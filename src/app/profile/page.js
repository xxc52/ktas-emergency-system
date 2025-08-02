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
        <button className="next-button" onClick={handleViewRecords}>
          📊 기록 보기
        </button>
      </div>

      <div className="content">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "24px", color: "#333", marginBottom: "10px" }}>
            응급구조원을 선택해주세요
          </h2>
          <p style={{ fontSize: "18px", color: "#666" }}>
            환자 평가를 진행할 구조원을 선택하세요
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#666" }}>로딩 중...</p>
          </div>
        ) : (
          <div className="button-grid profile-grid">
            {rescuers.map((worker) => (
            <button
              key={worker.id}
              className={`category-button ${
                selectedWorker?.id === worker.id ? "selected" : ""
              }`}
              onClick={() => handleWorkerSelect(worker)}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  {worker.name}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: selectedWorker?.id === worker.id ? "#fff" : "#999",
                  }}
                >
                  구조대원 #{worker.id}
                </div>
              </div>
            </button>
          ))}
          
          {/* 새 구조대원 추가 버튼 */}
          {!showAddForm ? (
            <button
              className="category-button add-rescuer-button"
              onClick={() => setShowAddForm(true)}
              style={{
                border: "2px dashed #999",
                backgroundColor: "transparent",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "8px",
                    color: "#999",
                  }}
                >
                  +
                </div>
                <div style={{ fontSize: "16px", color: "#666" }}>
                  새 구조대원 추가
                </div>
              </div>
            </button>
          ) : (
            <form
              onSubmit={handleAddRescuer}
              className="category-button"
              style={{
                border: "2px solid #4a90e2",
                backgroundColor: "#f8f9fa",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <input
                type="text"
                value={newRescuerName}
                onChange={(e) => setNewRescuerName(e.target.value)}
                placeholder="구조대원 이름"
                disabled={isCreating}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  marginBottom: "12px",
                  textAlign: "center",
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  disabled={isCreating || !newRescuerName.trim()}
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "14px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    opacity: isCreating || !newRescuerName.trim() ? 0.6 : 1,
                  }}
                >
                  {isCreating ? "추가 중..." : "추가"}
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
                    padding: "8px",
                    fontSize: "14px",
                    backgroundColor: "#666",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
