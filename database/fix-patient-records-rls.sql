-- patient_assessments 테이블의 RLS 정책 수정
-- 환자 기록은 생성은 허용하되, 수정/삭제는 차단

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Allow public read" ON public.patient_assessments;
DROP POLICY IF EXISTS "Block all modifications" ON public.patient_assessments;

-- 새로운 정책 생성

-- 1. 읽기 허용 (모든 사용자)
CREATE POLICY "Allow public read" 
ON public.patient_assessments 
FOR SELECT 
USING (true);

-- 2. 삽입 허용 (인증 없이도 기록 생성 가능)
CREATE POLICY "Allow insert for all" 
ON public.patient_assessments 
FOR INSERT 
WITH CHECK (true);

-- 3. 수정 차단 (기록 무결성 보호)
CREATE POLICY "Block updates" 
ON public.patient_assessments 
FOR UPDATE 
USING (false);

-- 4. 삭제 차단 (기록 보존)
CREATE POLICY "Block deletes" 
ON public.patient_assessments 
FOR DELETE 
USING (false);

-- custom_presets도 동일하게 수정 (프리셋 저장 가능하도록)
DROP POLICY IF EXISTS "Allow public read" ON public.custom_presets;
DROP POLICY IF EXISTS "Block all modifications" ON public.custom_presets;

-- 프리셋 읽기 허용
CREATE POLICY "Allow public read" 
ON public.custom_presets 
FOR SELECT 
USING (true);

-- 프리셋 생성 허용
CREATE POLICY "Allow insert for all" 
ON public.custom_presets 
FOR INSERT 
WITH CHECK (true);

-- 프리셋 수정 허용 (자신의 프리셋만 - 추후 인증 시스템 추가 시 수정)
CREATE POLICY "Allow updates" 
ON public.custom_presets 
FOR UPDATE 
USING (true);

-- 프리셋 삭제 허용 (자신의 프리셋만 - 추후 인증 시스템 추가 시 수정)
CREATE POLICY "Allow deletes" 
ON public.custom_presets 
FOR DELETE 
USING (true);