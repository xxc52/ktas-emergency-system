"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllRescuers, createRescuer } from "@/utils/rescuersSupabase";

export default function ProfileSelection() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [rescuers, setRescuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRescuerName, setNewRescuerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // DB에서 구조대원 목록 로드
  useEffect(() => {
    loadRescuers();
  }, []);

  const loadRescuers = async () => {
    setLoading(true);
    const data = await getAllRescuers();
    setRescuers(data);
    setLoading(false);
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    // Store selected worker in localStorage for later use
    localStorage.setItem("selectedWorker", JSON.stringify(worker));
    localStorage.setItem("selectedRescuerId", worker.id);
    // Navigate to age selection
    setTimeout(() => {
      router.push("/age-selection");
    }, 300);
  };

  const handleAddRescuer = async (e) => {
    e.preventDefault();
    if (!newRescuerName.trim()) return;

    setIsCreating(true);
    try {
      await createRescuer(newRescuerName.trim());
      setNewRescuerName("");
      setShowAddForm(false);
      await loadRescuers(); // 목록 새로고침
    } catch (error) {
      alert("구조대원 추가 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewRecords = () => {
    router.push("/records");
  };


  return (
    <div className="container">
      <div className="header">
        <div></div>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <div></div>
      </div>

      <div className="content">
        <div
          style={{ textAlign: "center", marginBottom: "var(--spacing-2xl)" }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "var(--spacing-md)",
              letterSpacing: "-0.02em",
            }}
          >
            🚑 구조대원을 선택해주세요
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "var(--gray-600)",
              lineHeight: "1.5",
            }}
          >
            현재 근무 중인 대원을 확인하고 시스템에 로그인하세요
          </p>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-2xl)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid var(--gray-200)",
                borderTop: "4px solid var(--primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p style={{ fontSize: "18px", color: "var(--gray-600)" }}>
              구조대원 목록을 불러오는 중...
            </p>
          </div>
        ) : (
          <div className="button-grid profile-grid">
            {rescuers.map((worker, index) => {
              const colors = [
                {
                  bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  icon: "👨‍⚕️",
                },
                {
                  bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  icon: "👩‍⚕️",
                },
                {
                  bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  icon: "🚑",
                },
                {
                  bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                  icon: "⚕️",
                },
                {
                  bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  icon: "🏥",
                },
                {
                  bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                  icon: "🩺",
                },
              ];
              const colorScheme = colors[index % colors.length];
              const isSelected = selectedWorker?.id === worker.id;

              return (
                <button
                  key={worker.id}
                  className={`category-button ${isSelected ? "selected" : ""}`}
                  onClick={() => handleWorkerSelect(worker)}
                  style={{
                    background: isSelected ? "var(--primary)" : colorScheme.bg,
                    color: "var(--white)",
                    border: isSelected
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                    minHeight: "140px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "48px",
                        marginBottom: "var(--spacing-md)",
                        filter: isSelected ? "brightness(1.2)" : "none",
                      }}
                    >
                      {isSelected ? "✅" : colorScheme.icon}
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        marginBottom: "var(--spacing-sm)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      {worker.name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        opacity: 0.9,
                        fontWeight: "500",
                      }}
                    >
                      구조대원 #{worker.id}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 새 구조대원 추가 버튼 */}
            {!showAddForm ? (
              <button
                className="category-button add-rescuer-button"
                onClick={() => setShowAddForm(true)}
                style={{
                  border: "2px dashed var(--gray-300)",
                  background: "var(--gray-50)",
                  minHeight: "140px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "48px",
                      marginBottom: "var(--spacing-md)",
                      color: "var(--gray-400)",
                    }}
                  >
                    ➕
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "var(--gray-600)",
                      fontWeight: "600",
                    }}
                  >
                    새 구조대원 추가
                  </div>
                </div>
              </button>
            ) : (
              <form
                onSubmit={handleAddRescuer}
                className="category-button"
                style={{
                  border: "2px solid var(--primary)",
                  background: "var(--primary-light)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "var(--spacing-xl)",
                  minHeight: "140px",
                }}
              >
                <input
                  type="text"
                  value={newRescuerName}
                  onChange={(e) => setNewRescuerName(e.target.value)}
                  placeholder="구조대원 이름을 입력하세요"
                  disabled={isCreating}
                  style={{
                    width: "100%",
                    padding: "var(--spacing-md)",
                    fontSize: "16px",
                    fontWeight: "500",
                    border: "2px solid var(--gray-200)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "var(--spacing-md)",
                    textAlign: "center",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--gray-200)")
                  }
                  autoFocus
                />
                <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                  <button
                    type="submit"
                    disabled={isCreating || !newRescuerName.trim()}
                    style={{
                      flex: 1,
                      padding: "var(--spacing-sm)",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: "var(--primary)",
                      color: "var(--white)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: isCreating ? "not-allowed" : "pointer",
                      opacity: isCreating || !newRescuerName.trim() ? 0.6 : 1,
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isCreating ? "추가 중..." : "✅ 추가"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRescuerName("");
                    }}
                    disabled={isCreating}
                    style={{
                      flex: 1,
                      padding: "var(--spacing-sm)",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: "var(--gray-500)",
                      color: "var(--white)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ❌ 취소
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className="bottom-navigation"
        style={{ marginTop: "var(--spacing-lg)" }}
      >
        <div></div>
        <div></div>
        <button
          className="nav-button records"
          onClick={handleViewRecords}
          style={{
            background: "var(--primary)",
            color: "var(--white)",
            borderRadius: "var(--radius-md)",
          }}
        >
          📊 기록 보기
        </button>
      </div>

    </div>
  );
}
