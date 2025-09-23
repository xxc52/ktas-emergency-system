'use client';
import { useEffect, useState } from 'react';
import { determineDepartmentCode, getRegionsForSearch } from '@/utils/llmService';
import { searchAndSortHospitals, getHospitalStatus } from '@/utils/hospitalApi';

export default function HospitalListLevel5({ currentLocation, patientData, onHospitalsUpdate }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [llmStatus, setLlmStatus] = useState(null);

  useEffect(() => {
    if (!patientData || !currentLocation) {
      setLoading(false);
      return;
    }

    searchOptimalHospitals();
  }, [patientData, currentLocation]);

  const searchOptimalHospitals = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('KTAS 5급 환자 병원 검색 시작:', patientData);

      // 1. LLM을 통한 진료과목 코드 판단
      const departmentResult = await determineDepartmentCode({
        ktasLevel: patientData.ktasLevel || 5,
        primaryDisease: patientData.primaryDisease || patientData.disease || '',
        firstConsiderations: patientData.firstConsiderations || [],
        secondConsiderations: patientData.secondConsiderations || [],
        location: getCurrentLocationString()
      });

      setLlmStatus(departmentResult);
      console.log('진료과목 판단 결과:', departmentResult);

      // 2. 검색할 지역 결정
      const regions = await getRegionsForSearch(currentLocation);
      console.log('검색 대상 지역:', regions);

      // 3. 병원 검색 및 거리순 정렬
      const searchResults = await searchAndSortHospitals(
        regions,
        departmentResult.departmentCode,
        currentLocation,
        20 // KTAS 5급: 20개 병원 표시
      );

      console.log('병원 검색 결과:', searchResults.length, '개');

      // 4. 병원 데이터 표시용으로 변환
      const formattedHospitals = searchResults.map(hospital => ({
        ...hospital,
        status: getHospitalStatus(hospital),
        departmentInfo: {
          code: departmentResult.departmentCode,
          name: departmentResult.departmentName
        }
      }));

      setHospitals(formattedHospitals);

      // 부모 컴포넌트(지도)에 병원 데이터 전달
      if (onHospitalsUpdate) {
        onHospitalsUpdate(formattedHospitals);
      }

    } catch (error) {
      console.error('병원 검색 실패:', error);
      setError(error.message);

      // 에러 발생 시 기본 병원 목록 표시
      const fallbackHospitals = getFallbackHospitals();
      setHospitals(fallbackHospitals);

      // 부모 컴포넌트에도 폴백 데이터 전달
      if (onHospitalsUpdate) {
        onHospitalsUpdate(fallbackHospitals);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationString = () => {
    if (!currentLocation) return '위치 정보 없음';
    return `위도: ${currentLocation.lat.toFixed(6)}, 경도: ${currentLocation.lng.toFixed(6)}`;
  };

  const getFallbackHospitals = () => {
    return [
      {
        id: 'fallback-1',
        name: '가까운 병원 정보를 불러올 수 없습니다',
        distance: '-',
        distanceText: '-',
        address: '인터넷 연결을 확인해주세요',
        phone: '-',
        divisionName: '시스템 오류',
        hasEmergencyRoom: false,
        status: { isOpen: false, status: '정보 없음' }
      }
    ];
  };

  if (loading) {
    return (
      <div className="hospital-list-loading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>🤖 AI가 최적 진료과목을 판단하고 있습니다...</p>
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
          ✅ 환자 정보 분석 중<br/>
          ⏳ LLM 진료과목 코드 판단 중<br/>
          🏥 주변 병원 검색 중<br/>
          📍 거리순 정렬 중
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-list">
      {/* LLM 판단 결과 표시 */}
      {llmStatus && (
        <div style={{
          background: llmStatus.success ? '#f0f9ff' : '#fef3c7',
          border: `1px solid ${llmStatus.success ? '#0ea5e9' : '#f59e0b'}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            🤖 AI 진료과목 판단 결과
          </div>
          <div>
            <strong>판단된 진료과목:</strong> {llmStatus.departmentName} ({llmStatus.departmentCode})
          </div>
          <div style={{ marginTop: '4px', color: '#6b7280' }}>
            신뢰도: {Math.round(llmStatus.confidence * 100)}% | {llmStatus.reasoning}
          </div>
          {llmStatus.fallback && (
            <div style={{ marginTop: '4px', color: '#dc2626' }}>
              ⚠️ LLM 서버 연결 실패로 기본 규칙 적용됨
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#dc2626'
        }}>
          ⚠️ 오류: {error}
        </div>
      )}

      {/* 병원 목록 */}
      {hospitals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
          검색된 병원이 없습니다.<br/>
          다른 지역을 검색해보시거나 직접 병원에 문의하세요.
        </div>
      ) : (
        hospitals.map((hospital) => (
          <div key={hospital.id} className="hospital-item">
            <div className="hospital-header">
              <h3 className="hospital-name">
                {hospital.name}
                {hospital.hasEmergencyRoom && (
                  <span className="hospital-badge">🚨</span>
                )}
                {hospital.status?.isOpen && (
                  <span className="hospital-badge" style={{ backgroundColor: '#10b981' }}>진료중</span>
                )}
              </h3>
              <span className="hospital-distance">{hospital.distanceText || hospital.distance}</span>
            </div>
            <div className="hospital-details">
              <div className="hospital-row">
                <span className="detail-label">병원 분류:</span>
                <span className="detail-value">{hospital.divisionName || '정보 없음'}</span>
              </div>
              <div className="hospital-row">
                <span className="detail-label">진료 상태:</span>
                <span className="detail-value" style={{
                  color: hospital.status?.isOpen ? '#10b981' : '#6b7280'
                }}>
                  {hospital.status?.status || '정보 없음'}
                </span>
              </div>
              <div className="hospital-row">
                <span className="detail-label">연락처:</span>
                <span className="detail-value">{hospital.phone || hospital.tel || '정보 없음'}</span>
              </div>
              {hospital.emergencyPhone && (
                <div className="hospital-row">
                  <span className="detail-label">응급실:</span>
                  <span className="detail-value">{hospital.emergencyPhone}</span>
                </div>
              )}
              <div className="hospital-row">
                <span className="detail-label">주소:</span>
                <span className="detail-value">{hospital.address || '주소 정보 없음'}</span>
              </div>

              {hospital.departmentInfo && (
                <div className="hospital-tags">
                  <span className="hospital-tag" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                    {hospital.departmentInfo.name}
                  </span>
                  {hospital.hasEmergencyRoom && (
                    <span className="hospital-tag" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                      응급실
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}