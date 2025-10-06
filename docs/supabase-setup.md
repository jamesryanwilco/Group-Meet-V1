# Supabase Setup Guide

This document outlines all the necessary steps to configure the Supabase backend for the Group Meet app. These steps include creating tables, setting up authentication triggers, and defining Row Level Security (RLS) policies.

## 1. Project Creation & API Keys

1.  Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Project Settings > API**.
3.  Find your **Project URL** and **anon public key**.
4.  Create a `.env` file in the root of the React Native project.
5.  Add your credentials to the `.env` file:

    ```sh
    EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

## 2. Database Table Creation

Navigate to the **Table Editor** in the Supabase dashboard to create the following tables.

### `profiles` Table

This table stores public user data, linked to the `auth.users` table.

-   **Table Name:** `profiles`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name         | Type          | Default Value | Notes                                        |
| :----------- | :------------ | :------------ | :------------------------------------------- |
| `id`         | `uuid`        |               | Primary Key, Foreign Key to `auth.users.id`  |
| `username`   | `text`        |               | Is Unique                                    |
| `updated_at` | `timestamptz` | `now()`       |                                              |
| `avatar_url` | `text`        |               |                                              |
| `active_group_id` | `uuid`   |               | Foreign Key to `groups.id` (optional)        |

**Foreign Key Relation for `id`:**
-   **Source Column:** `id`
-   **Reference Schema:** `auth`
-   **Reference Table:** `users`
-   **Reference Column:** `id`

### `groups` Table

This table stores information about each friend group.

-   **Table Name:** `groups`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name         | Type          | Default Value       | Notes                                   |
| :----------- | :------------ | :------------------ | :-------------------------------------- |
| `id`         | `uuid`        | `gen_random_uuid()` | Primary Key                             |
| `created_at` | `timestamptz` | `now()`             |                                         |
| `name`       | `text`        |                     |                                         |
| `bio`        | `text`        |                     |                                         |
| `photo_url`  | `text`        |                     |                                         |
| `owner_id`   | `uuid`        |                     | Foreign Key to `profiles.id`            |
| `is_active`  | `bool`        | `false`             | Marks if a group is actively seeking a match |
| `active_until`| `timestamptz`|                     | Expiration time for the active status     |

### `group_members` Table

This table creates a many-to-many relationship between users (`profiles`) and `groups`.

-   **Table Name:** `group_members`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name       | Type   | Default Value | Notes                               |
| :--------- | :----- | :------------ | :---------------------------------- |
| `group_id` | `uuid` |               | Primary Key, FK to `groups.id`      |
| `user_id`  | `uuid` |               | Primary Key, FK to `profiles.id`    |
| `role`     | `text` | `'member'`    | e.g., 'owner' or 'member'           |

### `group_invites` Table

This table stores unique, expiring invitation codes for groups.

-   **Table Name:** `group_invites`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name          | Type          | Default Value      | Notes                      |
| :------------ | :------------ | :----------------- | :------------------------- |
| `id`          | `uuid`        | `gen_random_uuid()`| Primary Key                |
| `group_id`    | `uuid`        |                    | FK to `groups.id`          |
| `invite_code` | `text`        | (custom function)  | Unique, generated code     |
| `created_by`  | `uuid`        |                    | FK to `profiles.id`        |
| `created_at`  | `timestamptz` | `now()`            |                            |
| `expires_at`  | `timestamptz` | `now() + 24h`      |                            |

### `group_photos` Table

This table stores references to photos uploaded to Supabase Storage for each group.

-   **Table Name:** `group_photos`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name         | Type          | Default Value       | Notes                      |
| :----------- | :------------ | :------------------ | :------------------------- |
| `id`         | `uuid`        | `gen_random_uuid()` | Primary Key                |
| `group_id`   | `uuid`        |                     | FK to `groups.id`          |
| `photo_url`  | `text`        |                     | Public URL from Storage    |
| `created_at` | `timestamptz` | `now()`             |                            |


### `swipes` Table

This table logs every swipe action between groups.

-   **Table Name:** `swipes`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name              | Type          | Default Value | Notes                                 |
| :---------------- | :------------ | :------------ | :------------------------------------ |
| `id`              | `bigint`      |               | Primary Key (Is Identity)             |
| `created_at`      | `timestamptz` | `now()`       |                                       |
| `swiper_group_id` | `uuid`        |               | Foreign Key to `groups.id`            |
| `swiped_group_id` | `uuid`        |               | Foreign Key to `groups.id`            |
| `liked`           | `bool`        |               | `true` for like, `false` for dislike  |

### `matches` Table

This table creates a record for a successful match between two groups, serving as a chat room identifier.

-   **Table Name:** `matches`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name      | Type      | Default Value       | Notes                      |
| :-------- | :-------- | :------------------ | :------------------------- |
| `id`      | `uuid`    | `gen_random_uuid()` | Primary Key                |
| `group_1` | `uuid`    |                     | Foreign Key to `groups.id` |
| `group_2` | `uuid`    |                     | Foreign Key to `groups.id` |

### `messages` Table

This table stores all individual chat messages for a given match.

-   **Table Name:** `messages`
-   **Enable Row Level Security (RLS):** Yes

**Columns:**

| Name       | Type          | Default Value | Notes                               |
| :--------- | :------------ | :------------ | :---------------------------------- |
| `id`       | `bigint`      |               | Primary Key (Is Identity)           |
| `match_id` | `uuid`        |               | Foreign Key to `matches.id`         |
| `sender_id`| `uuid`        |               | Foreign Key to `profiles.id`        |
| `content`  | `text`        |               | The text of the message             |
| `sent_at`  | `timestamptz` | `now()`       |                                     |


## 3. Auto-Create Profile on Sign-Up

To automatically create a profile for each new user, run the following script in the **SQL Editor**. This creates a function and a trigger that watches the `auth.users` table.

```sql
-- Creates a function that inserts a new row into public.profiles
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Creates a trigger that fires after a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Row Level Security (RLS) Policies

For security, all tables with RLS enabled are locked by default. Run the following scripts in the **SQL Editor** to grant specific permissions to users.

### Policies for `profiles` Table

```sql
-- Allow users to view their own profile.
create policy "Users can view their own profile."
on public.profiles for select
using ( auth.uid() = id );

-- Allow users to update their own profile.
create policy "Users can update their own profile."
on public.profiles for update
using ( auth.uid() = id );

-- (Updated) Final recursion-safe policy for viewing profiles.
drop policy if exists "Users can view profiles of self and fellow group members." on public.profiles;
drop policy if exists "Users can view profiles of fellow group members." on public.profiles;
drop policy if exists "Users can view profiles of self, group members, and matched members." on public.profiles;

create policy "Users can view profiles of self, group members, and matched members."
on public.profiles for select
using (
  id = auth.uid() OR
  is_member_of_group(auth.uid(), (SELECT group_id FROM public.group_members WHERE user_id = profiles.id LIMIT 1)) OR
  do_users_share_a_match(auth.uid(), profiles.id)
);
```

### Policies for `groups` Table

```sql
-- Allow any authenticated user to create a new group.
create policy "Authenticated users can create groups."
on public.groups for insert
with check ( auth.role() = 'authenticated' );

-- Allow any authenticated user to view any group.
create policy "Authenticated users can view all groups."
on public.groups for select
using ( auth.role() = 'authenticated' );

-- Allow the admin of a group to update it.
create policy "Admins can update their own group."
on public.groups for update
using ( auth.uid() = owner_id );

-- Policy for viewing groups was updated for the matching feature.
drop policy if exists "Authenticated users can view all groups." on public.groups;

create policy "Users can view active groups."
on public.groups for select
using ( is_active = true );

-- (New) Allow users to view groups they are a member of.
create policy "Users can view groups they are a member of."
on public.groups for select
using ( is_member_of_group(auth.uid(), id) );
```

### Policies for `swipes` Table

```sql
-- Allow users to insert a swipe for their active group
create policy "Users can insert swipes for their active group."
on public.swipes for insert
with check (
  swiper_group_id = (select active_group_id from public.profiles where id = auth.uid())
);

-- Allow users to view swipes involving their active group
create policy "Users can view swipes involving their active group."
on public.swipes for select
using (
  swiper_group_id = (select active_group_id from public.profiles where id = auth.uid())
  or
  swiped_group_id = (select active_group_id from public.profiles where id = auth.uid())
);

-- (Updated) The previous policies were combined and corrected to allow inserts.
drop policy if exists "Users can insert swipes for their active group." on public.swipes;
drop policy if exists "Users can view swipes involving their active group." on public.swipes;

create policy "Users can insert and view swipes for their active group."
on public.swipes for all
using (
  swiper_group_id = (select active_group_id from public.profiles where id = auth.uid()) or
  swiped_group_id = (select active_group_id from public.profiles where id = auth.uid())
)
with check (
  swiper_group_id = (select active_group_id from public.profiles where id = auth.uid())
);
```

### Policies for `matches` Table

```sql
-- Allow users to view matches they are a part of.
create policy "Users can view matches involving their active group."
on public.matches for select
using (
  (group_1 = (select active_group_id from public.profiles where id = auth.uid()))
  or
  (group_2 = (select active_group_id from public.profiles where id = auth.uid()))
);
```

### Policies for `group_members` and `group_invites`

```sql
-- Allow users to view members of groups they are also in.
create policy "Users can view members of their own group."
on public.group_members for select
using (
  group_id in (select group_id from public.group_members where user_id = auth.uid())
);

-- (Updated) The previous policy was recursive. It has been replaced with a safer version.
drop policy if exists "Users can view members of their own group." on public.group_members;

create policy "Users can view members of groups they belong to."
on public.group_members for select
using ( is_member_of_group(auth.uid(), group_id) );

-- Allow users to leave a group.
create policy "Users can leave a group."
on public.group_members for delete
using ( user_id = auth.uid() );

-- Allow group owners to create invites for their group.
create policy "Group owners can create invites."
on public.group_invites for insert
with check (
  created_by = auth.uid() and
  exists (select 1 from public.groups where id = group_id and owner_id = auth.uid())
);

-- Allow any authenticated user to read valid, non-expired invites.
create policy "Authenticated users can read valid invites."
on public.group_invites for select
using ( auth.role() = 'authenticated' and expires_at > now() );
```

### Policies for `group_photos`

```sql
-- Allow anyone to view group photos.
create policy "Anyone can view group photos."
on public.group_photos for select
using ( true );

-- (Updated) Allow any group member to manage photos.
drop policy if exists "Group owners can insert photos." on public.group_photos;
drop policy if exists "Group owners can delete photos." on public.group_photos;

create policy "Group members can insert photos."
on public.group_photos for insert
with check ( is_member_of_group(auth.uid(), group_id) );

create policy "Group members can delete photos."
on public.group_photos for delete
using ( is_member_of_group(auth.uid(), group_id) );
```

## 5. Secure Database Functions (RPC)

To handle complex operations that might conflict with Row Level Security policies (like creating a group and assigning the creator as an admin simultaneously), we use `security definer` functions.

### Storage Setup (`group-photos`)

1.  **Create a Public Bucket:**
    *   Navigate to the **Storage** section in the Supabase dashboard.
    *   Create a new bucket named `group-photos`.
    *   Ensure the "Public bucket" toggle is **on**.
2.  **Set Up Policies:**
    *   Click on the new bucket's policies and create a new policy from scratch.
    *   Name it "Group members can manage photos".
    *   Check the boxes for `insert`, `update`, and `delete`.
    *   Use the following SQL definition:
    ```sql
    (bucket_id = 'group-photos' AND
      is_member_of_group(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
    ```

### Create a New Group Function

This function creates a new group and automatically adds the creator to the group as the owner. A user can create and belong to multiple groups.

```sql
create function create_new_group(group_name text, group_bio text)
returns uuid as $$
declare
  new_group_id uuid;
begin
  -- Insert the new group and return its ID
  insert into public.groups (name, bio, owner_id)
  values (group_name, group_bio, auth.uid())
  returning id into new_group_id;

  -- Add the creator to the group_members table as the owner
  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'owner');

  return new_group_id;
end;
$$ language plpgsql security definer;
```

### Group Invitation and Membership Functions

```sql
-- Creates a unique, shareable invite code for a group. Can only be called by the group owner.
create function public.create_group_invite()
returns text as $$
-- ... function body
$$ language plpgsql;

-- Allows a user to join a group using a valid, non-expired invite code.
create function public.join_group_with_code(invite_code_to_join text)
returns void as $$
-- ... function body
$$ language plpgsql security definer;

-- Allows a user to leave their current group. If the owner leaves, the group is deleted.
create function public.leave_current_group()
returns void as $$
-- ... function body
$$ language plpgsql;

### Helper and Utility Functions

```sql
-- Securely checks if a user is a member of a given group without causing recursion.
create function is_member_of_group(p_user_id UUID, p_group_id UUID)
returns boolean as $$
  select exists (
    select 1
    from public.group_members
    where user_id = p_user_id and group_id = p_group_id
  );
$$ language sql stable security definer;

-- Sets a user's chosen group to active, and deactivates their other groups.
create function set_active_group(p_group_id UUID)
returns void as $$
-- ... function body
$$ language plpgsql security definer;

-- Securely checks if two users share a match, preventing recursion.
create function do_users_share_a_match(user_a_id UUID, user_b_id UUID)
returns boolean as $$
-- ... function body
$$ language plpgsql security definer;
```


### Create a New Match Function

This function securely creates a new match between two groups. It is used to bypass RLS conflicts that can occur during foreign key checks when inserting a match.

```sql
create function create_new_match(group_1_id uuid, group_2_id uuid)
returns uuid as $$
declare
  new_match_id uuid;
begin
  -- Insert the new match and return its ID
  insert into public.matches (group_1, group_2)
  values (group_1_id, group_2_id)
  returning id into new_match_id;

  return new_match_id;
end;
$$ language plpgsql security definer;
```

### Create a Unique Index for Matches

To prevent duplicate matches between the same two groups, a unique index must be created on the `matches` table. This ensures data integrity at the database level.

```sql
create unique index unique_match_idx on public.matches (least(group_1, group_2), greatest(group_1, group_2));
```

## 6. Database Views

Database views are virtual tables created from a query. They can simplify complex queries and help manage security.

### Match Details View

This view joins the `matches` and `groups` tables to provide the names of both groups involved in a match. This simplifies fetching match data in the app. The view is automatically secured by the RLS policies on the underlying `matches` and `groups` tables.

```sql
create view public.match_details as
select
  m.id as match_id,
  m.group_1,
  m.group_2,
  g1.name as group_1_name,
  g2.name as group_2_name
from
  public.matches m
  join public.groups g1 on m.group_1 = g1.id
  join public.groups g2 on m.group_2 = g2.id;
```

### Policies for `messages` Table

```sql
-- Allow users to send messages in a match they are part of.
create policy "Users can send messages in their matches."
on public.messages for insert
with check (
  match_id in (
    select id from public.matches where
    (group_1 = (select active_group_id from public.profiles where id = auth.uid()))
    or
    (group_2 = (select active_group_id from public.profiles where id = auth.uid()))
  )
);

-- Allow users to view messages from matches they are a part of.
create policy "Users can view messages in their matches."
on public.messages for select
using (
  match_id in (
    select id from public.matches where
    (group_1 = (select active_group_id from public.profiles where id = auth.uid()))
    or
    (group_2 = (select active_group_id from public.profiles where id = auth.uid()))
  )
);
```
