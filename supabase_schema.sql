-- =====================================================================
-- INCIDENT AI - SUPABASE SCHEMA INITIALIZATION
-- Run this SQL in your Supabase project's SQL Editor (https://app.supabase.com)
-- =====================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- TABLE: profiles
-- Extends Supabase auth.users with app-specific profile metadata
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'DevOps / SRE Engineer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ---------------------------------------------------------------------
-- TABLE: user_saved_errors
-- Stores error occurrences and incidents preferred / saved by users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_saved_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    log_id TEXT NOT NULL,
    error_level TEXT NOT NULL, -- e.g. ERROR, CRITICAL, FATAL
    message TEXT NOT NULL,
    component TEXT,
    timestamp TEXT,
    summary TEXT,
    root_cause TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_saved_errors
ALTER TABLE public.user_saved_errors ENABLE ROW LEVEL SECURITY;

-- Policies for user_saved_errors:
-- Users can view their own saved errors
CREATE POLICY "Users can view own saved errors" 
    ON public.user_saved_errors FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can save (insert) errors under their user_id
CREATE POLICY "Users can insert own saved errors" 
    ON public.user_saved_errors FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update notes/details on their saved errors
CREATE POLICY "Users can update own saved errors" 
    ON public.user_saved_errors FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can remove (delete) their saved errors
CREATE POLICY "Users can delete own saved errors" 
    ON public.user_saved_errors FOR DELETE 
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- INDEXES FOR FAST QUERYING
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_saved_errors_user_id 
    ON public.user_saved_errors(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_errors_created_at 
    ON public.user_saved_errors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_errors_level 
    ON public.user_saved_errors(error_level);

-- ---------------------------------------------------------------------
-- TABLE: incident_records
-- Persistent record of formalized incidents and publication-ready RCA drafts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    incident_title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MAJOR', -- CRITICAL, MAJOR, MINOR, LOW
    status TEXT NOT NULL DEFAULT 'IDENTIFIED', -- INVESTIGATING, IDENTIFIED, MITIGATED, RESOLVED, CLOSED
    executive_summary TEXT NOT NULL,
    root_cause TEXT,
    trigger_event TEXT,
    impact_assessment TEXT,
    affected_components TEXT[],
    causal_timeline JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    rca_draft_markdown TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for incident_records
ALTER TABLE public.incident_records ENABLE ROW LEVEL SECURITY;

-- Incident Records Policies
CREATE POLICY "Users can view incident records" 
    ON public.incident_records FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert incident records" 
    ON public.incident_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own incident records" 
    ON public.incident_records FOR UPDATE 
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own incident records" 
    ON public.incident_records FOR DELETE 
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Indexes for incident_records
CREATE INDEX IF NOT EXISTS idx_incident_records_user_id 
    ON public.incident_records(user_id);

CREATE INDEX IF NOT EXISTS idx_incident_records_created_at 
    ON public.incident_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_records_severity 
    ON public.incident_records(severity);

CREATE INDEX IF NOT EXISTS idx_incident_records_status 
    ON public.incident_records(status);

-- ---------------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- Automatically creates a row in public.profiles when an auth.user signs up
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Site Reliability Engineer (SRE)')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- SUCCESS: Schema created. You can now connect your frontend application.
-- =====================================================================
