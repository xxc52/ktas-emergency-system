'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { savePatientAssessment } from '../../utils/patientRecordsSupabase';

const ktasColors = {
  1: '#FF0000', // Red - 즉시
  2: '#FF8000', // Orange - 긴급
  3: '#FFFF00', // Yellow - 준응급
  4: '#00FF00', // Green - 비응급
  5: '#0080FF'  // Blue - 진료지연가능
};

const ktasLabels = {
  1: '즉시',
  2: '긴급',
  3: '준응급',
  4: '비응급',
  5: '진료지연가능'
};

export default function Result() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [recordSaved, setRecordSaved] = useState(false);

  useEffect(() => {
    const savedResult = localStorage.getItem('ktasResult');
    if (savedResult) {
      const resultData = JSON.parse(savedResult);
      setResult(resultData);
      
      // 자동으로 환자 기록 저장
      saveRecord(resultData);
    }
  }, []);

  const saveRecord = async (resultData) => {
    try {
      if (!resultData.worker || !resultData.ktasLevel) {
        console.warn('기록 저장에 필요한 데이터가 부족합니다.');
        return;
      }

      // 이미 저장되었는지 확인 (중복 저장 방지)
      const alreadySaved = localStorage.getItem('recordSaved');
      if (alreadySaved) {
        console.log('이미 저장된 기록입니다.');
        setRecordSaved(true);
        return;
      }

      const patientType = localStorage.getItem('selectedAge') || 'adult';
      
      // assessment_data 구조화
      const assessmentData = {
        category: resultData.category,
        primaryDisease: resultData.primaryDisease || resultData.disease,
        diseases: resultData.diseases || [],
        firstConsiderations: resultData.firstConsiderations || [],
        secondConsiderations: resultData.secondConsiderations || [],
        evaluationTime: new Date().toISOString()
      };

      const rescuerId = localStorage.getItem('selectedRescuerId');
      
      const saved = await savePatientAssessment(
        parseInt(rescuerId) || resultData.worker.id,
        patientType,
        assessmentData,
        resultData.ktasLevel,
        null // hospital - 나중에 추가 가능
      );

      if (saved) {
        console.log('✅ 환자 기록이 저장되었습니다.');
        localStorage.setItem('recordSaved', 'true');
        setRecordSaved(true);
      }
    } catch (error) {
      console.error('기록 저장 중 오류:', error);
    }
  };

  const handleStartOver = () => {
    // Clear all stored data
    localStorage.removeItem('selectedWorker');
    localStorage.removeItem('selectedRescuerId');
    localStorage.removeItem('selectedAge');
    localStorage.removeItem('ktasResult');
    localStorage.removeItem('recordSaved');
    router.push('/profile');
  };

  const handleBack = () => {
    const age = localStorage.getItem('selectedAge');
    if (age === 'adult') {
      router.push('/adult-input');
    } else {
      router.push('/pediatric-input');
    }
  };

  if (!result) {
    return (
      <div className="container">
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading result...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          ← 이전
        </button>
        <h1 className="title">KTAS 평가 결과</h1>
        <button className="next-button" onClick={handleStartOver}>
          새로 시작
        </button>
      </div>
      
      <div className="content">
        {result.worker && (
          <div className="current-user">
            평가자: {result.worker.name} ({result.worker.role})
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '30px',
          height: '100%',
          padding: '20px 0'
        }}>
          {/* KTAS Level Display */}
          {result.ktasLevel && (
            <div style={{
              backgroundColor: ktasColors[result.ktasLevel],
              color: result.ktasLevel === 3 ? '#000' : '#fff',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              KTAS {result.ktasLevel}급
              <div style={{ fontSize: '24px', marginTop: '10px' }}>
                {ktasLabels[result.ktasLevel]}
              </div>
            </div>
          )}

          {/* Disease Information */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            border: '2px solid #ddd'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
              진단 정보
            </h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <strong>구분:</strong> {result.category || 'N/A'}
              </div>
              <div>
                <strong>주요 병명:</strong> {result.primaryDisease || result.disease || 'N/A'}
              </div>
              {result.diseases && result.diseases.length > 1 && (
                <div>
                  <strong>기타 선택된 병명:</strong> {result.diseases.filter(d => d !== result.primaryDisease).join(', ')}
                </div>
              )}
              {result.firstConsiderations && result.firstConsiderations.length > 0 && (
                <div>
                  <strong>1차 고려사항:</strong> {result.firstConsiderations.join(', ')}
                </div>
              )}
              {result.firstConsideration && (
                <div>
                  <strong>1차 고려사항:</strong> {result.firstConsideration}
                </div>
              )}
              {result.secondConsiderations && result.secondConsiderations.length > 0 && (
                <div>
                  <strong>2차 고려사항:</strong> {result.secondConsiderations.join(', ')}
                </div>
              )}
              {result.secondConsideration && (
                <div>
                  <strong>2차 고려사항:</strong> {result.secondConsideration}
                </div>
              )}
            </div>
          </div>

          {/* Special message for pediatric */}
          {result.ageType === 'pediatric' && (
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '30px',
              borderRadius: '15px',
              border: '2px solid #007AFF',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '18px', color: '#333' }}>
                {result.message}
              </p>
            </div>
          )}

          {/* Next Steps */}
          {result.ktasLevel && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h4 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>
                다음 단계
              </h4>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.5' }}>
                이 결과를 바탕으로 적합한 병원을 검색하고 이송 계획을 수립하세요.
                병원 검색 및 이송 계획 기능은 추후 구현될 예정입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}