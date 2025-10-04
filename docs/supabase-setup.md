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
