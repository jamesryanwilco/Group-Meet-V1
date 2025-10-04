# Application Flow

This document details the step-by-step user journey for the Group-to-Group Meetup App MVP.

## 1. Onboarding & Sign-Up

1.  **Welcome Screen:** A brief, engaging introduction to the app's value proposition ("Meet new groups. Together.").
2.  **Sign-Up:** User signs up using their phone number or email.
3.  **Phone/Email Verification:** User enters a code sent to their device to verify their account. This is the first step of identity verification.

## 2. User Verification

1.  **Profile Creation (Individual):** User provides their first name and takes a clear selfie.
2.  **Selfie Verification:** The app confirms it's a real face (a simple check for MVP, not a full ID-scan).
    *   *Rationale:* This adds a layer of safety and ensures profiles are genuine.

## 3. Group Creation & Management

1.  **Create or Join a Group:**
    *   **Create:** The user becomes the group's first member and admin. They get a unique invite link/code to share.
    *   **Join:** A user who has an invite link/code can join an existing group.
2.  **Group Profile Setup:** The group admin sets up the profile:
    *   **Group Photo:** A picture of the group together.
    *   **Group Name:** The name of their squad (e.g., "The Adventurers").
    *   **Short Bio:** A fun, brief description of the group's vibe.
    *   **Member List:** Shows the verified members of the group (2-6 people).

## 4. Going Active (Finding a Match)

1.  **Activate Session:** From the home screen, the group admin can "Go Active."
2.  **Set Availability:** The admin defines the meetup parameters for the current session:
    *   **Time Window:** e.g., "Tonight, 7 PM - 11 PM".
    *   **Location Radius:** e.g., "Within 5 miles of our current location".
3.  **Confirmation:** The app confirms the group is now "active" and visible to other active groups that match their criteria. Other group members are notified.

## 5. Swiping & Matching

1.  **Swipe Interface:** The admin is presented with profile cards of other active groups.
    *   **Swipe Right:** "Interested"
    *   **Swipe Left:** "Not interested"
2.  **It's a Match!:** When two groups swipe right on each other, a match screen is displayed.

## 6. Chat & Meetup

1.  **Group Chat Unlocked:** A shared group chat is automatically created for the two matched groups.
2.  **In-App Chat:** Members from both groups can now chat to coordinate a meetup.
3.  **Session End:** The chat remains open, but the "active" session ends after the defined time window expires.
