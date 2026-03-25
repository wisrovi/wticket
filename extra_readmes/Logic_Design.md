# Logic Design Documentation

> **Technical Reference**: This document details the business logic, algorithms, and decision flows of the ticket management microservice.

---

## 1. Business Logic Overview

### 1.1 Core Business Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS RULES ENGINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        CORE RULES                                      │  │
│  │                                                                       │  │
│  │  BR-001: Ticket IDs are sequential integers starting from 1          │  │
│  │  BR-002: Passwords must be hashed before storage (SHA-256 + salt)     │  │
│  │  BR-003: Sessions expire after 24 hours (TTL)                        │  │
│  │  BR-004: Only admins can resolve tickets                              │  │
│  │  BR-005: Users can only view their own tickets                        │  │
│  │  BR-006: Ticket status transitions: open → closed only               │  │
│  │  BR-007: Admin user is auto-created on first init                    │  │
│  │  BR-008: All user inputs are XSS-sanitized                           │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       INPUT VALIDATIONS                               │  │
│  │                                                                       │  │
│  │  V-001: Email must be valid format                                    │  │
│  │  V-002: Password minimum 4 characters                                │  │
│  │  V-003: Title is required                                            │  │
│  │  V-004: XSS sanitization on all text inputs                          │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Logic

### 2.1 Password Hashing Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PASSWORD HASHING ALGORITHM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [User Password]                                                           │
│        │                                                                    │
│        ▼                                                                    │
│  [Append Salt: "wticket_salt"]                                              │
│        │                                                                    │
│        ▼                                                                    │
│  [Concatenate: password + "wticket_salt"]                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [UTF-8 Encode]                                                            │
│        │                                                                    │
│        ▼                                                                    │
│  [Web Crypto API: crypto.subtle.digest('SHA-256')]                          │
│        │                                                                    │
│        ▼                                                                    │
│  [Convert to Hexadecimal String]                                           │
│        │                                                                    │
│        ▼                                                                    │
│  [Store in Redis]                                                          │
│                                                                             │
│  Example:                                                                  │
│  Input:  "mypassword"                                                      │
│  Salt:   "wticket_salt"                                                   │
│  Output: "a1b2c3d4e5f6..." (64-character hex string)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Token Generation Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOKEN GENERATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Generate 32 random bytes]                                                 │
│        │                                                                    │
│        ▼                                                                    │
│  [crypto.getRandomValues(new Uint8Array(32))]                              │
│        │                                                                    │
│        ▼                                                                    │
│  [Convert each byte to 2-character hex]                                     │
│        │                                                                    │
│        ▼                                                                    │
│  [Join into 64-character string]                                           │
│        │                                                                    │
│        ▼                                                                    │
│  [Store as session:{token} with 24h TTL]                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Session Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SESSION VALIDATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Start: Validate Session]                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [localStorage.getItem('wticket_token')]                                   │
│        │                                                                    │
│        ▼                                                                    │
│  [Token exists?] ────No───▶ [Return null]                                   │
│        │                                                                    │
│       Yes                                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis GET session:{token}]                                                │
│        │                                                                    │
│        ▼                                                                    │
│  [Session found?] ────No───▶ [Clear localStorage] ────▶ [Return null]     │
│        │                                                                    │
│       Yes                                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [Date.now() < expiresAt?] ────No───▶ [Redis DEL session]                 │
│        │                                                                    │
│       Yes                                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [Return {email, name, role}]                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Ticket Management Logic

### 3.1 Ticket Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TICKET CREATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Create Ticket Request]                                                    │
│        │                                                                    │
│        ▼                                                                    │
│  [Validate: title required?] ────No───▶ [Throw Error]                      │
│        │                                                                    │
│       Yes                                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [escapeHtml(title)]                                                       │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis INCR ticket:counter] ────▶ [Get next ID]                           │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis SET ticket:{id} {ticketData}]                                      │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis ZADD tickets:open {score: timestamp, member: id}]                  │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis SADD tickets:user:{email}:open {id}]                               │
│        │                                                                    │
│        ▼                                                                    │
│  [Return ticketId]                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Ticket Closure Flow (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TICKET CLOSURE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Admin Close Request]                                                     │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis GET ticket:{id}]                                                   │
│        │                                                                    │
│        ▼                                                                    │
│  [Ticket found?] ────No───▶ [Throw Error]                                   │
│        │                                                                    │
│       Yes                                                                  │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis SET ticket:{id} {status: "closed", response, responseAt}]         │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis ZREM tickets:open {id}]                                            │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis ZADD tickets:closed {score: timestamp, member: id}]              │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis SREM tickets:user:{email}:open {id}]                               │
│        │                                                                    │
│        ▼                                                                    │
│  [Redis SADD tickets:user:{email}:closed {id}]                             │
│        │                                                                    │
│        ▼                                                                    │
│  [Return void]                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Search Logic

### 4.1 Search Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEARCH ALGORITHM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  function searchTickets(tickets, query) {                                  │
│                                                                             │
│      if (!query) return tickets;                                            │
│                                                                             │
│      const q = query.toLowerCase();                                        │
│                                                                             │
│      return tickets.filter(ticket => {                                      │
│          const titleMatch = ticket.title.toLowerCase().includes(q);        │
│          const idMatch = ticket.id.toString().includes(q);                │
│          return titleMatch || idMatch;                                      │
│      });                                                                   │
│  }                                                                         │
│                                                                             │
│  Example:                                                                  │
│  Tickets: [{id: 1, title: "Login issue"}, {id: 2, title: "Bug report"}] │
│  Query: "login"                                                            │
│  Result: [{id: 1, title: "Login issue"}]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. XSS Protection Logic

### 5.1 Sanitization Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        XSS SANITIZATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [User Input]                                                              │
│        │                                                                    │
│        ▼                                                                    │
│  [Create temporary div element]                                              │
│        │                                                                    │
│        ▼                                                                    │
│  [Set textContent (auto-escapes HTML)]                                      │
│        │                                                                    │
│        ▼                                                                    │
│  [Read innerHTML]                                                           │
│        │                                                                    │
│        ▼                                                                    │
│  [Return sanitized string]                                                  │
│                                                                             │
│  Example:                                                                  │
│  Input:  "<script>alert('xss')</script>"                                  │
│  Output: "&lt;script&gt;alert('xss')&lt;/script&gt;"                    │
│                                                                             │
│  Input:  "Normal text"                                                    │
│  Output: "Normal text"                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Error Handling Logic

### 6.1 Error Classification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ERROR CLASSIFICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ERROR TYPES                                    │   │
│  │                                                                       │   │
│  │  E1: Validation Error (400)    ──▶ Toast error + form validation  │   │
│  │  E2: Auth Error (401)          ──▶ Redirect to login               │   │
│  │  E3: Not Found (404)          ──▶ Toast + log                    │   │
│  │  E4: Server Error (500)        ──▶ Toast + retry option            │   │
│  │  E5: Network Error            ──▶ Toast + disable buttons          │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
