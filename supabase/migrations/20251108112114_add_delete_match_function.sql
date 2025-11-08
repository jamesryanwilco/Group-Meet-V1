-- Function to allow a group owner to delete a match.
CREATE OR REPLACE FUNCTION public.delete_match(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_group_1_id UUID;
  v_group_2_id UUID;
  v_group_1_owner_id UUID;
  v_group_2_owner_id UUID;
BEGIN
  -- Get the IDs of the two groups in the match
  SELECT group_1, group_2 INTO v_group_1_id, v_group_2_id
  FROM public.matches
  WHERE id = p_match_id;

  -- Get the owner IDs for both groups from the groups table
  SELECT owner_id INTO v_group_1_owner_id FROM public.groups WHERE id = v_group_1_id;
  SELECT owner_id INTO v_group_2_owner_id FROM public.groups WHERE id = v_group_2_id;

  -- Security Check:
  -- Ensure the currently authenticated user is the owner of one of the two groups in the match.
  IF auth.uid() = v_group_1_owner_id OR auth.uid() = v_group_2_owner_id THEN
    -- If the check passes, delete the match.
    -- The ON DELETE CASCADE constraint on the messages table will handle deleting the chat history.
    DELETE FROM public.matches WHERE id = p_match_id;
  ELSE
    -- If the user is not an owner of either group, raise an exception.
    RAISE EXCEPTION 'You do not have permission to delete this match.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
