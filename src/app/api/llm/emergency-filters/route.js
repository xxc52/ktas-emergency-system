import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * KTAS 1-4급 환자 응급실 필터 코드 판단 API (RAG 없이 직접 LLM 추론)
 * OpenAI GPT-4 Turbo 사용
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      ktas_level,
      primary_disease,
      first_considerations = [],
      second_considerations = [],
      gender = null,
      age_group = null,
    } = body;

    console.log(`\n[KTAS ${ktas_level}급 필터 판단 시작]`);
    console.log(`병명: ${primary_disease} | 성별: ${gender || '미상'} | 연령: ${age_group || '미상'}`);
    if (first_considerations.length > 0) {
      console.log(`1차: ${first_considerations.join(', ')}`);
    }
    if (second_considerations.length > 0) {
      console.log(`2차: ${second_considerations.join(', ')}`);
    }

    // 환자 정보 준비
    const patientInfo = `- KTAS 등급: ${ktas_level}급
- 주요 병명: ${primary_disease}
- 1차 고려사항: ${first_considerations.join(', ') || '없음'}
- 2차 고려사항: ${second_considerations.join(', ') || '없음'}
- 성별: ${gender || '정보 없음'}
- 세부 연령대: ${age_group || '정보 없음'}`;

    // Full 코드 목록 (74개)
    const codeList = `## 응급실병상(rltmEmerCd) - 정확히 1개만 선택
- O001: 일반병상 (대부분의 성인 환자, 기본값)
- O060: 외상소생실 (중증 외상 환자만)
- O004: 일반격리 (일반 격리 필요 환자)
- O003: 음압격리 (감염병 의심 환자)
- O059: 코호트격리 (집단 격리)

## 입원병상(rltmCd) - 1개만 선택 or null
### 중환자실
- O017: 중환자실 일반
- O018: 중환자실 음압격리
- O008: 중환자실 신생아
- O006: 중환자실 내과
- O015: 중환자실 심장내과
- O011: 중환자실 신경과
- O013: 중환자실 화상
- O007: 중환자실 외과
- O012: 중환자실 신경외과
- O016: 중환자실 흉부외과

### 응급전용
- O019: 응급전용 입원실
- O052: 응급전용 입원실 음압격리
- O053: 응급전용 입원실 일반격리
- O005: 응급전용 중환자실
- O050: 응급전용 중환자실 음압격리
- O051: 응급전용 중환자실 일반격리

### 외상전용
- O014: 외상전용 중환자실 (외상 환자만)
- O021: 외상전용 입원실 (외상 환자만)
- O023: 외상전용 수술실 (외상 환자만)

### 입원실
- O038: 입원실 일반
- O025: 입원실 음압격리
- O024: 입원실 정신과 폐쇄병동

### 기타
- O022: 수술실
- O026: 분만실 (임산부 관련)
- O036: 화상전용처치실

## 중증응급질환(svdssCd) - 필요한 만큼 선택 가능 (1~2개) or null
- Y0031: 뇌출혈수술 거미막하출혈
- Y0032: 뇌출혈수술 거미막하출혈 외
- Y0041: 대동맥응급 흉부
- Y0042: 대동맥응급 복부
- Y0051: 담낭담관질환 담낭질환
- Y0052: 담낭담관질환 담도포함질환
- Y0060: 복부응급수술 비외상
- Y0131: 사지접합 수족지접합 (절단 및 외상사고)
- Y0132: 사지접합 수족지접합 외 (절단 및 외상사고)
- Y0111: 산부인과응급 분만 (임산부 관련)
- Y0112: 산부인과응급 산과수술 (임산부 관련)
- Y0113: 산부인과응급 부인과수술 (여성생식기 질환)
- Y0160: 안과적수술 응급 (눈 부상/질환 필수)
- Y0171: 영상의학혈관중재 성인
- Y0081: 응급내시경 성인 위장관
- Y0091: 응급내시경 성인 기관지
- Y0141: 응급투석 HD
- Y0142: 응급투석 CRRT
- Y0010: 재관류중재술 심근경색
- Y0020: 재관류중재술 뇌경색
- Y0100: 저체중출생아 집중치료 (임산부 관련)
- Y0150: 정신과적응급 폐쇄병동입원
- Y0120: 중증화상 전문치료

## 장비정보(rltmMeCd) - 필요한 만큼 선택 가능 (1~3개) or null
- O030: 인공호흡기 일반
- O031: 인공호흡기 조산아 (임산부 관련)
- O032: 인큐베이터 (임산부 관련)
- O033: CRRT (지속적신대체요법)
- O034: ECMO (체외막산소공급)
- O035: 중심체온조절유도기
- O037: 고압산소치료기
- O027: CT
- O028: MRI
- O029: 혈관촬영기

※ 위 코드 외 다른 코드는 절대 사용 금지`;

    console.log(`\n[최종 판단] GPT-4 Turbo 호출`);

    const finalJudgmentPrompt = `당신은 응급의료 전문의입니다. 환자에게 필요한 병원 검색 필터를 JSON으로 출력하세요.

## 환자 정보
${patientInfo}

## 사용 가능 코드
${codeList}

## 엄격한 규칙
1. 코드 목록에 있는 코드만 사용 (O040 같은 존재하지 않는 코드 절대 금지)
2. rltmEmerCd: 정확히 1개만 선택 (응급실병상 9개 중 1개)
3. rltmCd: 1개만 선택 or null (입원병상 28개 중 1개)
4. svdssCd: 필요한 만큼 선택 가능 (중증응급질환 27개 중 1~2개) or null
5. rltmMeCd: 필요한 만큼 선택 가능 (장비정보 10개 중 1~3개) or null
6. **성별/연령대 필수 확인**:
   - 임산부 관련 코드는 **여성만** (O026, Y0111, Y0112, Y0113, O031, O032, Y0100)
   - 소아 관련 코드는 **소아/영유아만** (O002, O049, O048, O009, O008, O020, O010, Y0172, Y0082, Y0092, Y0070)
   - 남성 환자에게 산부인과 코드 절대 금지
   - 성인 환자에게 소아 전용 코드 절대 금지
7. 환자와 직접 관련된 코드만 선택
8. 눈 부상 → Y0160 필수
9. 외상 환자 → O060 (외상소생실), O014 (외상중환자실), O021 (외상입원실), O023 (외상수술실) 고려

## 올바른 예시

### 예시 1: 눈 외상 (성인 남성)
{"rltmEmerCd": ["O001"], "rltmCd": null, "svdssCd": ["Y0160"], "rltmMeCd": null, "reasoning": "성인 남성 눈 외상으로 안과응급 대응 가능 병원 필요"}

### 예시 2: 조기진통 (임산부 여성)
{"rltmEmerCd": ["O001"], "rltmCd": ["O026"], "svdssCd": ["Y0100", "Y0111", "Y0112"], "rltmMeCd": ["O031", "O032"], "reasoning": "임산부 여성 조기진통으로 조산 위험. 분만실 보유하고 조산아 인공호흡기·인큐베이터 갖춘 병원 필요"}

## 잘못된 예시 (절대 금지)
❌ {"rltmEmerCd": ["O001", "O060"]} - 응급실 2개 선택
❌ {"rltmCd": ["O014", "O006"]} - 입원병상 2개 선택
❌ {"rltmEmerCd": ["O040"]} - 존재하지 않는 코드
❌ {"rltmMeCd": ["O023"]} - 카테고리 착각 (O023은 입원병상)
❌ 남성 환자에게 {"svdssCd": ["Y0111"]} - 산부인과 코드 사용 금지

## 출력 형식
{"rltmEmerCd": ["코드"], "rltmCd": ["코드"] or null, "svdssCd": ["코드1", "코드2", ...] or null, "rltmMeCd": ["코드1", "코드2", ...] or null, "reasoning": "한글 판단 근거"}

위 규칙을 엄격히 따라 JSON만 출력하세요.`;

    const step4Time = Date.now();
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: finalJudgmentPrompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const finalAnswer = finalCompletion.choices[0].message.content.trim();
    const step4Duration = (Date.now() - step4Time) / 1000;

    console.log(`완료 (${step4Duration.toFixed(2)}s)`);
    console.log(`  ⚖️ 판단: ${finalAnswer}`);

    console.log(`\n[JSON 파싱]`);

    // JSON 파싱
    const answerClean = finalAnswer.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = answerClean.match(/\{[\s\S]*?\}/);

    let result;
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
        console.log(`파싱 성공`);
      } catch (e) {
        console.warn(`⚠️ JSON 디코딩 실패: ${e.message}`);
        result = {
          rltmEmerCd: ['O001'],
          rltmCd: null,
          svdssCd: null,
          rltmMeCd: null,
          reasoning: `JSON 디코딩 실패: ${e.message}`,
        };
      }
    } else {
      console.warn('⚠️ JSON 패턴 매칭 실패 - 기본값 적용');
      result = {
        rltmEmerCd: ['O001'],
        rltmCd: null,
        svdssCd: null,
        rltmMeCd: null,
        reasoning: 'LLM 응답 파싱 실패로 기본 필터 적용',
      };
    }

    // 빈 배열 폴백 처리
    let rltmEmerCd = result.rltmEmerCd;
    if (!rltmEmerCd || rltmEmerCd.length === 0) {
      rltmEmerCd = ['O001'];
      console.warn('⚠️ rltmEmerCd 비어있음 → O001 기본값 적용');
      result.reasoning += ' (필터 없음 → 거리순 정렬)';
    }

    const totalTime = (Date.now() - startTime) / 1000;

    console.log(`\n[필터 판단 완료] 총 ${totalTime.toFixed(2)}s`);
    console.log(`  🏥 응급실병상: ${rltmEmerCd}`);
    console.log(`  🛏️ 입원병상: ${result.rltmCd}`);
    console.log(`  🚨 중증질환: ${result.svdssCd}`);
    console.log(`  🔧 장비정보: ${result.rltmMeCd}`);
    console.log(`  📝 근거: ${result.reasoning || 'N/A'}\n`);

    return NextResponse.json({
      rltmEmerCd: rltmEmerCd,
      rltmCd: result.rltmCd,
      svdssCd: result.svdssCd,
      rltmMeCd: result.rltmMeCd,
      reasoning: result.reasoning || '필터 판단 완료',
      performance: {
        processing_time: parseFloat(totalTime.toFixed(2)),
        step4_final_judgment_time: parseFloat(step4Duration.toFixed(2)),
        llm_full_response: finalAnswer,
        llm_response_length: finalAnswer.length,
        ktas_level: ktas_level,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`\n❌ 필터 판단 실패: ${error.message}`);
    return NextResponse.json(
      {
        error: '필터 판단 실패',
        detail: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
