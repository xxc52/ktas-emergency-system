'use client';

export default function PatientInfo({ patientData, ktasColors, ktasLabels }) {
  if (!patientData) return null;

  const ktasLevel = patientData.ktasLevel || 3;

  // 텍스트 색상 결정 (노란색/초록색일 때는 검은색, 나머지는 흰색)
  const getTextColor = (level) => {
    return (level === 3 || level === 4) ? '#000000' : '#ffffff';
  };

  const getBadgeStyle = (level) => {
    return {
      backgroundColor: ktasColors[level],
      color: getTextColor(level),
      padding: 'var(--spacing-sm) var(--spacing-md)',
      borderRadius: 'var(--radius-md)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)',
      fontWeight: 700,
      fontSize: '16px',
      marginBottom: 'var(--spacing-sm)'
    };
  };

  return (
    <div className="patient-info" style={{
      backgroundColor: ktasColors[ktasLevel] + '08',
      borderColor: ktasColors[ktasLevel]
    }}>
      <h2 className="patient-info-title">📋 진단 정보</h2>

      <div className="diagnosis-grid">
        <div className="diagnosis-left">
          {/* KTAS 뱃지 스타일 */}
          <div style={getBadgeStyle(ktasLevel)}>
            🚨 KTAS {ktasLevel}급 - {ktasLabels[ktasLevel]}
          </div>

          <div className="diagnosis-row">
            <span className="diagnosis-label">🏥 주요 병명:</span>
            <span className="diagnosis-value">
              {patientData.primaryDisease || patientData.disease || '미확정'}
            </span>
          </div>
        </div>

        <div className="diagnosis-right">
          {patientData.firstConsiderations && patientData.firstConsiderations.length > 0 && (
            <div className="diagnosis-row">
              <span className="diagnosis-label">⚠️ 1차 고려사항:</span>
              <span className="diagnosis-value">
                {patientData.firstConsiderations.join(', ')}
              </span>
            </div>
          )}

          {patientData.secondConsiderations && patientData.secondConsiderations.length > 0 && (
            <div className="diagnosis-row">
              <span className="diagnosis-label">📝 2차 고려사항:</span>
              <span className="diagnosis-value">
                {patientData.secondConsiderations.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}