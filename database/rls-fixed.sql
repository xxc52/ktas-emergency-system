-- RLS 설정 (수정된 버전 - 문법 오류 해결)
-- INSERT는 WITH CHECK, UPDATE/DELETE는 USING 사용

-- =========================================
-- 1. 모든 테이블에 RLS 활성화
-- =========================================

ALTER TABLE public.ktas_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assessments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. 기존 정책 모두 삭제 (충돌 방지)
-- =========================================

-- ktas_data 정책 삭제
DROP POLICY IF EXISTS "Allow public read" ON public.ktas_data;
DROP POLICY IF EXISTS "Block all writes" ON public.ktas_data;
DROP POLICY IF EXISTS "Block all updates" ON public.ktas_data;
DROP POLICY IF EXISTS "Block all deletes" ON public.ktas_data;

-- rescuers 정책 삭제
DROP POLICY IF EXISTS "Allow public read" ON public.rescuers;
DROP POLICY IF EXISTS "Block all writes" ON public.rescuers;
DROP POLICY IF EXISTS "Block all updates" ON public.rescuers;
DROP POLICY IF EXISTS "Block all deletes" ON public.rescuers;

-- custom_presets 정책 삭제
DROP POLICY IF EXISTS "Allow public read" ON public.custom_presets;

-- patient_assessments 정책 삭제
DROP POLICY IF EXISTS "Allow public read" ON public.patient_assessments;

-- =========================================
-- 3. 읽기 전용 정책 생성
-- =========================================

-- KTAS 데이터: 모든 사용자가 읽을 수 있음
CREATE POLICY "Allow public read" 
ON public.ktas_data 
FOR SELECT 
USING (true);

-- 구조대원 정보: 모든 사용자가 읽을 수 있음
CREATE POLICY "Allow public read" 
ON public.rescuers 
FOR SELECT 
USING (true);

-- 커스텀 프리셋: 일단 읽기만 허용
CREATE POLICY "Allow public read" 
ON public.custom_presets 
FOR SELECT 
USING (true);

-- 환자 평가 기록: 일단 읽기만 허용
CREATE POLICY "Allow public read" 
ON public.patient_assessments 
FOR SELECT 
USING (true);

-- =========================================
-- 4. 모든 쓰기 작업 차단 (하나의 정책으로 통합)
-- =========================================

-- KTAS 데이터 - 모든 수정 차단
CREATE POLICY "Block all modifications" 
ON public.ktas_data 
FOR ALL 
USING (false)
WITH CHECK (false);

-- 구조대원 정보 - 모든 수정 차단
CREATE POLICY "Block all modifications" 
ON public.rescuers 
FOR ALL 
USING (false)
WITH CHECK (false);

-- 커스텀 프리셋 - 모든 수정 차단 (추후 인증 시스템 추가 시 수정)
CREATE POLICY "Block all modifications" 
ON public.custom_presets 
FOR ALL 
USING (false)
WITH CHECK (false);

-- 환자 평가 기록 - 모든 수정 차단 (추후 인증 시스템 추가 시 수정)
CREATE POLICY "Block all modifications" 
ON public.patient_assessments 
FOR ALL 
USING (false)
WITH CHECK (false);