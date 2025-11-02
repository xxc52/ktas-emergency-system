/**
 * VWorld Geocoder API 2.0를 사용한 주소-좌표 변환 유틸리티
 * API 키: E84467DF-FBF1-38C4-8673-12D7B1E1AFC1
 * 문서: https://www.vworld.kr/dev/v4dv_geocoderguide2_s001.do
 */

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const GEOCODER_BASE_URL = 'https://api.vworld.kr/req/address';

/**
 * 주소를 좌표로 변환 (내부 헬퍼 함수)
 * @param {string} address - 변환할 주소
 * @returns {Promise<{lat: number, lng: number, refinedAddress: string} | null>}
 */
async function _geocodeAddress(address) {
  try {
    // Next.js API 라우트를 통해 프록시 호출 (CORS 우회)
    const url = `/api/geocode?address=${encodeURIComponent(address)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // VWorld API 응답 구조 확인
    if (data.response && data.response.status === 'OK') {
      const result = data.response.result;

      if (result && result.point) {
        const coordinates = {
          lat: parseFloat(result.point.y),
          lng: parseFloat(result.point.x),
          refinedAddress: result.text || address
        };

        return coordinates;
      }
    }

    return null;
  } catch (error) {
    console.error(`❌ Geocoding 요청 실패:`, error.message);
    return null;
  }
}

/**
 * 주소를 좌표로 변환 (다중 후보 시도)
 * @param {string} address - 변환할 주소
 * @param {string} type - 주소 타입 ('ROAD' for 도로명주소, 'PARCEL' for 지번주소)
 * @returns {Promise<{lat: number, lng: number, refinedAddress: string} | null>}
 */
export async function addressToCoordinates(address, type = 'ROAD') {
  if (!address) {
    console.warn('주소가 제공되지 않았습니다.');
    return null;
  }

  if (!VWORLD_API_KEY) {
    console.error('❌ VWorld API 키가 설정되지 않았습니다.');
    return null;
  }

  console.log(`🔍 주소 변환 시도: "${address}"`);

  // 여러 주소 후보 생성
  const addressCandidates = [];

  // 1. 쉼표로 분리된 주소 파싱
  const parts = address.split(',').map(p => p.trim());

  if (parts.length > 1) {
    // 쉼표로 구분된 경우, 각 부분을 후보로 추가
    parts.forEach(part => {
      // 기본 주소 (시/도 + 구/군 + 도로명)
      const match = part.match(/^(.*?[시도])\s+(.*?[구군])\s+(.+)$/);
      if (match) {
        addressCandidates.push(part);
      } else if (part.includes('로') || part.includes('길')) {
        // 두 번째 부분에 시/도가 없으면 첫 번째 부분의 시/도 + 구/군 추가
        const firstMatch = parts[0].match(/^(.*?[시도])\s+(.*?[구군])/);
        if (firstMatch) {
          addressCandidates.push(`${firstMatch[1]} ${firstMatch[2]} ${part}`);
        } else {
          addressCandidates.push(part);
        }
      }
    });
  } else {
    // 쉼표가 없으면 원본 주소 사용
    addressCandidates.push(address);
  }

  console.log(`📋 주소 후보 ${addressCandidates.length}개: ${addressCandidates.join(' | ')}`);

  // 각 후보에 대해 정제 및 geocoding 시도
  for (let i = 0; i < addressCandidates.length; i++) {
    const candidate = addressCandidates[i];
    const refinedCandidate = refineAddressForGeocoding(candidate);

    console.log(`🔍 [${i + 1}/${addressCandidates.length}] 변환 시도: "${refinedCandidate}"`);

    const coordinates = await _geocodeAddress(refinedCandidate);

    if (coordinates) {
      console.log(`✅ 좌표 변환 성공: "${refinedCandidate}" → (${coordinates.lat}, ${coordinates.lng})`);
      return coordinates;
    } else {
      console.warn(`⚠️ 변환 실패, 다음 후보 시도...`);
    }
  }

  console.error(`❌ 모든 주소 후보 변환 실패: ${address}`);
  return null;
}

/**
 * 여러 주소를 배치로 좌표 변환 (순차 처리로 API 제한 준수)
 * @param {Array<{id: string, address: string}>} addressList - 변환할 주소 목록
 * @param {number} delay - 요청 간 지연시간 (ms), 기본 100ms
 * @returns {Promise<Array<{id: string, lat: number, lng: number, refinedAddress: string}>>}
 */
export async function batchAddressToCoordinates(addressList, delay = 100) {
  const results = [];

  console.log(`🔄 배치 좌표 변환 시작: ${addressList.length}개 주소`);

  for (let i = 0; i < addressList.length; i++) {
    const { id, address } = addressList[i];

    console.log(`📍 [${i + 1}/${addressList.length}] 변환 중: ${address}`);

    const coordinates = await addressToCoordinates(address);

    if (coordinates) {
      results.push({
        id,
        ...coordinates
      });
    } else {
      console.warn(`⚠️ 주소 변환 실패, 건너뛰기: ${address}`);
    }

    // API 제한 준수를 위한 지연
    if (i < addressList.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log(`✅ 배치 변환 완료: ${results.length}/${addressList.length}개 성공`);
  return results;
}

/**
 * 주소를 정제하여 Geocoding 성공률 높이기
 * @param {string} address - 원본 주소
 * @returns {string} 정제된 주소
 */
export function refineAddressForGeocoding(address) {
  if (!address) return '';

  let refined = address;

  // 1. 전화번호 제거
  refined = refined.replace(/\d{2,3}-\d{3,4}-\d{4}/g, '');

  // 2. 쉼표 기준 분리 (여러 주소가 쉼표로 구분된 경우)
  const addressParts = refined.split(',');

  // 3. 첫 번째 주소에서 도로명 주소 패턴 찾기
  let mainAddress = addressParts[0].trim();

  // 4. 층 정보 제거 (예: "173(1층일부)", "15(3층)", "101(지하1층)" 등)
  mainAddress = mainAddress.replace(/\d+\([^)]*층[^)]*\)/g, (match) => {
    // 괄호 앞의 번호만 남기기
    return match.match(/^\d+/)[0];
  });

  // 5. 동/호 정보가 포함된 괄호 제거 (예: "(중동)", "(101동)", "(A동 302호)" 등)
  // 단, 동명(안암동5가)은 유지
  mainAddress = mainAddress.replace(/\s*\([^)]*동\s*\d*호?[^)]*\)/g, '');

  // 6. 건물명 뒤의 추가 정보 제거 (괄호 안에 동명이 있는 경우는 유지)
  // 예: "고려대병원 (안암동5가)" → 유지
  // 예: "병원 (1층일부)" → "(1층일부)" 제거

  // 7. 중복 공백 정리
  refined = mainAddress.replace(/\s+/g, ' ').trim();

  console.log(`🧹 주소 정제: "${address}" → "${refined}"`);
  return refined;
}

/**
 * 좌표가 한국 내 유효한 범위인지 확인
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {boolean} 유효성 여부
 */
export function isValidKoreanCoordinates(lat, lng) {
  // 대한민국 대략적 좌표 범위
  const KOREA_BOUNDS = {
    minLat: 33.0, // 제주도 남단
    maxLat: 38.7, // 북한 접경 (남한 기준)
    minLng: 124.5, // 서해 서단
    maxLng: 132.0  // 동해 동단
  };

  const isValid = lat >= KOREA_BOUNDS.minLat && lat <= KOREA_BOUNDS.maxLat &&
                  lng >= KOREA_BOUNDS.minLng && lng <= KOREA_BOUNDS.maxLng;

  if (!isValid) {
    console.warn(`⚠️ 유효하지 않은 한국 좌표: (${lat}, ${lng})`);
  }

  return isValid;
}