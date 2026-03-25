# 🎫 WTicket - Enterprise Ticket Management System

> A modern, scalable ticket management system engineered with vanilla JavaScript and JSONBin.io, designed for zero-infrastructure deployment on static hosting platforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages-orange)](https://pages.github.com/)
[![Database](https://img.shields.io/badge/Database-JSONBin.io-green)](https://jsonbin.io/)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)](https://web.dev/progressive-web-apps/)

---

## 📋 Project Overview

WTicket is an enterprise-grade, serverless ticket management system architected for rapid deployment without infrastructure overhead. The solution leverages JSONBin.io for persistent, serverless JSON storage and CDN-distributed static assets for optimal global performance.

### Core Objectives

| Objective | Implementation |
|-----------|----------------|
| **Zero Infrastructure** | Deploy on any static hosting provider (GitHub Pages, Netlify, Vercel) |
| **Cost Efficiency** | Free tier of JSONBin.io with generous limits |
| **Developer Experience** | No build process, instant setup, hot-reload capable |
| **Security First** | SHA-256 hashing, cryptographically secure sessions, XSS sanitization |
| **Offline Capability** | Service Worker caching for static assets |

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Public Dashboard** | Real-time aggregated statistics (open, closed, total tickets, user count) |
| **User Authentication** | Email/password registration and login with secure session tokens |
| **Role-Based Access Control** | Segregated user and administrator panels with authorization enforcement |
| **Complete Ticket Lifecycle** | Create → Open → Attended → Closed workflow |
| **Real-Time Search** | Filter tickets by title or ID across all views |
| **Progressive Web App** | Installable on iOS/Android/Desktop with partial offline support |
| **Responsive Design System** | Mobile-first CSS with adaptive breakpoints |
| **Toast Notification System** | Non-intrusive visual feedback for all user actions |

---

## 🛠 Technical Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Vanilla JavaScript (ES6+) | ES2022 | Core application logic |
| **Module System** | ES Modules | Native | Code organization and imports |
| **Styling** | CSS3 Custom Properties | Modern | Design system and theming |
| **Database** | JSONBin.io | Free Tier | Persistent JSON storage |
| **Hosting** | GitHub Pages | Static | Global CDN distribution |
| **PWA** | Service Worker API | v3 | Offline caching and installation |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                     CLIENT LAYER (Browser)                         │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│   │  │ index.html  │  │ login.html  │  │dashboard.html│  admin.html  │   │
│   │  │ (Dashboard) │  │   (Auth)    │  │  (User)     │  (Admin)    │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│   │                         │                                          │   │
│   │  ┌─────────────────────────────────────────────────────────────┐  │   │
│   │  │              JavaScript Modules                              │  │   │
│   │  │  js/app.js (JSONBin Client + Auth + Tickets) │ js/toast.js │  │   │
│   │  └─────────────────────────────────────────────────────────────┘  │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                    │ HTTPS/REST                            │
│                                    ▼                                      │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                    DATA LAYER (JSONBin.io)                          │   │
│   │  ┌─────────────────────────────────────────────────────────────┐  │   │
│   │  │  users.json  │  tickets.json  │  counter.json  │  sessions  │  │   │
│   │  └─────────────────────────────────────────────────────────────┘  │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
wticket/
│
├── index.html                  # Public dashboard - statistics without authentication
├── login.html                 # Authentication - login/register tabs
├── dashboard.html             # User panel - open/closed ticket columns
├── admin.html                 # Administrator panel - ticket management
│
├── manifest.json              # PWA manifest - app metadata and icons
├── service-worker.js          # Service Worker - offline caching strategy
│
├── css/
│   └── styles.css            # Complete design system with CSS custom properties
│
├── js/
│   ├── app.js                # Core API module - JSONBin operations, auth, tickets
│   └── toast.js              # Toast notification system with animations
│
├── LICENSE                   # MIT License
└── README.md                # This documentation
```

---

## 🚀 Installation & Setup

### Prerequisites

| Requirement | Specification |
|-------------|----------------|
| Browser | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Network | Internet connectivity |
| JSONBin | Free account at https://jsonbin.io |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/wisrovi/wticket.git
cd wticket

# 2. Create JSONBin.io account
# Visit https://jsonbin.io and sign up for free

# 3. Create 3 bins for data storage
# Create bins for: users, tickets, counter

# 4. Configure JSONBin credentials
# Edit js/app.js with your API key and bin IDs
```

```javascript
// js/app.js - Configuration section
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const JSONBIN_API_KEY = 'YOUR_API_KEY';

const BIN_IDS = {
  users: 'YOUR_USERS_BIN_ID',
  tickets: 'YOUR_TICKETS_BIN_ID',
  counter: 'YOUR_COUNTER_BIN_ID'
};
```

```bash
# 5. Local development server (optional but recommended)
python3 -m http.server 8000

# 6. Deploy to GitHub Pages
# Push to your repository and enable Pages in Settings
```

---

## ⚙️ Configuration

### Application Constants

```javascript
// js/app.js - Application configuration
const ADMIN_EMAIL = 'wisrovi@wticket.com';    // Default admin email
const ADMIN_PASSWORD = 'wisrovi_wticket';     // Default admin password
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
```

---

## 📖 Usage Guide

### User Flow

1. **Access Dashboard** → View public statistics without login
2. **Register** → Create account with email and password
3. **Login** → Authenticate with credentials
4. **Create Ticket** → Submit title and optional description
5. **Track Tickets** → Monitor open tickets in real-time
6. **View Resolution** → Check closed tickets with responses

### Administrator Flow

1. **Login** → Use admin credentials
2. **View Stats** → Monitor system-wide ticket metrics
3. **Browse Open Tickets** → Ordered by creation date (oldest first)
4. **Search Tickets** → Find by title or ID
5. **Resolve Tickets** → Add optional response and close
6. **Review Closed** → Access history of resolved tickets

---

## 📊 Data Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA STRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USERS (users.json)                                                       │
│  ├── {email}: {                                                           │
│  │     email: string                                                       │
│  │     passwordHash: string (SHA-256)                                      │
│  │     name: string                                                       │
│  │     role: "user" | "admin"                                             │
│  │     createdAt: number                                                   │
│  │   }                                                                   │
│                                                                             │
│  TICKETS (tickets.json)                                                   │
│  ├── {id}: {                                                              │
│  │     id: number                                                         │
│  │     title: string (XSS sanitized)                                       │
│  │     description: string                                                 │
│  │     userEmail: string                                                   │
│  │     status: "open" | "closed"                                          │
│  │     createdAt: number                                                   │
│  │     response: string                                                    │
│  │     responseAt: number                                                  │
│  │   }                                                                   │
│                                                                             │
│  COUNTER (counter.json)                                                    │
│  └── { counter: number }                                                   │
│                                                                             │
│  SESSIONS (in-memory cache)                                                │
│  └── {token}: {                                                           │
│        email: string                                                       │
│        name: string                                                       │
│        role: string                                                       │
│        createdAt: number                                                  │
│        expiresAt: number                                                   │
│      }                                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Architecture

### Implemented Security Controls

| Control | Implementation | Effectiveness |
|---------|---------------|---------------|
| **Password Hashing** | SHA-256 with application salt | High |
| **Session Tokens** | 256-bit cryptographically random | High |
| **Session Expiry** | 24-hour automatic TTL | Medium |
| **XSS Prevention** | HTML entity escaping | High |
| **Input Sanitization** | Client-side validation | Medium |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>🎫 WTicket</strong> — Enterprise ticket management, zero infrastructure.
</p>
