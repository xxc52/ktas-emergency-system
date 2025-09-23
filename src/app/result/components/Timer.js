'use client';
import { useEffect, useState } from 'react';

export default function Timer() {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    // localStorage에서 타이머 시작 시간 가져오기
    let startTime = localStorage.getItem('ktasTimer');

    if (!startTime) {
      // 타이머가 없으면 새로 시작
      startTime = Date.now().toString();
      localStorage.setItem('ktasTimer', startTime);
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - parseInt(startTime)) / 1000);

      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;

      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setElapsedTime(formattedTime);
    };

    // 초기 실행
    updateTimer();

    // 매초마다 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="timer">
      <span className="timer-label">경과 시간 : </span>
      <span className="timer-value">{elapsedTime}</span>
    </div>
  );
}