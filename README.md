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
| **Ticket Priorities** | Urgent (🔴), High (🟠), Normal (🟡), Low (🟢) |
| **Ticket Categories** | General, Technical, Billing, Suggestion, Bug, Other |
| **Ticket Assignment** | Admins can assign tickets to other admins |
| **Comments System** | Threaded comments on tickets for communication |
| **User Achievements** | Gamification with badges for user engagement |
| **Real-Time Search** | Filter tickets by title or ID across all views |
| **CSV Export** | Export all tickets to CSV for data analysis |
| **Pull-to-Refresh** | Mobile-friendly swipe-to-refresh functionality |
| **Progressive Web App** | Installable on iOS/Android/Desktop with partial offline support |
| **Responsive Design System** | Mobile-first CSS with adaptive breakpoints and segmented navbar |
| **Dark Mode** | Toggle between light and dark themes |
| **Toast Notification System** | Non-intrusive visual feedback for all user actions |
| **Keyboard Shortcuts** | n=new ticket, /=search, r=refresh, d=dark mode, Esc=close modals |

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
| **Testing** | Playwright | Latest | End-to-end testing |

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
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│   │  │profile.html │  │ contact.html│  │   (PWA)    │              │   │
│   │  │  (Profile)  │  │ (Contact)   │  │             │              │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│   │                         │                                          │   │
│   │  ┌─────────────────────────────────────────────────────────────┐  │   │
│   │  │              JavaScript Modules                              │  │   │
│   │  │  app.js │ toast.js │ shortcuts.js │ utils.js │ db.js     │  │   │
│   │  │  i18n.js │ achievements.js                              │  │   │
│   │  └─────────────────────────────────────────────────────────────┘  │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                    │ HTTPS/REST                            │
│                                    ▼                                      │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                    DATA LAYER (JSONBin.io)                          │   │
│   │  ┌─────────────────────────────────────────────────────────────┐  │   │
│   │  │  users.json  │  tickets.json  │  counter.json             │  │   │
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
├── profile.html               # User profile - change name/password, achievements
├── contact.html               # Contact page - developer information
│
├── manifest.json              # PWA manifest - app metadata and icons
├── service-worker.js          # Service Worker - offline caching strategy
│
├── css/
│   └── styles.css            # Complete design system with CSS custom properties
│
├── js/
│   ├── app.js                # Core API module - JSONBin operations, auth, tickets
│   ├── toast.js              # Toast notification system with animations
│   ├── shortcuts.js          # Keyboard shortcuts module
│   ├── utils.js              # Debounce/throttle utilities
│   ├── db.js                 # IndexedDB caching layer
│   ├── i18n.js               # Internationalization (ES/EN)
│   └── achievements.js       # User achievements/gamification system
│
├── tests/
│   ├── app.spec.js           # Playwright end-to-end tests
│   └── README.md             # Testing documentation
│
├── docs/                      # Sphinx documentation (ReadTheDocs compatible)
│   ├── source/               # Source files for Sphinx
│   ├── Makefile              # Build automation
│   └── README.md             # Docs README
│
├── docs_pdf/                  # LaTeX/PDF documentation
│   ├── wticket-documentation.tex
│   ├── wticket-documentation.pdf
│   └── sources/              # Images and assets
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
4. **Create Ticket** → Submit title, description, priority, and category
5. **Track Tickets** → Monitor open tickets in real-time
6. **Add Comments** → Communicate on tickets
7. **View Resolution** → Check closed tickets with responses
8. **Manage Profile** → Update name/password, view achievements

### Administrator Flow

1. **Login** → Use admin credentials
2. **View Stats** → Monitor system-wide ticket metrics with charts
3. **Browse Open Tickets** → Ordered by creation date (oldest first)
4. **Assign Tickets** → Assign tickets to other admins
5. **Search Tickets** → Find by title or ID
6. **Resolve Tickets** → Add optional response and close
7. **Review Closed** → Access history of resolved tickets
8. **Export CSV** → Download all tickets for analysis

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | Create new ticket |
| `/` | Focus search input |
| `r` | Refresh data |
| `d` | Toggle dark mode |
| `Esc` | Close modals |

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
│  │     title: string                                                       │
│  │     description: string                                                 │
│  │     userEmail: string                                                   │
│  │     priority: "urgent" | "high" | "normal" | "low"                     │
│  │     category: "general" | "technical" | "billing" | "suggestion" |    │
│  │               "bug" | "other"                                          │
│  │     status: "open" | "closed"                                          │
│  │     createdAt: number                                                   │
│  │     response: string                                                    │
│  │     responseAt: number                                                  │
│  │     assignedTo: string (admin email)                                   │
│  │     assignedAt: number                                                  │
│  │     comments: Array<{text, authorEmail, authorName, createdAt}>        │
│  │   }                                                                   │
│                                                                             │
│  COUNTER (counter.json)                                                    │
│  └── { counter: number }                                                  │
│                                                                             │
│  SESSIONS (in-memory cache)                                                │
│  └── {token}: {                                                           │
│        email: string                                                       │
│        name: string                                                        │
│        role: string                                                        │
│        createdAt: number                                                   │
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
| **Data Sync** | GET before PUT to prevent overwrites | High |

---

## 📚 Documentation

Comprehensive documentation is available in multiple formats:

### Sphinx Documentation (Recommended)

```bash
cd docs
make install-deps  # Install dependencies
make html          # Build HTML docs
make serve         # Preview at http://localhost:8000
```

### LaTeX/PDF Documentation

```bash
cd docs_pdf
pdflatex wticket-documentation.tex  # Compile (run 3 times)
```

### Online Resources

- **Live Demo**: https://wisrovi.github.io/wticket
- **Sphinx Docs**: Build with `make html` in docs folder
- **PDF Docs**: docs_pdf/wticket-documentation.pdf

---

## 🧪 Testing

```bash
# Install dependencies
npm install -D @playwright/test
npx playwright install chromium

# Run tests
npx playwright test
```

### Test Coverage

- Homepage loads correctly
- Login page functionality
- Dark mode toggle
- Contact page
- Global stats banner

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
