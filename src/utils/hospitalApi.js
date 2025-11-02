/**
 * 국립중앙의료원 Open API 연동 서비스
 * 진료과목별 병원 검색 및 데이터 처리
 */

import { calculateDistance } from "./llmService";

// API 설정
const HOSPITAL_API_CONFIG = {
  BASE_URL:
    "http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire",
  PROXY_URL: "/api/hospital-proxy", // Vercel 프록시 API
  SERVICE_KEY: process.env.NEXT_PUBLIC_HOSPITAL_API_KEY || "",
  DEFAULT_NUM_OF_ROWS: 1000, // 최대 검색 건수
  TIMEOUT: 15000, // 15초 타임아웃
};

/**
 * 진료과목별 병원 검색
 * @param {string} region - 시도명 (예: '서울특별시')
 * @param {string} departmentCode - 진료과목 코드 (예: 'D001')
 * @returns {Promise<Array>} 병원 목록
 */
export async function searchHospitalsByDepartment(region, departmentCode) {
  try {
    console.log(`🏥 [병원 검색] ${region}, ${departmentCode}`);

    // Vercel 환경에서는 프록시 사용, 로컬에서는 직접 호출
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

    let url;
    if (isProduction) {
      // Vercel 환경: 프록시 API 사용
      const params = new URLSearchParams({
        region: region,
        departmentCode: departmentCode
      });
      url = `${HOSPITAL_API_CONFIG.PROXY_URL}?${params.toString()}`;
      console.log('Proxy API 요청 URL:', url);
    } else {
      // 로컬 환경: 직접 API 호출
      const params = new URLSearchParams({
        ServiceKey: HOSPITAL_API_CONFIG.SERVICE_KEY,
        Q0: region,
        QD: departmentCode,
        numOfRows: HOSPITAL_API_CONFIG.DEFAULT_NUM_OF_ROWS,
        pageNo: 1,
        _type: 'json'
      });
      url = `${HOSPITAL_API_CONFIG.BASE_URL}?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(HOSPITAL_API_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // API 응답 구조 확인 및 파싱
    let hospitals = [];

    if (data.response && data.response.body && data.response.body.items) {
      // 정상 응답 구조 - items.item 형태
      if (data.response.body.items.item) {
        hospitals = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item];
      } else {
        // items가 직접 배열인 경우
        const items = data.response.body.items;
        hospitals = Array.isArray(items) ? items : [items];
      }
    } else if (data.items) {
      // 다른 응답 구조
      hospitals = Array.isArray(data.items) ? data.items : [data.items];
    } else if (Array.isArray(data)) {
      // 배열 형태로 직접 반환
      hospitals = data;
    } else {
      console.warn('⚠️ [병원 검색] 예상치 못한 API 응답 구조');
      return [];
    }

    // 병원 데이터 정규화
    const normalizedHospitals = hospitals
      .filter(hospital => hospital && hospital.dutyName) // 유효한 병원만 필터링
      .map(hospital => normalizeHospitalData(hospital));

    console.log(`✅ [병원 검색] ${region} ${departmentCode}: ${normalizedHospitals.length}개`);
    return normalizedHospitals;

  } catch (error) {
    console.error(`❌ [병원 검색] 실패 (${region}, ${departmentCode}):`, error.message);
    return []; // 실패 시 빈 배열 반환
  }
}

/**
 * 병원 데이터 정규화
 * @param {Object} hospital - 원본 병원 데이터
 * @returns {Object} 정규화된 병원 데이터
 */
function normalizeHospitalData(hospital) {
  const normalized = {
    // 기본 정보
    id: hospital.hpid || hospital.dutyName,
    name: hospital.dutyName || "병원명 미상",
    address: hospital.dutyAddr || "",

    // 연락처
    phone: hospital.dutyTel1 || "",
    emergencyPhone: hospital.dutyTel3 || "",

    // 위치 정보
    latitude: parseFloat(hospital.wgs84Lat) || null,
    longitude: parseFloat(hospital.wgs84Lon) || null,

    // 병원 분류
    division: hospital.dutyDiv || "",
    divisionName: hospital.dutyDivNam || "",

    // 응급실 정보
    hasEmergencyRoom: hospital.dutyEryn === "1",
    emergencyCode: hospital.dutyEmcls || "",
    emergencyCodeName: hospital.dutyEmclsName || "",

    // 진료시간 (요일별)
    operatingHours: {
      monday: {
        start: hospital.dutyTime1s || "",
        end: hospital.dutyTime1c || "",
      },
      tuesday: {
        start: hospital.dutyTime2s || "",
        end: hospital.dutyTime2c || "",
      },
      wednesday: {
        start: hospital.dutyTime3s || "",
        end: hospital.dutyTime3c || "",
      },
      thursday: {
        start: hospital.dutyTime4s || "",
        end: hospital.dutyTime4c || "",
      },
      friday: {
        start: hospital.dutyTime5s || "",
        end: hospital.dutyTime5c || "",
      },
      saturday: {
        start: hospital.dutyTime6s || "",
        end: hospital.dutyTime6c || "",
      },
      sunday: {
        start: hospital.dutyTime7s || "",
        end: hospital.dutyTime7c || "",
      },
      holiday: {
        start: hospital.dutyTime8s || "",
        end: hospital.dutyTime8c || "",
      },
    },

    // 기타 정보
    description: hospital.dutyInf || "",
    notes: hospital.dutyEtc || "",
    mapImage: hospital.dutyMapimg || "",

    // 우편번호
    zipCode: `${hospital.postCdn1 || ""}${hospital.postCdn2 || ""}`.trim(),

    // 메타데이터
    dataSource: "national_medical_center",
    lastUpdated: new Date().toISOString(),
  };

  return normalized;
}

/**
 * 병원명으로 병원 정보 검색 (연락처 조회용)
 * @param {string} hospitalName - 병원명
 * @returns {Promise<Object|null>} 병원 정보 (연락처 포함) 또는 null
 */
export async function searchHospitalByName(hospitalName) {
  try {

    const params = new URLSearchParams({
      ServiceKey: HOSPITAL_API_CONFIG.SERVICE_KEY,
      QN: hospitalName,
      pageNo: 1,
      numOfRows: 10,
      _type: 'json'
    });

    const url = `${HOSPITAL_API_CONFIG.BASE_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(HOSPITAL_API_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // API 응답에서 첫 번째 병원 정보 추출
    let hospital = null;
    if (data.response && data.response.body && data.response.body.items) {
      if (data.response.body.items.item) {
        const items = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item];
        hospital = items[0];
      }
    }

    if (hospital) {
      return {
        phone: hospital.dutyTel1 || '',
        emergencyPhone: hospital.dutyTel3 || '',
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`❌ [연락처 조회] 실패 (${hospitalName}):`, error.message);
    return null;
  }
}

/**
 * 여러 병원의 연락처를 일괄 조회
 * @param {Array<{name: string, id: string}>} hospitals - 병원 목록
 * @returns {Promise<Map>} 병원 ID를 키로 하는 연락처 정보 맵
 */
export async function fetchHospitalContacts(hospitals) {
  const contactPromises = hospitals.map(async (hospital) => {
    const contact = await searchHospitalByName(hospital.name);
    return { id: hospital.id, contact };
  });

  const results = await Promise.all(contactPromises);

  // Map으로 변환
  const contactMap = new Map();
  results.forEach(({ id, contact }) => {
    if (contact) {
      contactMap.set(id, contact);
    }
  });

  console.log(`✅ [연락처 조회] ${contactMap.size}/${hospitals.length}개 성공`);
  return contactMap;
}

/**
 * 여러 지역에서 병원 검색 후 거리순 정렬
 * @param {Array<string>} regions - 검색할 지역 목록
 * @param {string} departmentCode - 진료과목 코드
 * @param {Object} currentLocation - 현재 위치 {lat, lng}
 * @param {number} limit - 반환할 병원 수 (기본값: 20)
 * @returns {Promise<Array>} 거리순으로 정렬된 병원 목록
 */
export async function searchAndSortHospitals(
  regions,
  departmentCode,
  currentLocation,
  limit = 20
) {
  try {
    // 모든 지역에서 병원 검색 (병렬 처리)
    const searchPromises = regions.map((region) =>
      searchHospitalsByDepartment(region, departmentCode)
    );

    const results = await Promise.all(searchPromises);

    // 모든 결과 합치기
    let allHospitals = [];
    results.forEach((hospitals, index) => {
      const region = regions[index];
      hospitals.forEach((hospital) => {
        hospital.searchRegion = region; // 검색 지역 정보 추가
        allHospitals.push(hospital);
      });
    });

    // 유효한 위치 정보가 있는 병원만 필터링
    const validHospitals = allHospitals.filter(
      (hospital) =>
        hospital.latitude &&
        hospital.longitude &&
        !isNaN(hospital.latitude) &&
        !isNaN(hospital.longitude)
    );

    // 현재 위치가 없으면 그대로 반환
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      return validHospitals.slice(0, limit);
    }

    // 거리 계산 및 정렬
    const hospitalsWithDistance = validHospitals.map((hospital) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        hospital.latitude,
        hospital.longitude
      );

      return {
        ...hospital,
        distance: distance,
        distanceText: formatDistance(distance),
      };
    });

    // 거리순 정렬
    hospitalsWithDistance.sort((a, b) => a.distance - b.distance);

    console.log(`✅ [병원 정렬] 거리순 정렬 완료, 상위 ${limit}개 반환`);

    return hospitalsWithDistance.slice(0, limit);
  } catch (error) {
    console.error("❌ [병원 검색] 통합 검색 실패:", error.message);
    return [];
  }
}

/**
 * 거리를 읽기 쉬운 형태로 포맷팅
 * @param {number} distance - 거리 (km)
 * @returns {string} 포맷된 거리 문자열
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * 병원 운영 상태 확인
 * @param {Object} hospital - 병원 데이터
 * @param {Date} currentTime - 현재 시간 (기본값: 현재)
 * @returns {Object} 운영 상태 정보
 */
export function getHospitalStatus(hospital, currentTime = new Date()) {
  const now = currentTime;
  const dayOfWeek = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const currentTimeStr =
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0");

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todaySchedule = hospital.operatingHours[dayNames[dayOfWeek]];

  let isOpen = false;
  let nextOpenTime = null;

  if (todaySchedule && todaySchedule.start && todaySchedule.end) {
    // Ensure start and end are strings and properly formatted
    const startTimeStr = String(todaySchedule.start || "").replace(/:/g, "");
    const endTimeStr = String(todaySchedule.end || "").replace(/:/g, "");

    // Only calculate if we have valid time strings (4 digits)
    if (
      startTimeStr.length === 4 &&
      endTimeStr.length === 4 &&
      /^\d{4}$/.test(startTimeStr) &&
      /^\d{4}$/.test(endTimeStr)
    ) {
      isOpen = currentTimeStr >= startTimeStr && currentTimeStr <= endTimeStr;
    }
  }

  return {
    isOpen,
    todaySchedule,
    nextOpenTime,
    status: isOpen ? "진료중" : "진료종료",
  };
}

const hospitalApi = {
  searchHospitalsByDepartment,
  searchAndSortHospitals,
  getHospitalStatus,
  formatDistance: formatDistance,
};

export default hospitalApi;
