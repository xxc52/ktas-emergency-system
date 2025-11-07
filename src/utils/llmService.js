/**
 * LLM 서비스 API 통신 유틸리티
 * 진료과목 코드 판단 및 병원 검색을 위한 LLM 연동
 */

// LLM API 기본 설정 (Next.js API Routes 사용)
const LLM_CONFIG = {
  BASE_URL: "/api/llm", // Vercel 서버리스 함수 (OpenAI GPT-4 Turbo)
  ENDPOINTS: {
    DEPARTMENT: "/department",
    EMERGENCY_FILTERS: "/emergency-filters", // 응급실 필터 판단 (KTAS 1-4급)
  },
  TIMEOUT: 60000, // 60초 타임아웃
};

/**
 * LLM 서버 상태 확인 (Vercel 서버리스 함수는 항상 사용 가능)
 * @returns {Promise<boolean>} 서버 사용 가능 여부
 */
export async function checkLLMHealth() {
  // Vercel 서버리스 함수는 항상 사용 가능
  return true;
}

/**
 * KTAS 환자 정보를 기반으로 진료과목 코드 판단
 * @param {Object} patientData - 환자 데이터
 * @param {number} patientData.ktasLevel - KTAS 레벨 (1-5)
 * @param {string} patientData.primaryDisease - 주요 병명
 * @param {Array<string>} patientData.firstConsiderations - 1차 고려사항
 * @param {Array<string>} patientData.secondConsiderations - 2차 고려사항
 * @param {string} patientData.location - 현재 위치
 * @param {string} patientData.gender - 성별 (male/female)
 * @param {string} patientData.ageGroup - 세부 연령대 (15-24, 25-34, 35-44, 45-54, 55-64, 65+)
 * @returns {Promise<Object>} 진료과목 판단 결과
 */
export async function determineDepartmentCode(patientData) {
  try {
    console.log("LLM 진료과목 판단 요청:", patientData);

    const requestData = {
      ktas_level: patientData.ktasLevel || 5,
      primary_disease: patientData.primaryDisease || "",
      first_considerations: patientData.firstConsiderations || [],
      second_considerations: patientData.secondConsiderations || [],
      location: patientData.location || "",
      gender: patientData.gender || null,
      age_group: patientData.ageGroup || null,
    };

    const response = await fetch(
      `${LLM_CONFIG.BASE_URL}${LLM_CONFIG.ENDPOINTS.DEPARTMENT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(LLM_CONFIG.TIMEOUT),
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
      reasoning: result.reasoning,
      performance: result.performance,
    };
  } catch (error) {
    console.error("LLM 진료과목 판단 실패:", error);

    // 폴백: LLM 실패 시 응급의학과로 기본 설정
    return {
      success: false,
      departmentCode: "D024",
      departmentName: "응급의학과",
      reasoning: "LLM 서버 연결 실패로 응급의학과 기본 설정",
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
 * KTAS 1-4급 환자 정보를 기반으로 응급실 필터 코드 판단
 * @param {Object} patientData - 환자 데이터
 * @param {number} patientData.ktasLevel - KTAS 레벨 (1-4)
 * @param {string} patientData.primaryDisease - 주요 병명
 * @param {Array<string>} patientData.firstConsiderations - 1차 고려사항
 * @param {Array<string>} patientData.secondConsiderations - 2차 고려사항
 * @param {string} patientData.gender - 성별 (male/female)
 * @param {string} patientData.ageGroup - 세부 연령대 (15-24, 25-34, 35-44, 45-54, 55-64, 65+)
 * @returns {Promise<Object>} 필터 판단 결과
 */
export async function determineEmergencyFilters(patientData) {
  try {
    console.log("\n🧠 [LLM 필터 판단] 요청:", patientData);

    const requestData = {
      ktas_level: patientData.ktasLevel,
      primary_disease: patientData.primaryDisease || "",
      first_considerations: patientData.firstConsiderations || [],
      second_considerations: patientData.secondConsiderations || [],
      gender: patientData.gender || null,
      age_group: patientData.ageGroup || null,
    };

    const response = await fetch(
      `${LLM_CONFIG.BASE_URL}${LLM_CONFIG.ENDPOINTS.EMERGENCY_FILTERS}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(LLM_CONFIG.TIMEOUT),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ [LLM 필터 판단] 결과:", result);
    console.log(`  - 응급실병상: ${result.rltmEmerCd}`);
    console.log(`  - 입원병상: ${result.rltmCd}`);
    console.log(`  - 중증응급질환: ${result.svdssCd}`);
    console.log(`  - 장비정보: ${result.rltmMeCd}`);
    console.log(`  - 근거: ${result.reasoning}`);

    // RAG 문서 정보 추출
    const ragDocs = result.performance?.rag_doc_summaries || [];
    if (ragDocs.length > 0) {
      console.log(`📚 [RAG 참고 문서] ${ragDocs.length}개:`);
      ragDocs.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.substring(0, 100)}...`);
      });
    }

    return {
      success: true,
      filters: {
        rltmEmerCd: result.rltmEmerCd,
        rltmCd: result.rltmCd,
        svdssCd: result.svdssCd,
        rltmMeCd: result.rltmMeCd,
      },
      reasoning: result.reasoning,
      ragDocs: ragDocs, // RAG 문서 추가
      performance: result.performance,
    };
  } catch (error) {
    console.error("❌ [LLM 필터 판단] 실패:", error);

    // 폴백: LLM 실패 시 기본 필터 설정
    const ktasLevel = patientData.ktasLevel;
    let fallbackFilters = {
      rltmEmerCd: ["O001"], // 기본: 일반응급실
      rltmCd: null,
      svdssCd: null,
      rltmMeCd: null,
    };

    // KTAS 레벨에 따른 기본 필터
    if (ktasLevel === 1 || ktasLevel === 2) {
      fallbackFilters.rltmCd = ["O017"]; // 일반중환자실
    }

    return {
      success: false,
      filters: fallbackFilters,
      reasoning: `LLM 서버 연결 실패로 기본 필터 적용 (KTAS ${ktasLevel}급)`,
      error: error.message,
      fallback: true,
    };
  }
}

const llmService = {
  checkLLMHealth,
  determineDepartmentCode,
  getRegionsForSearch,
  calculateDistance,
  determineEmergencyFilters,
};

export default llmService;
