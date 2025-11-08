-- 1. Add the new 'location' column to the groups table
ALTER TABLE public.groups
ADD COLUMN location TEXT;

-- 2. Drop the old function so it can be replaced
DROP FUNCTION IF EXISTS public.activate_group(uuid);

-- 3. Create the new function with parameters for duration and location
CREATE OR REPLACE FUNCTION public.activate_group(p_group_id UUID, p_duration_hours INT, p_location TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the user is a member of the group before activating
  IF is_member_of_group(auth.uid(), p_group_id) THEN
    UPDATE public.groups
    SET
      is_active = true,
      -- Set the active_until timestamp dynamically based on the user's input
      active_until = now() + (p_duration_hours * interval '1 hour'),
      -- Store the selected location
      location = p_location
    WHERE id = p_group_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
