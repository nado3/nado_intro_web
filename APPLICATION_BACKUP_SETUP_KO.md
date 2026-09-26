# 신청 원본 백업 설정

이번 버전은 `/api/submit`이 요청을 받은 직후, 선생님/정책 검증 및 Jotform 전송보다 먼저 `public.application_submissions`에 신청 원본을 저장합니다.

## 1. Supabase migration 실행

Supabase SQL Editor에서 아래 파일 내용을 실행합니다.

`supabase/migrations/20260926093000_application_submissions.sql`

실행 후 Table Editor에 `application_submissions` 테이블이 생성되어야 합니다.

## 2. Vercel 환경변수

기존에 설정한 아래 값이 필요합니다.

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `JOTFORM_API_KEY`

`SUPABASE_SECRET_KEY`는 브라우저 코드나 GitHub에 넣지 말고 Vercel Secret으로만 보관합니다.

## 3. 동작 방식

- 제출 도착 → `status=received`로 전체 신청값 백업
- 검증/Jotform 성공 → `status=completed`, `status_code=200`
- 검증/Jotform 실패 → `status=failed`, 오류 코드/종류/메시지 저장
- 기술 오류 상세는 기존 `submission_error_logs`에도 별도 기록

`raw_payload`에는 브라우저가 보낸 모든 신청 필드가 배열 형태로 보존됩니다. HTTP 헤더, 쿠키, API 키는 저장하지 않습니다.

## 4. 확인 방법

정상 TEST 신청 후 `application_submissions`에서 최신 행을 확인합니다.

- `status = completed`
- 이름/연락처/플랜/시간/장소/선생님 등이 표시됨
- `raw_payload`에 제출 필드 전체가 존재함

실패 테스트에서는:

- `status = failed`
- `status_code`와 `error_type`이 채워짐
- 같은 `request_id`를 `submission_error_logs`에서 찾아 상세 기술 오류를 확인할 수 있음

## 5. 개인정보

`application_submissions`는 개인정보를 포함하므로 RLS가 켜져 있고 `anon`/`authenticated` 직접 접근 권한을 제거한 서버 전용 테이블입니다. 개인정보처리방침에도 Supabase 백업 저장 목적을 반영했습니다.
