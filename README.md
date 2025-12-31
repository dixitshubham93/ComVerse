# 🌌 ComVerse

<div align="center">

**An Immersive 3D Community Platform for Real-Time Social Interaction**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)

[Features](#-features) • [Demo](#-demo) • [Architecture](#-architecture) • [Installation](#-installation) • [Contributing](#-contributing)

</div>

---

## 📌 Overview

ComVerse reimagines online community interaction by breaking away from traditional flat interfaces and introducing a **3D spatial model**. Instead of endless lists and channels, communities exist as **planets in a universe**, content is navigated through **3D space**, and rooms become **destinations** rather than tabs.

This experimental yet production-oriented platform combines real-time systems (WebRTC, WebSockets) with 3D-inspired UI paradigms to deliver a Discord-like feature set with a fundamentally different interaction model.

![ComVerse Main Interface](https://drive.google.com/uc?export=view&id=1aSwZQInvLP57coGt7bZmwIgMa0pfTezo)
*Screenshot: The ComVerse universe with planetary communities*

---

## 🎯 Problem Statement

Modern community platforms like Discord, Slack, and Reddit face key limitations:

- ❌ **No spatial context** for communities or content
- ❌ **Static 2D navigation** that doesn't scale with growth
- ❌ **Feeds optimized for passive consumption**, not exploration
- ❌ **Voice rooms lack visual or spatial identity**
- ❌ **Discovery degrades** as communities grow larger

ComVerse explores how 3D metaphors can enhance engagement, discovery, and social presence without compromising performance or usability.

---

## ✨ Features

### 🌍 3D Community Space (Planet-Based Model)

Each community is visualized as a planet in a 3D universe, creating emotional attachment and improving discovery.

![Planet Communities](https://drive.google.com/uc?export=view&id=192i05l5gjRA6F40ZAbOjf29H0Iu4bw-S)
*Screenshot: Multiple community planets in the ComVerse universe*

**Capabilities:**
- Travel between communities through spatial navigation
- Enter communities with immersive transitions
- Explore rooms as logical zones within planets
- Enhanced sense of presence and belonging

---

### 🖼️ Meme & Post Room — 3D Feed System

**The core innovation of ComVerse.** Posts are arranged in a 3D carousel/spatial feed instead of a traditional vertical scroll.

![3D Feed System](https://drive.google.com/uc?export=view&id=1nkQhSnQsaGbyBhvVj9lycT8SomOYJW4U)
*Screenshot: 3D post carousel with spatial navigation*

**Features:**
- Navigate posts in 3D space with smooth animations
- Like, comment, and interact in real-time
- Comment panel overlays without breaking spatial context
- Rotate and explore content naturally

---

### 🎙️ Voice Rooms (WebRTC-Based)

Real-time voice communication with spatial presence awareness.

![Voice Room](https://drive.google.com/uc?export=view&id=1134Izfe63IgVTLPU712NzCUAVnJ10ajO)
*Screenshot: Active voice room with participant grid*

**Features:**
- Join/Leave with presence indicators
- Mute/Unmute controls
- Live participant grid
- Peer-to-peer audio streaming (scalable & secure)
- WebSocket-based signaling

**Architecture:**
```
WebRTC → Direct media streaming between peers
WebSockets → Signaling & presence management
Audio streams never pass through server → Scalable & secure
```

---

### 💬 General Chat Room

High-concurrency, low-latency text chat powered by WebSockets.

![Chat Room](https://drive.google.com/uc?export=view&id=1ixr6x1rlR4uvvvkW0tYYqrtg6rqILCFw)
*Screenshot: Real-time chat interface*

**Features:**
- Create, update, and delete messages in real-time
- Message pagination for performance
- Typing indicators
- User presence tracking

---

### 📢 Announcement Room

Role-restricted communication channel with backend-enforced permissions.

![Announcement Room](https://drive.google.com/uc?export=view&id=1sIUkxKY7wdO-mnOWpn9oPcGeucBIpeEY)
*Screenshot: Announcement room with role-based access*

**Features:**
- Only Owners and Admins can post
- Members have read-only access
- Real-time updates for all connected users
- All permissions enforced server-side

---

### 👤 User Space & Profiles

Personalized user spaces with presence-aware interactions.

![User Profile](https://drive.google.com/uc?export=view&id=1DEyQgqEqng6IC3dxzYXjJKcxEfex0Ahs)
*Screenshot: User profile with avatar and communities*

**Features:**
- Customizable avatar and banner
- Joined communities showcase
- Direct messaging (DMs)
- Cross-room presence tracking

---

### 🛠️ Community Management Dashboard

Comprehensive control panel for community owners and administrators.

![Management Dashboard](https://drive.google.com/uc?export=view&id=1J3iQIyDTGiYM9pHLoZRHVgCoqulatmx_)
*Screenshot: Community management interface*

**Features:**
- Edit community details (name, banner, description)
- Member management (assign roles, remove members)
- Room management (create, edit, delete, permissions)
- Real-time change propagation

---

## 🧠 Architecture

### Tech Stack

#### Backend
- **Runtime:** Node.js + Express
- **Real-Time:** Socket.IO
- **Database:** PostgreSQL with Prisma ORM
- **Architecture:** Service-oriented with clear separation of concerns
  - Controllers
  - Services
  - Socket handlers
  - Presence managers

#### Frontend
- **Framework:** React + TypeScript
- **Animations:** Framer Motion
- **Voice:** WebRTC (simple-peer)
- **3D Effects:** WebGL shaders + CSS 3D transforms
- **Custom Hooks:**
  - Socket lifecycle management
  - Presence synchronization
  - Voice signaling

### Real-Time Stack Overview

| Component | Technology |
|-----------|------------|
| Text Messaging | WebSocket (Socket.IO) |
| Voice Communication | WebRTC (P2P) |
| Presence Tracking | WebSocket (Authoritative Server) |
| Authentication | OAuth 2.0 + JWT |
| Database | PostgreSQL |
| ORM | Prisma |
| Animations | Framer Motion |
| 3D Effects | WebGL / CSS 3D Transforms |

### System Architecture Diagram

![System Architecture](https://drive.google.com/uc?export=view&id=14K2kVHGOXFbFdk3gGQvY5d3Smw54F_45)
*Diagram: ComVerse system architecture*

---

## 🔐 Security

- **Authentication:** OAuth 2.0 flow
- **API Security:** JWT-secured REST endpoints
- **WebSocket Security:** Token-authenticated connections
- **Authorization:** Backend-enforced (zero frontend trust)
- **Data Privacy:** End-to-end encrypted voice streams

---

## 🚀 Installation

### Prerequisites

- Node.js (v18 )
- PostgreSQL (v14 )
- npm or Bun

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/dixitshubham93/comverse.git
cd comverse/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and OAuth keys

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your backend URL

# Start the development server
npm run dev
```

### Environment Variables

#### Backend `.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/comverse"
JWT_SECRET="your-secret-key"
OAUTH_CLIENT_ID="your-oauth-client-id"
OAUTH_CLIENT_SECRET="your-oauth-client-secret"
PORT=5000
```

#### Frontend `.env`
```env
VITE_API_URL="http://localhost:5000"
VITE_SOCKET_URL="http://localhost:5000"
```

---

## 📖 Usage

1. **Create an Account:** Sign up using OAuth authentication
2. **Explore Communities:** Navigate through the 3D universe of planetary communities
3. **Join a Planet:** Enter a community to access its rooms
4. **Engage:** Post in the 3D feed, chat in real-time, or join voice rooms
5. **Create Your Own:** Start your own community and customize it

---

## 🛣️ Roadmap

### Current Focus
- [ ] Enhanced 3D navigation with physics-based movement
- [ ] Spatial audio in voice rooms (positional audio)
- [ ] Accessibility modes for 3D environments
- [ ] Performance optimization for low-end devices

### Future Extensions
- [ ] Plugin system for community extensions
- [ ] Mobile app (React Native)
- [ ] AI-powered content moderation
- [ ] Blockchain-based community governance
- [ ] VR/AR integration

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 👨‍💻 Author

**Shubham Dixit**  
Full-Stack Developer | Real-Time Systems | Immersive UI Research

*Designing communities as experiences, not just interfaces.*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/dixitshubham93)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shubhamdt1/)

---

<div align="center">

**⭐ Star this repository if you find it interesting!**

Made with ❤️ for the future of online communities

</div>


