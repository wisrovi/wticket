# Architecture & Backend Core Documentation

> **Technical Reference**: This document provides a comprehensive architectural overview of the serverless ticket management microservice.

---

## 1. Architectural Overview

### 1.1 System Classification

| Attribute | Value |
|-----------|-------|
| **Architecture Pattern** | Serverless Frontend + Cloud Database |
| **Deployment Model** | Static Site Generation (SSG) |
| **Data Layer** | Serverless Redis (Upstash) |
| **Frontend Paradigm** | Single Page Application (SPA) - Multi-page variant |
| **Authentication Model** | Token-based Session Management |

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                      CDN EDGE NETWORK                                 │ │
│   │                    (GitHub Pages)                                    │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                                    ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                      CLIENT ENVIRONMENT                               │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │ │
│   │  │   Browser   │  │   Service   │  │   Static    │              │ │
│   │  │   (HTML)    │  │   Worker    │  │   (JS/CSS)  │              │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘              │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│                              HTTPS/REST                                    │
│                                    ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                    UPSTASH CLOUD INFRASTRUCTURE                      │ │
│   │  ┌─────────────────────────────────────────────────────────────┐  │ │
│   │  │                  Redis REST API (TLS Encrypted)              │  │ │
│   │  └─────────────────────────────────────────────────────────────┘  │ │
│   │  ┌─────────────────────────────────────────────────────────────┐  │ │
│   │  │                    Redis Database (Serverless)               │  │ │
│   │  └─────────────────────────────────────────────────────────────┘  │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Design Principles

1. **Zero Server Principle**: No application server required; all logic executes in browser context
2. **Stateless Client Pattern**: Client maintains no persistent state; Redis is single source of truth
3. **Edge-First Delivery**: Static assets served from CDN for global low-latency access
4. **Progressive Enhancement**: Core functionality works without JavaScript; enhanced with JS modules

---

## 2. Backend Core Components

### 2.1 Data Layer - Upstash Redis

| Component | Specification |
|-----------|----------------|
| **Provider** | Upstash Inc. |
| **Protocol** | REST API over HTTPS |
| **Authentication** | Token-based (Bearer token in header) |
| **Pricing Model** | Pay-per-request (Serverless) |
| **Geo-replication** | Multi-region by default |
| **Persistence** | In-memory with optional persistence |

### 2.2 Redis Data Types Utilization

| Redis Type | Keys | Purpose |
|------------|------|---------|
| **String (JSON)** | `user:{email}`, `ticket:{id}`, `session:{token}` | Structured data storage |
| **Sorted Set** | `tickets:open`, `tickets:closed` | Chronological ordering |
| **Set** | `tickets:user:{email}:open`, `tickets:user:{email}:closed` | User's ticket indexes |
| **Integer** | `ticket:counter` | Auto-increment ID |

### 2.3 API Module Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API MODULE (js/app.js)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AUTHENTICATION                                    │   │
│  │  register(email, password, name) → Session                          │   │
│  │  login(email, password) → Session                                    │   │
│  │  logout() → void                                                     │   │
│  │  validateSession() → User | null                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TICKETS                                         │   │
│  │  createTicket(title, desc, email) → ticketId                        │   │
│  │  getTicket(id) → Ticket | null                                       │   │
│  │  getOpenTickets() → Ticket[]                                         │   │
│  │  getClosedTickets() → Ticket[]                                       │   │
│  │  closeTicket(id, response) → void                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       UTILITIES                                       │   │
│  │  searchTickets(tickets, query) → Ticket[]                            │   │
│  │  escapeHtml(text) → string                                           │   │
│  │  formatDate(timestamp) → string                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Core Components

### 3.1 Page Structure

| Page | Route | Purpose | Auth Required |
|------|-------|--------|---------------|
| **index.html** | `/` | Public dashboard, statistics | No |
| **login.html** | `/login.html` | Authentication (login/register) | No |
| **dashboard.html** | `/dashboard.html` | User panel (my tickets) | Yes (user role) |
| **admin.html** | `/admin.html` | Admin panel (manage all) | Yes (admin role) |

### 3.2 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE DEPENDENCIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                        HTML PAGES                                  │    │
│    │  index.html  ────── login.html  ────── dashboard.html  ── admin │    │
│    └──────────────────────┬───────────────────────────────────────────┘    │
│                           │                                                │
│                           ▼                                                │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                    JAVASCRIPT MODULES                             │    │
│    │                      js/app.js                                     │    │
│    │                  ┌──────┴──────┐                                  │    │
│    │                  │             │                                   │    │
│    │              Security      Utilities                              │    │
│    │           (sha256, token)  (escapeHtml, formatDate)              │    │
│    └──────────────────────┬───────────────────────────────────────────┘    │
│                           │                                                │
│                           ▼                                                │
│    ┌──────────────────────────────────────────────────────────────────┐    │
│    │                  UPSTASH REDIS (Cloud)                             │    │
│    └──────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Session Management Architecture

### 4.1 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SESSION LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Login Form] ──submit──▶ [Validate Credentials]                            │
│                                        │                                   │
│                                        ▼                                   │
│                               [Hash Password + Salt]                        │
│                                        │                                   │
│                                        ▼                                   │
│                               [Compare with stored hash]                    │
│                                        │                                   │
│                         ┌──────────────┴──────────────┐                   │
│                         │                               │                   │
│                         ▼                               ▼                   │
│                    [Success]                      [Failure]                 │
│                         │                               │                   │
│                         ▼                               ▼                   │
│              [Generate 256-bit Token]          [Show Error Toast]          │
│                         │                                                       │
│                         ▼                                                       │
│              [Store Session in Redis]                                        │
│              [Set EXPIRE 86400 seconds]                                     │
│                         │                                                       │
│                         ▼                                                       │
│              [Return to Dashboard]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Error Handling Strategy

### 5.1 Error Categories

| Category | Code | Handling |
|----------|------|----------|
| **Validation** | 400 | Client-side HTML5 + JS validation |
| **Authentication** | 401 | Redirect to login.html |
| **Authorization** | 403 | Redirect to appropriate panel |
| **Not Found** | 404 | Toast notification + graceful fallback |
| **Server Error** | 500 | Toast error message |
| **Network Error** | NET | Toast "Connection error" + retry |

---

## 6. Performance Characteristics

### 6.1 Latency Benchmarks

| Operation | Typical Latency | Notes |
|-----------|----------------|-------|
| **Page Load (cached)** | 50-200ms | CDN edge cached |
| **Page Load (uncached)** | 200-500ms | First visit |
| **Redis GET** | 50-150ms | Round trip to Upstash |
| **Redis SET** | 50-150ms | Write operation |
| **Session Validation** | 100-200ms | Two Redis calls |

---

## 7. Scalability Considerations

### 7.1 Horizontal Scaling

Since this is a serverless architecture:
- **No application server to scale**: Static files served from CDN
- **Redis auto-scales**: Upstash handles scaling automatically
- **Stateless clients**: Any browser can connect

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
