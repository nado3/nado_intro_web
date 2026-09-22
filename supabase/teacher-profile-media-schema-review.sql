-- NADO Teachers: public language profile + moderated bilingual intro-video submissions
-- Run in the Supabase SQL editor before deploying the matching portal code.
-- This file creates only the private submission workflow. Approval/publishing must be
-- performed by a trusted admin process after the file is copied to an approved public location.

begin;

create table if not exists public.teacher_profile_public_details (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  languages text[] not null default array['en']::text[],
  updated_at timestamptz not null default now()
);

alter table public.teacher_profile_public_details
  add column if not exists languages text[] not null default array['en']::text[],
  add column if not exists updated_at timestamptz not null default now();

alter table public.teacher_profile_public_details
  drop constraint if exists teacher_profile_public_details_languages_check,
  drop constraint if exists teacher_profile_public_details_language_count,
  drop constraint if exists teacher_profile_public_details_language_codes;
alter table public.teacher_profile_public_details
  add constraint teacher_profile_public_details_languages_check check (
    cardinality(languages) between 1 and 7
    and languages @> array['en']::text[]
    and languages <@ array['en', 'ko', 'zh', 'ja', 'es', 'fr', 'ru']::text[]
    and array_position(languages, '') is null
  );

create table if not exists public.teacher_intro_videos (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  language_code text not null,
  storage_bucket text not null default 'teacher-intro-video-submissions',
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  status text not null default 'pending',
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  approved_public_path text,
  published_url text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (teacher_id, language_code)
);

alter table public.teacher_intro_videos
  add column if not exists language_code text,
  add column if not exists storage_bucket text not null default 'teacher-intro-video-submissions',
  add column if not exists storage_path text,
  add column if not exists original_name text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists status text not null default 'pending',
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_public_path text,
  add column if not exists published_url text,
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.teacher_intro_videos
  drop constraint if exists teacher_intro_videos_language_code_check,
  drop constraint if exists teacher_intro_videos_storage_bucket_check,
  drop constraint if exists teacher_intro_videos_mime_type_check,
  drop constraint if exists teacher_intro_videos_size_bytes_check,
  drop constraint if exists teacher_intro_videos_status_check,
  drop constraint if exists teacher_intro_videos_storage_path_check,
  drop constraint if exists teacher_intro_videos_approved_public_check,
  drop constraint if exists teacher_intro_videos_language_code,
  drop constraint if exists teacher_intro_videos_status,
  drop constraint if exists teacher_intro_videos_private_bucket,
  drop constraint if exists teacher_intro_videos_storage_path,
  drop constraint if exists teacher_intro_videos_published_state;

alter table public.teacher_intro_videos
  add constraint teacher_intro_videos_language_code_check check (language_code in ('en', 'ko')),
  add constraint teacher_intro_videos_storage_bucket_check check (storage_bucket = 'teacher-intro-video-submissions'),
  add constraint teacher_intro_videos_mime_type_check check (mime_type in ('video/mp4', 'video/webm', 'video/quicktime')),
  add constraint teacher_intro_videos_size_bytes_check check (size_bytes between 1 and 104857600),
  add constraint teacher_intro_videos_status_check check (status in ('pending', 'approved', 'rejected')),
  add constraint teacher_intro_videos_storage_path_check check (
    storage_path = btrim(storage_path)
    and storage_path not like '/%'
    and position('..' in storage_path) = 0
    and storage_path like teacher_id::text || '/' || language_code || '/%'
  ),
  add constraint teacher_intro_videos_approved_public_check check (
    (
      status = 'approved'
      and nullif(btrim(approved_public_path), '') is not null
      and approved_public_path like 'teacher-intro-videos-public/%'
      and position('..' in approved_public_path) = 0
      and nullif(btrim(published_url), '') is not null
      and reviewed_at is not null
    )
    or (status <> 'approved' and approved_public_path is null and published_url is null)
  );

create unique index if not exists teacher_intro_videos_teacher_language_key
  on public.teacher_intro_videos (teacher_id, language_code);
create index if not exists teacher_intro_videos_review_queue_idx
  on public.teacher_intro_videos (status, updated_at desc);

create or replace function public.set_teacher_profile_media_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.reset_teacher_intro_video_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if row(new.storage_bucket, new.storage_path, new.original_name, new.mime_type, new.size_bytes)
     is distinct from
     row(old.storage_bucket, old.storage_path, old.original_name, old.mime_type, old.size_bytes) then
    new.status = 'pending';
    new.review_note = null;
    new.reviewed_at = null;
    new.reviewed_by = null;
    new.approved_public_path = null;
    new.published_url = null;
    new.submitted_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_profile_public_details_updated_at on public.teacher_profile_public_details;
drop trigger if exists teacher_profile_public_details_touch on public.teacher_profile_public_details;
create trigger teacher_profile_public_details_updated_at
before update on public.teacher_profile_public_details
for each row execute function public.set_teacher_profile_media_updated_at();

drop trigger if exists teacher_intro_videos_review_reset on public.teacher_intro_videos;
drop trigger if exists teacher_intro_videos_reset_changed_submission on public.teacher_intro_videos;
create trigger teacher_intro_videos_review_reset
before update on public.teacher_intro_videos
for each row execute function public.reset_teacher_intro_video_review();

alter table public.teacher_profile_public_details enable row level security;
alter table public.teacher_intro_videos enable row level security;

drop policy if exists "teacher_public_details_select_own_or_admin" on public.teacher_profile_public_details;
drop policy if exists "teacher_public_details_insert_own" on public.teacher_profile_public_details;
drop policy if exists "teacher_public_details_update_own" on public.teacher_profile_public_details;
drop policy if exists "teacher_public_details_delete_own" on public.teacher_profile_public_details;
drop policy if exists "Teachers read own public profile details" on public.teacher_profile_public_details;
drop policy if exists "Teachers insert own public profile details" on public.teacher_profile_public_details;
drop policy if exists "Teachers update own public profile details" on public.teacher_profile_public_details;
drop policy if exists "Teachers delete own public profile details" on public.teacher_profile_public_details;

create policy "teacher_public_details_select_own_or_admin"
on public.teacher_profile_public_details for select to authenticated
using ((select auth.uid()) = teacher_id or public.is_admin());

create policy "teacher_public_details_insert_own"
on public.teacher_profile_public_details for insert to authenticated
with check (
  (select auth.uid()) = teacher_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_public_details_update_own"
on public.teacher_profile_public_details for update to authenticated
using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_public_details_delete_own"
on public.teacher_profile_public_details for delete to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists "teacher_intro_videos_select_own_or_admin" on public.teacher_intro_videos;
drop policy if exists "teacher_intro_videos_insert_pending_own" on public.teacher_intro_videos;
drop policy if exists "teacher_intro_videos_update_submission_own" on public.teacher_intro_videos;
drop policy if exists "teacher_intro_videos_delete_own" on public.teacher_intro_videos;
drop policy if exists "Teachers read own intro video submissions" on public.teacher_intro_videos;
drop policy if exists "Teachers insert own pending intro video" on public.teacher_intro_videos;
drop policy if exists "Teachers replace own pending intro video" on public.teacher_intro_videos;
drop policy if exists "Teachers delete own unapproved intro video" on public.teacher_intro_videos;

create policy "teacher_intro_videos_select_own_or_admin"
on public.teacher_intro_videos for select to authenticated
using ((select auth.uid()) = teacher_id or public.is_admin());

create policy "teacher_intro_videos_insert_pending_own"
on public.teacher_intro_videos for insert to authenticated
with check (
  (select auth.uid()) = teacher_id
  and status = 'pending'
  and approved_public_path is null
  and published_url is null
  and reviewed_at is null
  and reviewed_by is null
  and storage_bucket = 'teacher-intro-video-submissions'
  and storage_path like (select auth.uid())::text || '/' || language_code || '/%'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_intro_videos_update_submission_own"
on public.teacher_intro_videos for update to authenticated
using ((select auth.uid()) = teacher_id and status <> 'approved')
with check (
  (select auth.uid()) = teacher_id
  and status = 'pending'
  and approved_public_path is null
  and published_url is null
  and reviewed_at is null
  and reviewed_by is null
  and storage_bucket = 'teacher-intro-video-submissions'
  and storage_path like (select auth.uid())::text || '/' || language_code || '/%'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_intro_videos_delete_own"
on public.teacher_intro_videos for delete to authenticated
using ((select auth.uid()) = teacher_id and status <> 'approved');

-- Explicit Data API privileges. Teachers can submit/replace media metadata but cannot
-- set review status, review notes, reviewer identity, public path, or published URL.
grant usage on schema public to authenticated;

revoke all on public.teacher_profile_public_details from anon, authenticated;
grant select, delete on public.teacher_profile_public_details to authenticated;
grant insert (teacher_id, languages) on public.teacher_profile_public_details to authenticated;
grant update (languages) on public.teacher_profile_public_details to authenticated;

revoke all on public.teacher_intro_videos from anon, authenticated;
grant select, delete on public.teacher_intro_videos to authenticated;
grant insert (
  teacher_id, language_code, storage_bucket, storage_path, original_name, mime_type, size_bytes
) on public.teacher_intro_videos to authenticated;
grant update (
  storage_bucket, storage_path, original_name, mime_type, size_bytes
) on public.teacher_intro_videos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-intro-video-submissions',
  'teacher-intro-video-submissions',
  false,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-intro-videos-public',
  'teacher-intro-videos-public',
  true,
  104857600,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "teacher_intro_submissions_select_own_or_admin" on storage.objects;
drop policy if exists "teacher_intro_submissions_insert_own" on storage.objects;
drop policy if exists "teacher_intro_submissions_update_own" on storage.objects;
drop policy if exists "teacher_intro_submissions_delete_own" on storage.objects;
drop policy if exists "Teachers upload own intro video submissions" on storage.objects;
drop policy if exists "Teachers read own intro video objects" on storage.objects;
drop policy if exists "Teachers replace own intro video objects" on storage.objects;
drop policy if exists "Teachers delete own intro video objects" on storage.objects;

create policy "teacher_intro_submissions_select_own_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-intro-video-submissions'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

create policy "teacher_intro_submissions_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teacher-intro-video-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] in ('en', 'ko')
  and lower(storage.extension(name)) in ('mp4', 'webm', 'mov')
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_intro_submissions_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'teacher-intro-video-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.teacher_intro_videos v
    where v.teacher_id = (select auth.uid())
      and v.storage_bucket = bucket_id
      and v.storage_path = name
      and v.status = 'approved'
  )
)
with check (
  bucket_id = 'teacher-intro-video-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] in ('en', 'ko')
  and lower(storage.extension(name)) in ('mp4', 'webm', 'mov')
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'teacher'
      and coalesce(to_jsonb(p)->>'account_status', 'active') = 'active'
  )
);

create policy "teacher_intro_submissions_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'teacher-intro-video-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1
    from public.teacher_intro_videos v
    where v.teacher_id = (select auth.uid())
      and v.storage_bucket = bucket_id
      and v.storage_path = name
      and v.status = 'approved'
  )
);

comment on table public.teacher_profile_public_details is 'Teacher-controlled public profile attributes projected through a reviewed public RPC';
comment on column public.teacher_profile_public_details.languages is 'Language codes selected by the teacher; English is required for NADO English teachers';
comment on table public.teacher_intro_videos is 'Private EN/KO intro-video submissions with trusted moderation status';
comment on column public.teacher_intro_videos.storage_path is 'Private submission object path; never expose through a public RPC';
comment on column public.teacher_intro_videos.published_url is 'Trusted public URL set only after an approved public copy exists';

-- Deliberately no authenticated INSERT/UPDATE/DELETE policy is created for
-- teacher-intro-videos-public. A trusted server or SQL-editor review process owns publishing.

commit;
