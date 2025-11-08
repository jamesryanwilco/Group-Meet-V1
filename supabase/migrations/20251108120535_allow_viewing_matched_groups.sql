-- Add a new RLS policy to the 'groups' table.
-- This policy allows a user to see the details of a group if they share a match with that group.
CREATE POLICY "Users can view groups they are matched with."
ON public.groups FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE
      -- The group being viewed is group_1, and the user is in group_2
      (m.group_1 = public.groups.id AND m.group_2 IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())) OR
      -- The group being viewed is group_2, and the user is in group_1
      (m.group_2 = public.groups.id AND m.group_1 IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
  )
);
