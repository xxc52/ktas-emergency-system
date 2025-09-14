-- KTAS Emergency Medical System - Row Level Security (RLS) Setup
-- This script enables RLS and creates appropriate security policies for all tables

-- =========================================
-- 1. Enable RLS on all tables
-- =========================================

-- Enable RLS on ktas_data table
ALTER TABLE public.ktas_data ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rescuers table
ALTER TABLE public.rescuers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on custom_presets table
ALTER TABLE public.custom_presets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on patient_assessments table
ALTER TABLE public.patient_assessments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. Create security policies
-- =========================================

-- KTAS_DATA TABLE POLICIES
-- Read-only access for everyone (public health data)
CREATE POLICY "Allow public read access to KTAS data"
ON public.ktas_data
FOR SELECT
TO anon, authenticated
USING (true);

-- Prevent any modifications through the API
CREATE POLICY "Deny all write operations on KTAS data"
ON public.ktas_data
FOR ALL
USING (false);

-- RESCUERS TABLE POLICIES
-- Allow everyone to read rescuer profiles (for profile selection)
CREATE POLICY "Allow public read access to rescuer profiles"
ON public.rescuers
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admin can modify rescuer data
CREATE POLICY "Admin only write access for rescuers"
ON public.rescuers
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- CUSTOM_PRESETS TABLE POLICIES
-- Users can only see and manage their own presets
CREATE POLICY "Users can view their own presets"
ON public.custom_presets
FOR SELECT
TO authenticated
USING (rescuer_id = auth.uid());

CREATE POLICY "Users can create their own presets"
ON public.custom_presets
FOR INSERT
TO authenticated
WITH CHECK (rescuer_id = auth.uid());

CREATE POLICY "Users can update their own presets"
ON public.custom_presets
FOR UPDATE
TO authenticated
USING (rescuer_id = auth.uid())
WITH CHECK (rescuer_id = auth.uid());

CREATE POLICY "Users can delete their own presets"
ON public.custom_presets
FOR DELETE
TO authenticated
USING (rescuer_id = auth.uid());

-- PATIENT_ASSESSMENTS TABLE POLICIES
-- Users can only see assessments they created
CREATE POLICY "Users can view their own assessments"
ON public.patient_assessments
FOR SELECT
TO authenticated
USING (rescuer_id = auth.uid());

CREATE POLICY "Users can create assessments"
ON public.patient_assessments
FOR INSERT
TO authenticated
WITH CHECK (rescuer_id = auth.uid());

-- Assessments cannot be updated or deleted (audit trail)
CREATE POLICY "Prevent assessment modifications"
ON public.patient_assessments
FOR UPDATE
USING (false);

CREATE POLICY "Prevent assessment deletions"
ON public.patient_assessments
FOR DELETE
USING (false);

-- =========================================
-- 3. Create indexes for performance
-- =========================================

-- Index for rescuer_id lookups
CREATE INDEX IF NOT EXISTS idx_custom_presets_rescuer_id ON public.custom_presets(rescuer_id);
CREATE INDEX IF NOT EXISTS idx_patient_assessments_rescuer_id ON public.patient_assessments(rescuer_id);

-- =========================================
-- 4. Grant necessary permissions
-- =========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant appropriate permissions on tables
GRANT SELECT ON public.ktas_data TO anon, authenticated;
GRANT SELECT ON public.rescuers TO anon, authenticated;
GRANT ALL ON public.custom_presets TO authenticated;
GRANT SELECT, INSERT ON public.patient_assessments TO authenticated;

-- Grant permissions on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;