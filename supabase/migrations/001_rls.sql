-- Enable Row Level Security on all user-owned tables
-- Run this in the Supabase SQL editor or via `supabase db push`

-- ============================================
-- projects
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_owner_all" ON projects
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- assets
-- ============================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_project_owner" ON assets
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- memberships
-- ============================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_owner_read" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- Only service-role (server) can write memberships
CREATE POLICY "memberships_service_write" ON memberships
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "memberships_service_update" ON memberships
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================
-- credit_transactions
-- ============================================
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_owner_read" ON credit_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "credit_transactions_service_write" ON credit_transactions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- users (public read of own profile)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_owner_read_update" ON users
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
