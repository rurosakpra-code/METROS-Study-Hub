-- MedStudy Hub Phase 1-3 migration
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists gems integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists xp integer not null default 0,
  add column if not exists gems_enabled boolean not null default true,
  add column if not exists streak_count integer not null default 0,
  add column if not exists last_study_date timestamptz,
  add column if not exists previous_streak_before_loss integer not null default 0,
  add column if not exists unlocked_items jsonb not null default '[]'::jsonb,
  add column if not exists equipped_items jsonb not null default '{}'::jsonb,
  add column if not exists banner_blur integer not null default 4,
  add column if not exists role text not null default 'member',
  add column if not exists is_guest boolean not null default false,
  add column if not exists avatar_url text,
  add column if not exists school text,
  add column if not exists clinical_interests text;

do $$ begin
  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin','member','guest'));
exception when duplicate_object then null; end $$;
update public.profiles set is_guest=(role='guest'), gems_enabled=false where role='guest';

alter table public.quizzes
  add column if not exists required_level integer not null default 1,
  add column if not exists gem_cost integer not null default 0,
  add column if not exists prerequisite_quiz_id bigint;

alter table public.quiz_attempts
  add column if not exists question_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists summary_unlocked boolean not null default false;
update public.quiz_attempts
set question_breakdown=answer_summary
where question_breakdown='[]'::jsonb and answer_summary<>'[]'::jsonb;

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon text not null default '🏅',
  gem_reward integer not null default 0 check (gem_reward>=0),
  requirement_type text not null,
  requirement_value integer not null default 0,
  is_default boolean not null default false
);

insert into public.achievements(title,description,icon,gem_reward,requirement_type,requirement_value,is_default)
select * from (values
 ('First Steps','Record your first quiz result','🎯',25,'quizzes_completed',1,true),
 ('Quiz Streak','Complete 5 quiz attempts','🔥',50,'quizzes_completed',5,true),
 ('Score Star','Earn 80% or higher','⭐',75,'score_threshold',80,true),
 ('Consistent Learner','Study for 7 consecutive days','📅',100,'streak_days',7,true),
 ('Course Explorer','Complete quizzes in 5 courses','🧭',125,'courses_completed',5,true),
 ('Clinical Scholar','Complete 25 verified quiz attempts','🩺',250,'quizzes_completed',25,true)
) v(title,description,icon,gem_reward,requirement_type,requirement_value,is_default)
where not exists (select 1 from public.achievements a where a.title=v.title);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  claimed boolean not null default false,
  unique(user_id,achievement_id)
);

create table if not exists public.user_unlocked_quizzes (
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id bigint not null references public.quizzes(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key(user_id,quiz_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists public.study_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  day_of_week smallint not null check(day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  color text not null default '#087f8c',
  notification_enabled boolean not null default true,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  hint text,
  image_url text,
  ease integer not null default 250,
  interval_days integer not null default 0,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into storage.buckets(id,name,public) values('app-assets','app-assets',true)
on conflict(id) do update set public=excluded.public;

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_unlocked_quizzes enable row level security;
alter table public.app_settings enable row level security;
alter table public.study_schedules enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

drop policy if exists "Members read achievements" on public.achievements;
create policy "Members read achievements" on public.achievements for select to authenticated
using (public.current_profile_role() in ('member','admin'));
drop policy if exists "Admins manage achievements" on public.achievements;
create policy "Admins manage achievements" on public.achievements for all to authenticated
using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists "Users manage own achievement claims" on public.user_achievements;
create policy "Users manage own achievement claims" on public.user_achievements for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "Users manage own quiz unlocks" on public.user_unlocked_quizzes;
create policy "Users manage own quiz unlocks" on public.user_unlocked_quizzes for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "Everyone reads app settings" on public.app_settings;
create policy "Everyone reads app settings" on public.app_settings for select to authenticated using (true);
drop policy if exists "Admins manage app settings" on public.app_settings;
create policy "Admins manage app settings" on public.app_settings for all to authenticated
using (public.is_current_user_admin()) with check (public.is_current_user_admin());

drop policy if exists "Users manage own schedules" on public.study_schedules;
create policy "Users manage own schedules" on public.study_schedules for all to authenticated
using (user_id=auth.uid() and public.current_profile_role() in ('member','admin'))
with check (user_id=auth.uid() and public.current_profile_role() in ('member','admin'));

drop policy if exists "Users manage own decks" on public.flashcard_decks;
create policy "Users manage own decks" on public.flashcard_decks for all to authenticated
using (user_id=auth.uid() and public.current_profile_role() in ('member','admin'))
with check (user_id=auth.uid() and public.current_profile_role() in ('member','admin'));

drop policy if exists "Users manage own cards" on public.flashcards;
create policy "Users manage own cards" on public.flashcards for all to authenticated
using (exists(select 1 from public.flashcard_decks d where d.id=deck_id and d.user_id=auth.uid())
       and public.current_profile_role() in ('member','admin'))
with check (exists(select 1 from public.flashcard_decks d where d.id=deck_id and d.user_id=auth.uid())
       and public.current_profile_role() in ('member','admin'));

drop policy if exists "Public app assets read" on storage.objects;
create policy "Public app assets read" on storage.objects for select to public
using (bucket_id='app-assets');
drop policy if exists "Admins upload app assets" on storage.objects;
create policy "Admins upload app assets" on storage.objects for insert to authenticated
with check (bucket_id='app-assets' and public.is_current_user_admin());
drop policy if exists "Admins update app assets" on storage.objects;
create policy "Admins update app assets" on storage.objects for update to authenticated
using (bucket_id='app-assets' and public.is_current_user_admin())
with check (bucket_id='app-assets' and public.is_current_user_admin());
drop policy if exists "Admins delete app assets" on storage.objects;
create policy "Admins delete app assets" on storage.objects for delete to authenticated
using (bucket_id='app-assets' and public.is_current_user_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-photos','profile-photos',true,524288,array['image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Users read own profile photos" on storage.objects;
create policy "Users read own profile photos" on storage.objects for select to authenticated
using (bucket_id='profile-photos' and (
  (storage.foldername(name))[1]=auth.uid()::text
  or public.current_profile_role() in ('member','admin')
));
drop policy if exists "Users upload own profile photos" on storage.objects;
create policy "Users upload own profile photos" on storage.objects for insert to authenticated
with check (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users update own profile photos" on storage.objects;
create policy "Users update own profile photos" on storage.objects for update to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users remove own profile photos" on storage.objects;
create policy "Users remove own profile photos" on storage.objects for delete to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.spend_gems(p_amount integer)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_balance integer;
begin
  if p_amount is null or p_amount<=0 then raise exception 'Gem amount must be positive'; end if;
  perform set_config('app.economy_authorized','true',true);
  select gems into v_balance from public.profiles where id=auth.uid() for update;
  if not found then raise exception 'Profile not found'; end if;
  if (select gems_enabled from public.profiles where id=auth.uid()) is false then raise exception 'Gems are disabled for this account'; end if;
  if v_balance<p_amount then raise exception 'Insufficient gems'; end if;
  update public.profiles set gems=gems-p_amount where id=auth.uid() returning gems into v_balance;
  return v_balance;
end; $$;
revoke all on function public.spend_gems(integer) from public;
grant execute on function public.spend_gems(integer) to authenticated;

create or replace function public.buy_shop_item(p_item_id text,p_price integer)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_balance integer; v_unlocked jsonb;
begin
  if p_item_id is null or btrim(p_item_id)='' then raise exception 'Item required'; end if;
  if p_price is null or p_price<=0 then raise exception 'Invalid item price'; end if;
  perform set_config('app.economy_authorized','true',true);
  select gems,unlocked_items into v_balance,v_unlocked
  from public.profiles where id=auth.uid() for update;
  if not found then raise exception 'Profile not found'; end if;
  if (select gems_enabled from public.profiles where id=auth.uid()) is false then raise exception 'Gems are disabled'; end if;
  if v_unlocked @> to_jsonb(ARRAY[p_item_id]) then return v_balance; end if;
  if v_balance<p_price then raise exception 'Insufficient gems'; end if;
  update public.profiles
  set gems=gems-p_price,
      unlocked_items=v_unlocked || jsonb_build_array(p_item_id)
  where id=auth.uid() returning gems into v_balance;
  return v_balance;
end; $$;
revoke all on function public.buy_shop_item(text,integer) from public;
grant execute on function public.buy_shop_item(text,integer) to authenticated;

drop function if exists public.claim_achievement(uuid);
create function public.claim_achievement(p_achievement_id uuid)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_reward integer; v_claimed boolean;
begin
  perform set_config('app.economy_authorized','true',true);
  select a.gem_reward,ua.claimed into v_reward,v_claimed
  from public.user_achievements ua join public.achievements a on a.id=ua.achievement_id
  where ua.user_id=auth.uid() and ua.achievement_id=p_achievement_id;
  if not found then raise exception 'Achievement is not unlocked'; end if;
  if v_claimed then raise exception 'Achievement already claimed'; end if;
  update public.user_achievements set claimed=true
  where user_id=auth.uid() and achievement_id=p_achievement_id;
  update public.profiles set gems=gems+v_reward where id=auth.uid();
  return v_reward;
end; $$;
revoke all on function public.claim_achievement(uuid) from public;
grant execute on function public.claim_achievement(uuid) to authenticated;

create or replace function public.sync_unlocked_achievements()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_unlocked integer:=0;
begin
  if auth.uid() is null then raise exception 'Sign-in required'; end if;
  insert into public.user_achievements(user_id,achievement_id)
  select auth.uid(),a.id
  from public.achievements a
  where
    (a.requirement_type='quizzes_completed' and
      (select count(*) from public.quiz_attempts q where q.user_id=auth.uid())>=a.requirement_value)
    or (a.requirement_type='streak_days' and
      (select coalesce(streak_count,0) from public.profiles p where p.id=auth.uid())>=a.requirement_value)
    or (a.requirement_type='score_threshold' and
      exists(select 1 from public.quiz_attempts q where q.user_id=auth.uid()
             and q.total_marks>0 and 100*q.score/q.total_marks>=a.requirement_value))
  on conflict(user_id,achievement_id) do nothing;
  get diagnostics v_unlocked=row_count;
  return jsonb_build_object('unlocked',v_unlocked);
end; $$;
revoke all on function public.sync_unlocked_achievements() from public;
grant execute on function public.sync_unlocked_achievements() to authenticated;

create or replace function public.restore_streak(p_cost integer default 50)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_streak integer;
begin
  perform set_config('app.economy_authorized','true',true);
  select previous_streak_before_loss into v_streak from public.profiles where id=auth.uid() for update;
  if v_streak is null or v_streak<=0 then raise exception 'No streak available to restore'; end if;
  perform public.spend_gems(p_cost);
  update public.profiles set streak_count=v_streak,last_study_date=now(),previous_streak_before_loss=0
  where id=auth.uid();
  return v_streak;
end; $$;
revoke all on function public.restore_streak(integer) from public;
grant execute on function public.restore_streak(integer) to authenticated;

create or replace function public.set_user_access(p_user_id uuid,p_role text default null,p_gems_enabled boolean default null)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_role is not null and p_role not in ('admin','member','guest') then raise exception 'Invalid role'; end if;
  update public.profiles
  set role=coalesce(p_role,role),
      is_guest=(coalesce(p_role,role)='guest'),
      gems_enabled=case when coalesce(p_role,role)='guest' then false else coalesce(p_gems_enabled,gems_enabled) end
  where id=p_user_id;
end; $$;
revoke all on function public.set_user_access(uuid,text,boolean) from public;
grant execute on function public.set_user_access(uuid,text,boolean) to authenticated;

create or replace function public.guest_quiz_verification()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if exists(select 1 from public.profiles p where p.id=new.user_id and p.role='guest') then
    new.is_verified=false;
  end if;
  return new;
end; $$;
drop trigger if exists guest_quiz_verification_trigger on public.quiz_attempts;
create trigger guest_quiz_verification_trigger
before insert on public.quiz_attempts for each row execute function public.guest_quiz_verification();

create or replace function public.sync_profile_streak()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  update public.profiles
  set streak_count=new.current_streak,
      previous_streak_before_loss=case
        when new.current_streak=1 and coalesce(old.current_streak,0)>1
        then old.current_streak else previous_streak_before_loss end,
      last_study_date=timezone('UTC',new.last_active_date::timestamp)
  where id=new.user_id;
  return new;
end; $$;
drop trigger if exists sync_profile_streak_trigger on public.user_study_streaks;
create trigger sync_profile_streak_trigger
after insert or update on public.user_study_streaks
for each row execute function public.sync_profile_streak();

create or replace view public.member_public_profiles as
select id,display_name,avatar_url,level,xp,equipped_items,
       coalesce(school,medical_school) as school,
       coalesce(clinical_interests,specialty_interest) as clinical_interests,
       class_name,favorite_subject
from public.profiles
where role='member'
  and exists(select 1 from public.profiles viewer
             where viewer.id=auth.uid() and viewer.role in ('member','admin'));
grant select on public.member_public_profiles to authenticated;

create or replace view public.recent_group_activity with (security_invoker=false) as
select coalesce(nullif(trim(p.display_name),''),'Student') as display_name,a.course,a.quiz_title,
       round(a.score/a.total_marks*100,2) as percentage,a.created_at,a.user_id
from public.quiz_attempts a join public.profiles p on p.id=a.user_id
where p.leaderboard_opt_in=true and p.role='member' and a.is_verified=true
  and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true);
grant select on public.recent_group_activity to authenticated;

create or replace function public.protect_profile_economy_columns()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_current_user_admin() then
    if coalesce(current_setting('app.economy_authorized',true),'') <> 'true'
       and (new.gems is distinct from old.gems
       or new.level is distinct from old.level
       or new.xp is distinct from old.xp
       or new.role is distinct from old.role
       or new.is_guest is distinct from old.is_guest
       or new.gems_enabled is distinct from old.gems_enabled) then
      raise exception 'Protected profile economy fields require an authorized RPC';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists protect_profile_economy_trigger on public.profiles;
create trigger protect_profile_economy_trigger
before update on public.profiles for each row execute function public.protect_profile_economy_columns();

drop policy if exists "Users read unexpired group chat" on public.group_chat_messages;
create policy "Users read unexpired group chat" on public.group_chat_messages for select to authenticated
using (expires_at>now() and public.current_profile_role() in ('member','admin'));
drop policy if exists "Users send group chat messages" on public.group_chat_messages;
create policy "Users send group chat messages" on public.group_chat_messages for insert to authenticated
with check (user_id=auth.uid() and public.current_profile_role() in ('member','admin'));

drop policy if exists "Users read active group chat presence" on public.group_chat_presence;
create policy "Users read active group chat presence" on public.group_chat_presence for select to authenticated
using (last_seen_at>now()-interval '2 minutes' and public.current_profile_role() in ('member','admin'));

-- Guest isolation: replace public profile and quiz policies as appropriate.
drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated
using (id=auth.uid()
 or public.is_current_user_admin()
 or (public.current_profile_role() in ('member','admin') and role='member'));

drop policy if exists "read own attempts" on public.quiz_attempts;
create policy "read own attempts" on public.quiz_attempts for select to authenticated
using (user_id=auth.uid());

drop policy if exists "read published resources" on public.resources;
create policy "read published resources" on public.resources for select to authenticated
using (is_published=true and public.current_profile_role() in ('member','admin')
 and exists(select 1 from public.feature_settings where key='resources' and enabled=true));

drop policy if exists "Users insert own manual attempts" on public.quiz_attempts;
create policy "Users insert own manual attempts" on public.quiz_attempts for insert to authenticated
with check (
  user_id=auth.uid()
  and is_verified=false
  and source='manual'
  and public.current_profile_role() in ('member','admin','guest')
);

-- Weekly #1 gem reward example. Verify job scheduling in Supabase before enabling.
-- select cron.schedule('medstudy-weekly-gems-leaderboard','0 0 * * 0',
-- $$ update public.profiles p set gems=gems+100 where p.id=(select user_id from public.overall_leaderboard order by average_percentage desc limit 1) $$);
