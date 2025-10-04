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
| `group_id`   | `uuid`        |               | Foreign Key to `groups.id` (optional)        |
| `avatar_url` | `text`        |               |                                              |

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
| `admin_id`   | `uuid`        |                     | Foreign Key to `profiles.id` (optional) |
| `is_active`  | `bool`        | `false`             | Marks if a group is actively seeking a match |
| `active_until`| `timestamptz`|                     | Expiration time for the active status     |

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
using ( auth.uid() = admin_id );

-- Policy for viewing groups was updated for the matching feature.
-- This command must be run to replace the old policy.
drop policy if exists "Authenticated users can view all groups." on public.groups;

create policy "Users can view active groups."
on public.groups for select
using ( is_active = true );
```

### Policies for `swipes` Table

```sql
-- Allow users to insert a swipe for their own group
create policy "Users can insert swipes for their own group."
on public.swipes for insert
with check (
  swiper_group_id in (
    select group_id from public.profiles where id = auth.uid()
  )
);

-- Allow users to view swipes involving their own group
create policy "Users can view swipes involving their own group."
on public.swipes for select
using (
  swiper_group_id in (
    select group_id from public.profiles where id = auth.uid()
  )
  or
  swiped_group_id in (
    select group_id from public.profiles where id = auth.uid()
  )
);
```

### Policies for `matches` Table

```sql
-- Allow users to create a match if their group is involved.
create policy "Users can create matches involving their own group."
on public.matches for insert
with check (
  (group_1 in (select group_id from public.profiles where id = auth.uid()))
  or
  (group_2 in (select group_id from public.profiles where id = auth.uid()))
);

-- Allow users to view matches they are a part of.
create policy "Users can view matches they are a part of."
on public.matches for select
using (
  (group_1 in (select group_id from public.profiles where id = auth.uid()))
  or
  (group_2 in (select group_id from public.profiles where id = auth.uid()))
);
```

## 5. Secure Database Functions (RPC)

To handle complex operations that might conflict with Row Level Security policies (like creating a group and assigning the creator as an admin simultaneously), we use `security definer` functions.

### Create a New Group Function

This function creates a new group and automatically updates the creator's profile to link them to the new group.

```sql
create function create_new_group(group_name text, group_bio text)
returns uuid as $$
declare
  new_group_id uuid;
begin
  -- Insert the new group and return its ID
  insert into public.groups (name, bio, admin_id)
  values (group_name, group_bio, auth.uid())
  returning id into new_group_id;

  -- Update the profile of the user who created it
  update public.profiles
  set group_id = new_group_id
  where id = auth.uid();

  return new_group_id;
end;
$$ language plpgsql security definer;

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
    (group_1 in (select group_id from public.profiles where id = auth.uid()))
    or
    (group_2 in (select group_id from public.profiles where id = auth.uid()))
  )
);

-- Allow users to view messages from matches they are a part of.
create policy "Users can view messages in their matches."
on public.messages for select
using (
  match_id in (
    select id from public.matches where
    (group_1 in (select group_id from public.profiles where id = auth.uid()))
    or
    (group_2 in (select group_id from public.profiles where id = auth.uid()))
  )
);
```
