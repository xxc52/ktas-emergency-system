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
  const [showChatModal, setShowChatModal] = useState(false);

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

  const handleLLMTest = () => {
    setShowChatModal(true);
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
        <button
          className="nav-button llm-test"
          onClick={handleLLMTest}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "var(--white)",
            borderRadius: "var(--radius-md)",
            fontWeight: "600",
          }}
        >
          🤖 LLM 배포 테스트
        </button>
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

      {/* LLM Chat Modal */}
      {showChatModal && (
        <LLMChatModal onClose={() => setShowChatModal(false)} />
      )}
    </div>
  );
}

// Configuration
const API_CONFIG = {
  LOCAL_URL: "http://localhost:8000",
  // Current ngrok URL - automatically set
  NGROK_URL: "https://c1744335a886.ngrok-free.app", // Current working ngrok URL (Updated: 2025-01-14)
  FALLBACK_URLS: ["http://localhost:8000"],
};

// LLM Chat Modal Component
function LLMChatModal({ onClose }) {
  const [messages, setMessages] = useState([
    {
      type: "system",
      content:
        "의료 AI 시스템에 연결되었습니다. 응급의학 관련 질문을 입력해보세요!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);

  // Auto-detect API URL on mount
  useEffect(() => {
    const detectApiUrl = async () => {
      setIsConnecting(true);

      // Try different URLs in order of preference
      const urlsToTry = [...API_CONFIG.FALLBACK_URLS];

      // Add ngrok URL if configured
      if (API_CONFIG.NGROK_URL) {
        urlsToTry.unshift(API_CONFIG.NGROK_URL);
      }

      // For production/Vercel, try to detect ngrok URL or use configured one
      if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost"
      ) {
        // Check localStorage for saved ngrok URL
        const savedNgrokUrl = localStorage.getItem("ngrok_url");
        if (savedNgrokUrl) {
          urlsToTry.unshift(savedNgrokUrl);
        }
      }

      for (const url of urlsToTry) {
        try {
          console.log(`Testing API URL: ${url}`);

          // Special handling for ngrok URLs
          const isNgrokUrl = url.includes("ngrok");
          const headers = {
            "Content-Type": "application/json",
          };

          if (isNgrokUrl) {
            headers["ngrok-skip-browser-warning"] = "any";
            headers["User-Agent"] = "Mozilla/5.0 (compatible; API-Client)";
          }

          const response = await fetch(`${url}/health`, {
            method: "GET",
            headers: headers,
            mode: "cors",
            credentials: "omit",
            signal: AbortSignal.timeout(8000), // 8 second timeout for ngrok
          });

          console.log(
            `Response for ${url}:`,
            response.status,
            response.statusText
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`Health check data:`, data);

            setApiUrl(url);
            console.log(`API connected: ${url}`);

            // Save ngrok URL to localStorage if it's not localhost
            if (url.includes("ngrok")) {
              localStorage.setItem("ngrok_url", url);
            }

            setMessages((prev) => [
              ...prev,
              {
                type: "system",
                content: `✅ API 연결 성공: ${url}\n상태: ${
                  data.status || "healthy"
                }`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            setIsConnecting(false);
            return;
          } else {
            console.log(`HTTP ${response.status} for ${url}`);
          }
        } catch (error) {
          console.log(
            `Failed to connect to ${url}:`,
            error.name,
            error.message
          );

          // For ngrok URLs, provide specific guidance
          if (
            url.includes("ngrok") &&
            error.message.includes("Failed to fetch")
          ) {
            setMessages((prev) => [
              ...prev,
              {
                type: "error",
                content: `🚨 ngrok URL 연결 실패: ${url}\n\n해결 방법:\n1. 브라우저에서 ${url} 직접 방문\n2. "Visit Site" 클릭하여 경고 페이지 통과\n3. 다시 시도하세요`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        }
      }

      // If no URL works, default to localhost and show error
      setApiUrl(API_CONFIG.LOCAL_URL);

      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: `⚠️ API 자동 연결 실패\n\nngrok 사용시 단계:\n1. 로컬에서 서버 실행: python medical_rag_api.py\n2. ngrok 실행: ngrok http 8000 --domain=custom.ngrok.io\n3. 새 URL을 아래 입력창에 붙여넣기\n\n주의: .ngrok-free.app 도메인은 SSL 에러 발생`,
          timestamp: new Date().toLocaleTimeString(),
          showNgrokSetup: true,
        },
      ]);
      setIsConnecting(false);
    };

    detectApiUrl();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      console.log(`Sending request to: ${apiUrl}/ask`);
      console.log(`Request payload:`, {
        question: userMessage.content,
        limit: 5,
      });

      // LLM API 호출
      const response = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any",
        },
        body: JSON.stringify({
          question: userMessage.content,
          limit: 5,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response:`, errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}\n\nResponse: ${errorText}`
        );
      }

      const data = await response.json();
      console.log(`API Response:`, data);

      const aiMessage = {
        type: "assistant",
        content: data.answer,
        references: data.references,
        performance: data.performance,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("LLM API Error:", error);
      let errorContent = `오류가 발생했습니다: ${error.message}`;

      if (error.name === "AbortError") {
        errorContent = `요청 시간 초과: API 응답이 30초를 초과했습니다.`;
      } else if (error.message.includes("Failed to fetch")) {
        errorContent = `연결 실패: ${apiUrl}에 연결할 수 없습니다.\n\n가능한 원인:\n- 서버가 실행되지 않음\n- CORS 정책 위반\n- 네트워크 연결 문제\n- ngrok 터널 만료`;
      }

      const errorMessage = {
        type: "error",
        content: `${errorContent}\n\n디버깅 정보:\n- API URL: ${apiUrl}\n- 시간: ${new Date().toISOString()}\n- 브라우저: ${
          navigator.userAgent.split(" ")[0]
        }`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "var(--spacing-lg)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "var(--radius-lg)",
          width: "90%",
          maxWidth: "800px",
          height: "80%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--spacing-lg)",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
              🤖 의료 LLM 배포 테스트
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
              API: {apiUrl}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* API URL 설정 */}
        <div
          style={{
            padding: "var(--spacing-md)",
            borderBottom: "1px solid var(--gray-200)",
            backgroundColor: "var(--gray-50)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <label style={{ fontSize: "14px", color: "var(--gray-700)" }}>
              API 서버 URL:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isConnecting && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid var(--gray-300)",
                      borderTop: "2px solid var(--primary)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                    연결 중...
                  </span>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "none",
                  border: "1px solid var(--gray-300)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "var(--gray-600)",
                }}
              >
                🔄 재연결
              </button>
            </div>
          </div>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8000 또는 ngrok URL"
            style={{
              width: "100%",
              padding: "var(--spacing-sm)",
              fontSize: "14px",
              border: "1px solid var(--gray-300)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "monospace",
            }}
          />
          <div
            style={{
              marginTop: "4px",
              fontSize: "11px",
              color: "var(--gray-500)",
            }}
          >
            💡 URL 변경 후 Enter를 누르거나 재연결 버튼을 클릭하세요
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            padding: "var(--spacing-lg)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                alignSelf: message.type === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor:
                    message.type === "user"
                      ? "var(--primary)"
                      : message.type === "error"
                      ? "var(--error)"
                      : message.type === "system"
                      ? "var(--gray-100)"
                      : "var(--gray-50)",
                  color:
                    message.type === "user" || message.type === "error"
                      ? "white"
                      : "var(--gray-900)",
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {message.content}
                {message.showNgrokSetup && (
                  <div
                    style={{
                      marginTop: "var(--spacing-md)",
                      padding: "var(--spacing-md)",
                      backgroundColor: "var(--gray-50)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--gray-200)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--gray-700)",
                        marginBottom: "8px",
                      }}
                    >
                      💡 ngrok URL을 입력하고 테스트하세요:
                    </div>
                    <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                      <input
                        type="text"
                        placeholder="예: http://abc123.ngrok.io"
                        style={{
                          flex: 1,
                          padding: "var(--spacing-sm)",
                          fontSize: "12px",
                          border: "1px solid var(--gray-300)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "monospace",
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const url = e.target.value.trim();
                            if (url) {
                              setApiUrl(url);
                              localStorage.setItem("ngrok_url", url);
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          const url = input.value.trim();
                          if (url) {
                            setApiUrl(url);
                            localStorage.setItem("ngrok_url", url);
                          }
                        }}
                        style={{
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--radius-sm)",
                          padding: "var(--spacing-sm) var(--spacing-md)",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        설정
                      </button>
                    </div>
                  </div>
                )}
                {message.references && (
                  <div
                    style={{
                      marginTop: "var(--spacing-sm)",
                      paddingTop: "var(--spacing-sm)",
                      borderTop: "1px solid var(--gray-300)",
                      fontSize: "12px",
                      opacity: 0.8,
                    }}
                  >
                    <strong>참고문서:</strong>
                    <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                      {message.references.map((ref, idx) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                    {message.performance && (
                      <div style={{ marginTop: "4px" }}>
                        <strong>성능:</strong> 총{" "}
                        {message.performance.total_time?.toFixed(2)}초 (검색:{" "}
                        {message.performance.search_time?.toFixed(2)}초, LLM:{" "}
                        {message.performance.llm_time?.toFixed(2)}초)
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--gray-500)",
                  textAlign: message.type === "user" ? "right" : "left",
                  marginTop: "4px",
                }}
              >
                {message.timestamp}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
              <div
                style={{
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--gray-50)",
                  color: "var(--gray-600)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid var(--gray-300)",
                    borderTop: "2px solid var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                AI가 답변을 생성하고 있습니다...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "var(--spacing-lg)",
            borderTop: "1px solid var(--gray-200)",
            backgroundColor: "white",
          }}
        >
          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="의료 관련 질문을 입력하세요... (예: 심폐소생술 시 가슴압박 깊이는?)"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "var(--spacing-md)",
                fontSize: "14px",
                border: "1px solid var(--gray-300)",
                borderRadius: "var(--radius-md)",
                resize: "none",
                minHeight: "60px",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              style={{
                padding: "0 var(--spacing-lg)",
                fontSize: "14px",
                fontWeight: "600",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor:
                  !inputValue.trim() || isLoading ? "not-allowed" : "pointer",
                opacity: !inputValue.trim() || isLoading ? 0.6 : 1,
                minWidth: "80px",
              }}
            >
              {isLoading ? "전송중..." : "전송"}
            </button>
          </div>
          <div
            style={{
              marginTop: "var(--spacing-sm)",
              fontSize: "12px",
              color: "var(--gray-500)",
              textAlign: "center",
            }}
          >
            Enter로 전송 | Shift+Enter로 줄바꿈
          </div>
        </div>
      </div>
    </div>
  );
}
