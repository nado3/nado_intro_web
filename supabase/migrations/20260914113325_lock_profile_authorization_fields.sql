-- Prevent authenticated users from promoting their own profile or reactivating
-- a suspended account. Active administrators and server-side service clients
-- retain the ability to manage authorization fields.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and account_status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.role is distinct from old.role
     or new.account_status is distinct from old.account_status then
    if (select auth.uid()) is not null and not public.is_admin() then
      raise exception using
        errcode = '42501',
        message = 'role and account_status may only be changed by an active administrator';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_authorization_fields() from public;
revoke all on function public.protect_profile_authorization_fields() from anon;
revoke all on function public.protect_profile_authorization_fields() from authenticated;
grant execute on function public.protect_profile_authorization_fields() to service_role;

drop trigger if exists profiles_protect_authorization_fields on public.profiles;
create trigger profiles_protect_authorization_fields
before update of role, account_status on public.profiles
for each row
execute function public.protect_profile_authorization_fields();
