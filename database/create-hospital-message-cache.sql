-- Hospital Message Cache Table
-- 응급실 메시지를 LLM으로 분석한 결과 캐싱

CREATE TABLE IF NOT EXISTS hospital_message_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 병원 식별
  hospital_id TEXT NOT NULL,
  hospital_name TEXT NOT NULL,

  -- 원본 메시지
  original_message TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'erMessages' or 'unavailableMessages'

  -- LLM 분석 결과
  blocked_filters JSONB, -- { "rltmCd": ["O026"], "svdssCd": ["Y0111", "Y0112", "Y0113"] }

  -- 캐시 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),

  -- 인덱스 최적화
  UNIQUE(hospital_id, original_message, message_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hospital_message_cache_expires
  ON hospital_message_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_hospital_message_cache_hospital
  ON hospital_message_cache(hospital_id);

-- RLS 정책 (읽기 전용)
ALTER TABLE hospital_message_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to hospital_message_cache"
  ON hospital_message_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to hospital_message_cache"
  ON hospital_message_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to hospital_message_cache"
  ON hospital_message_cache
  FOR UPDATE
  TO public
  USING (true);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_hospital_message_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.expires_at = NOW() + INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hospital_message_cache_timestamp
  BEFORE UPDATE ON hospital_message_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_message_cache_timestamp();

COMMENT ON TABLE hospital_message_cache IS '응급실 메시지 LLM 분석 결과 캐시 (1시간 TTL)';
COMMENT ON COLUMN hospital_message_cache.blocked_filters IS 'LLM이 분석한 차단 필터 코드 (rltmCd, svdssCd 등)';
COMMENT ON COLUMN hospital_message_cache.expires_at IS '캐시 만료 시간 (1시간 후)';
