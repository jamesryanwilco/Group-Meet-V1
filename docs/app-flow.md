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

1.  **My Groups Hub:** After signing in, the user lands on a "My Groups" screen. This is the central hub for all their group activities.
    *   From here, they can see a list of all groups they are a member of.
    *   They can also choose to **Create a New Group** or **Join a Group**.
2.  **Creating a Group:**
    *   The user provides a group name, photo, and bio.
    *   Upon creation, they become the group's **owner** and are automatically added as a member.
3.  **Joining a Group:**
    *   To join, a user must have a unique invite code shared with them by a group's owner.
    *   They enter the code to be added to that group's member list.
4.  **Group Details:**
    *   Tapping on any group from the "My Groups" list takes the user to that group's detail screen.
    *   This screen shows the group's profile (photo, bio) and a list of all its current members.

## 4. Going Active (Finding a Match)

1.  **Select a Group:** From the "My Groups" list, the user chooses which group they want to represent for a potential meetup.
2.  **Activate Session:** On the Group Details screen, any member can "Go Active." This makes their chosen group visible to other active groups for a set period (e.g., 4 hours).
    *   A user can only have **one active group at a time**.
3.  **Set Availability (Future Feature):**
    *   *Note for future development:* This step could be expanded to include setting a time window and location radius for the active session.
4.  **Confirmation:** The app confirms the group is now "active." The user can now proceed to the swiping interface.

## 5. Swiping & Matching

1.  **Swipe Interface:** The user is presented with profile cards of other active groups. All swipes (likes/dislikes) are made on behalf of their currently active group.
    *   **Swipe Right:** "Interested"
    *   **Swipe Left:** "Not interested"
2.  **It's a Match!:** When two groups swipe right on each other, a match screen is displayed.

## 6. Chat & Meetup

1.  **Group Chat Unlocked:** A shared group chat is automatically created for the two matched groups.
2.  **In-App Chat:** Members from both groups can now chat to coordinate a meetup.
3.  **Session End:** The chat remains open, but the "active" session ends after the defined time window expires.
