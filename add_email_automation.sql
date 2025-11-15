-- Email templates allow managing reusable layouts in Supabase
create table if not exists public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  html_body text not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create unique index if not exists email_templates_name_idx on public.email_templates (lower(name));

create trigger update_email_templates_updated_at
before update on public.email_templates
for each row execute procedure public.set_updated_at();

-- Queue of emails waiting to be processed by a worker/cron
create table if not exists public.email_queue (
  id uuid primary key default uuid_generate_v4(),
  email_type text not null check (email_type in ('VERIFY', 'INVITE', 'MARKETING')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  try_count integer not null default 0,
  last_error text,
  scheduled_for timestamp with time zone default timezone('utc', now()),
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists email_queue_status_scheduled_idx
  on public.email_queue (status, scheduled_for);

-- Permanent log of deliveries for analytics/reporting
create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  queue_id uuid references public.email_queue(id) on delete set null,
  email_type text not null,
  recipient text not null,
  status text not null check (status in ('sent', 'failed')),
  provider_id text,
  error_message text,
  created_at timestamp with time zone default timezone('utc', now())
);

create index if not exists email_logs_queue_id_idx on public.email_logs(queue_id);
create index if not exists email_logs_created_at_idx on public.email_logs(created_at desc);

-- Optional: store marketing campaign metadata to reuse in UI
create table if not exists public.marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subject text not null,
  headline text not null,
  message text not null,
  cta_url text,
  cta_label text,
  unsubscribe_url text,
  created_by uuid,
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone default timezone('utc', now())
);


