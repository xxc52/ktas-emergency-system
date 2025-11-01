"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPresetsByRescuer,
  deletePreset,
  createSystemPresets,
  hasPresets,
} from "../../utils/presetSupabase";

export default function AgeSelection() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedDetailedAge, setSelectedDetailedAge] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const worker = localStorage.getItem("selectedWorker");
    const rescuerId = localStorage.getItem("selectedRescuerId");
    if (worker && rescuerId) {
      const workerData = JSON.parse(worker);
      setSelectedWorker(workerData);
      loadPresets(parseInt(rescuerId));
    }
  }, []);

  const loadPresets = async (rescuerId) => {
    try {
      setLoading(true);
      const hasExistingPresets = await hasPresets(rescuerId);

      if (!hasExistingPresets) {
        await createSystemPresets(rescuerId);
      }

      const presetData = await getPresetsByRescuer(rescuerId);
      setPresets(presetData);
    } catch (error) {
      console.error("프리셋 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgeSelect = (ageType) => {
    setSelectedAge(ageType);

    // 소아 선택 시 세부 연령대와 성별 초기화
    if (ageType === "pediatric") {
      setSelectedDetailedAge(null);
      setSelectedGender(null);
    }
  };

  const handleDetailedAgeSelect = (ageGroup) => {
    setSelectedDetailedAge(ageGroup);
  };

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  const handleStartKTAS = () => {
    // 성인: 모든 항목 필수
    if (selectedAge === "adult") {
      if (!selectedDetailedAge || !selectedGender) {
        alert("세부 연령대와 성별을 모두 선택해주세요.");
        return;
      }
    }

    // localStorage에 저장
    localStorage.setItem("selectedAge", selectedAge);
    if (selectedDetailedAge) {
      localStorage.setItem("selectedDetailedAge", selectedDetailedAge);
    }
    if (selectedGender) {
      localStorage.setItem("selectedGender", selectedGender);
    }

    // 페이지 이동
    if (selectedAge === "adult") {
      router.push("/adult-input");
    } else {
      router.push("/pediatric-input");
    }
  };

  const handlePresetSelect = (preset) => {
    // 성인 프리셋이므로 세부 연령대와 성별 필수 확인
    if (!selectedDetailedAge || !selectedGender) {
      alert("세부 연령대와 성별을 먼저 선택해주세요.");
      return;
    }

    // 선택된 정보 저장
    localStorage.setItem("selectedAge", "adult");
    localStorage.setItem("selectedDetailedAge", selectedDetailedAge);
    localStorage.setItem("selectedGender", selectedGender);
    localStorage.setItem("selectedPreset", JSON.stringify(preset.preset_data));
    router.push("/adult-input");
  };

  const handleDeletePreset = async (presetId, e) => {
    e.stopPropagation();

    if (confirm("이 프리셋을 삭제하시겠습니까?")) {
      const success = await deletePreset(presetId);
      if (success) {
        setPresets(presets.filter((p) => p.id !== presetId));
      }
    }
  };

  const handleBack = () => {
    router.push("/profile");
  };

  // KTAS 시작 버튼 활성화 조건
  const canStartKTAS =
    selectedAge &&
    (selectedAge === "pediatric" || (selectedDetailedAge && selectedGender));

  // 빠른 선택 프리셋 사용 가능 조건 (세부 연령대 + 성별 필수)
  const canUsePreset = selectedDetailedAge && selectedGender;

  return (
    <div className="container">
      <div className="header">
        <div></div>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <div></div>
      </div>

      <div className="content">
        {selectedWorker && (
          <div
            className="current-user"
            style={{ marginTop: "var(--spacing-sm)" }}
          >
            평가자: {selectedWorker.name} ({selectedWorker.role})
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: "var(--spacing-sm)" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "var(--spacing-xs)",
              letterSpacing: "-0.02em",
            }}
          >
            👩‍⚕️ 환자 정보를 입력해주세요
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--gray-600)",
              lineHeight: "1.5",
            }}
          >
            환자의 정보에 따라 평가 기준이 달라집니다
          </p>
        </div>

        {/* 메인 콘텐츠: 왼쪽(선택 영역) + 오른쪽(프리셋) */}
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-lg)",
            flex: "1",
            minHeight: "0",
            alignItems: "stretch",
          }}
        >
          {/* 왼쪽: 환자 정보 선택 */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
              minWidth: "0",
            }}
          >
            {/* 1. 연령대 선택 */}
            <div
              style={{
                background: "var(--white)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-md)",
                boxShadow: "var(--shadow-sm)",
                border: "2px solid var(--gray-200)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "var(--spacing-xs)",
                  marginBottom: "var(--spacing-xs)",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--gray-900)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  1. 연령대 선택
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "var(--spacing-sm)",
                }}
              >
                <button
                  className={`category-button ${
                    selectedAge === "adult" ? "selected" : ""
                  }`}
                  onClick={() => handleAgeSelect("adult")}
                  style={{
                    padding: "var(--spacing-md)",
                    background:
                      selectedAge === "adult"
                        ? "var(--primary)"
                        : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "var(--white)",
                    border:
                      selectedAge === "adult"
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                    minHeight: "82px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      gap: "4px",
                    }}
                  >
                    <div style={{ fontSize: "30px" }}>
                      {selectedAge === "adult" ? "✅" : "👨‍⚕️"}
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: "700" }}>
                      성인
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.95 }}>
                      만 15세 이상
                    </div>
                  </div>
                </button>

                <button
                  className={`category-button ${
                    selectedAge === "pediatric" ? "selected" : ""
                  }`}
                  onClick={() => handleAgeSelect("pediatric")}
                  style={{
                    padding: "var(--spacing-md)",
                    background:
                      selectedAge === "pediatric"
                        ? "var(--primary)"
                        : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "var(--white)",
                    border:
                      selectedAge === "pediatric"
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                    minHeight: "82px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      gap: "4px",
                    }}
                  >
                    <div style={{ fontSize: "30px" }}>
                      {selectedAge === "pediatric" ? "✅" : "👶"}
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: "700" }}>
                      소아
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.95 }}>
                      만 15세 미만
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. 세부 연령대 선택 (성인 선택 시만 표시) */}
            {selectedAge === "adult" && (
              <div
                style={{
                  background: "var(--white)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--spacing-md)",
                  boxShadow: "var(--shadow-sm)",
                  border: "2px solid var(--gray-200)",
                  animation: "fadeIn 0.3s ease-in-out",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--spacing-xs)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--gray-900)",
                      marginBottom: "var(--spacing-xs)",
                    }}
                  >
                    2. 세부 연령대 선택
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  {[
                    {
                      value: "15-24",
                      label: "15-24세",
                      emoji: "👦",
                      subtitle: "청년",
                    },
                    {
                      value: "25-34",
                      label: "25-34세",
                      emoji: "👨",
                      subtitle: "청년",
                    },
                    {
                      value: "35-44",
                      label: "35-44세",
                      emoji: "👱",
                      subtitle: "중년",
                    },
                    {
                      value: "45-54",
                      label: "45-54세",
                      emoji: "👨",
                      subtitle: "중년",
                    },
                    {
                      value: "55-64",
                      label: "55-64세",
                      emoji: "👴",
                      subtitle: "장년",
                    },
                    {
                      value: "65+",
                      label: "65세 이상",
                      emoji: "👵",
                      subtitle: "노년",
                    },
                  ].map((age) => (
                    <button
                      key={age.value}
                      className={`category-button ${
                        selectedDetailedAge === age.value ? "selected" : ""
                      }`}
                      onClick={() => handleDetailedAgeSelect(age.value)}
                      style={{
                        padding: "var(--spacing-sm)",
                        background:
                          selectedDetailedAge === age.value
                            ? "var(--primary)"
                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "var(--white)",
                        border:
                          selectedDetailedAge === age.value
                            ? "3px solid var(--primary)"
                            : "3px solid transparent",
                        minHeight: "70px",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "26px", marginBottom: "3px" }}>
                          {selectedDetailedAge === age.value ? "✅" : age.emoji}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "700" }}>
                          {age.label}
                        </div>
                        <div style={{ fontSize: "13px", opacity: 0.9 }}>
                          {age.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 성별 선택 */}
            {selectedAge === "adult" && (
              <div
                style={{
                  background: "var(--white)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--spacing-md)",
                  boxShadow: "var(--shadow-sm)",
                  border: "2px solid var(--gray-200)",
                  animation: "fadeIn 0.3s ease-in-out",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--spacing-xs)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--gray-900)",
                      marginBottom: "var(--spacing-xs)",
                    }}
                  >
                    3. 성별 선택
                  </h3>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  <button
                    className={`category-button ${
                      selectedGender === "male" ? "selected" : ""
                    }`}
                    onClick={() => handleGenderSelect("male")}
                    style={{
                      padding: "var(--spacing-md)",
                      background:
                        selectedGender === "male"
                          ? "var(--primary)"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "var(--white)",
                      border:
                        selectedGender === "male"
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                      minHeight: "80px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "30px", marginBottom: "3px" }}>
                        {selectedGender === "male" ? "✅" : "👨"}
                      </div>
                      <div style={{ fontSize: "17px", fontWeight: "700" }}>
                        남성
                      </div>
                      <div style={{ fontSize: "13px", opacity: 0.9 }}>Male</div>
                    </div>
                  </button>

                  <button
                    className={`category-button ${
                      selectedGender === "female" ? "selected" : ""
                    }`}
                    onClick={() => handleGenderSelect("female")}
                    style={{
                      padding: "var(--spacing-md)",
                      background:
                        selectedGender === "female"
                          ? "var(--primary)"
                          : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      color: "var(--white)",
                      border:
                        selectedGender === "female"
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                      minHeight: "80px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "30px", marginBottom: "3px" }}>
                        {selectedGender === "female" ? "✅" : "👩"}
                      </div>
                      <div style={{ fontSize: "17px", fontWeight: "700" }}>
                        여성
                      </div>
                      <div style={{ fontSize: "13px", opacity: 0.9 }}>
                        Female
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 빠른 선택 (성인용) 프리셋 */}
          {!loading && presets.length > 0 && (
            <div
              style={{
                flex: "0 0 20%",
                display: "flex",
                flexDirection: "column",
                background:
                  "linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%)",
                borderRadius: "var(--radius-lg)",
                border: "2px solid var(--gray-200)",
                boxShadow: "var(--shadow-md)",
                padding: "var(--spacing-md)",
                minWidth: "200px",
                maxWidth: "280px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "var(--spacing-sm)",
                  flexShrink: 0,
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--primary)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  ⚡ 빠른 선택
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--gray-600)",
                    lineHeight: "1.4",
                  }}
                >
                  자주 사용하는 상황
                </p>
              </div>

              <div
                style={{
                  flex: "1",
                  minHeight: "0",
                  overflowY: "auto",
                  padding: "var(--spacing-xs) 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="preset-button"
                      onClick={() => canUsePreset && handlePresetSelect(preset)}
                      style={{
                        padding: "var(--spacing-md)",
                        minHeight: "70px",
                        opacity: canUsePreset ? 1 : 0.5,
                        cursor: canUsePreset ? "pointer" : "not-allowed",
                        pointerEvents: canUsePreset ? "auto" : "none",
                      }}
                    >
                      <div className="preset-content">
                        <div
                          className="preset-name"
                          style={{ fontSize: "16px" }}
                        >
                          {preset.preset_name}
                        </div>
                        <div
                          className="preset-details"
                          style={{ fontSize: "13px" }}
                        >
                          {preset.preset_data.category} →{" "}
                          {preset.preset_data.disease}
                        </div>
                      </div>
                      <button
                        className="preset-delete-btn"
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className="bottom-navigation"
        style={{ marginTop: "var(--spacing-md)" }}
      >
        <button
          className="nav-button back"
          onClick={handleBack}
          style={{
            background: "var(--gray-100)",
            color: "var(--gray-700)",
            border: "2px solid var(--gray-300)",
            borderRadius: "var(--radius-md)",
          }}
        >
          ← 이전
        </button>

        <button
          className="nav-button next"
          onClick={handleStartKTAS}
          disabled={!canStartKTAS}
          style={{
            background: canStartKTAS ? "var(--primary)" : "var(--gray-300)",
            color: "var(--white)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: canStartKTAS ? "pointer" : "not-allowed",
            opacity: canStartKTAS ? 1 : 0.6,
            fontSize: "18px",
            fontWeight: "700",
            padding: "var(--spacing-md) var(--spacing-xl)",
          }}
        >
          {selectedAge === "pediatric"
            ? "KTAS 평가 시작 →"
            : !selectedAge
            ? "연령대를 선택해주세요"
            : !selectedDetailedAge
            ? "세부 연령대를 선택해주세요"
            : !selectedGender
            ? "성별을 선택해주세요"
            : "KTAS 평가 시작 →"}
        </button>
      </div>
    </div>
  );
}
