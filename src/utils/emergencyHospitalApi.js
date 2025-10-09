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

    // 필터 추가 (LLM이 판단한 코드만)
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

// 필터 코드 이름 매핑
const filterCodeNames = {
  // 응급실병상
  O001: "일반응급실",
  O002: "소아응급실",
  O003: "음압격리",
  O004: "일반격리",
  O060: "외상소생실",
  // 입원병상
  O006: "내과중환자실",
  O007: "외과중환자실",
  O008: "신생아중환자실",
  O009: "소아중환자실",
  O011: "신경과중환자실",
  O012: "신경외과중환자실",
  O013: "화상중환자실",
  O014: "외상중환자실",
  O015: "심장내과중환자실",
  O016: "흉부외과중환자실",
  O017: "일반중환자실",
  O020: "소아응급입원",
  O021: "외상입원",
  O022: "수술실",
  O023: "외상수술",
  O026: "분만실",
  O036: "화상전용처치실",
  // 중증응급질환
  Y0010: "심근경색",
  Y0020: "뇌경색",
  Y0031: "거미막하출혈",
  Y0032: "뇌출혈",
  Y0041: "흉부대동맥응급",
  Y0042: "복부대동맥응급",
  Y0051: "담낭질환",
  Y0052: "담도질환",
  Y0060: "복부응급수술",
  Y0070: "장중첩",
  Y0100: "저체중출생아",
  Y0111: "분만",
  Y0112: "산과수술",
  Y0113: "부인과수술",
  Y0120: "화상",
  Y0131: "수족지접합",
  Y0132: "사지접합외",
  Y0150: "정신응급",
  Y0160: "안과응급",
  // 장비정보
  O027: "CT",
  O028: "MRI",
  O029: "혈관촬영기",
  O030: "인공호흡기(일반)",
  O031: "인공호흡기(조산아)",
  O032: "인큐베이터",
  O033: "CRRT",
  O034: "ECMO",
};

/**
 * 병원 필터링 및 점수 계산 (개선된 스코어링 시스템)
 * @param {Array} hospitals - 병원 목록
 * @param {Object} currentLocation - 현재 위치
 * @param {Object} patientData - 환자 정보
 * @param {Object} requestedFilters - LLM이 요청한 필터 (rltmEmerCd, rltmCd, svdssCd, rltmMeCd)
 * @returns {Array} 필터링 및 정렬된 병원 목록
 */
export function filterAndScoreHospitals(
  hospitals,
  currentLocation,
  patientData,
  requestedFilters = {}
) {
  console.log(`\n🔍 [병원 필터링] 시작`);
  console.log(`  📊 원본 병원 수: ${hospitals.length}개`);
  console.log(`  🎯 요청된 필터:`, requestedFilters);

  const scored = hospitals.map((hospital) => {
    let score = 1000; // 기본 점수
    let reasons = [];

    // 1. 거리 패널티 (거리 × 1점 감점)
    const distance = hospital.distance || 0;
    const distancePenalty = Math.round(distance * 1);
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

    // 3. 응급실 병상 가용성
    const emergencyBeds = hospital.rltmEmerCd?.elements?.O001;
    if (emergencyBeds) {
      const usable = emergencyBeds.usable || 0;
      const total = emergencyBeds.total || 0;
      if (usable <= 0) {
        score -= 100;
        reasons.push(`응급병상: 0/${total} (-100)`);
      } else {
        const bedScore = Math.round(usable * 0.5);
        score += bedScore;
        reasons.push(`응급병상: ${usable}/${total} (+${bedScore})`);
      }
    } else {
      // 응급실 병상 정보가 없으면 중간 정도 감점
      score -= 30;
      reasons.push(`응급병상: 정보없음 (-30)`);
    }

    // 4. 중증응급질환 가용성 (요청한 경우에만 평가)
    const svdssCd = hospital.svdssCd?.elements || {};
    let svdssDetails = [];
    let svdssScore = 0;
    const svdssRequested = requestedFilters.svdssCd && requestedFilters.svdssCd.length > 0;

    Object.entries(svdssCd).forEach(([code, element]) => {
      const level = element.availableLevel;
      const name = filterCodeNames[code] || code;

      if (level === "Y") {
        svdssScore += 10;
        svdssDetails.push(`${name}:Y`);
      } else if (level === "N" || level === "N1") {
        svdssScore -= 100;
        svdssDetails.push(`${name}:${level}`);
      } else if (level === "NONE") {
        svdssScore -= 50;
        svdssDetails.push(`${name}:없음`);
      }
    });

    score += svdssScore;

    if (svdssDetails.length > 0) {
      const sign = svdssScore >= 0 ? "+" : "";
      reasons.push(
        `중증: ${svdssDetails.slice(0, 2).join(", ")}${
          svdssDetails.length > 2 ? " 외" : ""
        } (${sign}${svdssScore})`
      );
    } else if (svdssRequested) {
      // 요청했는데 정보가 없으면 감점
      score -= 50;
      reasons.push(`중증: 정보없음 (-50)`);
    }
    // 요청하지 않았으면 감점하지 않음

    // 5. 입원병상 가용성 (요청한 경우에만 평가)
    const rltmCd = hospital.rltmCd?.elements || {};
    let admissionDetails = [];
    let admissionScore = 0;
    const rltmCdRequested = requestedFilters.rltmCd && requestedFilters.rltmCd.length > 0;

    Object.entries(rltmCd).forEach(([code, element]) => {
      const level = element?.availableLevel;
      const name = filterCodeNames[code] || code;

      if (level === "Y") {
        admissionScore += 5;
        admissionDetails.push(`${name}:Y`);
      } else if (level === "N" || level === "N1") {
        admissionScore -= 100;
        admissionDetails.push(`${name}:${level}`);
      } else if (level === "NONE") {
        admissionScore -= 50;
        admissionDetails.push(`${name}:없음`);
      }
    });

    score += admissionScore;

    if (admissionDetails.length > 0) {
      const sign = admissionScore >= 0 ? "+" : "";
      reasons.push(
        `입원: ${admissionDetails.slice(0, 2).join(", ")}${
          admissionDetails.length > 2 ? " 외" : ""
        } (${sign}${admissionScore})`
      );
    } else if (rltmCdRequested) {
      // 요청했는데 정보가 없으면 감점
      score -= 50;
      reasons.push(`입원: 정보없음 (-50)`);
    }
    // 요청하지 않았으면 감점하지 않음

    // 6. 장비 가용성 (요청한 경우에만 평가)
    const rltmMeCd = hospital.rltmMeCd?.elements || {};
    let equipmentDetails = [];
    let equipmentScore = 0;
    const rltmMeCdRequested = requestedFilters.rltmMeCd && requestedFilters.rltmMeCd.length > 0;

    Object.entries(rltmMeCd).forEach(([code, element]) => {
      const level = element?.availableLevel;
      const name = filterCodeNames[code] || code;

      if (level === "Y") {
        equipmentScore += 5;
        equipmentDetails.push(`${name}:Y`);
      } else if (level === "N" || level === "N1") {
        equipmentScore -= 40;
        equipmentDetails.push(`${name}:${level}`);
      } else if (level === "NONE") {
        equipmentScore -= 30;
        equipmentDetails.push(`${name}:없음`);
      }
    });

    score += equipmentScore;

    if (equipmentDetails.length > 0) {
      const sign = equipmentScore >= 0 ? "+" : "";
      reasons.push(
        `장비: ${equipmentDetails.slice(0, 2).join(", ")}${
          equipmentDetails.length > 2 ? " 외" : ""
        } (${sign}${equipmentScore})`
      );
    } else if (rltmMeCdRequested) {
      // 요청했는데 정보가 없으면 감점
      score -= 30;
      reasons.push(`장비: 정보없음 (-30)`);
    }
    // 요청하지 않았으면 감점하지 않음

    // 7. 병원 메시지 페널티 (이미 계산된 값 사용)
    if (hospital.messagePenalty && hospital.messagePenalty > 0) {
      score -= hospital.messagePenalty;
      reasons.push(
        `메시지 페널티: ${hospital.penaltyReasons.join(", ")} (-${
          hospital.messagePenalty
        })`
      );
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
    { radius: 100, filters: searchParams, label: "100km + 전체 필터" },
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
