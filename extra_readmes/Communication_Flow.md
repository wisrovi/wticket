# Communication Flow Documentation

> **Technical Reference**: This document details all communication patterns, data flows, and integration points of the ticket management microservice.

---

## 1. External Communication Overview

### 1.1 Communication Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMUNICATION TOPOLOGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                       EXTERNAL SYSTEMS                                │ │
│   │                         User Browser                                  │ │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│               ┌──────────────────┴──────────────────┐                    │
│               │                                     │                    │
│               ▼                                     ▼                    │
│   ┌───────────────────────┐         ┌───────────────────────┐           │
│   │     CDN NETWORK       │         │   UPSTASH REDIS API   │           │
│   │   (GitHub Pages)     │         │    (HTTPS/TLS)       │           │
│   └───────────────────────┘         └───────────────────────┘           │
│               │                                     │                    │
│               │         ┌───────────────────────────────┘                │
│               │         │                                                 │
│               ▼         ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────┐         │
│   │                   APPLICATION LAYER                           │         │
│   │  HTML Pages ──── JavaScript (app.js) ──── CSS (styles.css) │         │
│   └─────────────────────────────────────────────────────────────┘         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────┐         │
│   │                      PWA LAYER                               │         │
│   │  Service Worker ──── Cache API ──── Manifest                 │         │
│   └─────────────────────────────────────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Protocol Summary

| Communication Path | Protocol | Security | Port |
|-------------------|----------|----------|------|
| Browser → CDN | HTTPS | TLS 1.3 | 443 |
| Browser → Upstash | HTTPS | TLS 1.3 | 443 |
| CDN → Browser | HTTPS | TLS 1.3 | 443 |
| Service Worker → Cache | Internal | N/A | N/A |

---

## 2. Authentication Communication Patterns

### 2.1 Login/Register Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION SEQUENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER ────▶ [Login Form] ────▶ js/app.js.login()                          │
│                                    │                                       │
│                                    ▼                                       │
│                            [Redis GET user:{email}]                         │
│                                    │                                       │
│                                    ▼                                       │
│                      [Compare password hash]                                │
│                         │          │                                       │
│                    [Match]      [Mismatch]                                │
│                         │          │                                       │
│                         ▼          ▼                                       │
│                [Generate Token]  [Throw Error]                             │
│                         │                                                       │
│                         ▼                                                       │
│                [Redis SET session:{token}]                                  │
│                         │                                                       │
│                         ▼                                                       │
│                [Return {token, user}]                                       │
│                         │                                                       │
│                         ▼                                                       │
│                [Redirect to panel]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Session Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SESSION VALIDATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Protected Page Load]                                                      │
│         │                                                                   │
│         ▼                                                                   │
│  [Get token from localStorage]                                              │
│         │                                                                   │
│         ▼                                                                   │
│  [Token exists?] ────No───▶ [Redirect to login]                            │
│         │                                                                     │
│        Yes                                                                  │
│         │                                                                     │
│         ▼                                                                   │
│  [Redis GET session:{token}]                                                │
│         │                                                                   │
│         ▼                                                                   │
│  [Session found?] ────No───▶ [Clear localStorage + Redirect]               │
│         │                                                                     │
│        Yes                                                                  │
│         │                                                                     │
│         ▼                                                                   │
│  [Session expired?] ────Yes───▶ [Delete + Clear + Redirect]                │
│         │                                                                     │
│        No                                                                   │
│         │                                                                     │
│         ▼                                                                   │
│  [Role authorized?] ────No───▶ [Redirect to correct panel]                  │
│         │                                                                     │
│        Yes                                                                  │
│         │                                                                     │
│         ▼                                                                   │
│  [Render protected content]                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Ticket Operations Communication

### 3.1 Create Ticket Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TICKET CREATION SEQUENCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER ────▶ [Fill form + Submit] ────▶ createTicket(title, desc, email)   │
│                                                   │                         │
│                                                   ▼                         │
│                                       [Redis INCR ticket:counter]            │
│                                                   │                         │
│                                                   ▼                         │
│                                        [XSS Sanitize (escapeHtml)]          │
│                                                   │                         │
│                                                   ▼                         │
│                              [Redis SET ticket:{id} {ticketData}]          │
│                                                   │                         │
│                              ┌────────────────────┴────────────────────┐   │
│                              │                                         │   │
│                              ▼                                         ▼   │
│               [Redis ZADD tickets:open]              [Redis SADD user:open]│
│                              │                                         │   │
│                              └────────────────────┬────────────────────┘   │
│                                                   │                         │
│                                                   ▼                         │
│                                       [Return ticketId]                     │
│                                                   │                         │
│                                                   ▼                         │
│                                [Show success toast + Refresh list]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Close Ticket Flow (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TICKET RESOLUTION SEQUENCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ADMIN ────▶ [Click "Atender"] ────▶ [Open respond modal]                 │
│                                                   │                         │
│                                                   ▼                         │
│                              [Enter response + Submit]                       │
│                                                   │                         │
│                                                   ▼                         │
│                                      closeTicket(id, response)              │
│                                                   │                         │
│                                                   ▼                         │
│                              [Redis GET ticket:{id}]                        │
│                                                   │                         │
│                                                   ▼                         │
│              [Redis SET ticket:{id} {status: closed, response}]              │
│                                                   │                         │
│                              ┌────────────────────┴────────────────────┐   │
│                              │                     │                    │   │
│                              ▼                     ▼                    ▼   │
│                   [ZREM tickets:open]    [ZADD tickets:closed]  [Update] │
│                              │                     │                    │   │
│                              └────────────────────┴────────────────────┘   │
│                                                   │                         │
│                                                   ▼                         │
│                               [Show success toast + Refresh lists]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Real-Time Updates Communication

### 4.1 Auto-Refresh Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTO-REFRESH PATTERN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Every 30 seconds]                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PARALLEL QUERIES                                 │   │
│  │                                                                       │   │
│  │   ZRANGE tickets:open ────▶ Open ticket IDs                         │   │
│  │   ZRANGE tickets:closed ───▶ Closed ticket IDs                       │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  [For each ID: Redis GET ticket:{id}]                                      │
│         │                                                                   │
│         ▼                                                                   │
│  [Return tickets array + Re-render UI]                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Service Worker Communication

### 5.1 Cache Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHE STRATEGY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Browser Request]                                                         │
│         │                                                                   │
│         ▼                                                                   │
│  [Check Cache]                                                             │
│         │                                                                   │
│    ┌────┴────┐                                                             │
│    │         │                                                             │
│  [Hit]   [Miss]                                                           │
│    │         │                                                             │
│    │         ▼                                                             │
│    │   [Fetch from Network]                                                │
│    │         │                                                             │
│    │         ▼                                                             │
│    │   [Cache Response + Return]                                           │
│    │         │                                                             │
│    └────┬────┘                                                             │
│         │                                                                   │
│         ▼                                                                   │
│  [Return Response]                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Error Communication Paths

### 6.1 Network Error Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [API Call]                                                                │
│       │                                                                     │
│       ▼                                                                     │
│  [Network Available?] ────No───▶ [Toast: Network Error]                    │
│       │                                                                     │
│      Yes                                                                    │
│       │                                                                     │
│       ▼                                                                     │
│  [Upstash Reachable?] ────No───▶ [Toast: Service Unavailable]               │
│       │                                                                     │
│      Yes                                                                    │
│       │                                                                     │
│       ▼                                                                     │
│  [Operation Success?] ────No───▶ [Toast: Error + Log]                     │
│       │                                                                     │
│      Yes                                                                    │
│       │                                                                     │
│       ▼                                                                     │
│  [Process Response]                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
