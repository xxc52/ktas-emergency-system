-- Add gender and age_group columns to patient_assessments table
-- Migration: 2025-11-01 - Add patient demographics fields

-- Add gender column (성별) - optional for pediatric, required for adult
ALTER TABLE patient_assessments
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', NULL));

-- Add age_group column (세부 연령대) - optional for pediatric, required for adult
ALTER TABLE patient_assessments
ADD COLUMN age_group TEXT CHECK (age_group IN ('15-24', '25-34', '35-44', '45-54', '55-64', '65+', NULL));

-- Add comments for documentation
COMMENT ON COLUMN patient_assessments.gender IS '환자 성별 (성인의 경우 필수): male, female';
COMMENT ON COLUMN patient_assessments.age_group IS '세부 연령대 (성인의 경우 필수): 15-24, 25-34, 35-44, 45-54, 55-64, 65+';

-- Create index for faster filtering by demographics
CREATE INDEX idx_patient_assessments_gender ON patient_assessments(gender);
CREATE INDEX idx_patient_assessments_age_group ON patient_assessments(age_group);

-- Verification query (optional - run to check)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'patient_assessments'
-- AND column_name IN ('gender', 'age_group');
