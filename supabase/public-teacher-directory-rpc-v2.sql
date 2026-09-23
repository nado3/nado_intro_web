-- NADO public teacher directory RPC v2 (multiple lesson types per teacher)
--
-- Reviewed against the live catalog and applied on 2026-09-21 through migrations
-- enable_public_teacher_directory_v2 and map_designated_songdo_schedule_category.
-- Kept here as the reproducible SQL definition for future environments.
--
-- Security model:
--   * SECURITY DEFINER is required only because the public directory must read
--     RLS-restricted schedules for anonymous visitors.
--     SECURITY INVOKER would require direct anon SELECT access plus matching RLS
--     policies (or a separately granted sanitized projection), neither of which
--     this script introduces.
--   * The function has an empty search_path and schema-qualifies every relation.
--   * student_teacher_catalog is the existing public-directory contract: the
--     view itself already limits rows to active, accepting teachers with active
--     accounts. The result below is an additional explicit safe projection. It
--     never returns a source row, email, phone, Kakao ID, bank details, auth IDs,
--     or schedule memo.
--   * PUBLIC receives no implicit EXECUTE privilege. Only Supabase's anon and
--     authenticated API roles may call this read-only function.
--   * No direct table privileges are granted by this script.
--
-- `to_jsonb(catalog_row)` is used only for schema-tolerant extraction of approved
-- catalog fields. In particular, introduction_video_url may be absent from the
-- live catalog; JSONB extraction then returns NULL without requiring ALTER TABLE.

begin;

create or replace function public.get_public_teacher_directory_v2(p_region text)
returns table (
  teacher_id text,
  display_name text,
  plan_groups jsonb,
  business_english boolean,
  school text,
  major text,
  bio text,
  profile_photo_path text,
  introduction_video_url text,
  service_areas jsonb,
  availability jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  requested_region text;
begin
  requested_region := case lower(btrim(coalesce(p_region, '')))
    when 'songdo' then 'Songdo'
    when 'seoul' then 'Seoul'
    else null
  end;

  if requested_region is null then
    raise exception using
      errcode = '22023',
      message = 'p_region must be exactly Songdo or Seoul';
  end if;

  return query
  with catalog_documents as (
    select to_jsonb(catalog_row) as document
    from public.student_teacher_catalog as catalog_row
  ),
  parsed_teachers as (
    select
      coalesce(
        nullif(catalog.document ->> 'teacher_id', ''),
        nullif(catalog.document ->> 'id', '')
      ) as teacher_id,
      coalesce(
        nullif(catalog.document ->> 'display_name', ''),
        nullif(catalog.document ->> 'teacher_name', ''),
        nullif(catalog.document ->> 'full_name', ''),
        nullif(catalog.document ->> 'name', '')
      ) as display_name,
      catalog.document -> 'plan_groups' as configured_plan_groups,
      lower(coalesce(
        nullif(catalog.document ->> 'business_english', ''),
        'false'
      )) in ('true', 't', '1', 'yes', 'y', 'on') as business_english,
      coalesce(
        nullif(catalog.document ->> 'school', ''),
        nullif(catalog.document ->> 'university', ''),
        nullif(catalog.document ->> 'university_name', '')
      ) as school,
      coalesce(
        nullif(catalog.document ->> 'major', ''),
        nullif(catalog.document ->> 'major_name', '')
      ) as major,
      coalesce(
        nullif(catalog.document ->> 'bio', ''),
        nullif(catalog.document ->> 'short_bio', ''),
        nullif(catalog.document ->> 'introduction', '')
      ) as bio,
      coalesce(
        nullif(catalog.document ->> 'profile_photo_path', ''),
        nullif(catalog.document ->> 'profile_photo_url', ''),
        nullif(catalog.document ->> 'photo_url', '')
      ) as profile_photo_path,
      coalesce(
        nullif(catalog.document ->> 'introduction_video_url', ''),
        nullif(catalog.document ->> 'intro_video_url', ''),
        nullif(catalog.document ->> 'self_intro_video_url', '')
      ) as introduction_video_url
    from catalog_documents as catalog
  ),
  active_teachers as (
    select distinct
      teacher.teacher_id,
      teacher.display_name,
      coalesce(
        (
          select jsonb_agg(configured.plan order by configured.sort_order)
          from (
            select distinct
              lower(plan_value.value) as plan,
              case lower(plan_value.value)
                when 'economy' then 1
                when 'standard' then 2
                when 'premium' then 3
              end as sort_order
            from jsonb_array_elements_text(
              case
                when jsonb_typeof(teacher.configured_plan_groups) = 'array'
                  then teacher.configured_plan_groups
                else '[]'::jsonb
              end
            ) as plan_value(value)
            where lower(plan_value.value) in ('economy', 'standard', 'premium')
          ) as configured
        ),
        case
          when lower(btrim(teacher.display_name)) = 'oscar'
            or lower(btrim(teacher.display_name)) like 'oscar %'
            then '["standard", "premium"]'::jsonb
          else '["economy", "standard"]'::jsonb
        end
      ) as plan_groups,
      teacher.business_english,
      teacher.school,
      teacher.major,
      teacher.bio,
      teacher.profile_photo_path,
      teacher.introduction_video_url
    from parsed_teachers as teacher
    -- Do not repeat status-key guesses here: the live catalog view already
    -- enforces active + accepting_students + active account_status. Relying on
    -- that view contract also avoids accidentally returning zero rows when its
    -- internal filter columns are intentionally omitted from the projection.
    where teacher.teacher_id is not null
      and teacher.display_name is not null
      and exists (
        select 1 from public.profiles as profile
        where profile.id::text = teacher.teacher_id
          and profile.role = 'teacher'
          and profile.is_active is true
      )
  ),
  seoul_catalog as (
    -- The existing catalog RPC is the canonical active code -> label source.
    -- Accept both known result-key conventions used by catalog RPC versions.
    select distinct
      coalesce(
        nullif(area.document ->> 'code', ''),
        nullif(area.document ->> 'area_code', '')
      ) as area_code,
      coalesce(
        nullif(area.document ->> 'label', ''),
        nullif(area.document ->> 'area_label', '')
      ) as area_label
    from (
      select to_jsonb(catalog_row) as document
      from public.get_seoul_service_area_catalog() as catalog_row
    ) as area
    where requested_region = 'Seoul'
      and coalesce(
        nullif(area.document ->> 'code', ''),
        nullif(area.document ->> 'area_code', '')
      ) is not null
      and coalesce(
        nullif(area.document ->> 'label', ''),
        nullif(area.document ->> 'area_label', '')
      ) is not null
  ),
  service_area_source as (
    select
      service_area.teacher_id::text as teacher_id,
      lower(regexp_replace(btrim(service_area.region::text), '[[:space:]_-]+', '', 'g')) as normalized_region,
      lower(regexp_replace(btrim(service_area.area::text), '[[:space:]_-]+', '', 'g')) as normalized_area
    from public.teacher_service_areas as service_area
    where service_area.active is true
  ),
  selected_service_areas as (
    select distinct
      source.teacher_id,
      'Seoul'::text as region,
      catalog.area_code,
      catalog.area_label
    from service_area_source as source
    join seoul_catalog as catalog
      on lower(regexp_replace(catalog.area_code, '[[:space:]_-]+', '', 'g')) = source.normalized_area
    where requested_region = 'Seoul'
      and source.normalized_region in ('seoul', '서울')
  ),
  availability_source as (
    select
      schedule.teacher_id::text as teacher_id,
      schedule.day_of_week,
      schedule.start_time,
      schedule.end_time,
      lower(regexp_replace(btrim(schedule.location::text), '[[:space:]_-]+', '', 'g')) as normalized_location,
      lower(regexp_replace(btrim(schedule.service_area::text), '[[:space:]_-]+', '', 'g')) as normalized_service_area
    from public.availability as schedule
    where schedule.day_of_week between 0 and 6
      and schedule.start_time is not null
      and schedule.end_time is not null
      and schedule.location is not null
      and lower(coalesce(
        nullif(to_jsonb(schedule) ->> 'active', ''),
        nullif(to_jsonb(schedule) ->> 'is_active', ''),
        'true'
      )) in ('true', 't', '1', 'yes', 'y', 'on', 'active')
  ),
  selected_availability as (
    -- A generic Seoul row applies to each of that teacher's active Seoul areas.
    -- An area-specific Seoul row applies only to the matching active area.
    select distinct
      schedule.teacher_id,
      schedule.day_of_week,
      schedule.start_time,
      schedule.end_time,
      area.area_code,
      area.area_label
    from availability_source as schedule
    join selected_service_areas as area
      on area.teacher_id = schedule.teacher_id
     and area.region = 'Seoul'
    where requested_region = 'Seoul'
      and (
        schedule.normalized_location in ('seoul', '서울')
        or schedule.normalized_location = lower(regexp_replace(area.area_code, '[[:space:]_-]+', '', 'g'))
        or schedule.normalized_location = lower(regexp_replace(area.area_label, '[[:space:]_-]+', '', 'g'))
      )
      and (
        schedule.normalized_service_area is null
        or schedule.normalized_service_area = lower(regexp_replace(area.area_code, '[[:space:]_-]+', '', 'g'))
        or schedule.normalized_service_area = lower(regexp_replace(area.area_label, '[[:space:]_-]+', '', 'g'))
      )

    union all

    -- Songdo eligibility comes from an active catalog teacher having an exact
    -- public Songdo schedule. Current schedules predate complete service-area
    -- coverage, so requiring a teacher_service_areas row would drop valid slots.
    -- The strict allowlist still prevents 구월동 or generic Incheon from entering.
    select distinct
      schedule.teacher_id,
      schedule.day_of_week,
      schedule.start_time,
      schedule.end_time,
      mapped.area_code,
      case mapped.area_code
        when 'IGC' then 'IGC 인천글로벌캠퍼스'
        when 'Triple Street' then '트리플스트리트'
        when 'Songdo' then '송도 내 협의'
      end as area_label
    from availability_source as schedule
    cross join lateral (
      select case
        -- Current teacher availability stores the shared category separately
        -- from the exact designated place. Never turn it into both places.
        when schedule.normalized_location = 'igc&트스'
          and schedule.normalized_service_area in ('igc', 'igc인천글로벌캠퍼스', '인천글로벌캠퍼스') then 'IGC'
        when schedule.normalized_location = 'igc&트스'
          and schedule.normalized_service_area in ('triplestreet', '트리플스트리트', '송도트리플스트리트') then 'Triple Street'
        when schedule.normalized_location in (
          'igc',
          'igc인천글로벌캠퍼스',
          '인천글로벌캠퍼스'
        ) then 'IGC'
        when schedule.normalized_location in (
          'triplestreet',
          '트리플스트리트',
          '송도트리플스트리트'
        ) then 'Triple Street'
        when schedule.normalized_location in (
          'songdo',
          '송도',
          '송도내협의',
          '송도내협의가능'
        ) then 'Songdo'
        else null
      end as area_code
    ) as mapped
    where requested_region = 'Songdo'
      and mapped.area_code is not null
  ),
  display_service_areas as (
    -- Only advertise detailed areas backed by at least one selected time slot.
    select distinct schedule.teacher_id, schedule.area_label
    from selected_availability as schedule
  ),
  area_rollup as (
    select
      area.teacher_id,
      jsonb_agg(to_jsonb(area.area_label) order by area.area_label) as service_areas
    from display_service_areas as area
    group by area.teacher_id
  ),
  availability_rollup as (
    select
      schedule.teacher_id,
      jsonb_agg(
        jsonb_build_object(
          'day_of_week', schedule.day_of_week,
          'start_time', left(schedule.start_time::text, 5),
          'end_time', left(schedule.end_time::text, 5),
          'area_code', schedule.area_code,
          'area_label', schedule.area_label
        ) order by
          schedule.day_of_week,
          schedule.start_time,
          schedule.end_time,
          schedule.area_label
      ) as availability
    from selected_availability as schedule
    group by schedule.teacher_id
  )
  select
    teacher.teacher_id,
    teacher.display_name,
    teacher.plan_groups,
    teacher.business_english,
    teacher.school,
    teacher.major,
    teacher.bio,
    teacher.profile_photo_path,
    teacher.introduction_video_url,
    areas.service_areas,
    schedules.availability
  from active_teachers as teacher
  join area_rollup as areas
    on areas.teacher_id = teacher.teacher_id
  join availability_rollup as schedules
    on schedules.teacher_id = teacher.teacher_id
  order by lower(teacher.display_name), teacher.teacher_id;
end;
$function$;

comment on function public.get_public_teacher_directory_v2(text) is
  'Public, read-only NADO teacher directory for exactly Songdo or Seoul; returns approved marketing fields, multiple lesson types, and region-scoped schedules.';

-- Functions receive EXECUTE from the pseudo-role PUBLIC by default. Reset all
-- relevant API-role privileges first, then grant only the intended callers.
revoke execute on function public.get_public_teacher_directory_v2(text)
  from public, anon, authenticated;
grant execute on function public.get_public_teacher_directory_v2(text)
  to anon, authenticated;

commit;

-- Manual verification after applying (keep these commented during review):
--
-- select * from public.get_public_teacher_directory_v2('Songdo');
-- select * from public.get_public_teacher_directory_v2('Seoul');
--
-- Snapshot count check (expected on 2026-09-15: Songdo 12, Seoul 6):
-- select 'Songdo' as region, count(*) from public.get_public_teacher_directory_v2('Songdo')
-- union all
-- select 'Seoul' as region, count(*) from public.get_public_teacher_directory_v2('Seoul');
--
-- Invalid and broader regions must fail with SQLSTATE 22023:
-- select * from public.get_public_teacher_directory_v2('Incheon');
-- select * from public.get_public_teacher_directory_v2('구월동');
--
-- Songdo must expose only the three canonical area codes:
-- select directory.teacher_id, item ->> 'area_code' as area_code
-- from public.get_public_teacher_directory_v2('Songdo') as directory
-- cross join lateral jsonb_array_elements(directory.availability) as item
-- where item ->> 'area_code' not in ('IGC', 'Triple Street', 'Songdo');
-- -- Expected: zero rows.
--
-- Confirm the function's effective privileges (PUBLIC must be false):
-- select
--   has_function_privilege('public', 'public.get_public_teacher_directory_v2(text)', 'execute') as public_can_execute,
--   has_function_privilege('anon', 'public.get_public_teacher_directory_v2(text)', 'execute') as anon_can_execute,
--   has_function_privilege('authenticated', 'public.get_public_teacher_directory_v2(text)', 'execute') as authenticated_can_execute;
-- -- Expected: false, true, true.
