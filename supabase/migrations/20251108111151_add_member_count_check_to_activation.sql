-- Overwrite the existing function to add the member count check.
DROP FUNCTION IF EXISTS public.activate_group(UUID, INT, TEXT);

CREATE OR REPLACE FUNCTION public.activate_group(p_group_id UUID, p_duration_hours INT, p_location TEXT)
RETURNS VOID AS $$
DECLARE
  member_count INT;
BEGIN
  -- First, check if the user calling the function is a member of the group.
  -- This is a security check.
  IF NOT is_member_of_group(auth.uid(), p_group_id) THEN
    RAISE EXCEPTION 'You must be a member of this group to activate it.';
  END IF;

  -- Next, count the number of members in the group.
  SELECT count(*) INTO member_count FROM public.group_members WHERE group_id = p_group_id;

  -- Check if the group has at least 2 members before allowing activation.
  IF member_count < 2 THEN
    RAISE EXCEPTION 'Groups must have at least 2 members to go active.';
  END IF;

  -- If all checks pass, proceed with activating the group.
  UPDATE public.groups
  SET
    is_active = true,
    active_until = now() + (p_duration_hours * interval '1 hour'),
    location = p_location
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
