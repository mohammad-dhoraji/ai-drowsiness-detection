-- ============================================================================
-- RLS Policies for Driver Drowsiness Detection System
-- Run this in your Supabase SQL Editor to enable proper data access
-- ============================================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drowsiness_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.driver_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guardian_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES Table Policies
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow service role to manage profiles (bypass RLS)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- SESSIONS Table Policies
-- ============================================================================

-- Drivers can read their own sessions
CREATE POLICY "Drivers can read own sessions" ON public.sessions
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Drivers can create their own sessions
CREATE POLICY "Drivers can create sessions" ON public.sessions
    FOR INSERT
    WITH CHECK (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Drivers can update their own sessions
CREATE POLICY "Drivers can update own sessions" ON public.sessions
    FOR UPDATE
    USING (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Service role can manage sessions
CREATE POLICY "Service role can manage sessions" ON public.sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- DROWSINESS_EVENTS Table Policies
-- ============================================================================

-- Drivers can read their own drowsiness events
CREATE POLICY "Drivers can read own events" ON public.drowsiness_events
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Drivers can create their own drowsiness events (CRITICAL - this was likely missing!)
CREATE POLICY "Drivers can create events" ON public.drowsiness_events
    FOR INSERT
    WITH CHECK (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Service role can manage drowsiness events
CREATE POLICY "Service role can manage events" ON public.drowsiness_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- DRIVER_GUARDIANS Table Policies
-- ============================================================================

-- Drivers can read their guardian links
CREATE POLICY "Drivers can read guardian links" ON public.driver_guardians
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Guardians can read their driver links
CREATE POLICY "Guardians can read driver links" ON public.driver_guardians
    FOR SELECT
    USING (
        guardian_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Drivers can create guardian links
CREATE POLICY "Drivers can create guardian links" ON public.driver_guardians
    FOR INSERT
    WITH CHECK (
        driver_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Service role can manage driver_guardians
CREATE POLICY "Service role can manage driver_guardians" ON public.driver_guardians
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- GUARDIAN_NOTIFICATIONS Table Policies
-- ============================================================================

-- Guardians can read their own notifications
CREATE POLICY "Guardians can read own notifications" ON public.guardian_notifications
    FOR SELECT
    USING (
        guardian_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- Guardians can update (mark as read) their own notifications
CREATE POLICY "Guardians can update own notifications" ON public.guardian_notifications
    FOR UPDATE
    USING (
        guardian_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- System can create notifications (called from backend service)
CREATE POLICY "Service can create guardian notifications" ON public.guardian_notifications
    FOR INSERT
    WITH CHECK (true);

-- Service role can manage guardian_notifications
CREATE POLICY "Service role can manage guardian_notifications" ON public.guardian_notifications
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- Verify Policies
-- ============================================================================

-- List all created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

