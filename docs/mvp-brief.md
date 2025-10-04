Project Brief: Group-to-Group Meetup App
Vision

A mobile app that makes it fun and safe for small friend groups (2–6 people) to meet other friend groups nearby for drinks, activities, or shared interests — spontaneous, social, and lower-pressure than solo meetups.

Problem

Existing social apps focus on individuals (dating, friendship) not groups.

People often prefer meeting with their friends, for safety and comfort.

Coordinating across groups is messy (texts, calendars, WhatsApp chaos).

There’s growing demand for new connections (loneliness epidemic, urban churn).

Solution

A simple app where:

Each member verifies identity.

Groups create a profile (photo, names, short bio).

Groups set availability (time window + location radius).

When “active,” groups swipe on other groups until there’s a match.

Shared group chat opens to arrange a meetup.

Tagline: “Meet new groups. Together.”

🎯 Target Audience

Gen Z / young millennials (18–30), urban, socially active.

University students, young professionals, expats.

Early launch focus: West London (dense, diverse, lots of pubs/events).

🔑 Core Features (MVP)
Must-haves (launch-critical)

Group creation (2–6 verified members).

Group profile (photo, names, short bio, interests).

Verification (selfie + phone/email).

Availability toggle (time + location range).

Swipe-to-match mechanic (admin swipes, group chat unlocks after match).

In-app chat (group ↔ group).

Nice-to-have (Phase 2)

Interests tags (drinks, sport, quiz, travel).

Suggested venues/icebreakers.

Feedback thumbs up/down after meetup.

Basic notifications (group active, new match).

🚀 MVP Action Plan
Phase 1: Prep (Weeks 1–2)

Finalize name & brand identity (e.g. Rally, SquadUp, Mixr).

Wireframe 6-step user flow: Sign-up → Verify → Create group → Activate → Swipe → Match/Chat.

Tech stack decision:

Mobile: React Native or Flutter (cross-platform).

Backend: Firebase (auth, real-time chat), Firestore/SQL.

Hosting: AWS/GCP.

Phase 2: Build (Weeks 3–8)

Core flows:

Auth & verification.

Group creation & profile.

Swipe matching engine.

Real-time group chat.

Design: lightweight, clean, swipe-card UI (like Tinder).

Internal alpha testing with 3–5 seeded groups.

Phase 3: Pilot Launch (Weeks 9–12)

Location lock: West London only.

Seed 50–100 groups (students, expats, sports clubs).

Run launch night event: “Meet Another Group” at a partnered pub.

Collect data: matches/day, chat opens, actual meetups, retention.

Phase 4: Iterate (Weeks 13–16)

Add top-requested features (e.g., interest tags, push notifications).

Adjust onboarding friction vs. verification needs.

Optimize match feed to avoid “empty” feeling (batch drops, only show active groups).