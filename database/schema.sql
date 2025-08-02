-- KTAS Emergency System Database Schema
-- 미니멀리즘 접근: 정말 필요한 것만!

-- 1. KTAS 기준 데이터 테이블 (CSV 데이터)
CREATE TABLE ktas_data (
  id SERIAL PRIMARY KEY,
  coding_system TEXT,
  codes TEXT,
  category TEXT NOT NULL,           -- 구분 (심혈관계, 호흡기계 등)
  disease TEXT NOT NULL,            -- 병명
  consideration_type TEXT,          -- 고려사항 구분 (활력징후 1차, 증상별 2차 등)
  emergency_level INTEGER,          -- 응급등급 (1-5)
  consideration TEXT,               -- 고려사항 상세
  note TEXT,                        -- 비고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 구조대원 테이블
CREATE TABLE rescuers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 커스텀 프리셋 테이블
CREATE TABLE custom_presets (
  id SERIAL PRIMARY KEY,
  rescuer_id INTEGER REFERENCES rescuers(id) ON DELETE CASCADE,
  preset_name TEXT NOT NULL,        -- "화재상황", "교통사고" 등 사용자 정의 이름
  preset_data JSONB NOT NULL,       -- 선택된 옵션들 {"category": "심혈관계", "disease": "...", "considerations": [...]}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 환자 평가 기록 테이블
CREATE TABLE patient_assessments (
  id SERIAL PRIMARY KEY,
  rescuer_id INTEGER REFERENCES rescuers(id),
  patient_type TEXT CHECK (patient_type IN ('adult', 'pediatric')),
  assessment_data JSONB NOT NULL,   -- 전체 평가 과정 데이터
  final_level INTEGER CHECK (final_level BETWEEN 1 AND 5),
  hospital TEXT,                    -- 이송 병원 (나중에 FK로 변경 가능)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_ktas_data_category ON ktas_data(category);
CREATE INDEX idx_ktas_data_disease ON ktas_data(disease);
CREATE INDEX idx_ktas_data_emergency_level ON ktas_data(emergency_level);
CREATE INDEX idx_custom_presets_rescuer ON custom_presets(rescuer_id);
CREATE INDEX idx_patient_assessments_rescuer ON patient_assessments(rescuer_id);
CREATE INDEX idx_patient_assessments_created ON patient_assessments(created_at);

-- RLS (Row Level Security) 설정 - 일단 비활성화 (미니멀리즘)
-- ALTER TABLE rescuers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_presets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_assessments ENABLE ROW LEVEL SECURITY;