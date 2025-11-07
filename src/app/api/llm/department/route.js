import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * KTAS 5급 환자 진료과목 코드 판단 API (RAG 없이 직접 LLM 추론)
 * OpenAI GPT-4 Turbo 사용
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 진료과목 코드와 이름 매핑
const DEPARTMENT_NAMES = {
  "D001": "내과", "D002": "신경과", "D003": "정신건강의학과", "D004": "외과",
  "D005": "정형외과", "D006": "신경외과", "D007": "흉부외과", "D008": "성형외과",
  "D009": "마취통증의학과", "D010": "산부인과", "D011": "소아청소년과", "D012": "안과",
  "D013": "이비인후과", "D014": "피부과", "D015": "비뇨의학과", "D016": "영상의학과",
  "D017": "방사선종양학과", "D018": "병리과", "D019": "진단검사의학과", "D020": "결핵과",
  "D021": "재활의학과", "D022": "핵의학과", "D023": "가정의학과", "D024": "응급의학과",
  "D025": "직업환경의학과", "D026": "예방의학과"
};

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      ktas_level,
      primary_disease,
      first_considerations = [],
      second_considerations = [],
      location,
      gender = null,
      age_group = null,
    } = body;

    console.log(`\n🩺 [진료과목 판단] 요청 받음`);
    console.log(`📋 KTAS 레벨: ${ktas_level}급`);
    console.log(`📋 주요 병명: ${primary_disease}`);
    console.log(`📋 1차 고려사항: ${first_considerations.join(', ') || '없음'}`);
    console.log(`📋 2차 고려사항: ${second_considerations.join(', ') || '없음'}`);
    console.log(`📋 위치: ${location}`);
    console.log(`📋 성별: ${gender || '정보 없음'}`);
    console.log(`📋 세부 연령대: ${age_group || '정보 없음'}`);

    // 성별/연령대 정보 포맷팅
    const genderStr = gender ? `성별: ${gender}` : '성별: 정보 없음';
    const ageGroupStr = age_group ? `연령대: ${age_group}` : '연령대: 정보 없음';

    // LLM 프롬프트 생성 (RAG 없이 직접 판단)
    const prompt = `당신은 응급의료 전문의입니다. 환자의 증상을 분석하여 가장 적합한 진료과목을 정확히 판단하세요.

환자 정보:
- KTAS 레벨: ${ktas_level} ${ktas_level === 5 ? '(비응급)' : ''}
- 주요 병명: ${primary_disease}
- 1차 고려사항: ${first_considerations.join(', ') || '없음'}
- 2차 고려사항: ${second_considerations.join(', ') || '없음'}
- ${genderStr}
- ${ageGroupStr}

진료과목별 담당 영역:
D001 내과: 소화계(변비, 복통, 설사), 심혈관계, 호흡기계, 내분비계, 전신질환
D002 신경과: 두통, 어지럼증, 신경계 질환, 뇌졸중
D003 정신건강의학과: 우울증, 불안장애, 정신질환
D004 외과: 복부 수술, 일반외과적 처치
D005 정형외과: 골절, 관절, 근골격계 외상, 척추
D006 신경외과: 뇌수술, 척추 수술
D007 흉부외과: 흉부 외상, 심장 수술
D008 성형외과: 성형, 화상, 재건 수술
D009 마취통증의학과: 통증 관리
D010 산부인과: 임신, 부인과 질환
D011 소아청소년과: 소아 환자 (<18세)
D012 안과: 눈, 시력, 안구 질환
D013 이비인후과: 귀, 코, 목, 인후 질환
D014 피부과: 피부 질환, 알레르기
D015 비뇨의학과: 비뇨기계, 신장 질환
D016-D026: 진단 및 기타 전문과

판단 원칙:
1. 해부학적 위치: 귀→D013, 눈→D012, 피부→D014
2. 증상의 발생 부위와 원인 분석
3. 소화계 문제(변비, 복통, 설사)는 D001 내과
4. 근골격계 문제는 D005 정형외과
5. 외상은 해당 부위 전문과

코드만 답변하세요 (예: D001):`;

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const answer = completion.choices[0].message.content.trim();
    const processingTime = (Date.now() - startTime) / 1000;

    // 진료과목 코드 추출
    let departmentCode = null;
    const matches = answer.match(/D\d{3}/g);
    if (matches) {
      for (const match of matches) {
        if (DEPARTMENT_NAMES[match]) {
          departmentCode = match;
          break;
        }
      }
    }

    // 여전히 못 찾으면 줄 단위로 다시 검색
    if (!departmentCode) {
      const lines = answer.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('D') && trimmed.length === 4 && /^\d+$/.test(trimmed.substring(1))) {
          if (DEPARTMENT_NAMES[trimmed]) {
            departmentCode = trimmed;
            break;
          }
        }
      }
    }

    // 기본값 설정
    if (!departmentCode) {
      departmentCode = 'D024'; // 응급의학과
    }

    const departmentName = DEPARTMENT_NAMES[departmentCode] || '응급의학과';

    // 상세한 판단 근거 생성
    let reasoning = '';
    const disease = primary_disease.toLowerCase();
    const considerations = [...first_considerations, ...second_considerations];

    if (ktas_level === 5) {
      // KTAS 5급의 경우 상세한 의학적 근거 제공
      if (disease.includes('변비') || considerations.some(c => c.includes('변비'))) {
        reasoning = `'${primary_disease}'는 소화계 질환으로 장의 운동 장애로 인한 배변 곤란입니다. 소화기계 전문 진료가 필요하여 내과(D001) 적합`;
      } else if (disease.includes('두통') || disease.includes('머리')) {
        reasoning = `'${primary_disease}'는 뇌신경계 증상으로 신경과(D002) 전문 진료 필요`;
      } else if (disease.includes('골절') || disease.includes('외상')) {
        reasoning = `'${primary_disease}'는 근골격계 손상으로 정형외과(D005) 전문 진료 필요`;
      } else if (disease.includes('귀') || disease.includes('이명')) {
        reasoning = `'${primary_disease}'는 청각기관 질환으로 이비인후과(D013) 전문 진료 필요`;
      } else if (disease.includes('눈') || disease.includes('시력')) {
        reasoning = `'${primary_disease}'는 시각기관 질환으로 안과(D012) 전문 진료 필요`;
      } else if (disease.includes('피부') || disease.includes('발진')) {
        reasoning = `'${primary_disease}'는 피부 질환으로 피부과(D014) 전문 진료 필요`;
      } else {
        reasoning = `'${primary_disease}' 증상 분석 결과 ${departmentName} 진료가 가장 적합하다고 판단됨`;
      }

      if (considerations.length > 0) {
        reasoning += `. 고려사항: ${considerations.slice(0, 2).join(', ')}`;
      }
    } else {
      // KTAS 1-4급의 경우
      reasoning = `KTAS ${ktas_level}급 환자 - '${primary_disease}' → ${departmentName} 전문 진료 필요`;
    }

    console.log(`✅ [진료과목 판단] 완료`);
    console.log(`📍 판단 결과: ${departmentCode} - ${departmentName}`);
    console.log(`💡 판단 근거: ${reasoning}`);
    console.log(`⏱️  처리 시간: ${processingTime.toFixed(2)}초`);
    console.log(`🤖 LLM 원본 응답: ${answer.length > 150 ? answer.substring(0, 150) + '...' : answer}`);
    console.log();

    return NextResponse.json({
      department_code: departmentCode,
      department_name: departmentName,
      reasoning: reasoning,
      performance: {
        processing_time: parseFloat(processingTime.toFixed(2)),
        llm_response: answer.length > 100 ? answer.substring(0, 100) + '...' : answer,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [진료과목 판단 실패]', error.message);
    return NextResponse.json(
      {
        error: '진료과목 판단 실패',
        detail: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
