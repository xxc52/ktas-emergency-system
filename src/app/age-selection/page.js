'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getPresetsByRescuer, 
  deletePreset, 
  createSystemPresets, 
  hasPresets 
} from '../../utils/presetSupabase';

export default function AgeSelection() {
  const router = useRouter();
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const worker = localStorage.getItem('selectedWorker');
    const rescuerId = localStorage.getItem('selectedRescuerId');
    if (worker && rescuerId) {
      const workerData = JSON.parse(worker);
      setSelectedWorker(workerData);
      loadPresets(parseInt(rescuerId));
    }
  }, []);

  const loadPresets = async (rescuerId) => {
    try {
      setLoading(true);
      const hasExistingPresets = await hasPresets(rescuerId);
      
      if (!hasExistingPresets) {
        // 초기 시스템 프리셋 생성
        await createSystemPresets(rescuerId);
      }
      
      const presetData = await getPresetsByRescuer(rescuerId);
      setPresets(presetData);
    } catch (error) {
      console.error('프리셋 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePresetSelect = (preset) => {
    localStorage.setItem('selectedAge', 'adult');
    localStorage.setItem('selectedPreset', JSON.stringify(preset.preset_data));
    router.push('/adult-input');
  };

  const handleDeletePreset = async (presetId, e) => {
    e.stopPropagation(); // 버튼 클릭이 부모로 전파되지 않도록
    
    if (confirm('이 프리셋을 삭제하시겠습니까?')) {
      const success = await deletePreset(presetId);
      if (success) {
        setPresets(presets.filter(p => p.id !== presetId));
      }
    }
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

        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--gray-900)', 
            marginBottom: 'var(--spacing-md)',
            letterSpacing: '-0.02em'
          }}>
            👩‍⚕️ 환자 연령대를 선택해주세요
          </h2>
          <p style={{ 
            fontSize: '18px', 
            color: 'var(--gray-600)',
            lineHeight: '1.6'
          }}>
            환자의 연령대에 따라 평가 기준이 달라집니다
          </p>
        </div>

        <div className="button-grid age-selection-grid" style={{ gap: 'var(--spacing-xl)' }}>
          <button
            className={`category-button ${selectedAge === 'adult' ? 'selected' : ''}`}
            onClick={() => handleAgeSelect('adult')}
            style={{ 
              padding: 'var(--spacing-2xl)',
              background: selectedAge === 'adult' ? 'var(--primary)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'var(--white)',
              border: selectedAge === 'adult' ? '3px solid var(--primary)' : '3px solid transparent',
              minHeight: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: 'var(--spacing-lg)',
                filter: selectedAge === 'adult' ? 'brightness(1.2)' : 'none'
              }}>
                {selectedAge === 'adult' ? '✅' : '👨‍⚕️'}
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                marginBottom: 'var(--spacing-md)',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                성인
              </div>
              <div style={{ 
                fontSize: '18px', 
                opacity: 0.95,
                fontWeight: '500'
              }}>
                만 15세 이상
              </div>
            </div>
            {!selectedAge && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none'
              }}></div>
            )}
          </button>

          <button
            className={`category-button ${selectedAge === 'pediatric' ? 'selected' : ''}`}
            onClick={() => handleAgeSelect('pediatric')}
            style={{ 
              padding: 'var(--spacing-2xl)',
              background: selectedAge === 'pediatric' ? 'var(--primary)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'var(--white)',
              border: selectedAge === 'pediatric' ? '3px solid var(--primary)' : '3px solid transparent',
              minHeight: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: 'var(--spacing-lg)',
                filter: selectedAge === 'pediatric' ? 'brightness(1.2)' : 'none'
              }}>
                {selectedAge === 'pediatric' ? '✅' : '👶'}
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                marginBottom: 'var(--spacing-md)',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                소아
              </div>
              <div style={{ 
                fontSize: '18px', 
                opacity: 0.95,
                fontWeight: '500'
              }}>
                만 15세 미만
              </div>
            </div>
            {!selectedAge && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none'
              }}></div>
            )}
          </button>
        </div>

        {/* 프리셋 섹션 */}
        {!loading && presets.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-2xl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                color: 'var(--gray-900)', 
                marginBottom: 'var(--spacing-md)',
                letterSpacing: '-0.01em'
              }}>
                ⚡ 빠른 선택 (성인용)
              </h3>
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--gray-600)',
                lineHeight: '1.5'
              }}>
                자주 사용하는 상황을 바로 선택할 수 있습니다
              </p>
            </div>

            <div className="preset-grid">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="preset-button"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="preset-content">
                    <div className="preset-name">{preset.preset_name}</div>
                    <div className="preset-details">
                      {preset.preset_data.category} → {preset.preset_data.disease}
                    </div>
                  </div>
                  <button
                    className="preset-delete-btn"
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="info-notice">
          <h4>⚠️ 중요 안내</h4>
          <p>정확한 연령대 선택은 적절한 응급 처치를 위해 중요합니다</p>
        </div>
      </div>
    </div>
  );
}