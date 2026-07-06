-- 온보딩 시 이용약관/개인정보 수집·이용 동의 여부를 기록한다.
-- profiles의 select 컬럼 grant는 0017에서 id/nickname/created_at으로만 제한해뒀으므로
-- 이 컬럼들은 별도 조치 없이도 anon/authenticated에게 비공개로 유지된다.

alter table public.profiles add column terms_agreed_at timestamptz;
alter table public.profiles add column privacy_agreed_at timestamptz;
