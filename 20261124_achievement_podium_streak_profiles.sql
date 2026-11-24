alter table public.achievements
  add column if not exists requirement_scope text;
drop policy if exists "Users manage own achievement claims" on public.user_achievements;
drop policy if exists "Users read own achievement claims" on public.user_achievements;
create policy "Users read own achievement claims" on public.user_achievements for select to authenticated
using (user_id=auth.uid());
revoke insert,update,delete on public.user_achievements from public,anon,authenticated;
grant select on public.user_achievements to authenticated;

insert into public.achievements(title,description,icon,gem_reward,requirement_type,requirement_value,requirement_scope,is_default)
select 'Weekly Leaderboard Champion',
       'Reach first place by average score on the rolling seven-day leaderboard.',
       '🏆',100,'weekly_top_scorer',1,null,true
where not exists (
  select 1 from public.achievements where title='Weekly Leaderboard Champion'
);

insert into public.achievements(title,description,icon,gem_reward,requirement_type,requirement_value,requirement_scope,is_default)
select 'Average Scholar',
       'Maintain an average score of at least 80% across your quiz results.',
       '📈',75,'average_threshold',80,null,true
where not exists (
  select 1 from public.achievements where title='Average Scholar'
);

drop view if exists public.member_public_profiles;
create view public.member_public_profiles with (security_invoker=false) as
select id,display_name,avatar_url,level,xp,equipped_items,
       coalesce(school,medical_school) as school,
       coalesce(clinical_interests,specialty_interest) as clinical_interests
from public.profiles
where role='member'
  and exists(
    select 1 from public.profiles viewer
    where viewer.id=auth.uid() and viewer.role in ('member','admin')
  );
grant select on public.member_public_profiles to authenticated;

drop function if exists public.claim_achievement(uuid);
create function public.claim_achievement(p_achievement_id uuid)
returns integer language plpgsql security definer set search_path=public
as $$
declare v_reward integer; v_claimed boolean;
begin
  perform set_config('app.economy_authorized','true',true);
  select a.gem_reward,ua.claimed into v_reward,v_claimed
  from public.user_achievements ua
  join public.achievements a on a.id=ua.achievement_id
  where ua.user_id=auth.uid() and ua.achievement_id=p_achievement_id
  for update of ua;
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
    or (a.requirement_type='courses_completed' and
      (select count(distinct q.course) from public.quiz_attempts q where q.user_id=auth.uid())>=a.requirement_value)
    or (a.requirement_type='streak_days' and
      (select coalesce(streak_count,0) from public.profiles p where p.id=auth.uid())>=a.requirement_value)
    or (a.requirement_type='score_threshold' and
      exists(select 1 from public.quiz_attempts q where q.user_id=auth.uid()
             and q.total_marks>0 and 100.0*q.score/q.total_marks>=a.requirement_value))
    or (a.requirement_type='average_threshold' and
      (select avg(100.0*q.score/q.total_marks) from public.quiz_attempts q
       where q.user_id=auth.uid() and q.total_marks>0)>=a.requirement_value)
    or (a.requirement_type='weekly_top_scorer' and
      exists(
        select 1
        from (
          select q.user_id,
                 rank() over(order by avg(100.0*q.score/q.total_marks) desc) as podium_rank,
                 count(*) over() as competitor_count
          from public.quiz_attempts q
          join public.profiles p on p.id=q.user_id
          where p.leaderboard_opt_in=true and p.role='member'
            and q.is_verified=true and q.total_marks>0
            and q.created_at>=now()-interval '7 days'
          group by q.user_id
        ) weekly_rankings
        where weekly_rankings.user_id=auth.uid()
          and weekly_rankings.podium_rank=1
          and weekly_rankings.competitor_count>=3
          and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
      ))
    or (a.requirement_type='quiz_podium' and a.requirement_scope is not null and
      exists(
        select 1
        from (
          select q.user_id,
                 rank() over(order by max(100.0*q.score/q.total_marks) desc) as podium_rank,
                 count(*) over() as competitor_count
          from public.quiz_attempts q
          join public.profiles p on p.id=q.user_id
          where p.leaderboard_opt_in=true and p.role='member'
            and q.is_verified=true and q.total_marks>0
            and lower(trim(q.quiz_title))=lower(trim(a.requirement_scope))
          group by q.user_id
        ) quiz_rankings
        where quiz_rankings.user_id=auth.uid()
          and quiz_rankings.podium_rank=a.requirement_value
          and quiz_rankings.competitor_count>=3
          and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
      ))
    or (a.requirement_type='course_podium' and a.requirement_scope is not null and
      exists(
        select 1
        from (
          select q.user_id,
                 rank() over(order by avg(100.0*q.score/q.total_marks) desc) as podium_rank,
                 count(*) over() as competitor_count
          from public.quiz_attempts q
          join public.profiles p on p.id=q.user_id
          where p.leaderboard_opt_in=true and p.role='member'
            and q.is_verified=true and q.total_marks>0
            and lower(trim(q.course))=lower(trim(a.requirement_scope))
          group by q.user_id
        ) course_rankings
        where course_rankings.user_id=auth.uid()
          and course_rankings.podium_rank=a.requirement_value
          and course_rankings.competitor_count>=3
          and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
      ))
  on conflict(user_id,achievement_id) do nothing;
  get diagnostics v_unlocked=row_count;
  return jsonb_build_object('unlocked',v_unlocked);
end; $$;
revoke all on function public.sync_unlocked_achievements() from public;
grant execute on function public.sync_unlocked_achievements() to authenticated;
