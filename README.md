# ConnectSphere — AI-Powered Community Connect

[![Hackathon Track: Open Innovation](https://img.shields.io/badge/Hackathon%20Track-Open%20Innovation-6366f1?style=for-the-badge)](https://connectsphere.dev)
[![Nexconn Chat SDK](https://img.shields.io/badge/Real--Time-Nexconn%20Chat%20SDK%20Web-3b82f6?style=for-the-badge)](https://docs.nexconn.ai/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%206%20%7C%20Tailwind%20CSS-06b6d4?style=for-the-badge)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB-10b981?style=for-the-badge)](https://nodejs.org)
[![AI Copilot](https://img.shields.io/badge/AI-Google%20Gemini%20API-8b5cf6?style=for-the-badge)](https://ai.google.dev)

> **ConnectSphere** is an intelligent, real-time community communication platform where people discover interest-based communities, communicate in real time, participate in live topic discussion rooms, share ideas, and collaborate seamlessly with AI assistance.
> 
> Engineered for the **Open Innovation Hackathon**, ConnectSphere is powered directly by the **Nexconn Chat SDK Web** (`@nexconn/chat`) and features an **AI Community Assistant (SphereAI)** for automated conversation summarization, topic brainstorming, Q&A, and smart content moderation.

---

## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Key Capabilities & Features](#2-key-capabilities--features)
3. [Nexconn Chat SDK Integration Architecture](#3-nexconn-chat-sdk-integration-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design & MongoDB Models](#5-database-design--mongodb-models)
6. [Security Architecture](#6-security-architecture)
7. [Getting Started & Installation](#7-getting-started--installation)
8. [Environment Variables Guide](#8-environment-variables-guide)
9. [Feature Testing & Verification Report](#9-feature-testing--verification-report)
10. [Known Limitations](#10-known-limitations)
11. [Hackathon Presentation Outline](#11-hackathon-presentation-outline)
12. [Live Demonstration Script for Judges](#12-live-demonstration-script-for-judges)

---

## 1. Executive Summary & Vision

ConnectSphere was built to solve the modern fragmentation in online communities. Traditional forums lack real-time conversational energy, while conventional chat platforms suffer from information overload, noise, and lack of synthesis.

ConnectSphere bridges this gap by combining:
1. **Low-latency real-time messaging** via the **Nexconn Chat SDK**.
2. **SphereAI Community Copilot** that synthesizes long threads into bulleted executive summaries, answers domain questions, and recommends relevant communities.
3. **Live Discussion Rooms** powered by **Nexconn Open Channels** for interactive topic debates.
4. **Smart Moderation Engine** with automated toxicity and spam detection to safeguard communities.
5. **A Premium SaaS-Grade UI/UX** designed with deep navy and charcoal backdrops, electric blue and violet accents, subtle glassmorphism, and responsive layouts.

---

## 2. Key Capabilities & Features

### A. Authentication & Profiles
* Secure User Registration and Login with JWT authentication & password hashing via `bcryptjs`.
* User profile management: Display name, Avatar, Bio, and Interest tags.
* Automatic Nexconn access token issuance upon user registration and login.
* One-click demo test accounts for hackathon judges (`Alex (Admin)`, `Sarah (AI Lead)`, `Marcus (Founder)`).

### B. Community Discovery
* Explore communities across 7 distinct categories:
  * 💻 **Technology**
  * 🚀 **Startups**
  * 🎮 **Gaming**
  * 📚 **Education**
  * 🎬 **Entertainment**
  * ⚡ **Sports**
  * 🌐 **General discussions**
* Search by keyword, description, or tags with live category pill filters.
* One-click Join and Leave community functionality with real-time membership counts.
* Community creation modal that auto-provisions a **Nexconn Group Channel** and a default **Live Discussion Room**.

### C. Real-Time Messaging (Nexconn Chat SDK Web)
* **One-to-One Messaging**: Instant private chats using `DirectChannel`.
* **Group Conversations**: Community-wide discussions using `GroupChannel`.
* **Live Message Delivery**: Subscribed via `NCEngine.addMessageHandler` for instant UI updates.
* **Timestamps & Delivery Status**: Track sent, delivered, and read status.
* **Unread Indicators & Conversation List**: Seamlessly toggle between direct and group threads.
* **File & Media Sharing**: Upload attachments with progress callbacks via `Helper.createSendFileMessageParams`.

### D. Live Discussion Rooms (Nexconn Open Channels)
* Topic-specific interactive rooms using `OpenChannel` (`enterChannel`, `sendMessage`, `exitChannel`).
* Displays active live participants with visual pulse indicators.
* Dedicated topic agendas and tags.
* Topic creation modal with integrated **SphereAI brainstorm assistant** for viral discussion prompts.

### E. AI Community Assistant (SphereAI)
* **Conversation Summarizer**: Condenses up to 25 channel messages into a concise executive summary with key takeaways and tone classification.
* **Community Q&A**: Answers questions based on community context and provides suggested follow-ups.
* **Topic Generator**: Brainstorms high-engagement prompts tailored to community categories.
* **Personalized Recommendations**: Analyzes user profile interests and ranks communities by match percentage.
* **Flexible Dual Engine**: Works seamlessly with Google's **Gemini 1.5 Flash API** when an API key is provided, and gracefully falls back to an intelligent built-in heuristic NLP engine for zero-friction offline demos.

### F. Smart Moderation & Safety
* **Spam & Abuse Detection**: Real-time message scanning with toxicity scoring (0.00 to 1.00) and category tagging (`spam`, `harassment`, `toxic`).
* **Message Reporting**: Any user can report a message directly from the chat interface.
* **Admin Moderation Dashboard**:
  * Real-time metrics on users, communities, rooms, and reports.
  * Filterable queue of flagged messages (`pending`, `action_taken`, `dismissed`).
  * Instant action controls to review or dismiss reported messages.

### G. Notification Center
* Bell icon with unread count badge and animated dropdown.
* Dispatches notifications for new direct messages, community joins, and live room discussions.
* "Mark as Read", "Mark All as Read", and "Clear All" controls.

---

## 3. Nexconn Chat SDK Integration Architecture

ConnectSphere adheres strictly to the official Nexconn documentation (`https://docs.nexconn.ai/`) and never exposes secret keys on the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                      │
│                                                             │
│   • React 19 + TypeScript + Vite 6                          │
│   • @nexconn/chat & @nexconn/engine Web SDK                 │
│   • NCEngine.initialize({ appKey: VITE_NEXCONN_APP_KEY })   │
│   • NCEngine.connect({ token: userNexconnToken })           │
│   • DirectChannel, GroupChannel, OpenChannel                │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
     JWT Auth  │  1. Login / Register         │ 3. User Access Token
     Requests  │  2. Request Token            │    (Never App Secret!)
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│                    ConnectSphere App Server                 │
│                                                             │
│   • Node.js & Express.js                                    │
│   • Securely holds NEXCONN_APP_KEY & NEXCONN_APP_SECRET     │
│   • Generates SHA-1 Signatures:                             │
│     Signature = sha1(AppSecret + Nonce + Timestamp)         │
│   • Endpoints:                                              │
│     - POST /api/auth/register                               │
│     - POST /api/auth/login                                  │
│     - GET  /api/auth/nexconn-token                          │
└──────────────┬──────────────────────────────────────────────┘
               │
   Server-to-  │  POST /v4/auth/access-token/issue
   Server API  │  POST /v4/group-channel/create
               │  POST /v4/open-channel/create
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nexconn Cloud Platform                    │
│                                                             │
│   • API Base: api.sg-light-api.com (Singapore Global)       │
│   • Real-Time Gateway & WebSocket Infrastructure            │
│   • Message Persistence & Global Routing                    │
└─────────────────────────────────────────────────────────────┘
```

### SDK Implementation Highlights

#### 1. Server-Side Token Generation (`backend/services/nexconnService.js`)
```javascript
const nonce = Math.floor(Math.random() * 1000000).toString();
const timestamp = Date.now().toString();
const signature = crypto
  .createHash('sha1')
  .update(this.appSecret + nonce + timestamp)
  .digest('hex');

const response = await axios.post(
  'https://api.sg-light-api.com/v4/auth/access-token/issue',
  { userId, name, avatarUrl },
  {
    headers: {
      'App-Key': this.appKey,
      'Nonce': nonce,
      'Timestamp': timestamp,
      'Signature': signature,
      'X-Request-ID': crypto.randomUUID().replace(/-/g, ''),
      'Content-Type': 'application/json',
    },
  }
);
```

#### 2. Client Initialization & Connection (`frontend/src/services/nexconnChat.ts`)
```typescript
import { NCEngine, ConnectionStatusHandler, MessageHandler } from '@nexconn/chat';

// Initialize exactly once
NCEngine.initialize({ appKey: import.meta.env.VITE_NEXCONN_APP_KEY });

// Add Connection Status Listener
NCEngine.addConnectionStatusHandler('conn-handler', new ConnectionStatusHandler({
  onConnectionStatusChanged({ status, code }) {
    console.log('Nexconn status:', status, 'code:', code);
  }
}));

// Add Real-Time Message Listener
NCEngine.addMessageHandler('msg-handler', new MessageHandler({
  onMessageReceived({ messages }) {
    messages.forEach((msg) => dispatchMessage(msg));
  }
}));

// Connect with Server-Issued Token
await NCEngine.connect({ token: userToken });
```

#### 3. Real-Time One-to-One Direct Messaging
```typescript
import { DirectChannel, SendTextMessageParams } from '@nexconn/chat';

const channel = new DirectChannel(recipientUserId);
const result = await channel.sendMessage(new SendTextMessageParams({ text }));
```

#### 4. Real-Time Group Channels (Communities)
```typescript
import { GroupChannel, SendTextMessageParams } from '@nexconn/chat';

const channel = new GroupChannel(groupId);
const result = await channel.sendMessage(new SendTextMessageParams({ text }));
```

#### 5. Live Discussion Rooms (Open Channels)
```typescript
import { OpenChannel, SendTextMessageParams } from '@nexconn/chat';

const channel = new OpenChannel(openChannelId);
// Enter room and fetch 20 recent messages
await channel.enterChannel({ messageCount: 20 });
// Send message in room
await channel.sendMessage(new SendTextMessageParams({ text }));
// Leave room when navigating away
await channel.exitChannel();
```

---

## 4. Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 3.4, Framer Motion 12, Lucide React icons, Axios |
| **Real-Time IM** | **Nexconn Chat SDK Web** (`@nexconn/chat: ^26.5.1`, `@nexconn/engine: ^26.5.1`) |
| **Backend** | Node.js (v22/v26), Express.js 4, Mongoose 8, JWT, bcryptjs, Morgan |
| **Database** | MongoDB (v7.0) |
| **Artificial Intelligence** | Google Gemini API (`@google/generative-ai`), built-in heuristic NLP fallback engine |
| **Design System** | Dark theme default, Charcoal (`#070A10`), Electric Blue (`#3B82F6`), Violet (`#8B5CF6`), Glassmorphism |

---

## 5. Database Design & MongoDB Models

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│              User               │       │            Community            │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ _id: ObjectId                   │       │ _id: ObjectId                   │
│ username: String (unique)       │◄──┐   │ name: String                    │
│ email: String (unique)          │   │   │ slug: String (unique)           │
│ password: String (bcrypt hash)  │   │   │ category: Enum (7 categories)   │
│ name: String                    │   │   │ nexconnGroupId: String (unique) │
│ avatarUrl: String               │   │   │ owner: ref User                 │
│ role: 'user'|'moderator'|'admin'│   │   │ membersCount: Number            │
│ interests: [String]             │   │   │ rules: [String]                 │
│ nexconnToken: String            │   │   │ tags: [String]                  │
└────────────────┬────────────────┘   │   └────────────────┬────────────────┘
                 │                    │                    │
                 ▼                    │                    ▼
┌─────────────────────────────────┐   │   ┌─────────────────────────────────┐
│         CommunityMember         │   │   │         DiscussionRoom          │
├─────────────────────────────────┤   │   ├─────────────────────────────────┤
│ community: ref Community        ├───┼──►│ community: ref Community        │
│ user: ref User                  │   │   │ name: String                    │
│ role: 'owner'|'mod'|'member'    │   │   │ topic: String                   │
│ joinedAt: Date                  │   │   │ openChannelId: String (Nexconn) │
└─────────────────────────────────┘   │   │ createdBy: ref User             │
                                      │   │ participantCount: Number        │
                                      │   └─────────────────────────────────┘
                                      │
┌─────────────────────────────────┐   │   ┌─────────────────────────────────┐
│          Notification           │   │   │             Report              │
├─────────────────────────────────┤   │   ├─────────────────────────────────┤
│ recipient: ref User             │   └───┤ reporter: ref User              │
│ sender: ref User                │       │ messageId: String               │
│ type: 'message'|'invite'|'room' │       │ content: String                 │
│ title: String                   │       │ reason: String                  │
│ link: String                    │       │ aiAnalysis: { toxicityScore... }│
│ read: Boolean                   │       │ status: 'pending'|'action_taken'│
└─────────────────────────────────┘       └─────────────────────────────────┘
```

---

## 6. Security Architecture

1. **Strict Credential Isolation**:
   - `NEXCONN_APP_SECRET`, database passwords, and `JWT_SECRET` reside strictly on the server side in environment variables (`backend/.env`).
   - The frontend only receives user-bound access tokens and public `VITE_NEXCONN_APP_KEY`.
2. **Password Protection**: Salted and hashed using `bcryptjs` with 10 rounds.
3. **Route Protection**: JWT bearer token authentication middleware verifies request signatures on all protected mutations.
4. **Role-Based Access Control (RBAC)**: Distinct permissions for `user`, `moderator`, and `admin` on moderation queues and management endpoints.
5. **AI Safety Gate**: Real-time toxicity scoring flags abusive, spam, or malicious messages automatically.

---

## 7. Getting Started & Installation

### Prerequisites
* **Node.js** v18+ or v20+ (Tested on v26.10)
* **npm** v9+ (Tested on v11.19)
* **MongoDB** (Local instance on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### Step 1: Clone or Navigate to the Workspace
```bash
cd /Users/cheeranjeevan.k/Documents/Nexoon
```

### Step 2: Install All Dependencies
```bash
npm run install:all
```
*(Or install in each directory individually: `npm install`, `cd backend && npm install`, `cd frontend && npm install`)*

### Step 3: Configure Environment Variables
Copy `.env.example` templates:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
*(If you have your Nexconn developer console credentials or Gemini API key, paste them into `backend/.env` and `frontend/.env`. If not, ConnectSphere runs automatically in developer demonstration mode!)*

### Step 4: Seed the Database
Populate demo users, vibrant communities, live discussion rooms, and sample moderation reports:
```bash
npm run seed
```

### Step 5: Start Frontend and Backend Concurrently
```bash
npm run dev
```

* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5001`
* **Health & Diagnostics**: `http://localhost:5001/api/health`

---

## 8. Environment Variables Guide

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| --- | --- | --- |
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection URL | `mongodb://127.0.0.1:27017/connectsphere` |
| `JWT_SECRET` | Secret key for JWT signing | `connectsphere-super-secure-jwt-key-2026` |
| `NEXCONN_APP_KEY` | Nexconn App Key from console | `YOUR_NEXCONN_APP_KEY` |
| `NEXCONN_APP_SECRET` | Nexconn App Secret (Keep secret!) | `YOUR_NEXCONN_APP_SECRET` |
| `NEXCONN_API_BASE_URL` | Nexconn Data Center Base URL | `https://api.sg-light-api.com` |
| `GEMINI_API_KEY` | Google Gemini API Key (Optional) | `YOUR_GEMINI_API_KEY` |
| `GEMINI_MODEL` | Gemini Model Identifier | `gemini-1.5-flash` |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example |
| --- | --- | --- |
| `VITE_API_URL` | Base API URL or Vite proxy path | `/api` |
| `VITE_NEXCONN_APP_KEY` | Public Nexconn App Key | `YOUR_NEXCONN_APP_KEY` |

---

## 8.1. Cloud Deployment Guide (Render, Railway & Vercel)

### Deploying the Backend (Render or Railway)

#### Option A: Render (Recommended)
1. Go to **[Render Dashboard](https://dashboard.render.com/)** & click **New** → **Web Service**.
2. Connect your GitHub repository: `Cheeranjeevank/Nexon-Build-AI---ConnectSphere-AI`.
3. Configure the service:
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
4. In **Environment Variables**, add:
   * `NODE_ENV` = `production`
   * `PORT` = `10000`
   * `MONGODB_URI` = `<Your MongoDB Atlas connection string>`
   * `JWT_SECRET` = `<Generate a secure random string>`
   * `NEXCONN_APP_KEY` = `x4vkb1qpx5cqk`
   * `NEXCONN_APP_SECRET` = `zETLbOIStuP`
   * `NEXCONN_API_BASE_URL` = `https://api.sg-light-api.com`
   * `GEMINI_API_KEY` = `<Your Google Gemini API Key>`
   * `GEMINI_MODEL` = `gemini-flash-latest`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://connectsphere-backend.onrender.com`).

#### Option B: Railway
1. Go to **[Railway](https://railway.app/)** → **New Project** → **Deploy from GitHub repo**.
2. Select `Cheeranjeevank/Nexon-Build-AI---ConnectSphere-AI`.
3. In **Settings** → **Root Directory**, set to `backend`.
4. In **Variables**, add the same environment variables as listed above.

---

### Deploying the Frontend (Vercel)

1. Go to **[Vercel Dashboard](https://vercel.com/new)** and click **Add New Project**.
2. Import repository `Cheeranjeevank/Nexon-Build-AI---ConnectSphere-AI`.
3. In the project setup screen:
   * **Framework Preset:** Vite
   * **Root Directory:** Click **Edit** and select `frontend`
4. Under **Environment Variables**, add:
   * `VITE_NEXCONN_APP_KEY` = `x4vkb1qpx5cqk`
   * `VITE_API_URL` = `https://<your-render-backend-url>/api` *(Point to your deployed backend)*
5. Click **Deploy**. Vercel will build the project and provide your live application URL!

---

## 9. Feature Testing & Verification Report

An automated end-to-end verification test suite was executed against the running backend and database. All 10 verification test suites passed with 100% success rate:

```
🧪 Starting ConnectSphere End-to-End Verification Tests...

✅ 1. Health Check Passed: ConnectSphere API (Status: ok)
✅ 2. Auth Login Passed: Logged in as Alex Rivera (Role: admin)
   Nexconn Token Issued: nx_seed_6aff137bddc19b3a0e13c5...
✅ 3. Get /auth/me Passed: User validated with 6 joined communities.
✅ 4. Communities Filter Passed: Found 2 Technology communities.
✅ 5. Community Slug Lookup Passed: AI & Machine Learning Pioneers (2 rooms, isMember: true)
✅ 6. AI Summarize Passed: In this session of 3 messages across 3 community participants...
   Key Takeaways: 3 bullets returned.
✅ 7. AI Ask Passed: Great question regarding "How do discussion rooms work with Nexconn Open Channel...
✅ 8a. AI Moderation Scan Passed: Toxicity Score 0.75 (IsAppropriate: false)
✅ 8b. Submit Report Passed: Report ID 6aff189bd4cc22dca0ef69dc (AI Flagged: true)
✅ 9. Admin Stats Passed: { users: 5, communities: 6, rooms: 6, reports: 2 }
✅ 10. Notifications Passed: 3 notifications retrieved.

🎉 ALL 10 END-TO-END VERIFICATION TESTS COMPLETED SUCCESSFULLY!
```

---

## 10. Known Limitations

1. **Data Center Regions**: Nexconn servers are partitioned across Singapore (`api.sg-light-api.com`), North America (`api.us-light-api.com`), and Saudi Arabia. Ensure the console application data center matches the configured `NEXCONN_API_BASE_URL`.
2. **Audio/Video Calls**: Audio/video RTC conferencing is handled by the companion Nexconn Call SDK (`@nexconn/call`). This hackathon application focuses on high-speed text, media, group messaging, and open channel rooms.
3. **AI Rate Limits**: Free tier Gemini API keys may have rate limits of 15 requests per minute. ConnectSphere includes an automatic fallback to its built-in NLP heuristics to prevent any disruption during demos.

---

## 11. Hackathon Presentation Outline

### Slide 1: Title & Hook
* **ConnectSphere: AI-Powered Community Connect**
* *The Next-Gen Community Platform with Nexconn Chat SDK & SphereAI*
* Hackathon Track: Open Innovation

### Slide 2: The Problem
* Online communities are either static forums with low engagement, or noisy chat channels with information overload.
* Teams and creators struggle to extract actionable insights from hours of discussions.
* Community safety and moderation usually lag hours behind abusive messages.

### Slide 3: The Solution — ConnectSphere
* Combines **Nexconn Chat SDK** for sub-second real-time messaging with **SphereAI** for intelligent synthesis.
* **Interest-Based Communities** + **Live Discussion Rooms** (Nexconn Open Channels).
* **Automated AI Moderation** scanning messages for toxicity and spam before they cause harm.

### Slide 4: Architecture & Security
* Production full-stack architecture: React 19, Vite, Tailwind CSS, Node.js, Express, MongoDB.
* Strict Nexconn credential separation: App Secrets stay on the backend server with SHA-1 HMAC signing.
* Dual-engine AI design: Google Gemini API integration with instant heuristic fallback.

### Slide 5: Live Demonstration
* Walk through 1-Click login as Alex Rivera.
* Showcase 1-on-1 direct messaging and real-time community chat.
* Enter a Live Discussion Room powered by Nexconn OpenChannel.
* Trigger SphereAI conversation summarizer to extract 3 bullet takeaways.
* Test message reporting and view the Admin Moderation Dashboard.

### Slide 6: Business Value & Future Roadmap
* High-retention community hubs for Web3, Developer Tools, SaaS, and Education.
* Roadmap: Nexconn Call SDK audio/video breakout stages, automated discord/slack bridges, and custom enterprise knowledge bases.

---

## 12. Live Demonstration Script for Judges

**Role**: Presenter / Product Engineer  
**Duration**: 3 to 4 minutes  

### Minute 1: The Landing Page & Quick-Launch
1. Open `http://localhost:5173`.
2. Point out the dark, modern SaaS design inspired by Linear, Slack, and Discord.
3. Click the **"Alex (Admin)"** quick-launch button on the hero section.
4. Explain: *"With a single click, our server authenticates with JWT, contacts the Nexconn Server API, generates an access token via SHA-1 request signatures, and connects the client SDK."*
5. Highlight the **Nexconn Web SDK: Connected** status pill in the top navigation bar.

### Minute 2: Community Hub & Nexconn Group Chat
1. Navigate to the **"AI & Machine Learning Pioneers"** community.
2. Show the **# Group Chat**:
   - Send a message: *"Testing real-time message delivery through the Nexconn Chat SDK!"*
   - Point out the instant UI delivery and delivery checkmarks.
3. Click the **"SphereAI Summary"** button in the chat header.
4. Watch SphereAI synthesize the last 25 messages into an executive summary with bullet takeaways, sentiment analysis, and action items.

### Minute 3: Live Discussion Rooms (Nexconn Open Channels)
1. Switch to the **"Live Discussion Rooms"** tab.
2. Click **"Enter Live Room"** on *"LLM Fine-Tuning & Quantization"*.
3. Explain: *"This uses the Nexconn OpenChannel API (`enterChannel`), allowing thousands of concurrent participants to join topic-focused live debates without channel clutter."*
4. Show how the room participant indicator updates in real-time.

### Minute 4: Direct Messaging & Smart Moderation
1. Navigate to **"Messages"** in the top navigation.
2. Switch to 1-on-1 direct chat with **"Sarah Chen"**.
3. Type a message draft, then click **"AI Polish"** to demonstrate how SphereAI refines the tone.
4. Show the **"Report Message"** modal on a sample message to demonstrate automated AI toxicity scoring.
5. Navigate to the **"Moderation"** dashboard (available to Alex as Admin) to show the live review queue and system infrastructure monitor.
6. Conclude: *"ConnectSphere demonstrates how modern AI and the Nexconn Chat SDK create a truly intelligent, safe, and engaging community platform."*

---

**Built with passion for the Open Innovation Hackathon • ConnectSphere © 2026**

