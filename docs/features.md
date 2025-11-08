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
- **Inviting Users:** Group owners can invite other users to their group by searching for their username. This creates a pending invitation that the other user must accept or decline.
- **Invitation Management:** A dedicated "Invites" screen allows users to see all their pending group invitations and respond to them.
- **Leaving a Group:** Any member can choose to leave a group. If the **owner** leaves, the entire group is disbanded and deleted.
- **Group Home Screen:** The main screen after login is a list of all groups the user is a part of ("My Groups"), with a header button to access pending invitations.

## 3. Profiles & Group Details

- **Group Details Screen:** Tapping on a group navigates to its dedicated details screen. The header dynamically displays the group's name, and the page shows:
    - A header gallery with the group's main profile photo (as a rounded square) and a horizontally scrolling list of other group photos.
    - A list of the group's current matches, including a count. Tapping a match navigates to that group's profile.
    - A list of all current members' usernames and avatars, including a count. The group owner is marked with an `(Admin)` tag.
- **Matched Group Profile:** This is a read-only page where users can view the photo gallery and member list of a group they have matched with.
    - **Open Chat:** A button on this page links directly to the chat screen for that match.
    - **Unmatch Group:** Group owners will see an option in the header to unmatch the group, which permanently deletes the match and chat history for both groups.
- **Photo Management:** All photo management (uploading, deleting, and setting the profile picture) is handled on the "Edit Group" screen.
- **"Active" Group Management:** From the details screen, any member can toggle their group's active status, provided the group has at least two members.
    - **Go Active:** Opens a full-screen modal where the user can set an activation duration (1-24 hours) and a meeting location (defaults to London). This makes the group visible to others for swiping.
    - **Go Inactive:** Manually deactivates the group before the timer expires.
- **Group Editing:** Any member of a group can edit the group's details, including the primary profile photo (by selecting from the gallery), name, and bio.
    - **Delete Group:** The group owner can permanently delete the group from the "Edit Group" screen.
- **Default Profile Photo:** The first photo uploaded to a group's gallery is automatically set as its default profile picture.

## 4. User Profile & Settings

- **Settings Hub:** A dedicated "Settings" tab provides access to user-specific actions.
- **Profile Editing:** Users can navigate to an "Edit Profile" screen where they can:
    - Update their public `username`.
    - Upload and change their personal profile picture (`avatar_url`).
- **Sign Out:** Users can sign out of their account from the settings screen.
- **Delete Account:** From the "Edit Profile" screen, users can choose to permanently delete their account. This action is irreversible and will remove all of their user data, groups they own, and associated content from the application.

## 4.5 User Interaction

- **Public Profiles:** Users can view a simple, public profile of another user (avatar and username) by tapping on their avatar within a chat.

## 5. Swiping & Matching

- **Matching Queue:** When a group is active, any member can initiate a swiping session for that group from its details screen.
- **Filtering:** The matching queue automatically filters out:
    - The user's own group.
    - Any groups they have already swiped on in the current session.
- **Swipe Actions:** Users can swipe "Like" or "Pass" on behalf of the group they are currently swiping for.
- **Match Creation:** If two groups "Like" each other, a `match` is created in the database, which automatically opens a shared chat room.

## 6. Messaging

- **Real-time Chat:** The chat screen provides a real-time messaging experience powered by Supabase Realtime subscriptions.
- **Sender Information:** Each message displays the username and avatar of the sender. A user can tap on the sender's avatar to view their public profile.
- **Performance:** The chat history uses pagination ("infinite scroll"), ensuring that chat rooms with long histories load instantly.
- **Optimistic UI:** When a user sends a message, it appears on the screen immediately, providing a fast and responsive user experience.
- **Push Notifications:** Users receive a push notification when a new message is sent in one of their matched chats.
- **Match History:** The "Matches" tab displays a complete history of all matches across all of the user's groups. The UI shows the profile pictures of both groups involved in the match.

## 7. Backend & Security

- **Supabase Backend:** The app is powered by Supabase, which handles the database, authentication, storage, and real-time services.
- **Row Level Security (RLS):** All database tables are protected by comprehensive RLS policies, ensuring users can only access data they are permitted to see. For example:
    - Users can only see the profiles of people they share a group or a match with.
    - Users can only manage photos for groups they are a member of.
- **Secure Functions:** Complex actions (like creating a group, inviting a user, or responding to an invite) are handled by secure PostgreSQL functions (RPCs) on the backend to ensure data integrity and prevent unauthorized actions.

## 8. Push Notifications

- **Opt-In:** Users can choose to enable push notifications from the settings screen.
- **New Messages:** When a user receives a new message in a match, they will get a push notification with the sender's username and the message content.
- **New Matches:** When a user's group matches with another group, all members of both groups will receive a notification.
- **Implementation:** The system is powered by Expo Push Notifications. Client-side token management is handled by a `useNotifications` hook. Backend sending logic is handled by two Supabase Edge Functions (`send-push-notification` and `send-match-notification`) that are triggered by database changes.
