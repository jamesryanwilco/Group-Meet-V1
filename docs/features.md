# App Feature Breakdown

This document provides a high-level overview of the app's features, broken down by category.

## 1. Authentication

- **Email & Password Sign-Up:** Users can create a new account using an email and password.
- **Username Creation:** On sign-up, users must provide a unique username, which is used to identify them throughout the app.
- **Session Management:** User sessions are securely managed using Supabase Auth. The app maintains a persistent login state.
- **Protected Routes:** The app's navigation is protected, automatically redirecting unauthenticated users to the sign-in screen.

## 2. Groups

- **Multi-Group Membership:** Users can create, join, and be a member of multiple groups simultaneously.
- **Group Creation:** Any user can create a new group by providing a name and a bio. The creator is automatically assigned as the group's **owner**.
- **Group Invitations:** Group owners can generate a unique, short-lived (24h) invitation code to share with friends.
- **Joining a Group:** Users can join an existing group by entering a valid invitation code.
- **Leaving a Group:** Any member can choose to leave a group. If the **owner** leaves, the entire group is disbanded and deleted.
- **Group Home Screen:** The main screen after login is a list of all groups the user is a part of ("My Groups").

## 3. Profiles & Group Details

- **Group Details Screen:** Tapping on a group navigates to its dedicated details screen, which shows:
    - The group's name and bio.
    - A list of all current members' usernames.
    - A gallery of group photos.
- **Photo Management:** Any member of a group can upload new photos or delete existing photos.
    - Photos are stored securely in Supabase Storage.
    - The UI supports picking images from the user's device, compressing them, and uploading.
- **"Active" Group Management:** From the details screen, any member can toggle their group's active status.
    - **Go Active:** Makes the group visible to others for swiping for 4 hours.
    - **Go Inactive:** Manually deactivates the group before the timer expires.
- **Group Editing:** Any member of a group can edit the group's details, including the primary profile photo (by selecting from the gallery), name, and bio.
- **Default Profile Photo:** The first photo uploaded to a group's gallery is automatically set as its default profile picture.

## 4. Swiping & Matching

- **Matching Queue:** When a group is active, any member can initiate a swiping session for that group from its details screen.
- **Filtering:** The matching queue automatically filters out:
    - The user's own group.
    - Any groups they have already swiped on in the current session.
- **Swipe Actions:** Users can swipe "Like" or "Pass" on behalf of the group they are currently swiping for.
- **Match Creation:** If two groups "Like" each other, a `match` is created in the database, which automatically opens a shared chat room.

## 5. Messaging

- **Real-time Chat:** The chat screen provides a real-time messaging experience powered by Supabase Realtime subscriptions.
- **Sender Information:** Each message displays the username of the sender, allowing for clear communication in a group context.
- **Performance:** The chat history uses pagination ("infinite scroll"), ensuring that chat rooms with long histories load instantly.
- **Optimistic UI:** When a user sends a message, it appears on the screen immediately, providing a fast and responsive user experience.
- **Match History:** The "Matches" tab displays a complete history of all matches across all of the user's groups, providing a single entry point to all their conversations.

## 6. Backend & Security

- **Supabase Backend:** The app is powered by Supabase, which handles the database, authentication, storage, and real-time services.
- **Row Level Security (RLS):** All database tables are protected by comprehensive RLS policies, ensuring users can only access data they are permitted to see. For example:
    - Users can only see the profiles of people they share a group or a match with.
    - Users can only manage photos for groups they are a member of.
- **Secure Functions:** Complex actions (like creating a group or setting a group to active) are handled by secure PostgreSQL functions on the backend to ensure data integrity and prevent unauthorized actions.
