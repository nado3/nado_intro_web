begin;

-- Victoria: Tuesday 15:00-21:00 in Seoul.
insert into public.availability (
  teacher_id,
  day_of_week,
  start_time,
  end_time,
  location,
  memo
)
select
  '77ad587c-1b7b-4e00-a10d-03bff4675d04'::uuid,
  2,
  '15:00:00'::time,
  '21:00:00'::time,
  '서울',
  '서울 수업 가능 시간 (이동 시간 제외)'
where not exists (
  select 1
  from public.availability
  where teacher_id = '77ad587c-1b7b-4e00-a10d-03bff4675d04'::uuid
    and day_of_week = 2
    and start_time = '15:00:00'::time
    and end_time = '21:00:00'::time
    and location = '서울'
);

-- Abhinay: Saturday 13:00-18:00 in Seoul.
insert into public.availability (
  teacher_id,
  day_of_week,
  start_time,
  end_time,
  location,
  memo
)
select
  '5e899280-edf9-4ae2-a4d5-e20f29b47a16'::uuid,
  6,
  '13:00:00'::time,
  '18:00:00'::time,
  '서울',
  '서울 수업 가능 시간'
where not exists (
  select 1
  from public.availability
  where teacher_id = '5e899280-edf9-4ae2-a4d5-e20f29b47a16'::uuid
    and day_of_week = 6
    and start_time = '13:00:00'::time
    and end_time = '18:00:00'::time
    and location = '서울'
);

-- Add service areas without replacing any existing areas.
with requested_areas (teacher_id, region, area) as (
  values
    ('77ad587c-1b7b-4e00-a10d-03bff4675d04'::uuid, 'Seoul', 'Gangnam'),
    ('77ad587c-1b7b-4e00-a10d-03bff4675d04'::uuid, 'Seoul', 'Hongdae'),
    ('77ad587c-1b7b-4e00-a10d-03bff4675d04'::uuid, 'Seoul', 'Yongsan'),
    ('5e899280-edf9-4ae2-a4d5-e20f29b47a16'::uuid, 'Seoul', 'Gangnam'),
    ('5e899280-edf9-4ae2-a4d5-e20f29b47a16'::uuid, 'Seoul', 'Hongdae')
)
insert into public.teacher_service_areas (teacher_id, region, area, active)
select requested.teacher_id, requested.region, requested.area, true
from requested_areas requested
where not exists (
  select 1
  from public.teacher_service_areas existing
  where existing.teacher_id = requested.teacher_id
    and existing.region = requested.region
    and existing.area = requested.area
);

commit;
