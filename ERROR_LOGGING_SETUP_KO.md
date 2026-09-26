# 신청 오류 추적 설정

이번 버전은 신청 실패 시 두 곳에 원인을 남깁니다.

1. **GA4 `form_submit_error` 이벤트 파라미터**
   - `status_code`
   - `error_type`
   - `region`
   - `plan`
   - `matching_type`
   - `teacher_id`
   - `teacher_name`
   - `error_message`
   - `request_id`

2. **Supabase `submission_error_logs` 테이블**
   - 서버에서만 기록합니다.
   - 학생 이름, 전화번호, 이메일, 문의사항 등 개인정보/자유입력 내용은 저장하지 않습니다.

## 1) Supabase 테이블 만들기

Supabase → SQL Editor → New query에서 아래 파일 내용을 실행합니다.

`supabase/migrations/20260926090000_submission_error_logs.sql`

실행 후 Table Editor에 `submission_error_logs`가 생겼는지 확인합니다.

## 2) Vercel에 서버 전용 Secret key 추가

기존 직접선택 검증용 `SUPABASE_PUBLISHABLE_KEY`는 그대로 둡니다.

추가로 Supabase → Settings → API Keys → **Secret keys**의 `sb_secret_...` 값을 복사하여 Vercel에 다음 환경변수를 추가합니다.

- Type: `Secret`
- Key: `SUPABASE_SECRET_KEY`
- Value: `sb_secret_...` 전체 값
- Environment: `Production`

중요: 이 키는 HTML/JavaScript/GitHub에 절대 넣지 않고 Vercel Environment Variable에만 저장합니다.

최종 Vercel 환경변수는 최소 다음 4개입니다.

- `JOTFORM_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

저장 후 Production을 Redeploy합니다.

## 3) 테스트

정상 신청 1건을 제출합니다.

- `/api/submit` 응답: `200`
- Jotform: 신청 저장됨
- `submission_error_logs`: 아무 행도 추가되지 않는 것이 정상

그다음 의도적으로 오류를 만들 필요는 없습니다. 실제 오류가 발생하면 자동으로 기록됩니다.

오류 확인용 SQL:

```sql
select
  created_at,
  status_code,
  error_type,
  region,
  plan,
  matching_type,
  teacher_name,
  error_message,
  request_id
from public.submission_error_logs
order by created_at desc
limit 100;
```

오류 종류별 집계:

```sql
select
  error_type,
  status_code,
  count(*) as error_count
from public.submission_error_logs
where created_at >= now() - interval '7 days'
group by error_type, status_code
order by error_count desc;
```

## 4) GA4에서 파라미터를 보고서에 쓰기

이벤트 자체는 코드 배포 후 자동 전송됩니다. 다만 GA4 Explore/Reports에서 `error_type`, `region`, `plan` 등을 쉽게 필터링하려면 GA4 Admin에서 이벤트 범위 Custom dimension으로 등록하는 것이 좋습니다.

우선 추천 등록 항목:

- `error_type`
- `status_code`
- `region`
- `plan`
- `matching_type`
- `teacher_name`

`request_id`와 `error_message`는 값 종류가 매우 많아질 수 있으므로 일반 Custom dimension으로 등록하지 않고, 개별 오류 추적/디버깅용으로 사용하는 것을 권장합니다.
