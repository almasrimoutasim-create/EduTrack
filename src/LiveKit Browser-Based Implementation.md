# EduTrack — Virtual Classroom Architecture
## LiveKit Browser-Based Implementation
### Designed for Google Antigravity

---

# PROJECT OVERVIEW

EduTrack currently operates as:

- School Management System (SMS)
- Student Information System (SIS)
- Educational ERP Platform

The goal is to extend EduTrack into:

```txt
Integrated Live Learning Platform
```

without requiring:

- Zoom installation
- External desktop applications
- Mobile app installation

The classroom must operate entirely inside the browser:

- Desktop browsers
- Android browsers
- iPhone Safari

---

# CORE ARCHITECTURE DECISION

## DO NOT BUILD WEBRTC FROM SCRATCH

Instead:

| Layer | Responsibility |
|---|---|
| EduTrack | Educational logic + permissions + classroom management |
| LiveKit | Video/audio realtime infrastructure |

---

# TARGET USER EXPERIENCE

## Teacher Flow

```txt
Teacher Portal
    ↓
Start Live Session
    ↓
Students Receive Notification
    ↓
Students Join From Browser
```

---

## Student Flow

```txt
Student Dashboard
    ↓
Upcoming Live Sessions
    ↓
Join Session
    ↓
Browser Requests Camera/Microphone
    ↓
Student Enters Classroom
```

---

# FINAL SYSTEM ARCHITECTURE

```txt
React Frontend
    ↓
Node.js Backend API
    ↓
PostgreSQL (Neon)
    ↓
LiveKit Cloud
    ↓
WebRTC Media Infrastructure
```

---

# WHY LIVEKIT?

## Reasons

### 1. Browser-Based

No application installation required.

---

### 2. Mobile Support

Works on:

- Chrome Android
- Safari iPhone
- Desktop browsers

---

### 3. Full SDK Control

Unlike Zoom SDK, LiveKit gives full control over:

- UI
- UX
- classroom layout
- educational tools

---

### 4. Scalable

Supports future migration toward:

- Self-hosted media servers
- Large concurrent classrooms
- AI integrations

---

# PHASE 1 — INFRASTRUCTURE SETUP

---

# Create LiveKit Cloud Project

## Create Account

```txt
https://cloud.livekit.io/
```

---

# Environment Variables

```env
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
```

---

# PHASE 2 — BACKEND INTEGRATION

---

# Backend Responsibilities

Backend must:

1. Authenticate user
2. Validate permissions
3. Generate LiveKit token
4. Control classroom permissions
5. Track attendance
6. Store session metadata

---

# Suggested Backend Structure

```txt
server/
 ├── livekit/
 │    ├── token.js
 │    ├── rooms.js
 │    ├── recordings.js
 │    ├── attendance.js
 │    └── webhooks.js
```

---

# Install SDK

```bash
npm install livekit-server-sdk
```

---

# Token Endpoint

## Endpoint

```txt
POST /api/livekit/token
```

---

## Request Example

```json
{
  "roomName": "grade10-math",
  "userId": "123",
  "role": "teacher"
}
```

---

## Response Example

```json
{
  "token": "...",
  "url": "wss://..."
}
```

---

# ROLE-BASED PERMISSIONS

## Teacher Permissions

```txt
CanPublish = true
CanShareScreen = true
CanModerate = true
CanRecord = true
```

---

## Student Permissions

```txt
CanPublish = optional
CanShareScreen = false
CanModerate = false
CanRecord = false
```

---

# PHASE 3 — DATABASE ARCHITECTURE

---

# VirtualSession Entity

| Field | Type |
|---|---|
| id | uuid |
| title | text |
| teacher_id | uuid |
| subject_id | uuid |
| room_name | text |
| scheduled_at | timestamp |
| started_at | timestamp |
| ended_at | timestamp |
| status | enum |

---

# SessionParticipant Entity

| Field | Type |
|---|---|
| session_id | uuid |
| user_id | uuid |
| joined_at | timestamp |
| left_at | timestamp |
| attendance_minutes | integer |
| reconnection_count | integer |

---

# SessionRecording Entity

| Field | Type |
|---|---|
| session_id | uuid |
| recording_url | text |
| duration | integer |
| size | bigint |

---

# LivePoll Entity

Used for:

- quizzes
- instant questions
- participation tracking

---

# PHASE 4 — FRONTEND ARCHITECTURE

---

# Suggested Page Structure

```txt
/src/pages/VirtualClassroom.jsx
```

---

# Suggested Components Structure

```txt
/components/classroom/
```

---

# Components

```txt
classroom/
 ├── ClassroomLayout
 ├── VideoGrid
 ├── ParticipantSidebar
 ├── ClassroomChat
 ├── TeacherToolbar
 ├── StudentToolbar
 ├── WhiteboardPanel
 ├── SessionHeader
 ├── RaiseHandButton
 ├── LivePolls
 ├── ScreenShareView
 └── AttendanceTracker
```

---

# PHASE 5 — LIVEKIT REACT SDK

---

# Install Packages

```bash
npm install \
livekit-client \
@livekit/components-react \
@livekit/components-styles
```

---

# Base Integration

```jsx
<LiveKitRoom
 serverUrl={LIVEKIT_URL}
 token={token}
 connect={true}
 audio={true}
 video={true}
>
   <VideoConference />
</LiveKitRoom>
```

---

# PHASE 6 — REALTIME EDUCATIONAL FEATURES

---

# Required Features

| Feature | Purpose |
|---|---|
| Raise Hand | classroom interaction |
| Live Chat | realtime communication |
| Screen Sharing | lesson presentation |
| Polls | quick assessments |
| Smart Attendance | automatic attendance |
| Teacher Controls | moderation |
| Shared Notes | collaboration |

---

# PHASE 7 — WHITEBOARD SYSTEM

---

# Recommended Tool

```txt
https://www.tldraw.com/
```

---

# Whiteboard Architecture

```txt
LiveKit = media
Socket.IO = realtime state
tldraw = collaborative whiteboard
```

---

# PHASE 8 — SMART ATTENDANCE ENGINE

---

# Attendance Should NOT Depend Only on Join Events

Track:

| Metric | Purpose |
|---|---|
| join time | attendance |
| active duration | engagement |
| microphone activity | participation |
| tab visibility | focus |
| reconnection count | network quality |

---

# Result

```txt
Smart Attendance System
```

---

# PHASE 9 — RECORDING SYSTEM

---

# Initial Strategy

Only teachers can trigger recordings.

---

# IMPORTANT

Do NOT store videos inside PostgreSQL.

Use:

- AWS S3
- Cloudflare R2

---

# PHASE 10 — MOBILE OPTIMIZATION

---

# Real Mobile Challenges

| Problem | Cause |
|---|---|
| overheating | video encoding |
| battery drain | camera + WebRTC |
| unstable quality | weak internet |
| Safari limitations | iOS WebRTC restrictions |

---

# Required Solutions

## Dynamic Video Quality

Automatically reduce quality during weak connections.

---

## Speaker View

Avoid full grid layout on phones.

---

## Audio-Only Fallback

Allow audio-only mode during weak bandwidth.

---

# PHASE 11 — SECURITY

---

# NEVER DO THIS

- Expose LiveKit secrets to frontend
- Use permanent tokens
- Use public classrooms

---

# Required Security

## Short-Lived Tokens

```txt
5–15 minutes
```

---

# Required Webhooks

```txt
participant_joined
participant_left
track_published
```

Used for:

- attendance tracking
- analytics
- monitoring

---

# PHASE 12 — SCALING STRATEGY

---

# INITIAL STAGE

Use:

```txt
LiveKit Cloud
```

Do NOT self-host initially.

---

# Move to Self-Hosted ONLY When

| Metric | Threshold |
|---|---|
| concurrent users | 1000+ |
| recording cost | high |
| latency issues | critical |
| compliance requirements | enterprise-level |

---

# PHASE 13 — FUTURE AI LAYER

---

# Planned AI Features

| Feature | Technology |
|---|---|
| live transcription | Whisper |
| AI summaries | GPT |
| engagement scoring | analytics |
| classroom insights | ML |
| smart alerts | realtime AI |

---

# DEVELOPMENT PRIORITIES

---

# START WITH

1. Stable connection
2. Browser compatibility
3. Attendance system
4. Teacher moderation
5. Low-bandwidth support

---

# DO NOT PRIORITIZE EARLY

- AI features
- fancy animations
- visual effects
- background blur
- advanced avatars

---

# STRATEGIC POSITIONING

EduTrack should NOT become:

```txt
Zoom Clone
```

Instead:

```txt
Educational Operating System
```

where live classrooms are only one module inside a fully integrated educational platform.

---

# FINAL ENGINEERING PRINCIPLE

The difficult problem is NOT video streaming.

The difficult problem is:

```txt
Educational Workflow Integration
```

Meaning:

- attendance connected to grades
- sessions connected to subjects
- recordings connected to students
- quizzes connected to analytics
- live classes connected to school operations

That is the actual competitive advantage of EduTrack.