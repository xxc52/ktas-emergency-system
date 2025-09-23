'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { savePatientAssessment } from '../../utils/patientRecordsSupabase';
import Timer from './components/Timer';
import PatientInfo from './components/PatientInfo';
import LeafletMap from './components/KakaoMap';
import HospitalListLevel1to4 from './components/HospitalListLevel1to4';
import HospitalListLevel5 from './components/HospitalListLevel5';

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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    const savedResult = localStorage.getItem('ktasResult');
    if (savedResult) {
      const resultData = JSON.parse(savedResult);
      setResult(resultData);

      // 자동으로 환자 기록 저장
      saveRecord(resultData);
    }

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          // 기본 위치 설정 (예: 고려대학교 서울캠퍼스)
          setCurrentLocation({
            lat: 37.5896,
            lng: 127.0321
          });
        }
      );
    } else {
      // 기본 위치 설정
      setCurrentLocation({
        lat: 37.5896,
        lng: 127.0321
      });
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
      const finalRescuerId = rescuerId ? parseInt(rescuerId) : 1; // 기본값 1 (테스트용)
      
      console.log('환자 기록 저장 시도:', {
        rescuerId: finalRescuerId,
        patientType,
        ktasLevel: resultData.ktasLevel
      });
      
      const saved = await savePatientAssessment(
        finalRescuerId,
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
      console.error('환자 기록 저장 오류:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  const handleEndSituation = () => {
    // 상황 종료 시 데이터 정리 및 처음으로 이동
    localStorage.removeItem('selectedWorker');
    localStorage.removeItem('selectedRescuerId');
    localStorage.removeItem('selectedAge');
    localStorage.removeItem('ktasResult');
    localStorage.removeItem('recordSaved');
    localStorage.removeItem('ktasTimer');
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
      <div className="loading-container">
        <div className="loading">데이터 로딩 중...</div>
      </div>
    );
  }

  const ktasLevel = result.ktasLevel || 3;

  return (
    <div className="result-container">
      {/* 상단바 */}
      <header className="result-header">
        <div className="header-left">
          <span className="emergency-system-title">🚨 응급 구조 시스템</span>
        </div>
        <div className="header-right">
          <Timer />
          <button
            className="end-situation-btn"
            onClick={handleEndSituation}
          >
            상황 종료
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="result-main">
        {/* 왼쪽 영역: 진단 정보 + 지도 */}
        <div className="result-left">
          <PatientInfo
            patientData={result}
            ktasColors={ktasColors}
            ktasLabels={ktasLabels}
          />
          <div className="map-container">
            <LeafletMap currentLocation={currentLocation} hospitals={hospitals} />
          </div>
        </div>

        {/* 오른쪽 영역: 병원 리스트 */}
        <div className="result-right">
          <h2 className="hospital-list-title">추천 병원 리스트 (실시간)</h2>
          {ktasLevel === 5 ? (
            <HospitalListLevel5
              currentLocation={currentLocation}
              patientData={result}
              onHospitalsUpdate={setHospitals}
            />
          ) : (
            <HospitalListLevel1to4
              currentLocation={currentLocation}
              patientData={result}
              ktasLevel={ktasLevel}
            />
          )}
        </div>
      </div>
    </div>
  );
}