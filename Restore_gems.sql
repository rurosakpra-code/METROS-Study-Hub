begin;
select set_config('app.economy_authorized', 'true', true);

update public.profiles p
set gems = p.gems + 100
where p.id = (
  select u.id
  from auth.users u
  where lower(u.email) = lower('rurosakpra302009@gmail.com')
)
returning p.gems as new_gem_balance;

commit;