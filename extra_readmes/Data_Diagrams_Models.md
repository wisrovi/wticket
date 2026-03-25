# Data Diagrams & Models Documentation

> **Technical Reference**: This document provides comprehensive data models, entity relationships, and schema definitions for the ticket management microservice.

---

## 1. Entity Relationship Diagram

### 1.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│     ┌──────────────┐                                                       │
│     │    USER      │                                                       │
│     ├──────────────┤                                                       │
│     │ email (PK)   │                                                       │
│     │ passwordHash  │                                                       │
│     │ name         │                                                       │
│     │ role         │                                                       │
│     │ createdAt    │                                                       │
│     └──────┬───────┘                                                       │
│            │                                                                │
│            │ creates                                                        │
│            │                                                                │
│            ▼                                                                │
│     ┌──────────────┐                                                       │
│     │   TICKET     │                                                       │
│     ├──────────────┤                                                       │
│     │ id (PK)      │                                                       │
│     │ title        │                                                       │
│     │ description  │                                                       │
│     │ userEmail(FK)│                                                       │
│     │ status       │                                                       │
│     │ createdAt    │                                                       │
│     │ response     │                                                       │
│     │ responseAt   │                                                       │
│     └──────────────┘                                                       │
│                                                                             │
│     ┌──────────────┐                                                       │
│     │   SESSION    │                                                       │
│     ├──────────────┤                                                       │
│     │ token (PK)   │◀────── has (1:1)                                      │
│     │ email (FK)   │                                                       │
│     │ name         │                                                       │
│     │ role         │                                                       │
│     │ createdAt    │                                                       │
│     │ expiresAt    │                                                       │
│     └──────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Redis Data Models

### 2.1 Key Structure Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REDIS KEY STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         COUNTER                                       │   │
│  │  ticket:counter ────────────────── Integer (auto-increment)         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       TICKET DATA                                     │   │
│  │  ticket:{id} ─────────────── JSON String                              │   │
│  │  ├── id: number                  Primary key                          │   │
│  │  ├── title: string              Sanitized subject                     │   │
│  │  ├── description: string        Optional details                       │   │
│  │  ├── userEmail: string          Creator reference                     │   │
│  │  ├── status: string             "open" | "closed"                     │   │
│  │  ├── createdAt: number          Unix timestamp                        │   │
│  │  ├── response: string           Admin response                        │   │
│  │  └── responseAt: number         Resolution timestamp                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       INDEXES                                         │   │
│  │                                                                       │   │
│  │  tickets:open ──────────── Sorted Set                                │   │
│  │  └── Score: timestamp, Member: ticket ID                              │   │
│  │                                                                       │   │
│  │  tickets:closed ─────────── Sorted Set                                │   │
│  │  └── Score: timestamp, Member: ticket ID                              │   │
│  │                                                                       │   │
│  │  tickets:user:{email}:open ─── Set                                    │   │
│  │  └── Members: ticket IDs (user's open tickets)                         │   │
│  │                                                                       │   │
│  │  tickets:user:{email}:closed ─── Set                                  │   │
│  │  └── Members: ticket IDs (user's closed tickets)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       USER DATA                                       │   │
│  │  user:{email} ─────────────── JSON String                             │   │
│  │  ├── email: string               Unique identifier                   │   │
│  │  ├── passwordHash: string        SHA-256 + salt                       │   │
│  │  ├── name: string                Display name                        │   │
│  │  ├── role: string                "user" | "admin"                    │   │
│  │  └── createdAt: number          Registration timestamp              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SESSION DATA                                      │   │
│  │  session:{token} ───────────── JSON String (TTL: 24h)                  │   │
│  │  ├── email: string               Associated user                       │   │
│  │  ├── name: string                Cached display name                   │   │
│  │  ├── role: string                Cached role                          │   │
│  │  ├── createdAt: number          Login timestamp                       │   │
│  │  └── expiresAt: number          Expiry timestamp                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. JSON Data Schemas

### 3.1 User Schema

```json
{
  "email": "string (required, unique)",
  "passwordHash": "string (SHA-256 hex, 64 chars)",
  "name": "string (display name)",
  "role": "string (enum: 'user' | 'admin')",
  "createdAt": "number (Unix timestamp ms)"
}
```

### 3.2 Ticket Schema

```json
{
  "id": "number (auto-increment)",
  "title": "string (XSS sanitized, max 500)",
  "description": "string (XSS sanitized, optional)",
  "userEmail": "string (creator's email)",
  "status": "string (enum: 'open' | 'closed')",
  "createdAt": "number (Unix timestamp ms)",
  "response": "string (admin reply, XSS sanitized)",
  "responseAt": "number (resolution timestamp)"
}
```

### 3.3 Session Schema

```json
{
  "email": "string (user email)",
  "name": "string (display name)",
  "role": "string (enum: 'user' | 'admin')",
  "createdAt": "number (Unix timestamp ms)",
  "expiresAt": "number (TTL timestamp)"
}
```

---

## 4. Data Flow Diagrams

### 4.1 Registration Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REGISTRATION DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT                    PROCESSING                  STORAGE              │
│  ─────                    ──────────                  ────────             │
│                                                                             │
│  email ─────────────────▶ [Validate format]                               │
│  password ───────────────▶ [SHA-256 + salt] ──────▶ passwordHash           │
│  name ───────────────────▶ [Optional default]                               │
│                                          │                                 │
│                                          ▼                                 │
│                              [Redis SET user:{email}]                      │
│                              [Redis SET users:count]                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Ticket Creation Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TICKET CREATION DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT                    PROCESSING                  STORAGE                │
│  ─────                    ──────────                  ────────             │
│                                                                             │
│  title ──────────────────▶ [escapeHtml()]                                  │
│  description ────────────▶ [escapeHtml()]                                  │
│  userEmail ──────────────▶ [Direct pass]                                    │
│                                                                             │
│                                          │                                 │
│                                          ▼                                 │
│                         ┌─────────────────────────────────┐              │
│                         │      Redis INCR ticket:counter   │              │
│                         └─────────────────────────────────┘              │
│                                          │                                 │
│                                          ▼                                 │
│                         ┌─────────────────────────────────┐              │
│                         │   Redis SET ticket:{id}         │              │
│                         │   Redis ZADD tickets:open       │              │
│                         │   Redis SADD user:open           │              │
│                         └─────────────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Integrity Constraints

### 5.1 Constraints Matrix

| Constraint | Type | Enforcement |
|------------|------|-------------|
| Email uniqueness | UNIQUE | Redis key prefix `user:{email}` |
| Ticket ID uniqueness | AUTO_INCREMENT | Redis INCR command |
| Role values | ENUM | Client-side validation |
| Status transitions | STATE_MACHINE | closeTicket() only |
| Session expiry | TTL | Redis SET with EX option |

### 5.2 State Transition Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STATE TRANSITION DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                     ┌──────────────────┐                                    │
│                     │                  │                                    │
│                     │    [START]       │                                    │
│                     │                  │                                    │
│                     └────────┬─────────┘                                    │
│                              │                                              │
│                              │ createTicket()                               │
│                              │                                              │
│                              ▼                                              │
│                     ┌──────────────────┐                                    │
│                     │                  │                                    │
│                     │       OPEN        │◀──────┐                          │
│                     │                  │       │                          │
│                     └────────┬─────────┘       │                          │
│                              │                  │                          │
│                              │                  │ createTicket()           │
│                              │ closeTicket()   │                          │
│                              │                  │                          │
│                              ▼                  │                          │
│                     ┌──────────────────┐       │                          │
│                     │                  │       │                          │
│                     │      CLOSED      │──────┘                          │
│                     │                  │                                  │
│                     └──────────────────┘                                  │
│                                                                             │
│  OPEN:   Valid initial state, ticket is pending resolution                 │
│  CLOSED: Terminal state, ticket has been resolved                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
