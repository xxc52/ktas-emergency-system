-- 간단한 RLS 해결 방법 (인증 없이 읽기 전용 접근 허용)
-- 이 스크립트는 현재 앱이 인증 시스템 없이 작동하도록 설계되어 있으므로
-- 읽기는 허용하되 쓰기는 차단하는 정책을 적용합니다.

-- =========================================
-- 1. 모든 테이블에 RLS 활성화
-- =========================================

ALTER TABLE public.ktas_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assessments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. 읽기 전용 정책 생성
-- =========================================

-- KTAS 데이터: 모든 사용자가 읽을 수 있음
DROP POLICY IF EXISTS "Allow public read" ON public.ktas_data;
CREATE POLICY "Allow public read" 
ON public.ktas_data 
FOR SELECT 
USING (true);

-- 구조대원 정보: 모든 사용자가 읽을 수 있음
DROP POLICY IF EXISTS "Allow public read" ON public.rescuers;
CREATE POLICY "Allow public read" 
ON public.rescuers 
FOR SELECT 
USING (true);

-- 커스텀 프리셋: 일단 읽기만 허용 (추후 인증 추가 시 수정)
DROP POLICY IF EXISTS "Allow public read" ON public.custom_presets;
CREATE POLICY "Allow public read" 
ON public.custom_presets 
FOR SELECT 
USING (true);

-- 환자 평가 기록: 일단 읽기만 허용 (추후 인증 추가 시 수정)
DROP POLICY IF EXISTS "Allow public read" ON public.patient_assessments;
CREATE POLICY "Allow public read" 
ON public.patient_assessments 
FOR SELECT 
USING (true);

-- =========================================
-- 3. 쓰기 작업은 모두 차단 (API를 통한 수정 방지)
-- =========================================

-- KTAS 데이터 수정 차단
DROP POLICY IF EXISTS "Block all writes" ON public.ktas_data;
CREATE POLICY "Block all writes" 
ON public.ktas_data 
FOR INSERT 
WITH CHECK (false);

DROP POLICY IF EXISTS "Block all updates" ON public.ktas_data;
CREATE POLICY "Block all updates" 
ON public.ktas_data 
FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "Block all deletes" ON public.ktas_data;
CREATE POLICY "Block all deletes" 
ON public.ktas_data 
FOR DELETE 
USING (false);

-- 구조대원 정보 수정 차단
DROP POLICY IF EXISTS "Block all writes" ON public.rescuers;
CREATE POLICY "Block all writes" 
ON public.rescuers 
FOR INSERT 
WITH CHECK (false);

DROP POLICY IF EXISTS "Block all updates" ON public.rescuers;
CREATE POLICY "Block all updates" 
ON public.rescuers 
FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "Block all deletes" ON public.rescuers;
CREATE POLICY "Block all deletes" 
ON public.rescuers 
FOR DELETE 
USING (false);