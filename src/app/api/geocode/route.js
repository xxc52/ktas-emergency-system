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

  // VWorld API는 브라우저 사용 시 domain 파라미터 필수
  const domain = 'https://ktas-emergency-system.vercel.app';
  const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getcoord&type=ROAD&address=${encodeURIComponent(address)}&format=json&key=${VWORLD_API_KEY}&domain=${encodeURIComponent(domain)}`;

  // 재시도 로직 (최대 3번)
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Geocode Proxy] Attempt ${attempt}/3`);

      const response = await fetch(vworldUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; KTAS-Emergency-System/1.0)',
        },
        signal: AbortSignal.timeout(15000), // 15초 타임아웃 (증가)
      });

      if (!response.ok) {
        console.error(`[Geocode Proxy] Attempt ${attempt} - VWorld API HTTP ${response.status}`);

        // 502, 503 에러는 재시도
        if (attempt < 3 && (response.status === 502 || response.status === 503)) {
          lastError = new Error(`HTTP ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 1초, 2초 대기
          continue;
        }

        return NextResponse.json({
          error: `VWorld API returned HTTP ${response.status}`,
          address: address
        }, { status: response.status });
      }

      const data = await response.json();

      console.log(`[Geocode Proxy] Attempt ${attempt} - VWorld Response Status: ${data.response?.status || 'Unknown'}`);

      // VWorld API 응답이 에러인 경우도 재시도
      if (data.response?.status !== 'OK') {
        console.error(`[Geocode Proxy] Attempt ${attempt} - VWorld API Error: ${data.response?.status || 'Unknown error'}`);

        if (attempt < 3) {
          lastError = new Error(`VWorld API status: ${data.response?.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        console.error(`[Geocode Proxy] Full response:`, JSON.stringify(data));
      }

      // 성공 시 즉시 반환
      console.log(`[Geocode Proxy] Success on attempt ${attempt}`);
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });

    } catch (error) {
      console.error(`[Geocode Proxy] Attempt ${attempt} Exception:`, error.message);
      lastError = error;

      // 마지막 시도가 아니면 재시도
      if (attempt < 3) {
        console.log(`[Geocode Proxy] Retrying after ${1000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }

  // 모든 재시도 실패
  console.error('[Geocode Proxy] All attempts failed');
  console.error('[Geocode Proxy] Last error details:', {
    message: lastError?.message,
    name: lastError?.name,
    address: address,
  });

  return NextResponse.json({
    error: 'Failed to geocode address after 3 attempts',
    details: lastError?.message || 'Unknown error',
    address: address
  }, { status: 500 });
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
