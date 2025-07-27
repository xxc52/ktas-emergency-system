"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const emergencyWorkers = [
  { id: 1, name: "이다정", role: "구급대장", experience: "10년차" },
  { id: 2, name: "김채운", role: "구급대원", experience: "7년차" },
  { id: 3, name: "신준용", role: "구급대원", experience: "5년차" },
  { id: 4, name: "김정현", role: "구급대원", experience: "3년차" },
  { id: 5, name: "김배호", role: "구급대원", experience: "2년차" },
  { id: 6, name: "이현석", role: "인턴", experience: "1년차" },
];

export default function ProfileSelection() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    // Store selected worker in localStorage for later use
    localStorage.setItem("selectedWorker", JSON.stringify(worker));
    // Navigate to age selection
    setTimeout(() => {
      router.push("/age-selection");
    }, 300);
  };

  return (
    <div className="container">
      <div className="header">
        <div></div>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <div></div>
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

        <div className="button-grid profile-grid">
          {emergencyWorkers.map((worker) => (
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
                    fontSize: "16px",
                    color: selectedWorker?.id === worker.id ? "#fff" : "#666",
                    marginBottom: "4px",
                  }}
                >
                  {worker.role}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: selectedWorker?.id === worker.id ? "#fff" : "#999",
                  }}
                >
                  {worker.experience}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
