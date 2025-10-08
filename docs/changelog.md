# Project Changelog

This document summarizes the major features, improvements, and bug fixes implemented in the project.

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
