-- Phase 3: 이미지 업로드 + AI 검증 + 워터마크

insert into storage.buckets (id, name, public)
values ('post-images-pending', 'post-images-pending', false),
       ('post-images-final', 'post-images-final', true)
on conflict (id) do nothing;

create policy "pending_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images-pending'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pending_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images-pending'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "final_select_public"
  on storage.objects for select to public
  using (bucket_id = 'post-images-final');

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  original_path text not null,
  final_path text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  ai_generated_score numeric,
  watermark_applied boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.post_images enable row level security;

create policy "post_images_select_approved_or_own"
  on public.post_images for select
  using (
    verification_status = 'approved'
    or exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- insert/update는 서버(service role)에서만 수행하므로 client insert/update 정책을 두지 않는다.
