'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PediatricInput() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const worker = localStorage.getItem('selectedWorker');
    if (worker) {
      setSelectedWorker(JSON.parse(worker));
    }
  }, []);

  const handleBack = () => {
    router.push('/age-selection');
  };

  const handleNext = () => {
    // For now, just redirect to a simple result
    const result = {
      worker: selectedWorker,
      ageType: 'pediatric',
      message: '소아 KTAS 평가는 추후 구현 예정입니다.'
    };
    
    localStorage.setItem('ktasResult', JSON.stringify(result));
    router.push('/result');
  };

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          ← 이전
        </button>
        <h1 className="title">KTAS 응급구조시스템 - 소아</h1>
        <button className="next-button" onClick={handleNext}>
          다음 →
        </button>
      </div>
      
      <div className="content">
        {selectedWorker && (
          <div className="current-user">
            평가자: {selectedWorker.name} ({selectedWorker.role})
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '30px' }}>👶</div>
          <h2 style={{ fontSize: '32px', color: '#333', marginBottom: '20px' }}>
            소아 KTAS 평가
          </h2>
          <p style={{ fontSize: '20px', color: '#666', marginBottom: '30px' }}>
            소아 환자를 위한 KTAS 평가 시스템
          </p>
          <div style={{ 
            padding: '30px', 
            backgroundColor: '#f0f8ff', 
            borderRadius: '15px', 
            border: '2px solid #007AFF',
            maxWidth: '500px'
          }}>
            <p style={{ fontSize: '18px', color: '#333', lineHeight: '1.5' }}>
              소아 KTAS 평가 기능은 현재 개발 중입니다.<br />
              성인 평가 시스템을 먼저 완성한 후 구현될 예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}