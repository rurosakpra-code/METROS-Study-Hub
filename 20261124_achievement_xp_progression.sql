alter table public.user_achievements
  add column if not exists xp_credited boolean not null default false;

do $$
begin
  perform set_config('app.economy_authorized','true',true);

  with claimed_xp as (
    select p.id,
           coalesce(sum(a.gem_reward) filter(where ua.claimed and not ua.xp_credited),0)::integer as amount
    from public.profiles p
    left join public.user_achievements ua on ua.user_id=p.id
    left join public.achievements a on a.id=ua.achievement_id
    group by p.id
  )
  update public.profiles p
  set xp=greatest(0,coalesce(p.xp,0))+claimed_xp.amount,
      level=1+floor((greatest(0,coalesce(p.xp,0))+claimed_xp.amount)::numeric/100)::integer
  from claimed_xp
  where p.id=claimed_xp.id;

  update public.user_achievements
  set xp_credited=true
  where claimed=true and xp_credited=false;
end; $$;

drop function if exists public.claim_achievement(uuid);
create function public.claim_achievement(p_achievement_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  v_reward integer;
  v_claimed boolean;
  v_gems integer;
  v_xp integer;
  v_level integer;
begin
  if not exists(
    select 1 from public.profiles
    where id=auth.uid() and role in ('member','admin') and gems_enabled=true
  ) then raise exception 'Gem rewards are disabled for this account'; end if;

  perform set_config('app.economy_authorized','true',true);
  select a.gem_reward,ua.claimed into v_reward,v_claimed
  from public.user_achievements ua
  join public.achievements a on a.id=ua.achievement_id
  where ua.user_id=auth.uid() and ua.achievement_id=p_achievement_id
  for update of ua;
  if not found then raise exception 'Achievement is not unlocked'; end if;
  if v_claimed then raise exception 'Achievement already claimed'; end if;

  update public.user_achievements
  set claimed=true,xp_credited=true
  where user_id=auth.uid() and achievement_id=p_achievement_id;

  update public.profiles
  set gems=gems+v_reward,
      xp=greatest(0,coalesce(xp,0))+v_reward,
      level=1+floor((greatest(0,coalesce(xp,0))+v_reward)::numeric/100)::integer
  where id=auth.uid()
  returning gems,xp,level into v_gems,v_xp,v_level;

  return jsonb_build_object(
    'gems',v_gems,
    'xp',v_xp,
    'level',v_level,
    'gems_awarded',v_reward,
    'xp_awarded',v_reward
  );
end; $$;
revoke all on function public.claim_achievement(uuid) from public;
grant execute on function public.claim_achievement(uuid) to authenticated;
