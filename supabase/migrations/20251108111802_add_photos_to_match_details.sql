-- Re-create the view to include the photo_url for both groups
CREATE OR REPLACE VIEW public.match_details AS
SELECT
  m.id AS match_id,
  m.group_1,
  m.group_2,
  g1.name AS group_1_name,
  g2.name AS group_2_name,
  g1.photo_url AS group_1_photo,
  g2.photo_url AS group_2_photo
FROM
  public.matches m
  JOIN public.groups g1 ON m.group_1 = g1.id
  JOIN public.groups g2 ON m.group_2 = g2.id;
