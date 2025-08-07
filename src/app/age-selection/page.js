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
        <div></div>
        <h1 className="title">KTAS 응급구조시스템</h1>
        <div></div>
      </div>
      
      <div className="content">
        {selectedWorker && (
          <div className="current-user">
            평가자: {selectedWorker.name} ({selectedWorker.role})
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ 
            fontSize: '26px', 
            fontWeight: '700', 
            color: 'var(--gray-900)', 
            marginBottom: 'var(--spacing-xs)',
            letterSpacing: '-0.02em'
          }}>
            👩‍⚕️ 환자 연령대를 선택해주세요
          </h2>
          <p style={{ 
            fontSize: '15px', 
            color: 'var(--gray-600)',
            lineHeight: '1.4'
          }}>
            환자의 연령대에 따라 평가 기준이 달라집니다
          </p>
        </div>

        <div className="button-grid age-selection-grid" style={{ 
          gap: 'var(--spacing-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          maxWidth: '700px',
          margin: '0 auto var(--spacing-md) auto'
        }}>
          <button
            className={`category-button ${selectedAge === 'adult' ? 'selected' : ''}`}
            onClick={() => handleAgeSelect('adult')}
            style={{ 
              padding: 'var(--spacing-lg)',
              background: selectedAge === 'adult' ? 'var(--primary)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'var(--white)',
              border: selectedAge === 'adult' ? '3px solid var(--primary)' : '3px solid transparent',
              minHeight: '130px',
              aspectRatio: '2/1',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              textAlign: 'center', 
              position: 'relative', 
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              gap: 'var(--spacing-xs)'
            }}>
              <div style={{ 
                fontSize: '42px', 
                filter: selectedAge === 'adult' ? 'brightness(1.2)' : 'none'
              }}>
                {selectedAge === 'adult' ? '✅' : '👨‍⚕️'}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                성인
              </div>
              <div style={{ 
                fontSize: '15px', 
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
              padding: 'var(--spacing-lg)',
              background: selectedAge === 'pediatric' ? 'var(--primary)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'var(--white)',
              border: selectedAge === 'pediatric' ? '3px solid var(--primary)' : '3px solid transparent',
              minHeight: '130px',
              aspectRatio: '2/1',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              textAlign: 'center', 
              position: 'relative', 
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              gap: 'var(--spacing-xs)'
            }}>
              <div style={{ 
                fontSize: '42px', 
                filter: selectedAge === 'pediatric' ? 'brightness(1.2)' : 'none'
              }}>
                {selectedAge === 'pediatric' ? '✅' : '👶'}
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                소아
              </div>
              <div style={{ 
                fontSize: '15px', 
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
          <div style={{ 
            flex: '1',
            minHeight: '0',
            padding: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--gray-200)',
            boxShadow: '0 2px 15px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)', flexShrink: 0 }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700',
                color: 'var(--primary)', 
                marginBottom: 'var(--spacing-xs)',
                letterSpacing: '-0.01em'
              }}>
                ⚡ 빠른 선택 (성인용)
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--gray-600)',
                lineHeight: '1.3'
              }}>
                자주 사용하는 상황을 바로 선택
              </p>
            </div>

            <div style={{
              flex: '1',
              minHeight: '0',
              overflowY: 'auto',
              padding: 'var(--spacing-xs) var(--spacing-xs) var(--spacing-sm) 0'
            }}>
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
          </div>
        )}

      </div>
      
      {/* Bottom Navigation */}
      <div className="bottom-navigation" style={{ marginTop: 'var(--spacing-lg)' }}>
        <button 
          className="nav-button back" 
          onClick={handleBack}
          style={{
            background: 'var(--gray-100)',
            color: 'var(--gray-700)',
            border: '2px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          ← 이전
        </button>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}