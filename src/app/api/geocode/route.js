import { NextResponse } from 'next/server';

/**
 * VWorld Geocoding API 프록시
 * 주소를 좌표로 변환하는 CORS 우회용 Next.js API Route
 */

const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    console.error('[Geocode Proxy] Missing address parameter');
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  // 환경변수 확인
  if (!VWORLD_API_KEY) {
    console.error('[Geocode Proxy] VWORLD_API_KEY 환경변수가 설정되지 않음');
    return NextResponse.json({
      error: 'VWorld API key not configured',
      message: 'NEXT_PUBLIC_VWORLD_API_KEY 환경변수를 설정하세요.'
    }, { status: 500 });
  }

  console.log(`[Geocode Proxy] Request: ${address}`);

  const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(address)}&format=json&key=${VWORLD_API_KEY}`;

  try {
    const response = await fetch(vworldUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      console.error(`[Geocode Proxy] VWorld API HTTP ${response.status}`);
      return NextResponse.json({
        error: `VWorld API returned HTTP ${response.status}`,
        address: address
      }, { status: response.status });
    }

    const data = await response.json();

    console.log(`[Geocode Proxy] VWorld Response Status: ${data.response?.status || 'Unknown'}`);

    // VWorld API 응답이 에러인 경우
    if (data.response?.status !== 'OK') {
      console.error(`[Geocode Proxy] VWorld API Error: ${data.response?.status || 'Unknown error'}`);
      console.error(`[Geocode Proxy] Full response:`, JSON.stringify(data));
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[Geocode Proxy] Exception:', error);
    console.error('[Geocode Proxy] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      address: address,
    });

    return NextResponse.json({
      error: 'Failed to geocode address',
      details: error.message,
      address: address
    }, { status: 500 });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
