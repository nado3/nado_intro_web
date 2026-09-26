-- Durable server-side copy of every application payload before downstream validation/Jotform.
-- Contains PII; browser roles must not have direct access.

create table if not exists public.application_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'received'
    check (status in ('received','completed','failed')),
  status_code integer
    check (status_code is null or (status_code between 200 and 599)),
  error_type text,
  error_message text,
  failed_at timestamptz,
  completed_at timestamptz,
  jotform_submission_id text,
  jotform_response_code integer,

  full_name text,
  phone text,
  age_group text,
  english_level text,
  goals jsonb not null default '[]'::jsonb,
  place_choices jsonb not null default '[]'::jsonb,
  plan_raw text,
  payment_confirmation text,
  schedule_raw text,
  place_label text,
  preferred_start_date text,
  referrals jsonb not null default '[]'::jsonb,
  gender text,
  referral_other text,
  goals_other text,
  frequency text,
  duration text,
  application_type text,
  notes_raw text,
  matching_type text,
  teacher_name text,
  teacher_id text,
  place_detail text,

  raw_payload jsonb not null default '{}'::jsonb,
  source_origin text,
  environment text
);

create index if not exists application_submissions_created_at_idx
  on public.application_submissions (created_at desc);

create index if not exists application_submissions_status_idx
  on public.application_submissions (status, created_at desc);

create index if not exists application_submissions_phone_idx
  on public.application_submissions (phone);

create index if not exists application_submissions_teacher_idx
  on public.application_submissions (teacher_id, created_at desc);

alter table public.application_submissions enable row level security;

revoke all on table public.application_submissions from anon, authenticated;
grant select, insert, update, delete on table public.application_submissions to service_role;

comment on table public.application_submissions is
  'Server-only durable copy of NADO application submissions, including PII, saved before downstream validation/Jotform processing.';
