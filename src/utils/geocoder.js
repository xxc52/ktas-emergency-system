/**
 * VWorld Geocoder API 2.0를 사용한 주소-좌표 변환 유틸리티
 * API 키: E84467DF-FBF1-38C4-8673-12D7B1E1AFC1
 * 문서: https://www.vworld.kr/dev/v4dv_geocoderguide2_s001.do
 */

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const GEOCODER_BASE_URL = 'https://api.vworld.kr/req/address';

/**
 * 주소를 좌표로 변환
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

  try {
    console.log(`🔍 주소 변환 시도: "${address}"`);

    // Next.js API 라우트를 통해 프록시 호출 (CORS 우회)
    const url = `/api/geocode?address=${encodeURIComponent(address)}`;
    console.log(`📡 API 요청: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📄 API 응답:', data);

    // VWorld API 응답 구조 확인
    if (data.response && data.response.status === 'OK') {
      const result = data.response.result;

      if (result && result.point) {
        const coordinates = {
          lat: parseFloat(result.point.y),
          lng: parseFloat(result.point.x),
          refinedAddress: result.text || address
        };

        console.log(`✅ 좌표 변환 성공: ${address} → (${coordinates.lat}, ${coordinates.lng})`);
        return coordinates;
      } else {
        console.warn(`⚠️ 좌표를 찾을 수 없습니다: ${address}`);
        return null;
      }
    } else {
      console.error('❌ API 응답 오류:', data.response?.status || 'Unknown error');
      return null;
    }

  } catch (error) {
    console.error(`❌ 주소 변환 실패 (${address}):`, error);
    return null;
  }
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

  // 병원명, 전화번호, 특수문자 제거
  let refined = address
    .replace(/병원|의원|클리닉|센터|의료원/g, '') // 의료기관 명칭 제거
    .replace(/\([^)]*\)/g, '') // 괄호 내용 제거
    .replace(/\d{2,3}-\d{3,4}-\d{4}/g, '') // 전화번호 제거
    .replace(/[,;]/g, '') // 쉼표, 세미콜론 제거
    .replace(/\s+/g, ' ') // 중복 공백 정리
    .trim();

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