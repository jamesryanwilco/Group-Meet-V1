import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetch } from 'https://esm.sh/cross-fetch@4.0.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const expoPushEndpoint = 'https://api.expo.dev/v2/push/send';

serve(async (req) => {
  const payload = await req.json();
  const { group_1: group_1_id, group_2: group_2_id } = payload.record;

  // 1. Get the names of both groups
  const { data: groups } = await supabase
    .from('groups')
    .select('name')
    .in('id', [group_1_id, group_2_id]);

  if (!groups || groups.length < 2) {
    return new Response('Groups not found', { status: 404 });
  }

  const group1Name = groups.find((g) => g.id === group_1_id)?.name || 'A group';
  const group2Name = groups.find((g) => g.id === group_2_id)?.name || 'Another group';

  // 2. Find all users in both groups
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', [group_1_id, group_2_id]);

  if (!members || members.length === 0) {
    return new Response('No members to notify', { status: 200 });
  }

  const recipientUserIds = members.map((m) => m.user_id);

  // 3. Get the push tokens for those users
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, user_id')
    .in('user_id', recipientUserIds);

  if (!tokens || tokens.length === 0) {
    return new Response('No push tokens found for recipients', { status: 200 });
  }

  // 4. Send notifications to each group about the other
  const pushMessages = tokens.map((t) => {
    const isMemberOfGroup1 = members.some(m => m.user_id === t.user_id && m.group_id === group_1_id);
    const notificationTitle = 'New Match!';
    const notificationBody = isMemberOfGroup1
      ? `Your group, ${group1Name}, matched with ${group2Name}!`
      : `Your group, ${group2Name}, matched with ${group1Name}!`;

    return {
      to: t.token,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: { matchId: payload.record.id },
    };
  });

  await fetch(expoPushEndpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pushMessages),
  });

  return new Response('Match notifications sent', { status: 200 });
});
