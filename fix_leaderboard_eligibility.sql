begin;

create or replace view public.overall_leaderboard with (security_invoker=false) as
select p.id as user_id,coalesce(nullif(trim(p.display_name),''),'Student') as display_name,
 count(a.id)::integer as quiz_count,round(avg(a.score/a.total_marks*100),2) as average_percentage
from public.profiles p join public.quiz_attempts a on a.user_id=p.id
where p.leaderboard_opt_in=true and a.is_verified=true
  and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
  and (select count(distinct p2.id)>=3
       from public.profiles p2 join public.quiz_attempts a2 on a2.user_id=p2.id
       where p2.leaderboard_opt_in=true and a2.is_verified=true)
group by p.id,p.display_name;

create or replace view public.course_leaderboard with (security_invoker=false) as
select p.id as user_id,coalesce(nullif(trim(p.display_name),''),'Student') as display_name,a.course,
 count(a.id)::integer as quiz_count,round(avg(a.score/a.total_marks*100),2) as average_percentage
from public.profiles p join public.quiz_attempts a on a.user_id=p.id
where p.leaderboard_opt_in=true and a.is_verified=true
  and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
  and (select count(distinct p2.id)>=3
       from public.profiles p2 join public.quiz_attempts a2 on a2.user_id=p2.id
       where p2.leaderboard_opt_in=true and a2.is_verified=true)
group by p.id,p.display_name,a.course;

create or replace view public.weekly_leaderboard with (security_invoker=false) as
select p.id as user_id,coalesce(nullif(trim(p.display_name),''),'Student') as display_name,
 count(a.id)::integer as quiz_count,round(avg(a.score/a.total_marks*100),2) as average_percentage
from public.profiles p join public.quiz_attempts a on a.user_id=p.id
where p.leaderboard_opt_in=true and a.is_verified=true and a.created_at>=now()-interval '7 days'
  and exists(select 1 from public.feature_settings where key='leaderboards' and enabled=true)
  and (select count(distinct p2.id)>=3
       from public.profiles p2 join public.quiz_attempts a2 on a2.user_id=p2.id
       where p2.leaderboard_opt_in=true and a2.is_verified=true and a2.created_at>=now()-interval '7 days')
group by p.id,p.display_name;

grant select on public.overall_leaderboard,public.course_leaderboard,public.weekly_leaderboard to authenticated;

notify pgrst, 'reload schema';

commit;
