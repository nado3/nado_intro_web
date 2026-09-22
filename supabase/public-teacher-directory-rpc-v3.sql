-- NADO public teacher directory RPC v3
-- Adds controlled available-language codes and approved EN/KO introduction
-- videos without changing the deployed v2 contract.
--
-- REVIEW/APPLY ORDER:
--   1. teacher-profile-media-schema-review.sql
--   2. this file
--
-- The v3 function remains a narrow public projection. It never returns private
-- submission paths, pending/rejected rows, review notes, auth IDs beyond the
-- existing public teacher_id, or any contact/payment data.

begin;

create or replace function public.get_public_teacher_directory_v3(p_region text)
returns table (
  teacher_id text,
  display_name text,
  plan_groups jsonb,
  business_english boolean,
  school text,
  major text,
  bio text,
  profile_photo_path text,
  available_languages jsonb,
  introduction_video_en_url text,
  introduction_video_ko_url text,
  service_areas jsonb,
  availability jsonb
)
language sql
stable
security definer
set search_path = ''
as $function$
  with base_directory as (
    select *
    from public.get_public_teacher_directory_v2(p_region)
  ),
  approved_videos as (
    select
      video.teacher_id::text as teacher_id,
      max(video.published_url) filter (where video.language_code = 'en') as english_url,
      max(video.published_url) filter (where video.language_code = 'ko') as korean_url
    from public.teacher_intro_videos as video
    where video.status = 'approved'
      and nullif(btrim(video.published_url), '') is not null
    group by video.teacher_id
  )
  select
    directory.teacher_id,
    directory.display_name,
    directory.plan_groups,
    directory.business_english,
    directory.school,
    directory.major,
    directory.bio,
    directory.profile_photo_path,
    coalesce(
      (
        select jsonb_agg(to_jsonb(language.code) order by language.position)
        from unnest(
          case
            when details.teacher_id is null then array['en']::text[]
            else details.languages
          end
        ) with ordinality
          as language(code, position)
        where language.code in ('en', 'ko', 'zh', 'ja', 'es', 'fr', 'ru')
      ),
      '[]'::jsonb
    ) as available_languages,
    videos.english_url as introduction_video_en_url,
    videos.korean_url as introduction_video_ko_url,
    directory.service_areas,
    directory.availability
  from base_directory as directory
  left join public.teacher_profile_public_details as details
    on details.teacher_id::text = directory.teacher_id
  left join approved_videos as videos
    on videos.teacher_id = directory.teacher_id
  order by lower(directory.display_name), directory.teacher_id;
$function$;

comment on function public.get_public_teacher_directory_v3(text) is
  'Public read-only Songdo/Seoul teacher directory with controlled language codes and approved bilingual introduction video URLs.';

revoke execute on function public.get_public_teacher_directory_v3(text)
  from public, anon, authenticated;
grant execute on function public.get_public_teacher_directory_v3(text)
  to anon, authenticated;

commit;

-- Manual verification after applying in a non-production branch:
-- select * from public.get_public_teacher_directory_v3('Songdo');
-- select * from public.get_public_teacher_directory_v3('Seoul');
-- select * from public.get_public_teacher_directory_v3('Incheon'); -- must fail
--
-- No unapproved video may appear:
-- select directory.teacher_id
-- from public.get_public_teacher_directory_v3('Songdo') as directory
-- join public.teacher_intro_videos as video
--   on video.teacher_id::text = directory.teacher_id
-- where video.status <> 'approved'
--   and video.published_url in (
--     directory.introduction_video_en_url,
--     directory.introduction_video_ko_url
--   );
-- -- Expected: zero rows.
--
-- select
--   has_function_privilege('public', 'public.get_public_teacher_directory_v3(text)', 'execute') as public_can_execute,
--   has_function_privilege('anon', 'public.get_public_teacher_directory_v3(text)', 'execute') as anon_can_execute,
--   has_function_privilege('authenticated', 'public.get_public_teacher_directory_v3(text)', 'execute') as authenticated_can_execute;
-- -- Expected: false, true, true.
