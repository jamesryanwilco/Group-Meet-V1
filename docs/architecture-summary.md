# Application Architecture Summary

This document provides a detailed breakdown of how the front-end and back-end systems work together.

### Front-End Architecture (React Native & Expo)

The front end is a React Native application built using the Expo framework, which simplifies development and deployment. The file-based routing system from Expo Router is used to structure navigation.

Here’s a breakdown of the key areas:

**1. Navigation and Layouts (`app/` directory):**

*   **Root Layout (`app/_layout.tsx`):** This is the main entry point for your app's UI. It wraps all other screens and is the ideal place for global providers, like the `SessionProvider`, which manages the user's authentication state.
*   **Authentication Flow (`app/(auth)/`):** This directory group handles the sign-in and sign-up screens. The layout in `app/(auth)/_layout.tsx` likely redirects users to the main app if they are already authenticated, or shows the sign-in/sign-up forms if they are not.
*   **Main App Flow (`app/(tabs)/`):** This is the core of the app for authenticated users. It uses a tab-based navigation system:
    *   `index.tsx`: The home screen, likely displaying the "My Groups" list.
    *   `matches.tsx`: Shows the list of groups the user has matched with.
    *   `settings.tsx`: The user's settings page, for editing their profile and signing out.
*   **Dynamic Routes (e.g., `app/group/[id].tsx`):** The application uses dynamic routes to display content for specific items. For example:
    *   `app/group/[id].tsx`: The group details screen. The `[id]` in the filename is a parameter for the group's unique ID.
    *   `app/chat/[id].tsx`: The chat screen for a specific match.

**2. State Management and Data Fetching:**

*   **Session Management (`providers/SessionProvider.tsx` & `hooks/useSession.tsx`):**
    *   The `SessionProvider` is a React Context provider that wraps the entire app. It checks the user's authentication status with Supabase and makes this information available globally.
    *   The `useSession` hook provides a simple way for any component to access the current session, user data, and loading state without having to manage it manually. This is crucial for protecting routes and personalizing the UI.
*   **Data Fetching:** The app communicates directly with the Supabase API to fetch and update data. This is likely done using the `supabase-js` client library within each screen or in custom hooks. For example, the group details screen (`app/group/[id].tsx`) would fetch the group's information from the `groups` table in Supabase.

**3. UI Components (`app/components/`):**

*   The application uses reusable components for common UI elements like `AvatarUploader.tsx`, `ImageUploader.tsx`, and `ProfileImageUploader.tsx`. This keeps the code organized and consistent. These components likely encapsulate the logic for interacting with Supabase Storage to upload and manage images.

### Back-End Architecture (Supabase)

The back end is built entirely on Supabase, a platform that provides a suite of tools to build and scale applications without managing server infrastructure.

Here’s how the different Supabase services are used:

**1. Database (PostgreSQL):**

*   **Data Storage:** A PostgreSQL database stores all the application's data, such as users, groups, members, matches, and messages.
*   **Row-Level Security (RLS):** As mentioned in your documentation, the database is secured with RLS policies. This is a critical feature that ensures users can only access data they are authorized to see. For example, a policy on the `messages` table would only allow a user to see messages from a chat they are a part of. This security is enforced directly at the database level, preventing accidental data leaks.
*   **Database Functions (RPC):** Complex operations are handled by PostgreSQL functions, which can be called securely from the front end. For example, creating a group might involve several steps (inserting into the `groups` table, adding the creator to the `members` table). A database function ensures these steps are performed atomically (all or nothing), maintaining data integrity.

**2. Authentication (Supabase Auth):**

*   **User Management:** Supabase Auth handles all user authentication, including sign-up, sign-in, and session management. It integrates directly with the database, automatically creating a new user record when someone signs up.
*   **Secure API Access:** When a user logs in, Supabase issues a JSON Web Token (JWT), which is then included with every subsequent API request from the front end. This token securely identifies the user and allows the database to enforce the RLS policies based on their identity.

**3. Real-time (Supabase Realtime):**

*   **Live Chat:** The chat feature is powered by Supabase Realtime. The front end subscribes to a "channel" for each chat room. Whenever a new message is inserted into the `messages` table in the database, Supabase sends that message instantly to all subscribed clients, creating a seamless real-time chat experience without the need for manual polling.

**4. File Storage (Supabase Storage):**

*   **Image Handling:** User avatars and group photos are uploaded and stored securely using Supabase Storage. The storage system is also integrated with the database's RLS policies, so you can create rules to control who can upload, view, or delete files (e.g., only a group member can upload a photo to their group's gallery).

**5. Edge Functions (Supabase Functions):**

*   **Serverless Logic:** The `send-push-notification` function in the `supabase/functions/` directory is an example of a serverless function. These are small, standalone pieces of code that can be triggered by database webhooks or called directly from the app. They are useful for running logic that shouldn't be on the client-side, such as sending notifications, processing payments, or integrating with third-party APIs.

### Summary of the Full-Stack Interaction:

1.  A user **signs up** on the React Native front end.
2.  The app calls **Supabase Auth** to create a new user.
3.  The user **creates a group**. The front end calls a **PostgreSQL function** in the Supabase database, which securely creates the group and adds the user as a member.
4.  When the user wants to **upload a photo**, the front end uses the Supabase client library to upload the image directly to **Supabase Storage**.
5.  When two groups **match**, the app writes to the `matches` table.
6.  This triggers the creation of a chat room, and users can send messages. Each new message is inserted into the `messages` table, and **Supabase Realtime** broadcasts it to the other group members in the chat.

This architecture is powerful because it allows for a secure, scalable, and feature-rich application with a relatively simple and maintainable codebase, as Supabase handles most of the complex back-end infrastructure.
