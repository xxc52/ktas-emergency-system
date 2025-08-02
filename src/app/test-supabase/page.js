"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState("testing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient();
        
        // 간단한 연결 테스트
        const { data, error } = await supabase.from('_').select('*').limit(1);
        
        if (error) {
          // 테이블이 없어서 에러가 나는 건 정상 (연결은 됨)
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            setConnectionStatus("✅ 연결 성공! (테이블이 없지만 Supabase 연결됨)");
          } else {
            setConnectionStatus("❌ 연결 실패");
            setError(error.message);
          }
        } else {
          setConnectionStatus("✅ 연결 성공!");
        }
      } catch (err) {
        setConnectionStatus("❌ 연결 실패");
        setError(err.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Supabase 연결 테스트</h1>
      <div style={{ marginTop: "20px" }}>
        <h2>연결 상태:</h2>
        <p style={{ fontSize: "18px", fontWeight: "bold" }}>{connectionStatus}</p>
        
        {error && (
          <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#ffebee", border: "1px solid #f44336", borderRadius: "4px" }}>
            <strong>에러 메시지:</strong>
            <p style={{ color: "#f44336", marginTop: "5px" }}>{error}</p>
          </div>
        )}
        
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#e8f5e8", border: "1px solid #4caf50", borderRadius: "4px" }}>
          <strong>환경변수:</strong>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 설정 안됨"}</p>
          <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 설정 안됨"}</p>
        </div>
      </div>
    </div>
  );
}