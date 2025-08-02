"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  loadKtasData,
  getUniqueCategories,
  getAllDiseasesByCategory,
  getFirstConsiderationsByCategory,
  getSecondConsiderationsByCategory,
  getDiseasesCompatibility,
  getFirstConsiderationsCompatibility,
  getSecondConsiderationsCompatibility,
  getKtasLevel,
} from "../../utils/ktasDataSupabase";
import { createPreset } from "../../utils/presetSupabase";

export default function AdultInput() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [ktasData, setKtasData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [selectedFirstConsiderations, setSelectedFirstConsiderations] =
    useState([]);
  const [selectedSecondConsiderations, setSelectedSecondConsiderations] =
    useState([]);

  // Available options
  const [categories, setCategories] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [firstConsiderations, setFirstConsiderations] = useState([]);
  const [secondConsiderations, setSecondConsiderations] = useState([]);

  useEffect(() => {
    const worker = localStorage.getItem("selectedWorker");
    if (worker) {
      setSelectedWorker(JSON.parse(worker));
    }

    // 프리셋 데이터 확인
    const presetData = localStorage.getItem("selectedPreset");
    if (presetData) {
      const preset = JSON.parse(presetData);
      localStorage.removeItem("selectedPreset"); // 한 번만 사용하고 삭제
      
      // 데이터 로드 후 프리셋 적용
      loadKtasData().then((data) => {
        setKtasData(data);
        setCategories(getUniqueCategories(data));
        
        // 프리셋 데이터 적용
        if (preset.category) {
          localStorage.setItem("presetLoaded", "true");
          setSelectedCategory(preset.category);
        }
        if (preset.disease) {
          setSelectedDiseases([preset.disease]);
        }
        if (preset.firstConsiderations) {
          setSelectedFirstConsiderations(preset.firstConsiderations);
        }
        if (preset.secondConsiderations) {
          setSelectedSecondConsiderations(preset.secondConsiderations);
        }
        
        setLoading(false);
      });
    } else {
      loadKtasData().then((data) => {
        setKtasData(data);
        setCategories(getUniqueCategories(data));
        setLoading(false);
      });
    }
  }, []);

  // Update available options when category changes
  useEffect(() => {
    if (selectedCategory && ktasData.length > 0) {
      const allDiseases = getAllDiseasesByCategory(ktasData, selectedCategory);
      const allFirstConsiderations = getFirstConsiderationsByCategory(
        ktasData,
        selectedCategory
      );
      const allSecondConsiderations = getSecondConsiderationsByCategory(
        ktasData,
        selectedCategory
      );

      setDiseases(allDiseases);
      setFirstConsiderations(allFirstConsiderations);
      setSecondConsiderations(allSecondConsiderations);

      // 프리셋에서 로드된 경우가 아니면 선택 초기화
      const presetData = localStorage.getItem("presetLoaded");
      if (!presetData) {
        setSelectedDiseases([]);
        setSelectedFirstConsiderations([]);
        setSelectedSecondConsiderations([]);
      } else {
        localStorage.removeItem("presetLoaded");
      }
    }
  }, [selectedCategory, ktasData]);

  // Memoized compatibility calculations
  const diseaseCompatibility = useMemo(() => {
    if (!selectedCategory || !ktasData.length) return {};
    return getDiseasesCompatibility(ktasData, {
      category: selectedCategory,
      firstConsiderations: selectedFirstConsiderations,
      secondConsiderations: selectedSecondConsiderations,
    });
  }, [
    selectedCategory,
    selectedFirstConsiderations,
    selectedSecondConsiderations,
    ktasData,
  ]);

  const firstConsiderationCompatibility = useMemo(() => {
    if (!selectedCategory || !ktasData.length) return {};
    return getFirstConsiderationsCompatibility(ktasData, {
      category: selectedCategory,
      diseases: selectedDiseases,
      secondConsiderations: selectedSecondConsiderations,
    });
  }, [
    selectedCategory,
    selectedDiseases,
    selectedSecondConsiderations,
    ktasData,
  ]);

  const secondConsiderationCompatibility = useMemo(() => {
    if (!selectedCategory || !ktasData.length) return {};
    return getSecondConsiderationsCompatibility(ktasData, {
      category: selectedCategory,
      diseases: selectedDiseases,
      firstConsiderations: selectedFirstConsiderations,
    });
  }, [
    selectedCategory,
    selectedDiseases,
    selectedFirstConsiderations,
    ktasData,
  ]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleDiseaseSelect = useCallback((disease) => {
    setSelectedDiseases(
      (prev) =>
        prev.includes(disease)
          ? [] // 이미 선택된 병명을 다시 클릭하면 선택 해제
          : [disease] // 새로운 병명 선택 시 기존 선택을 대체
    );
  }, []);

  const handleFirstConsiderationSelect = useCallback((consideration) => {
    setSelectedFirstConsiderations((prev) =>
      prev.includes(consideration)
        ? prev.filter((c) => c !== consideration)
        : [...prev, consideration]
    );
  }, []);

  const handleSecondConsiderationSelect = useCallback((consideration) => {
    setSelectedSecondConsiderations((prev) =>
      prev.includes(consideration)
        ? prev.filter((c) => c !== consideration)
        : [...prev, consideration]
    );
  }, []);

  const handleNext = () => {
    if (
      selectedDiseases.length > 0 &&
      (selectedFirstConsiderations.length > 0 ||
        selectedSecondConsiderations.length > 0)
    ) {
      // For now, use the first selected disease and consideration for KTAS calculation
      const primaryDisease = selectedDiseases[0];
      const primaryFirstConsideration = selectedFirstConsiderations[0] || null;
      const primarySecondConsideration =
        selectedSecondConsiderations[0] || null;

      const ktasLevel = getKtasLevel(
        ktasData,
        primaryDisease,
        primaryFirstConsideration,
        primarySecondConsideration
      );

      const result = {
        worker: selectedWorker,
        category: selectedCategory,
        diseases: selectedDiseases,
        firstConsiderations: selectedFirstConsiderations,
        secondConsiderations: selectedSecondConsiderations,
        primaryDisease,
        ktasLevel,
      };

      localStorage.setItem("ktasResult", JSON.stringify(result));
      router.push("/result");
    }
  };

  const handleClearAll = useCallback(() => {
    setSelectedDiseases([]);
    setSelectedFirstConsiderations([]);
    setSelectedSecondConsiderations([]);
  }, []);

  const removeFirstConsideration = useCallback((consideration) => {
    setSelectedFirstConsiderations((prev) =>
      prev.filter((c) => c !== consideration)
    );
  }, []);

  const removeSecondConsideration = useCallback((consideration) => {
    setSelectedSecondConsiderations((prev) =>
      prev.filter((c) => c !== consideration)
    );
  }, []);

  // 프리셋 저장 함수
  const handleSavePreset = useCallback(async () => {
    const presetName = prompt("프리셋 이름을 입력하세요:");
    
    if (!presetName || !presetName.trim()) {
      return;
    }

    if (!selectedWorker || !selectedCategory || selectedDiseases.length === 0) {
      alert("카테고리와 병명을 먼저 선택해주세요.");
      return;
    }

    const presetData = {
      category: selectedCategory,
      disease: selectedDiseases[0], // 단일 선택이므로 첫 번째 값만
      firstConsiderations: selectedFirstConsiderations,
      secondConsiderations: selectedSecondConsiderations
    };

    const result = await createPreset(selectedWorker.id, presetName, presetData);
    
    if (result) {
      alert("프리셋이 저장되었습니다!");
    } else {
      alert("프리셋 저장에 실패했습니다.");
    }
  }, [selectedWorker, selectedCategory, selectedDiseases, selectedFirstConsiderations, selectedSecondConsiderations]);

  // Memoized sorted items by compatibility and selection
  const sortedDiseases = useMemo(() => {
    return [...diseases].sort((a, b) => {
      const aSelected = selectedDiseases.includes(a);
      const bSelected = selectedDiseases.includes(b);
      const aCompatible = diseaseCompatibility[a];
      const bCompatible = diseaseCompatibility[b];

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (aCompatible && !bCompatible) return -1;
      if (!aCompatible && bCompatible) return 1;
      return a.localeCompare(b);
    });
  }, [diseases, selectedDiseases, diseaseCompatibility]);

  const sortedFirstConsiderations = useMemo(() => {
    return [...firstConsiderations].sort((a, b) => {
      const aSelected = selectedFirstConsiderations.includes(a);
      const bSelected = selectedFirstConsiderations.includes(b);
      const aCompatible = firstConsiderationCompatibility[a];
      const bCompatible = firstConsiderationCompatibility[b];

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (aCompatible && !bCompatible) return -1;
      if (!aCompatible && bCompatible) return 1;
      return a.localeCompare(b);
    });
  }, [
    firstConsiderations,
    selectedFirstConsiderations,
    firstConsiderationCompatibility,
  ]);

  const sortedSecondConsiderations = useMemo(() => {
    return [...secondConsiderations].sort((a, b) => {
      const aSelected = selectedSecondConsiderations.includes(a);
      const bSelected = selectedSecondConsiderations.includes(b);
      const aCompatible = secondConsiderationCompatibility[a];
      const bCompatible = secondConsiderationCompatibility[b];

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (aCompatible && !bCompatible) return -1;
      if (!aCompatible && bCompatible) return 1;
      return a.localeCompare(b);
    });
  }, [
    secondConsiderations,
    selectedSecondConsiderations,
    secondConsiderationCompatibility,
  ]);

  const handleBack = () => {
    router.push("/age-selection");
  };

  const isNextEnabled =
    selectedCategory &&
    selectedDiseases.length > 0 &&
    (selectedFirstConsiderations.length > 0 ||
      selectedSecondConsiderations.length > 0);

  if (loading) {
    return (
      <div className="container">
        <div
          className="content"
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <div>Loading KTAS data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="back-button" onClick={handleBack}>
            ← 이전
          </button>
          {selectedWorker && (
            <div className="current-user">
              평가자: {selectedWorker.name} ({selectedWorker.role})
            </div>
          )}
        </div>
        <h1 className="title">KTAS 응급구조시스템 - 성인</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {selectedCategory && selectedDiseases.length > 0 && (
            <button className="save-preset-btn" onClick={handleSavePreset}>
              프리셋으로 저장
            </button>
          )}
          {(selectedDiseases.length > 0 ||
            selectedFirstConsiderations.length > 0 ||
            selectedSecondConsiderations.length > 0) && (
            <button className="clear-button" onClick={handleClearAll}>
              초기화
            </button>
          )}
          <button
            className="next-button"
            onClick={handleNext}
            disabled={!isNextEnabled}
          >
            다음 →
          </button>
        </div>
      </div>

      <div className="content">
        {/* 구분 Navigation */}
        <div className="category-nav">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-nav-button ${
                selectedCategory === category ? "selected" : ""
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Main Content - Show only when category is selected */}
        {selectedCategory && (
          <div className="ktas-container">
            {/* 병명 Section */}
            <div className="ktas-section">
              <h3>병명</h3>
              {sortedDiseases.map((disease) => {
                const isSelected = selectedDiseases.includes(disease);
                const isCompatible = diseaseCompatibility[disease];

                return (
                  <button
                    key={disease}
                    className={`option-button ${
                      isSelected ? "selected" : isCompatible ? "" : "disabled"
                    }`}
                    onClick={() => handleDiseaseSelect(disease)}
                  >
                    {disease}
                  </button>
                );
              })}
            </div>

            {/* 1차 고려사항 Section */}
            <div className="ktas-section">
              <h3>1차 고려사항</h3>
              {selectedFirstConsiderations.length > 0 && (
                <div className="selected-items">
                  {selectedFirstConsiderations.map((consideration) => (
                    <div key={consideration} className="selected-item">
                      <span>{consideration}</span>
                      <button
                        className="remove-item"
                        onClick={() => removeFirstConsideration(consideration)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {sortedFirstConsiderations.map((consideration) => {
                const isSelected =
                  selectedFirstConsiderations.includes(consideration);
                const isCompatible =
                  firstConsiderationCompatibility[consideration];

                if (isSelected) return null;

                return (
                  <button
                    key={consideration}
                    className={`option-button ${
                      isCompatible ? "" : "disabled"
                    }`}
                    onClick={() =>
                      handleFirstConsiderationSelect(consideration)
                    }
                  >
                    {consideration}
                  </button>
                );
              })}
            </div>

            {/* 2차 고려사항 Section */}
            <div className="ktas-section">
              <h3>2차 고려사항</h3>
              {selectedSecondConsiderations.length > 0 && (
                <div className="selected-items">
                  {selectedSecondConsiderations.map((consideration) => (
                    <div key={consideration} className="selected-item">
                      <span>{consideration}</span>
                      <button
                        className="remove-item"
                        onClick={() => removeSecondConsideration(consideration)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {sortedSecondConsiderations.map((consideration) => {
                const isSelected =
                  selectedSecondConsiderations.includes(consideration);
                const isCompatible =
                  secondConsiderationCompatibility[consideration];

                if (isSelected) return null;

                return (
                  <button
                    key={consideration}
                    className={`option-button ${
                      isCompatible ? "" : "disabled"
                    }`}
                    onClick={() =>
                      handleSecondConsiderationSelect(consideration)
                    }
                  >
                    {consideration}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Instructions when no category selected */}
        {!selectedCategory && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60%",
              fontSize: "20px",
              color: "#666",
              textAlign: "center",
            }}
          >
            위에서 구분을 선택해주세요
          </div>
        )}
      </div>
    </div>
  );
}
