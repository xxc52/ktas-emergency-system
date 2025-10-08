/**
 * 응급실 실시간 정보 API (KTAS 1-4급)
 * 국립중앙의료원 응급의료포털 API 연동
 */

/**
 * 응급실 병원 검색 (실시간 병상 정보)
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Array>} 병원 목록
 */
export async function searchEmergencyHospitals(params) {
  const {
    latitude,
    longitude,
    radius = 10, // km 단위
    rltmEmerCd = null, // 응급실병상 코드 배열
    rltmCd = null, // 입원병상 코드 배열
    svdssCd = null, // 중증응급질환 코드 배열
    rltmMeCd = null, // 장비정보 코드 배열
  } = params;

  try {
    console.log(`\n🏥 [응급실 검색] 시작`);
    console.log(`  📍 위치: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    console.log(`  📏 반경: ${radius}km`);
    console.log(`  🏥 필터:`, {
      응급실병상: rltmEmerCd,
      입원병상: rltmCd,
      중증응급질환: svdssCd,
      장비정보: rltmMeCd,
    });

    // URL 파라미터 구성
    const searchParams = new URLSearchParams({
      asort: "A,C,D", // 응급의료기관: 권역(A), 센터(C), 기관(D)
      searchCondition: "radius",
      lat: latitude,
      lon: longitude,
      radius: radius,
    });

    // 필터 추가
    if (rltmEmerCd && rltmEmerCd.length > 0) {
      searchParams.append("rltmEmerCd", rltmEmerCd.join(","));
    }
    if (rltmCd && rltmCd.length > 0) {
      searchParams.append("rltmCd", rltmCd.join(","));
    }
    if (svdssCd && svdssCd.length > 0) {
      searchParams.append("svdssCd", svdssCd.join(","));
    }
    if (rltmMeCd && rltmMeCd.length > 0) {
      searchParams.append("rltmMeCd", rltmMeCd.join(","));
    }

    const apiUrl = `https://mediboard.nemc.or.kr/api/v1/search/detail/general?${searchParams.toString()}`;
    console.log(`  🔗 API URL: ${apiUrl.substring(0, 100)}...`);

    // API 호출
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000), // 15초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`  ✅ API 응답 받음:`, data.message);

    // 병원 데이터 파싱
    const hospitals = data.result?.data || [];
    console.log(`  📊 검색된 병원 수: ${hospitals.length}개`);

    return hospitals;
  } catch (error) {
    console.error(`  ❌ 응급실 검색 실패:`, error);
    return [];
  }
}

/**
 * 거리 계산 (Haversine 공식)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 병원 필터링 및 점수 계산 (개선된 스코어링 시스템)
 * @param {Array} hospitals - 병원 목록
 * @param {Object} currentLocation - 현재 위치
 * @param {Object} patientData - 환자 정보
 * @returns {Array} 필터링 및 정렬된 병원 목록
 */
export function filterAndScoreHospitals(
  hospitals,
  currentLocation,
  patientData
) {
  console.log(`\n🔍 [병원 필터링] 시작`);
  console.log(`  📊 원본 병원 수: ${hospitals.length}개`);

  const scored = hospitals.map((hospital) => {
    let score = 1000; // 기본 점수
    let reasons = [];

    // 1. 거리 패널티 (거리 × 10점 감점)
    const distance = hospital.distance || 0;
    const distancePenalty = Math.round(distance * 10);
    score -= distancePenalty;
    reasons.push(`거리 ${distance.toFixed(1)}km (-${distancePenalty})`);

    // 2. 병원 등급 보너스 (권역 +10, 센터 +5, 기관 가점 없음)
    if (hospital.typeCode === "A") {
      score += 10;
      reasons.push(`권역 (+10)`);
    } else if (hospital.typeCode === "C") {
      score += 5;
      reasons.push(`센터 (+5)`);
    }

    // 3. 응급실 병상 가용성 (사용가능 개수만큼 가산, 0개 이하면 -100점)
    const emergencyBeds = hospital.rltmEmerCd?.elements?.O001;
    if (emergencyBeds) {
      const usable = emergencyBeds.usable || 0;
      if (usable <= 0) {
        // 0 또는 음수일 때 감점
        score -= 100;
        reasons.push(`응급병상 없음 (-100)`);
      } else {
        score += usable;
        reasons.push(`응급병상 ${usable}개 (+${usable})`);
      }
    }

    // 4. 중증응급질환 가용성 (Y/N/N1/NONE 차등)
    const svdssCd = hospital.svdssCd?.elements || {};
    let svdssBonus = 0;
    let svdssPenalty = 0;
    let svdssYCount = 0;
    let svdssNCount = 0;

    Object.entries(svdssCd).forEach(([code, element]) => {
      const level = element.availableLevel;

      if (level === "Y") {
        svdssBonus += 10;
        svdssYCount++;
      } else if (level === "N" || level === "N1") {
        svdssPenalty += 50;
        svdssNCount++;
      } else if (level === "NONE") {
        svdssPenalty += 20;
        svdssNCount++;
      }
    });

    score += svdssBonus;
    score -= svdssPenalty;

    if (svdssYCount > 0) {
      reasons.push(`중증질환 가능 ${svdssYCount}개 (+${svdssBonus})`);
    }
    if (svdssNCount > 0 || svdssPenalty > 0) {
      reasons.push(`중증질환 제한/불가 (-${svdssPenalty})`);
    }

    // 5. 입원병상/장비 가용성 (Y/N/N1/NONE 차등)
    const rltmCd = hospital.rltmCd?.elements || {};
    const rltmMeCd = hospital.rltmMeCd?.elements || {};

    let facilityBonus = 0;
    let facilityPenalty = 0;

    [...Object.values(rltmCd), ...Object.values(rltmMeCd)].forEach(
      (element) => {
        const level = element?.availableLevel;

        if (level === "Y") {
          facilityBonus += 5;
        } else if (level === "N" || level === "N1") {
          facilityPenalty += 35;
        } else if (level === "NONE") {
          facilityPenalty += 15;
        }
      }
    );

    score += facilityBonus;
    score -= facilityPenalty;

    if (facilityBonus > 0) {
      reasons.push(`입원/장비 가능 (+${facilityBonus})`);
    }
    if (facilityPenalty > 0) {
      reasons.push(`입원/장비 제한 (-${facilityPenalty})`);
    }

    return {
      ...hospital,
      score: Math.round(score),
      scoreReasons: reasons,
    };
  });

  // 점수순 정렬
  scored.sort((a, b) => b.score - a.score);

  console.log(`  ✅ 필터링 완료`);
  console.log(`  🏆 상위 5개 병원:`);
  scored.slice(0, 5).forEach((h, i) => {
    console.log(
      `    ${i + 1}. ${h.name} (${h.score}점, ${h.distance.toFixed(1)}km)`
    );
    console.log(`       ${h.scoreReasons.join(" | ")}`);
  });

  return scored;
}

/**
 * 병원 메시지 분석 (2차 필터링)
 * @param {Array} hospitals - 병원 목록
 * @param {Object} patientData - 환자 정보
 * @returns {Array} 메시지 필터링된 병원 목록
 */
export function analyzeHospitalMessages(hospitals, patientData) {
  console.log(`\n💬 [메시지 분석] 시작`);

  const filtered = hospitals.filter((hospital) => {
    let isBlocked = false;
    let blockReasons = [];

    // erMessages 검사
    const erMessages = hospital.erMessages || [];
    erMessages.forEach((msg) => {
      const message = msg.message || "";

      // 간단한 키워드 기반 필터링
      const disease = patientData.primaryDisease || "";

      // 진료 불가 메시지 확인
      if (message.includes("불가") || message.includes("불가능")) {
        // 환자 질환과 메시지 매칭
        if (disease.includes("소아") && message.includes("소아")) {
          isBlocked = true;
          blockReasons.push(`소아 진료 불가: ${message.substring(0, 50)}`);
        }
        if (disease.includes("외상") && message.includes("외상")) {
          isBlocked = true;
          blockReasons.push(`외상 진료 불가: ${message.substring(0, 50)}`);
        }
        if (disease.includes("정신") && message.includes("정신")) {
          isBlocked = true;
          blockReasons.push(`정신과 진료 불가: ${message.substring(0, 50)}`);
        }
      }
    });

    // unavailableMessages 검사
    const unavailableMessages = hospital.unavailableMessages || [];
    if (unavailableMessages.length > 0) {
      console.log(
        `  ⚠️  ${hospital.name}: ${unavailableMessages.length}개 수용불가 메시지`
      );
    }

    if (isBlocked) {
      console.log(`  ❌ ${hospital.name} 제외: ${blockReasons.join(", ")}`);
    }

    return !isBlocked;
  });

  console.log(
    `  ✅ 메시지 필터링 완료: ${hospitals.length}개 → ${filtered.length}개`
  );

  return filtered;
}

/**
 * 점진적 확장 검색 (10km → 20km)
 * @param {Object} searchParams - 초기 검색 파라미터
 * @param {Object} currentLocation - 현재 위치
 * @param {Object} patientData - 환자 정보
 * @returns {Promise<Array>} 병원 목록
 */
export async function progressiveSearch(
  searchParams,
  currentLocation,
  patientData
) {
  console.log(`\n🔄 [점진적 확장 검색] 시작`);

  let hospitals = [];
  const strategies = [
    { radius: 10, filters: searchParams, label: "10km + 전체 필터" },
    { radius: 20, filters: searchParams, label: "20km + 전체 필터" },
    {
      radius: 10,
      filters: { ...searchParams, svdssCd: null },
      label: "10km + 중증질환 제외",
    },
    {
      radius: 20,
      filters: { ...searchParams, rltmCd: null, svdssCd: null },
      label: "20km + 입원병상/중증질환 제외",
    },
  ];

  for (const strategy of strategies) {
    console.log(
      `  🔍 시도 ${strategies.indexOf(strategy) + 1}: ${strategy.label}`
    );

    const results = await searchEmergencyHospitals({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      radius: strategy.radius,
      ...strategy.filters,
    });

    if (results.length >= 10) {
      console.log(`  ✅ 충분한 병원 발견 (${results.length}개), 검색 종료`);
      hospitals = results;
      break;
    } else {
      console.log(`  ⏭️  병원 부족 (${results.length}개), 다음 전략 시도`);
      hospitals = results; // 마지막 결과 보존
    }
  }

  console.log(`  🏁 최종 결과: ${hospitals.length}개 병원`);

  return hospitals;
}

export default {
  searchEmergencyHospitals,
  filterAndScoreHospitals,
  analyzeHospitalMessages,
  progressiveSearch,
};
