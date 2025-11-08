-- The is_active column is now redundant. The active_until timestamp is the single source of truth.
-- This function now simply sets the active_until timestamp 4 hours into the future.
DROP FUNCTION IF EXISTS public.activate_group(uuid);
CREATE OR REPLACE FUNCTION public.activate_group(p_group_id UUID)
RETURNS VOID AS $$
BEGIN
  IF is_member_of_group(auth.uid(), p_group_id) THEN
    UPDATE public.groups
    SET
      is_active = true, -- Keep this for now for client-side convenience, but it's not the source of truth
      active_until = now() + interval '4 hours'
    WHERE id = p_group_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function now simply nullifies the active_until timestamp.
DROP FUNCTION IF EXISTS public.deactivate_group(uuid);
CREATE OR REPLACE FUNCTION public.deactivate_group(p_group_id UUID)
RETURNS VOID AS $$
BEGIN
  IF is_member_of_group(auth.uid(), p_group_id) THEN
    UPDATE public.groups
    SET
      is_active = false, -- Keep this consistent
      active_until = null
    WHERE id = p_group_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- This function provides the definitive list of groups for the matching screen.
-- It correctly filters out groups that are not active by checking the timestamp.
DROP FUNCTION IF EXISTS public.get_groups_for_swiping(uuid);
CREATE OR REPLACE FUNCTION public.get_groups_for_swiping(p_swiping_group_id UUID)
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  photo_url text,
  owner_id uuid,
  members json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.bio,
    g.photo_url,
    g.owner_id,
    (
      SELECT json_agg(json_build_object('id', p.id, 'username', p.username, 'avatar_url', p.avatar_url))
      FROM public.group_members gm
      JOIN public.profiles p ON gm.user_id = p.id
      WHERE gm.group_id = g.id
    ) AS members
  FROM
    public.groups g
  WHERE
    -- The core logic: group must have a future active_until timestamp
    g.active_until > now()
    -- Exclude the user's own group
    AND g.id <> p_swiping_group_id
    -- Exclude groups the user has already swiped on in this session (last 4 hours)
    AND NOT EXISTS (
      SELECT 1
      FROM public.swipes s
      WHERE s.swiper_group_id = p_swiping_group_id
        AND s.swiped_group_id = g.id
        AND s.created_at > now() - interval '4 hours'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
