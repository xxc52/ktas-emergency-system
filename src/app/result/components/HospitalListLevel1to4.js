"use client";
import { useEffect, useState } from "react";
import { determineEmergencyFilters } from "@/utils/llmService";
import {
  progressiveSearch,
  filterAndScoreHospitals,
} from "@/utils/emergencyHospitalApi";

export default function HospitalListLevel1to4({
  currentLocation,
  patientData,
  ktasLevel,
  onHospitalsUpdate,
  onHospitalSelect,
}) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [llmStatus, setLlmStatus] = useState(null);
  const [searchProgress, setSearchProgress] = useState([]);

  useEffect(() => {
    if (!patientData || !currentLocation) {
      setLoading(false);
      return;
    }

    searchEmergencyHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientData, currentLocation, ktasLevel]);

  const addProgress = (message, type = "info") => {
    setSearchProgress((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toISOString() },
    ]);
  };

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

  // API 응답의 code로 병원에 메시지 페널티 추가 (중복 감점 방지)
  // N/N1은 이미 elements에서 감점되므로 메시지 페널티 없음
  const addMessagePenaltiesToHospitals = (hospitals, patientFilters) => {
    return hospitals.map(hospital => {
      // N/N1으로 감점되므로 메시지 페널티는 별도로 추가하지 않음
      return {
        ...hospital,
        messagePenalty: 0,
        penaltyReasons: []
      };
    });
  };

  const searchEmergencyHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchProgress([]);

      addProgress(`🚨 KTAS ${ktasLevel}급 응급실 검색 시작`, "info");
      addProgress(
        `📍 현재 위치: ${currentLocation.lat.toFixed(
          4
        )}, ${currentLocation.lng.toFixed(4)}`,
        "info"
      );

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🚨 KTAS ${ktasLevel}급 응급실 검색 시작`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log("환자 정보:", patientData);

      // 1단계: LLM을 통한 필터 판단
      addProgress("🧠 AI가 필요한 응급실 필터를 판단중...", "info");

      const filterResult = await determineEmergencyFilters({
        ktasLevel: ktasLevel,
        primaryDisease: patientData.primaryDisease || patientData.disease || "",
        firstConsiderations: patientData.firstConsiderations || [],
        secondConsiderations: patientData.secondConsiderations || [],
      });

      setLlmStatus(filterResult);

      if (filterResult.success) {
        addProgress(`✅ 필터 판단 완료: ${filterResult.reasoning}`, "success");
      } else {
        addProgress(`⚠️ LLM 연결 실패, 기본 필터 사용`, "warning");
      }

      console.log("\n📋 판단된 필터:", filterResult.filters);

      // 2단계: 점진적 확장 검색
      addProgress("🔍 주변 응급실 검색중 (10km → 20km 확장)...", "info");

      const searchParams = {
        ...filterResult.filters,
      };

      let rawHospitals = await progressiveSearch(
        searchParams,
        currentLocation,
        patientData
      );

      addProgress(
        `📊 검색 완료: ${rawHospitals.length}개 병원 발견`,
        "success"
      );

      if (rawHospitals.length === 0) {
        addProgress("❌ 주변에 수용 가능한 응급실이 없습니다", "error");
        setHospitals([]);
        setLoading(false);
        return;
      }

      // 3단계: API 응답의 code로 병원 메시지 페널티 추가
      addProgress("💬 병원 메시지 분석중 (감점 방식)...", "info");

      const hospitalsWithPenalties = addMessagePenaltiesToHospitals(
        rawHospitals,
        filterResult.filters
      );

      const penalizedCount = hospitalsWithPenalties.filter(h => h.messagePenalty > 0).length;
      if (penalizedCount > 0) {
        addProgress(
          `⚠️ ${penalizedCount}개 병원에 메시지 페널티 적용`,
          "warning"
        );
      } else {
        addProgress(
          `✅ 메시지 분석 완료 (페널티 없음)`,
          "success"
        );
      }

      // 4단계: 병원 점수 계산 및 정렬 (메시지 페널티 포함)
      addProgress("🏆 병원 우선순위 계산중...", "info");

      const scoredHospitals = filterAndScoreHospitals(
        hospitalsWithPenalties,
        currentLocation,
        patientData,
        filterResult.filters // 요청한 필터 정보 전달
      );

      // 상위 20개만 표시
      const topHospitals = scoredHospitals.slice(0, 20);

      addProgress(`✅ 최종 ${topHospitals.length}개 병원 선정 완료`, "success");

      // 5단계: 화면 표시용 데이터 변환
      const formattedHospitals = topHospitals.map((hospital) => ({
        ...hospital,
        id: hospital.code,
        name: hospital.name,
        distance: hospital.distance,
        distanceText: formatDistance(hospital.distance),
        address: hospital.address,
        phone:
          hospital.wiredHotline !== "-"
            ? hospital.wiredHotline
            : hospital.wirelessHotline,
        divisionName: getDivisionName(hospital.typeCode),
        hasEmergencyRoom: true,

        // 실시간 병상 정보
        emergencyBeds: hospital.rltmEmerCd?.elements?.O001 || null,
        admissionBeds: hospital.rltmCd?.elements || null,
        criticalDiseases: hospital.svdssCd?.elements || null,
        equipment: hospital.rltmMeCd?.elements || null,

        // 메시지
        erMessages: hospital.erMessages || [],
        unavailableMessages: hospital.unavailableMessages || [],

        // 점수 정보
        score: hospital.score,
        scoreReasons: hospital.scoreReasons,
      }));

      setHospitals(formattedHospitals);

      // 부모 컴포넌트(지도)에 병원 데이터 전달
      if (onHospitalsUpdate) {
        onHospitalsUpdate(formattedHospitals);
      }

      console.log("\n✅ 응급실 검색 완료");
      console.log(`📊 총 ${formattedHospitals.length}개 병원 표시\n`);
    } catch (error) {
      console.error("\n❌ 응급실 검색 실패:", error);
      setError(error.message);
      addProgress(`❌ 오류 발생: ${error.message}`, "error");

      // 에러 발생 시 기본 병원 목록 표시
      const fallbackHospitals = getFallbackHospitals();
      setHospitals(fallbackHospitals);

      if (onHospitalsUpdate) {
        onHospitalsUpdate(fallbackHospitals);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  };

  const getDivisionName = (typeCode) => {
    const divisions = {
      A: "권역응급의료센터",
      C: "지역응급의료센터",
      D: "지역응급의료기관",
    };
    return divisions[typeCode] || "응급의료기관";
  };

  const getAvailabilityColor = (level) => {
    const colors = {
      HIGH: "#10b981",
      MEDIUM: "#f59e0b",
      LOW: "#ef4444",
      NONE: "#6b7280",
    };
    return colors[level] || "#6b7280";
  };

  const getAvailabilityText = (level) => {
    const texts = {
      HIGH: "충분",
      MEDIUM: "보통",
      LOW: "부족",
      NONE: "없음",
      Y: "가능",
      N: "불가",
      N1: "제한적",
    };
    return texts[level] || "확인 필요";
  };

  const getFallbackHospitals = () => {
    return [
      {
        id: "fallback-1",
        name: "응급실 정보를 불러올 수 없습니다",
        distance: "-",
        distanceText: "-",
        address: "인터넷 연결 및 LLM 서버를 확인해주세요",
        phone: "-",
        divisionName: "시스템 오류",
        hasEmergencyRoom: false,
        score: 0,
      },
    ];
  };

  if (loading) {
    return (
      <div className="hospital-list-loading">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #e5e7eb",
              borderTop: "2px solid #ef4444",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ fontWeight: "600", color: "#ef4444" }}>
            🚨 응급실 검색중... (KTAS {ktasLevel}급)
          </p>
        </div>

        {/* 진행 상황 표시 */}
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            padding: "12px",
            borderRadius: "8px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {searchProgress.map((progress, index) => (
            <div
              key={index}
              style={{
                marginBottom: "6px",
                color:
                  progress.type === "error"
                    ? "#ef4444"
                    : progress.type === "warning"
                    ? "#f59e0b"
                    : progress.type === "success"
                    ? "#10b981"
                    : "#6b7280",
              }}
            >
              {progress.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-list">
      {/* LLM 판단 결과 표시 */}
      {llmStatus && (
        <div
          style={{
            background: llmStatus.success ? "#f0f9ff" : "#fef3c7",
            border: `1px solid ${llmStatus.success ? "#0ea5e9" : "#f59e0b"}`,
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            🧠 AI 필터 판단 결과 (KTAS {ktasLevel}급)
          </div>
          <div
            style={{ color: "#6b7280", fontSize: "13px", marginBottom: "8px" }}
          >
            {llmStatus.reasoning}
          </div>

          {/* 필터 코드 상세 정보 토글 */}
          {llmStatus.filters && (
            <details style={{ marginTop: "8px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#10b981",
                  marginBottom: "4px",
                }}
              >
                🏥 선택된 필터 코드 상세 정보
              </summary>
              <div
                style={{
                  marginTop: "8px",
                  paddingLeft: "12px",
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: "1.8",
                }}
              >
                {llmStatus.filters.rltmEmerCd &&
                  llmStatus.filters.rltmEmerCd.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>• 응급실병상:</strong>{" "}
                      {llmStatus.filters.rltmEmerCd
                        .map(
                          (code) => `${filterCodeNames[code] || code}(${code})`
                        )
                        .join(", ")}
                    </div>
                  )}
                {llmStatus.filters.rltmCd &&
                  llmStatus.filters.rltmCd.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>• 입원병상:</strong>{" "}
                      {llmStatus.filters.rltmCd
                        .map(
                          (code) => `${filterCodeNames[code] || code}(${code})`
                        )
                        .join(", ")}
                    </div>
                  )}
                {llmStatus.filters.svdssCd &&
                  llmStatus.filters.svdssCd.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>• 중증응급질환:</strong>{" "}
                      {llmStatus.filters.svdssCd
                        .map(
                          (code) => `${filterCodeNames[code] || code}(${code})`
                        )
                        .join(", ")}
                    </div>
                  )}
                {llmStatus.filters.rltmMeCd &&
                  llmStatus.filters.rltmMeCd.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <strong>• 장비정보:</strong>{" "}
                      {llmStatus.filters.rltmMeCd
                        .map(
                          (code) => `${filterCodeNames[code] || code}(${code})`
                        )
                        .join(", ")}
                    </div>
                  )}
              </div>
            </details>
          )}

          {/* RAG 참고 문서 표시 */}
          {llmStatus.ragDocs && llmStatus.ragDocs.length > 0 && (
            <details style={{ marginTop: "8px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#3b82f6",
                  marginBottom: "4px",
                }}
              >
                📚 참고한 의료 문서 {llmStatus.ragDocs.length}개
              </summary>
              <div
                style={{
                  marginTop: "8px",
                  paddingLeft: "12px",
                  fontSize: "12px",
                  color: "#6b7280",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {llmStatus.ragDocs.map((doc, i) => (
                  <div
                    key={i}
                    style={{ marginBottom: "6px", lineHeight: "1.4" }}
                  >
                    • {doc}
                  </div>
                ))}
              </div>
            </details>
          )}

          {llmStatus.fallback && (
            <div
              style={{ marginTop: "8px", color: "#dc2626", fontSize: "13px" }}
            >
              ⚠️ LLM 서버 연결 실패로 기본 필터 적용됨
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#dc2626",
          }}
        >
          ⚠️ 오류: {error}
        </div>
      )}

      {/* 병원 목록 */}
      {hospitals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
          검색된 응급실이 없습니다.
          <br />
          필터 조건을 완화하거나 119에 직접 문의하세요.
        </div>
      ) : (
        hospitals.map((hospital, index) => (
          <div
            key={hospital.id}
            className="hospital-item"
            style={{
              borderLeft:
                index < 3
                  ? `4px solid ${
                      index === 0
                        ? "#ef4444"
                        : index === 1
                        ? "#f59e0b"
                        : "#10b981"
                    }`
                  : "none",
              cursor: "pointer",
            }}
            onClick={() => onHospitalSelect && onHospitalSelect(hospital.id)}
          >
            <div className="hospital-header">
              <h3 className="hospital-name">
                {index < 3 && (
                  <span
                    style={{
                      backgroundColor:
                        index === 0
                          ? "#ef4444"
                          : index === 1
                          ? "#f59e0b"
                          : "#10b981",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      marginRight: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}위
                  </span>
                )}
                {hospital.name}
                {hospital.divisionName === "권역응급의료센터" && (
                  <span
                    className="hospital-badge"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    권역
                  </span>
                )}
                {hospital.divisionName === "지역응급의료센터" && (
                  <span
                    className="hospital-badge"
                    style={{ backgroundColor: "#f59e0b" }}
                  >
                    센터
                  </span>
                )}
              </h3>
              <span
                className="hospital-distance"
                style={{ fontWeight: "bold", color: "#ef4444" }}
              >
                {hospital.distanceText || hospital.distance}
              </span>
            </div>

            <div className="hospital-details">
              {/* 2x2 그리드 레이아웃 */}
              <div className="hospital-grid">
                {/* 첫 번째 행 */}
                <div className="hospital-row">
                  <span className="detail-label">응급실 병상:</span>
                  <span className="detail-value" style={{ fontWeight: "600" }}>
                    {hospital.emergencyBeds ?
                      `${hospital.emergencyBeds.usable}/${hospital.emergencyBeds.total}` :
                      '-'}
                  </span>
                </div>

                <div className="hospital-row">
                  <span className="detail-label">입원병상:</span>
                  <span className="detail-value" style={{ fontSize: "11px" }}>
                    {hospital.admissionBeds && Object.keys(hospital.admissionBeds).length > 0 ? (
                      Object.entries(hospital.admissionBeds).map(([code, data]) => {
                        if (!data || typeof data !== 'object') return null;
                        const usable = data.usable !== undefined ? data.usable : '-';
                        const total = data.total !== undefined ? data.total : '-';
                        return `${filterCodeNames[code] || code}: ${usable}/${total}`;
                      }).filter(Boolean).join(", ")
                    ) : '-'}
                  </span>
                </div>

                {/* 두 번째 행 */}
                <div className="hospital-row">
                  <span className="detail-label">중증응급:</span>
                  <span className="detail-value" style={{ fontSize: "11px" }}>
                    {hospital.criticalDiseases && Object.keys(hospital.criticalDiseases).length > 0 ? (
                      Object.entries(hospital.criticalDiseases).map(([code, data]) => {
                        if (!data || typeof data !== 'object') return null;
                        const level = data.availableLevel;
                        let status = '-';
                        if (level === 'Y') status = '가능';
                        else if (level === 'N') status = '불가';
                        else if (level === 'N1') status = '제한';
                        else if (level === 'NONE') status = '없음';
                        return `${filterCodeNames[code] || code}: ${status}`;
                      }).filter(Boolean).join(", ")
                    ) : '-'}
                  </span>
                </div>

                <div className="hospital-row">
                  <span className="detail-label">장비:</span>
                  <span className="detail-value" style={{ fontSize: "11px" }}>
                    {hospital.equipment && Object.keys(hospital.equipment).length > 0 ? (
                      Object.entries(hospital.equipment).map(([code, data]) => {
                        if (!data || typeof data !== 'object') return null;
                        const level = data.availableLevel;
                        let status = '-';
                        if (level === 'Y') status = '가능';
                        else if (level === 'N') status = '불가';
                        else if (level === 'N1') status = '제한';
                      else if (level === 'NONE') status = '없음';
                      return `${filterCodeNames[code] || code}: ${status}`;
                    }).filter(Boolean).join(", ")
                  ) : '-'}
                  </span>
                </div>
              </div>

              {/* 연락처와 주소 정보 */}
              <div className="hospital-row" style={{ marginTop: "8px" }}>
                <span className="detail-label">연락처:</span>
                <span className="detail-value">
                  {hospital.phone || "정보 없음"}
                </span>
              </div>

              <div className="hospital-row">
                <span className="detail-label">주소:</span>
                <span className="detail-value">{hospital.address}</span>
              </div>

              {/* 점수 정보 - 토글 가능한 상세 정보 */}
              {hospital.scoreReasons && hospital.scoreReasons.length > 0 && (
                <details
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
                  <summary
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>🏆 병원 점수: {hospital.score}점</span>
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                      클릭하여 상세 보기 ▼
                    </span>
                  </summary>
                  <div
                    style={{
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid #e5e7eb",
                      color: "#6b7280",
                      lineHeight: "1.8",
                    }}
                  >
                    {hospital.scoreReasons.map((reason, idx) => (
                      <div key={idx} style={{ marginBottom: "2px" }}>
                        • {reason}
                      </div>
                    ))}
                  </div>
                </details>
              )}

            </div>
          </div>
        ))
      )}
    </div>
  );
}
