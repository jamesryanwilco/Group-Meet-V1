import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetch } from "https://esm.sh/cross-fetch@4.0.0";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const expoPushEndpoint = 'https://api.expo.dev/v2/push/send';

serve(async (req) => {
  const payload = await req.json();
  const { id: message_id, match_id, sender_id, content } = payload.record;

  // 1. Get the sender's username
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', sender_id)
    .single();

  // 2. Get the match details
  const { data: match } = await supabase
    .from('matches')
    .select('group_1, group_2')
    .eq('id', match_id)
    .single();
  
  if (!match) return new Response('Match not found', { status: 404 });

  // 3. Find all users in both groups, excluding the sender
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', [match.group_1, match.group_2])
    .neq('user_id', sender_id);
    
  if (!members || members.length === 0) {
    return new Response('No members to notify', { status: 200 });
  }

  const recipientUserIds = members.map(m => m.user_id);

  // 4. Get the push tokens for those users
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', recipientUserIds);

  if (!tokens || tokens.length === 0) {
    return new Response('No push tokens found for recipients', { status: 200 });
  }

  // 5. Send the notifications
  const pushMessages = tokens.map(t => ({
    to: t.token,
    sound: 'default',
    title: `New message from ${senderProfile?.username || 'Someone'}`,
    body: content,
    data: { matchId: match_id }, // So we can navigate to the chat on tap
  }));

  await fetch(expoPushEndpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pushMessages),
  });

  return new Response('Notifications sent', { status: 200 });
});
