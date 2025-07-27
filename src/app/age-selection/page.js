'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgeSelection() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);

  useEffect(() => {
    const worker = localStorage.getItem('selectedWorker');
    if (worker) {
      setSelectedWorker(JSON.parse(worker));
    }
  }, []);

  const handleAgeSelect = (ageType) => {
    setSelectedAge(ageType);
    localStorage.setItem('selectedAge', ageType);
    
    setTimeout(() => {
      if (ageType === 'adult') {
        router.push('/adult-input');
      } else {
        router.push('/pediatric-input');
      }
    }, 300);
  };

  const handleBack = () => {
    router.push('/profile');
  };

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          ← 이전
        </button>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <div></div>
      </div>
      
      <div className="content">
        {selectedWorker && (
          <div className="current-user">
            평가자: {selectedWorker.name} ({selectedWorker.role})
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', color: '#333', marginBottom: '15px' }}>
            환자 연령대를 선택해주세요
          </h2>
          <p style={{ fontSize: '18px', color: '#666' }}>
            환자의 연령대에 따라 평가 기준이 달라집니다
          </p>
        </div>

        <div className="button-grid age-selection-grid">
          <button
            className={`category-button ${selectedAge === 'adult' ? 'selected' : ''}`}
            onClick={() => handleAgeSelect('adult')}
            style={{ padding: '60px 40px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>👨‍⚕️</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                성인
              </div>
              <div style={{ fontSize: '16px', color: selectedAge === 'adult' ? '#fff' : '#666' }}>
                만 15세 이상
              </div>
            </div>
          </button>

          <button
            className={`category-button ${selectedAge === 'pediatric' ? 'selected' : ''}`}
            onClick={() => handleAgeSelect('pediatric')}
            style={{ padding: '60px 40px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>👶</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                소아
              </div>
              <div style={{ fontSize: '16px', color: selectedAge === 'pediatric' ? '#fff' : '#666' }}>
                만 15세 미만
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}