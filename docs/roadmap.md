# Phase 2 Roadmap

This document outlines the next set of features to be developed for the Group Meet app, building upon the core multi-group architecture.

## Tier 1: Foundational Improvements (Highest Priority)

These features are essential for a complete and engaging user experience.

### 1. Richer Group Profiles (with Photos)
- **Description:** Allow groups to upload a gallery of photos in addition to their name and bio.
- **Rationale:** Photos are critical for a matching app. They make the swiping experience more engaging and give a better sense of each group's personality.
- **Implementation:**
    - Use Supabase Storage for image uploads.
    - Create a new `group_photos` table to link images to groups.

### 2. Profile & Group Editing
- **Description:** Allow users to edit their personal profile (username, avatar) and for group owners to edit their group's details (name, bio, photos).
- **Rationale:** A fundamental quality-of-life feature that allows users to manage their identity and correct mistakes.
- **Implementation:**
    - Create new UI screens for editing forms.
    - Use standard Supabase `update` queries on the `profiles` and `groups` tables.

## Tier 2: High-Impact Features

These features will significantly boost user engagement and safety once the foundations are solid.

### 1. Push Notifications
- **Description:** Send native push notifications for key events (new matches, new messages, group invites).
- **Rationale:** The most effective way to re-engage users and keep them informed of important, time-sensitive events.
- **Implementation:**
    - Use Expo's Push Notification service.
    - Create Supabase Edge Functions to securely trigger notifications on database events.

### 2. Basic Match Filtering
- **Description:** Allow users to filter the groups they see in the matching queue based on simple criteria, starting with group size.
- **Rationale:** Gives users more control over their experience and increases the relevance of potential matches.
- **Implementation:**
    - Add UI filtering elements to the matching screen.
    - Modify the Supabase query that fetches potential groups to include the filter.

### 3. User Safety Features (Reporting & Blocking)
- **Description:** Allow users to report or block a group they have matched with.
- **Rationale:** Essential for building a trustworthy platform and making users feel secure.
- **Implementation:**
    - Create new `reports` and `blocked_groups` tables in Supabase.
    - Implement RLS policies to enforce blocks.

## Tier 3: Future Enhancements

Powerful features to be considered after the above priorities are addressed.

### 1. Enhanced Chat
- **Description:** Add features like image sharing and read receipts to the in-app chat.
- **Rationale:** Encourages users to stay within the app to coordinate meetups.

### 2. Location-Based Swiping
- **Description:** Allow users to see and match with groups that are physically nearby.
- **Rationale:** Drastically increases the likelihood of a successful real-life meetup. This is a complex feature involving PostGIS in Supabase.
