-- 短剧创作工具 Supabase Schema
-- 在 Supabase Dashboard -> SQL Editor 中运行此脚本

-- 用户表
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key default gen_random_uuid(),
  email text unique not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  credits integer not null default 100,
  created_at timestamptz not null default now()
);

-- 项目表
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null default '未命名项目',
  status text not null default 'draft' check (status in ('draft', 'casting', 'shooting', 'mastering', 'published', 'archived')),
  tag_set jsonb not null default '{}',
  inferred_config jsonb not null default '{}',
  script jsonb not null default '{"rawText":"","estimatedDurationSec":0,"characterCount":0,"wordLimit":0,"history":[]}',
  shots jsonb not null default '[]',
  master_cut jsonb,
  variants jsonb not null default '[]',
  story_structure jsonb,
  cost_spent integer not null default 0,
  estimated_cost_remaining integer not null default 0,
  last_entered_stage integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 资产表（场景/角色/道具）
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  kind text not null check (kind in ('scene', 'character', 'prop')),
  name text not null,
  description text not null default '',
  image_url text,
  public_id text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed')),
  approved_by_user boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 积分交易记录表
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('subscription_grant', 'one_time_grant', 'admin_adjust', 'consumption', 'refund')),
  amount integer not null,
  balance integer not null,
  project_id uuid references public.projects(id),
  project_title text,
  operation text,
  note text,
  created_at timestamptz not null default now()
);

-- RLS 策略
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.credit_transactions enable row level security;

-- 用户只能看到自己的数据
create policy "Users can only see own data" on public.users for select using (auth.uid() = id);
create policy "Users can only update own data" on public.users for update using (auth.uid() = id);

create policy "Users can CRUD own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can CRUD own assets" on public.assets for all using (
  auth.uid() = (select user_id from public.projects where id = project_id)
);
create policy "Users can see own credit transactions" on public.credit_transactions for select using (auth.uid() = user_id);

-- 自动更新时间戳
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- 索引
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_assets_project_id on public.assets(project_id);
create index if not exists idx_credit_transactions_user_id on public.credit_transactions(user_id);
