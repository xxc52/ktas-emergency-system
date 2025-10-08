-- =====================================================
-- Supabase 병원 메시지 캐시 테이블 삭제
-- =====================================================
-- 이유: API 응답에 이미 code가 포함되어 있어 LLM 분석 불필요
-- =====================================================

-- 테이블 삭제
DROP TABLE IF EXISTS hospital_message_cache CASCADE;

-- 관련 함수 삭제
DROP FUNCTION IF EXISTS update_hospital_message_cache_timestamp() CASCADE;

-- 완료 확인
SELECT 'hospital_message_cache 테이블 삭제 완료' AS status;
