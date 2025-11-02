import { NextResponse } from 'next/server';

/**
 * 병원 검색 API 프록시
 * 공공데이터포털 CORS 우회용 Next.js API Route
 */

// API 설정
const HOSPITAL_API_CONFIG = {
  BASE_URL: 'http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire',
  SERVICE_KEY: process.env.NEXT_PUBLIC_HOSPITAL_API_KEY,
  DEFAULT_NUM_OF_ROWS: 1000,
  TIMEOUT: 15000,
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const departmentCode = searchParams.get('departmentCode');
    const hospitalName = searchParams.get('hospitalName'); // 병원명 검색 추가

    // 병원명 검색 또는 지역+진료과목 검색
    if (!hospitalName && (!region || !departmentCode)) {
      return NextResponse.json(
        { error: '병원명 또는 (지역 + 진료과목 코드)가 필요합니다.' },
        { status: 400 }
      );
    }

    // 국립중앙의료원 API 호출 파라미터 구성
    const params = new URLSearchParams({
      ServiceKey: HOSPITAL_API_CONFIG.SERVICE_KEY,
      numOfRows: hospitalName ? 10 : HOSPITAL_API_CONFIG.DEFAULT_NUM_OF_ROWS,
      pageNo: 1,
      _type: 'json'
    });

    // 병원명 검색 또는 지역+진료과목 검색
    if (hospitalName) {
      params.append('QN', hospitalName);
      console.log(`[Hospital Proxy] 병원명: ${hospitalName}`);
    } else {
      params.append('Q0', region);
      params.append('QD', departmentCode);
      console.log(`[Hospital Proxy] 지역: ${region}, 진료과목: ${departmentCode}`);
    }

    const url = `${HOSPITAL_API_CONFIG.BASE_URL}?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HOSPITAL_API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`[Hospital Proxy] Success: ${data.response?.body?.items?.item?.length || 0} hospitals`);

      // CORS 헤더와 함께 응답
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('[Hospital Proxy] Error:', error.message);
    return NextResponse.json(
      { error: '병원 API 프록시 오류', details: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
