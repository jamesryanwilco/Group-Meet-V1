create function public.delete_user_account()
returns void as $$
begin
  -- This will trigger the cascade delete on all related tables.
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
