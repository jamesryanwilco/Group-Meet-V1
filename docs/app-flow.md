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

1.  **Activate Session:** On a group's detail screen, any member can tap "Go Active," provided the group has at least two members. This opens a full-screen modal.
2.  **Set Activation Details:** In the modal, the user can:
    *   Select a duration (from 1 to 24 hours) using a slider.
    *   Choose a location for the meetup (currently defaults to London).
3.  **Confirmation:** After confirming the details, the group becomes "active" for the chosen duration, making it visible to other active groups in the selected location.
4.  **Start Swiping:** Once a group is active, a "Start Swiping" button appears. Tapping this takes the user to the matching screen for that specific group.

## 5. Swiping & Matching

1.  **Swipe Interface:** The user is presented with profile cards of other active groups. All swipes are made on behalf of the group they started the session from.
    *   **Swipe Right:** "Interested"
    *   **Swipe Left:** "Not interested"
2.  **It's a Match!:** When two groups swipe right on each other, a match screen is displayed.

## 6. Chat & Meetup

1.  **View Matches:** From their own group's detail page, a user can see a list of all their matches.
2.  **View Matched Group Profile:** Tapping on a match navigates the user to the matched group's profile page, where they can see that group's photos and member list.
3.  **Unmatch or Chat:** From the matched group's profile, the user can choose to either open the chat or, if they are their group's owner, unmatch the group.
4.  **In-App Chat:** After navigating to the chat, members from both groups can now chat to coordinate a meetup. The chat remains open until a group owner decides to unmatch.
5.  **Session End:** The "active" session for matching ends after the defined time window expires, but all existing matches and chats remain accessible.
