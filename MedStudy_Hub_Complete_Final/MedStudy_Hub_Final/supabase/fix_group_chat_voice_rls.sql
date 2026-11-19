begin;

drop policy if exists "Users send group chat messages" on public.group_chat_messages;
create policy "Users send group chat messages" on public.group_chat_messages for insert to authenticated
with check (
  user_id=auth.uid() and exists(
    select 1 from public.feature_settings where key='group_chat' and enabled=true
  ) and (
    audio_path is null or
    (storage.foldername(audio_path))[1]=auth.uid()::text
  )
);

commit;
