# Microservice Design Specification

> **Technical Reference**: This document provides detailed technical specifications for all microservice components, including interfaces, data contracts, and implementation requirements.

---

## 1. System Architecture

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                     CLIENT LAYER                                      │ │
│   │  ┌───────────────────────────────────────────────────────────────┐   │ │
│   │  │                   PRESENTATION LAYER                           │   │ │
│   │  │  index.html  │  login.html  │  dashboard.html  │  admin.html │   │ │
│   │  └───────────────────────────────────────────────────────────────┘   │ │
│   │                              │                                        │ │
│   │  ┌───────────────────────────────────────────────────────────────┐   │ │
│   │  │                  BUSINESS LOGIC LAYER                          │   │ │
│   │  │              js/app.js  │  js/toast.js                        │   │ │
│   │  └───────────────────────────────────────────────────────────────┘   │ │
│   │                              │                                        │ │
│   │  ┌───────────────────────────────────────────────────────────────┐   │ │
│   │  │                  INFRASTRUCTURE LAYER                         │   │ │
│   │  │  service-worker.js  │  styles.css  │  manifest.json          │   │ │
│   │  └───────────────────────────────────────────────────────────────┘   │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                      NETWORK LAYER                                  │ │
│   │            CDN (GitHub Pages)  │  Redis API (Upstash)              │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                       DATA LAYER                                     │ │
│   │                    Upstash Redis                                     │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Matrix

| Component | Technology | Version | Type |
|-----------|------------|---------|------|
| **Presentation** | HTML5 | Living Standard | Markup |
| **Styling** | CSS3 | Level 4 | Stylesheet |
| **Logic** | JavaScript | ES2022 | Programming |
| **Modules** | ES Modules | Native | Import/Export |
| **HTTP Client** | Fetch API | Living Standard | Web API |
| **Crypto** | Web Crypto API | Level 4 | Security |
| **Cache** | Service Worker | v3 | PWA |
| **Storage** | localStorage | Living Standard | Client Storage |
| **Database** | Upstash Redis | Serverless | Cloud DB |
| **CDN** | GitHub Pages | - | Hosting |

---

## 2. Module Specifications

### 2.1 API Module (js/app.js)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API MODULE INTERFACE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      INITIALIZATION                                   │   │
│  │  init() → Promise<void>                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AUTHENTICATION                                   │   │
│  │  register(email, password, name?) → Promise<Session>               │   │
│  │  login(email, password) → Promise<Session>                          │   │
│  │  logout() → Promise<void>                                             │   │
│  │  validateSession() → Promise<User | null>                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TICKETS                                         │   │
│  │  createTicket(title, description, userEmail) → Promise<number>      │   │
│  │  getTicket(id) → Promise<Ticket | null>                              │   │
│  │  getOpenTickets() → Promise<Ticket[]>                                │   │
│  │  getClosedTickets() → Promise<Ticket[]>                              │   │
│  │  getUserOpenTickets(email) → Promise<Ticket[]>                        │   │
│  │  getUserClosedTickets(email) → Promise<Ticket[]>                      │   │
│  │  closeTicket(id, response) → Promise<void>                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       UTILITIES                                       │   │
│  │  getStats() → Promise<Stats>                                        │   │
│  │  searchTickets(tickets, query) → Ticket[]                          │   │
│  │  requireAuth(allowedRoles?) → Function                               │   │
│  │  escapeHtml(text) → string                                          │   │
│  │  formatDate(timestamp) → string                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Contracts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA CONTRACTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Session {                                                                │
│      token: string                                                        │
│      user: {                                                              │
│          email: string                                                     │
│          name: string                                                      │
│          role: "user" | "admin"                                           │
│      }                                                                    │
│  }                                                                        │
│                                                                             │
│  Ticket {                                                                │
│      id: number                                                           │
│      title: string                                                        │
│      description: string                                                   │
│      userEmail: string                                                    │
│      status: "open" | "closed"                                            │
│      createdAt: number                                                     │
│      response: string                                                      │
│      responseAt: number                                                     │
│  }                                                                        │
│                                                                             │
│  Stats {                                                                 │
│      openCount: number                                                    │
│      closedCount: number                                                   │
│      totalCount: number                                                   │
│      userCount: number                                                     │
│  }                                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Page Specifications

### 3.1 index.html (Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD PAGE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        NAVIGATION BAR                                  │   │
│  │                    🎫 WTicket  │  Inicio  │  Login                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PAGE HEADER                                    │   │
│  │              Dashboard de Tickets                                      │   │
│  │           Resumen general del sistema de soporte                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Tickets │  │  Tickets │  │  Total   │  │ Usuarios │               │
│  │  Abiertos│  │ Atendidos│  │  Tickets │  │   (n)    │               │
│  │    (n)   │  │    (n)   │  │    (n)   │  │          │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       QUICK ACTIONS                                   │   │
│  │              [Crear Ticket]  [Iniciar Sesión]                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 dashboard.html (User Panel)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER DASHBOARD                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🎫 WTicket  │  Inicio  │  👤 User Name  │  [Cerrar Sesión]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │           Mi Panel              │      [Crear Nuevo Ticket]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │    📂 Tickets Abiertos     │  │   ✅ Tickets Atendidos              │   │
│  │         [search...]        │  │         [search...]                │   │
│  │                             │  │                                     │   │
│  │  ┌───────────────────────┐  │  │  ┌───────────────────────────────┐  │   │
│  │  │ #1 Título...  [Abierto]│  │  │  │ #3 Título...  [Atendido]   │  │   │
│  │  │ Creado: fecha        │  │  │  │  │ Creado: fecha           │  │   │
│  │  └───────────────────────┘  │  │  │  └───────────────────────────┘  │   │
│  │                             │  │  │                                     │   │
│  │  ┌───────────────────────┐  │  │  ┌───────────────────────────────┐  │   │
│  │  │ #2 Título...  [Abierto]│  │  │  │ #5 Título...  [Atendido]   │  │   │
│  │  │ Creado: fecha        │  │  │  │  │ Creado: fecha           │  │   │
│  │  └───────────────────────┘  │  │  │  └───────────────────────────┘  │   │
│  └─────────────────────────────┘  └─────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Design System Specifications

### 4.1 Color Palette

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLOR SYSTEM                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BRAND COLORS                                                             │
│  ─────────────                                                            │
│  --primary:      #6366f1  ████████  Primary actions and branding          │
│  --primary-dark: #4f46e5  ████████  Hover and active states              │
│                                                                             │
│  SEMANTIC COLORS                                                          │
│  ─────────────────                                                         │
│  --success:     #10b981  ████████  Positive outcomes                      │
│  --warning:     #f59e0b  ████████  Caution states                        │
│  --danger:      #ef4444  ████████  Errors and destructive actions         │
│                                                                             │
│  NEUTRAL SCALE                                                            │
│  ─────────────                                                            │
│  --gray-50:     #f9fafb  ████████  Lightest background                   │
│  --gray-100:    #f3f4f6  ████████  Light backgrounds                    │
│  --gray-200:    #e5e7eb  ████████  Borders                               │
│  --gray-500:    #6b7280  ████████  Muted text                             │
│  --gray-800:    #1f2937  ████████  Primary text                           │
│  --gray-900:    #111827  ████████  Darkest text                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Typography Scale

| Element | Font | Size | Weight |
|---------|------|------|--------|
| **H1 (Page Title)** | Inter | 1.75rem | 700 |
| **H2 (Section)** | Inter | 1.125rem | 600 |
| **H3 (Card)** | Inter | 1rem | 600 |
| **Body** | Inter | 14px | 400 |
| **Small** | Inter | 12px | 400 |
| **Caption** | Inter | 11px | 600 |

---

## 5. PWA Specifications

### 5.1 Manifest Schema

```json
{
  "name": "WTicket - Sistema de Tickets",
  "short_name": "WTicket",
  "description": "Sistema de gestión de tickets de soporte",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "data:image/svg+xml,...svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### 5.2 Service Worker Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVICE WORKER LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [sw.register()]                                                           │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────┐                                                        │
│  │    INSTALLING   │  Cache static assets                                  │
│  └────────┬────────┘                                                        │
│           │                                                                   │
│           │ skipWaiting()                                                    │
│           ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │    ACTIVATING   │  Clean old caches                                     │
│  └────────┬────────┘                                                        │
│           │                                                                   │
│           │ clients.claim()                                                 │
│           ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │    ACTIVE       │  Serve from cache, intercept requests                 │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
