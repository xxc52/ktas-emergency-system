/**
 * LLM 서비스 API 통신 유틸리티
 * 진료과목 코드 판단 및 병원 검색을 위한 LLM 연동
 */

// LLM API 기본 설정
const LLM_CONFIG = {
  BASE_URL: "https://5d9edeeafa5f.ngrok-free.app", // 로컬 LLM 서버
  ENDPOINTS: {
    HEALTH: "/health",
    DEPARTMENT: "/department",
  },
  TIMEOUT: 30000, // 30초 타임아웃 (Vercel 환경 고려)
};

/**
 * LLM 서버 상태 확인
 * @returns {Promise<boolean>} 서버 사용 가능 여부
 */
export async function checkLLMHealth() {
  try {
    const response = await fetch(
      `${LLM_CONFIG.BASE_URL}${LLM_CONFIG.ENDPOINTS.HEALTH}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // ngrok 브라우저 경고 우회
        },
        signal: AbortSignal.timeout(5000), // Health check는 5초
      }
    );

    return response.ok;
  } catch (error) {
    console.warn("LLM 서버 연결 실패:", error.message);
    return false;
  }
}

/**
 * KTAS 환자 정보를 기반으로 진료과목 코드 판단
 * @param {Object} patientData - 환자 데이터
 * @param {number} patientData.ktasLevel - KTAS 레벨 (1-5)
 * @param {string} patientData.primaryDisease - 주요 병명
 * @param {Array<string>} patientData.firstConsiderations - 1차 고려사항
 * @param {Array<string>} patientData.secondConsiderations - 2차 고려사항
 * @param {string} patientData.location - 현재 위치
 * @returns {Promise<Object>} 진료과목 판단 결과
 */
export async function determineDepartmentCode(patientData) {
  try {
    console.log("LLM 진료과목 판단 요청:", patientData);

    // LLM 서버 상태 먼저 확인 (빠른 실패 처리)
    const isHealthy = await checkLLMHealth();
    if (!isHealthy) {
      console.warn('LLM 서버 상태 확인 실패 - 폴백 사용');
      throw new Error('LLM 서버 연결 불가');
    }

    const requestData = {
      ktas_level: patientData.ktasLevel || 5,
      primary_disease: patientData.primaryDisease || "",
      first_considerations: patientData.firstConsiderations || [],
      second_considerations: patientData.secondConsiderations || [],
      location: patientData.location || "",
    };

    const response = await fetch(
      `${LLM_CONFIG.BASE_URL}${LLM_CONFIG.ENDPOINTS.DEPARTMENT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // ngrok 브라우저 경고 우회
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(LLM_CONFIG.TIMEOUT),
        mode: 'cors', // CORS 명시적 설정
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("LLM 진료과목 판단 결과:", result);

    return {
      success: true,
      departmentCode: result.department_code,
      departmentName: result.department_name,
      confidence: result.confidence,
      reasoning: result.reasoning,
      performance: result.performance,
    };
  } catch (error) {
    console.error("LLM 진료과목 판단 실패:", error);

    // 폴백: 병명 기반 간단한 매핑
    const fallbackCode = getFallbackDepartmentCode(patientData.primaryDisease);

    return {
      success: false,
      departmentCode: fallbackCode.code,
      departmentName: fallbackCode.name,
      confidence: 0.3,
      reasoning: `LLM 서버 연결 실패. ${fallbackCode.reason}`,
      error: error.message,
      fallback: true,
    };
  }
}

/**
 * 현재 위치를 기반으로 시도 정보 반환
 * @param {Object} location - 위치 정보 {lat, lng}
 * @returns {Promise<Array<string>>} 검색할 시도 목록
 */
export async function getRegionsForSearch(location) {
  // 기본 검색 지역 (서울 + 경기)
  const defaultRegions = ["서울특별시", "경기도"];

  if (!location || !location.lat || !location.lng) {
    return defaultRegions;
  }

  try {
    // 위도/경도 기반 지역 판단 (간단한 규칙)
    const { lat, lng } = location;

    // 서울 근처 (대략적인 범위)
    if (lat >= 37.4 && lat <= 37.7 && lng >= 126.8 && lng <= 127.2) {
      return ["서울특별시", "경기도"];
    }

    // 경기도 범위
    if (lat >= 37.0 && lat <= 38.0 && lng >= 126.5 && lng <= 127.8) {
      return ["경기도", "서울특별시"];
    }

    // 인천 범위
    if (lat >= 37.3 && lat <= 37.6 && lng >= 126.4 && lng <= 126.8) {
      return ["인천광역시", "경기도"];
    }

    // 기타 지역은 기본값 반환
    return defaultRegions;
  } catch (error) {
    console.warn("지역 판단 실패, 기본값 사용:", error);
    return defaultRegions;
  }
}

/**
 * 두 지점 간의 직선 거리 계산 (km)
 * @param {number} lat1 - 첫 번째 지점 위도
 * @param {number} lng1 - 첫 번째 지점 경도
 * @param {number} lat2 - 두 번째 지점 위도
 * @param {number} lng2 - 두 번째 지점 경도
 * @returns {number} 거리 (km)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * LLM 실패 시 폴백 진료과목 코드 결정
 * @param {string} primaryDisease - 주요 병명
 * @returns {Object} 폴백 진료과목 정보
 */
function getFallbackDepartmentCode(primaryDisease) {
  const diseaseText = (primaryDisease || '').toLowerCase();

  // 기본 키워드 매핑
  const mappings = [
    { keywords: ['귀', '이비인후', '코', '목'], code: 'D013', name: '이비인후과', reason: '귀/코/목 관련 증상' },
    { keywords: ['눈', '안과', '시력'], code: 'D012', name: '안과', reason: '눈 관련 증상' },
    { keywords: ['피부', '발진', '두드러기'], code: 'D008', name: '피부과', reason: '피부 관련 증상' },
    { keywords: ['치아', '이', '입', '구강'], code: 'D026', name: '구강외과', reason: '구강 관련 증상' },
    { keywords: ['소화', '복통', '위', '장'], code: 'D001', name: '내과', reason: '소화계 증상' },
    { keywords: ['골절', '탈구', '외상', '다치'], code: 'D005', name: '정형외과', reason: '외상 및 근골격계 증상' },
    { keywords: ['심장', '호흡', '가슴'], code: 'D001', name: '내과', reason: '심혈관 및 호흡계 증상' },
    { keywords: ['두통', '두부', '머리'], code: 'D011', name: '신경과', reason: '신경계 증상' },
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some(keyword => diseaseText.includes(keyword))) {
      return mapping;
    }
  }

  // 기본값: 응급의학과
  return { code: 'D024', name: '응급의학과', reason: '일반적인 응급 상황' };
}

const llmService = {
  checkLLMHealth,
  determineDepartmentCode,
  getRegionsForSearch,
  calculateDistance,
};

export default llmService;
