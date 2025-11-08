# Changelog

## [Version 1.2.0] - Unreleased

### Added
- **Username-based Invitation System:** Overhauled the group invite system. Users can now be invited directly by their username instead of using expiring invite codes.
  - Implemented a new "Invites" screen for users to view and respond to pending group invitations.
  - Added a user search/autocomplete feature when sending invitations.
  - The "Invites" link has been moved from the tab bar to the header of the "My Groups" screen for a cleaner UI.
- **Push Notifications:** Implemented a full end-to-end push notification system.
  - Users now receive notifications for new chat messages and new group matches.
  - Added a "Manage Notifications" button in the settings screen that links to the device's system settings for the app.
- **Clickable Avatars in Chat:** Users can now tap on another user's avatar within a chat screen to navigate to their public profile page.
- **Public User Profiles:** Created a new screen to display a user's public profile (avatar and username).

### Changed
- **Avatar Uploader UI:** The avatar uploader component on the "Edit Profile" screen now displays the user's current avatar.

### Removed
- **Invite Code System:** The previous system of joining groups via a 6-character, expiring invite code has been completely removed from the UI and codebase.

## [Version 1.1.0]

### Added
- **Multi-Group Functionality:** Users can now create, join, and be a member of multiple groups simultaneously.

### 1. Complete Visual Overhaul ("Midnight Teal" Theme)

*   **New Design System:** Introduced a centralized theme in `lib/theme.ts`, defining a consistent dark mode color palette, typography (using the "Inter" font), spacing, and component styles.
*   **Comprehensive Redesign:** Every screen and component in the application was restyled to create a modern, cohesive, and visually appealing user experience, inspired by popular apps like WhatsApp and Tinder.
    *   **Screens Updated:** Authentication, My Groups, Matches, Chat, Group Details, Settings, and all edit screens.

### 2. Performance & UX Enhancements

*   **Global State for Groups:** Implemented a `GroupsProvider` to fetch and cache the user's group list globally. This eliminated loading delays on the "My Groups" screen, making navigation feel instantaneous.
*   **Pull-to-Refresh:** Added a manual pull-to-refresh feature on the "My Groups" screen, allowing users to fetch updates on demand.
*   **Intelligent Sorting:** The "Matches" screen now automatically sorts conversations, placing the most recently active chats at the top.
*   **User-Friendly Timestamps:** Timestamps on the "Matches" screen are now formatted contextually (e.g., "15:55", "Yesterday", "Monday").

### 3. Feature Development & Testing

*   **Swipe Card Image Gallery:** Implemented a multi-image gallery for the matching screen. Users can now tap through a group's photos before swiping. The UI includes progress indicators at the top of each card.
*   **Placeholder Groups for Testing:** Added five placeholder groups with multiple images to the matching screen. This allows for easy testing of the swiping UI and image gallery without requiring real, active groups.

### 4. Bug Fixes & Configuration

*   **TypeScript Configuration:** Resolved a critical build error by correcting the `tsconfig.json` file. This fixed numerous inline "Cannot use JSX" errors across the application.
*   **Build & Dependency Fixes:** Addressed various build-time issues, including missing Android package names and asset path resolution errors.
