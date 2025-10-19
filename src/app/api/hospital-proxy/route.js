import { NextResponse } from 'next/server';

/**
 * ⚠️ 임시 비활성화: 공공데이터포털 운영 중단으로 인한 에러 방지
 * 공공데이터포털(apis.data.go.kr) 임시 운영 중단 상태
 */

// API 설정 (임시 비활성화)
// const HOSPITAL_API_CONFIG = {
//   BASE_URL: 'http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire',
//   SERVICE_KEY: '4d3689cde20aee7c9a462d2fe3a3bf435084a21af9e13b71c30d6ecb21168c0f',
//   DEFAULT_NUM_OF_ROWS: 1000,
//   TIMEOUT: 15000,
// };

export async function GET(request) {
  // 공공데이터포털 API 임시 중단으로 인한 비활성화
  console.warn('⚠️ 공공데이터포털 API 임시 중단 - 프록시 기능 비활성화');
  return NextResponse.json(
    {
      error: '공공데이터포털 임시 운영 중단',
      message: '병원 검색 API가 일시적으로 사용 불가능합니다.',
      response: { body: { items: [] } } // 빈 응답 반환
    },
    { status: 503 } // Service Unavailable
  );

  /* 공공데이터포털 API 임시 주석 처리 (운영 중단)
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const departmentCode = searchParams.get('departmentCode');

    if (!region || !departmentCode) {
      return NextResponse.json(
        { error: '지역과 진료과목 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 국립중앙의료원 API 호출
    const params = new URLSearchParams({
      ServiceKey: HOSPITAL_API_CONFIG.SERVICE_KEY,
      Q0: region,
      QD: departmentCode,
      numOfRows: HOSPITAL_API_CONFIG.DEFAULT_NUM_OF_ROWS,
      pageNo: 1,
      _type: 'json'
    });

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
    console.error('Hospital proxy API error:', error);
    return NextResponse.json(
      { error: '병원 API 프록시 오류', details: error.message },
      { status: 500 }
    );
  }
  */
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