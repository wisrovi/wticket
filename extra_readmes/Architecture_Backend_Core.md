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

```mermaid
graph TB
    subgraph Edge["CDN Edge Network"]
        GP[GitHub Pages<br/>Static Assets]
    end
    
    subgraph Client["Client Environment"]
        Browser[Web Browser<br/>Chrome/Firefox/Safari/Edge]
        PWA[Service Worker<br/>Offline Cache]
        SW[Static Resources<br/>HTML/CSS/JS]
    end
    
    subgraph Upstash["Upstash Cloud Infrastructure"]
        RedisAPI[Redis REST API<br/>TLS Encrypted]
        RedisDB[(Redis Database<br/>Serverless)]
    end
    
    Browser -->|HTTPS| GP
    GP -->|Serve Files| SW
    Browser -->|HTTPS/REST| RedisAPI
    RedisAPI -->|Read/Write| RedisDB
    Browser -->|Background| PWA
    
    style Edge fill:#e3f2fd,stroke:#1976d2
    style Client fill:#e8f5e9,stroke:#388e3c
    style Upstash fill:#fff3e0,stroke:#f57c00
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

```mermaid
classDiagram
    class RedisConnection {
        <<singleton>>
        -url: string
        -token: string
        +get(key) Promise~any~
        +set(key, value) Promise~void~
        +hgetall(key) Promise~object~
        +hset(key, data) Promise~number~
        +zadd(key, data) Promise~number~
        +sadd(key, member) Promise~number~
        +incr(key) Promise~number~
    }
    
    class TicketCounter {
        +getNextId() number
    }
    
    class TicketHash {
        +id: number
        +title: string
        +description: string
        +userEmail: string
        +status: "open"|"closed"
        +createdAt: number
        +response: string
        +responseAt: number
    }
    
    class SessionHash {
        +email: string
        +name: string
        +role: string
        +createdAt: number
        +expiresAt: number
    }
    
    class UserHash {
        +email: string
        +passwordHash: string
        +name: string
        +role: string
        +createdAt: number
    }
    
    class SortedSet {
        +tickets:open
        +tickets:closed
        Score: Unix timestamp
        Member: ticket ID
    }
    
    class Set {
        +tickets:user:{email}:open
        +tickets:user:{email}:closed
        Members: ticket IDs
    }
    
    RedisConnection --> TicketCounter
    RedisConnection --> TicketHash
    RedisConnection --> SessionHash
    RedisConnection --> UserHash
    RedisConnection --> SortedSet
    RedisConnection --> Set
```

### 2.3 API Module Structure (js/app.js)

```mermaid
classDiagram
    class API {
        <<module>>
        +init() Promise~void~
        +register() Promise~Session~
        +login() Promise~Session~
        +logout() Promise~void~
        +validateSession() Promise~User~
        +createTicket() Promise~number~
        +getTicket() Promise~Ticket~
        +getOpenTickets() Promise~Ticket[]~
        +getClosedTickets() Promise~Ticket[]~
        +getUserOpenTickets() Promise~Ticket[]~
        +getUserClosedTickets() Promise~Ticket[]~
        +closeTicket() Promise~void~
        +getStats() Promise~Stats~
        +searchTickets() Ticket[]
        +requireAuth() Function
    }
    
    class Security {
        +sha256() string
        +hashPassword() string
        +generateToken() string
        +escapeHtml() string
    }
    
    class Utilities {
        +formatDate() string
    }
    
    API --> Security
    API --> Utilities
```

---

## 3. Frontend Core Components

### 3.1 Page Structure

| Page | Route | Purpose | Auth Required |
|------|-------|--------|---------------|
| **index.html** | `/` | Public dashboard, statistics | No |
| **login.html** | `/login.html` | Authentication (login/register) | No (redirects if authenticated) |
| **dashboard.html** | `/dashboard.html` | User panel (my tickets) | Yes (user role) |
| **admin.html** | `/admin.html` | Admin panel (manage all) | Yes (admin role) |

### 3.2 Module Dependency Graph

```mermaid
graph TD
    subgraph Pages["HTML Pages"]
        index[index.html<br/>Dashboard]
        login[login.html<br/>Auth]
        dashboard[dashboard.html<br/>User Panel]
        admin[admin.html<br/>Admin Panel]
    end
    
    subgraph Modules["JavaScript Modules"]
        app[js/app.js<br/>Core API]
        toast[js/toast.js<br/>Notifications]
    end
    
    subgraph Assets["Static Assets"]
        css[css/styles.css<br/>Design System]
        sw[service-worker.js<br/>PWA Cache]
        manifest[manifest.json<br/>PWA Config]
    end
    
    index --> app
    index --> toast
    index --> css
    index --> sw
    index --> manifest
    
    login --> app
    login --> toast
    login --> css
    login --> sw
    
    dashboard --> app
    dashboard --> toast
    dashboard --> css
    dashboard --> sw
    
    admin --> app
    admin --> toast
    admin --> css
    admin --> sw
    
    style Modules fill:#fff3e0
    style Assets fill:#e3f2fd
```

---

## 4. Session Management Architecture

### 4.1 Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> LoginForm: User submits credentials
    LoginForm --> ValidateCredentials: POST /login
    
    state ValidateCredentials {
        [*] --> HashPassword: SHA-256 + salt
        HashPassword --> LookupUser: Query Redis
        LookupUser --> CompareHash: Retrieve stored hash
        CompareHash --> Success: Hashes match
        CompareHash --> Failure: Hashes differ
    }
    
    ValidateCredentials --> GenerateToken: Success
    GenerateToken --> StoreSession: Redis HSET
    StoreSession --> SetLocalStorage: Browser localStorage
    SetLocalStorage --> Dashboard: Redirect user
    
    ValidateCredentials --> ErrorToast: Failure
    ErrorToast --> LoginForm: Retry
    
    Dashboard --> ActiveSession: User interacting
    ActiveSession --> ValidateOnEachRequest: Every API call
    ActiveSession --> Logout: User clicks logout
    Logout --> DeleteSession: Redis DEL
    DeleteSession --> ClearLocalStorage: Browser
    ClearLocalStorage --> LoginForm: Redirect
    
    ActiveSession --> SessionExpired: TTL reached
    SessionExpired --> ClearLocalStorage: Auto-cleanup
    ClearLocalStorage --> LoginForm: Redirect
```

### 4.2 Session Storage Schema

```
session:{token} (Hash)
├── email: String        # User's email address
├── name: String         # Cached display name
├── role: String         # "user" | "admin"
├── createdAt: Integer    # Unix timestamp (ms)
└── expiresAt: Integer    # TTL timestamp (ms)
    └── EXPIRE: 86400 seconds (24 hours)
```

---

## 5. Authentication Flow

### 5.1 Registration Sequence

```mermaid
sequenceDiagram
    participant B as Browser
    participant App as js/app.js
    participant R as Upstash Redis
    
    B->>App: register(email, password, name)
    
    rect rgb(255, 240, 230)
        Note over App,R: Validation Phase
        App->>R: EXISTS user:{email}
        R-->>App: 0 (not exists)
    end
    
    rect rgb(230, 255, 230)
        Note over App,R: Password Hashing
        App->>App: sha256(password + "wticket_salt")
        Note right of App: Uses Web Crypto API<br/>crypto.subtle.digest('SHA-256')
    end
    
    rect rgb(230, 240, 255)
        Note over App,R: User Creation
        App->>R: HSET user:{email}<br/>{email, passwordHash, name, role, createdAt}
        R-->>App: OK
    end
    
    App->>App: login(email, password)
    App->>R: HGETALL user:{email}
    App->>R: HSET session:{token}
    App->>R: EXPIRE session:{token} 86400
    R-->>App: {token, user}
    App-->>B: Session object
```

### 5.2 Login Sequence

```mermaid
sequenceDiagram
    participant B as Browser
    participant App as js/app.js
    participant R as Upstash Redis
    
    B->>App: login(email, password)
    
    rect rgb(255, 240, 230)
        Note over App,R: User Lookup
        App->>R: HGETALL user:{email}
        R-->>App: {passwordHash, name, role, ...}
    end
    
    alt User Not Found
        App-->>B: throw Error("Usuario no encontrado")
    else User Found
        App->>App: sha256(password + "wticket_salt")
        App->>App: Compare with stored hash
    end
    
    alt Password Mismatch
        App-->>B: throw Error("Contraseña incorrecta")
    else Password Match
        App->>App: Generate 256-bit token<br/>crypto.getRandomValues(32)
        App->>R: HSET session:{token}<br/>{email, name, role, expiresAt}
        App->>R: EXPIRE session:{token} 86400
        R-->>App: OK
        App-->>B: {token, user: {email, name, role}}
    end
```

---

## 6. Error Handling Strategy

### 6.1 Error Categories

| Category | Code | Handling |
|----------|------|----------|
| **Validation** | 400 | Client-side HTML5 + JS validation |
| **Authentication** | 401 | Redirect to login.html |
| **Authorization** | 403 | Redirect to appropriate panel |
| **Not Found** | 404 | Toast notification + graceful fallback |
| **Server Error** | 500 | Toast error message |
| **Network Error** | NET | Toast "Connection error" + retry |

### 6.2 Error Flow Diagram

```mermaid
flowchart TD
    Start[API Call] --> Check{Response OK?}
    Check -->|Yes| Process[Process Data]
    Check -->|No| ErrorType{Error Type?}
    
    ErrorType -->|401| RedirectLogin[Redirect to<br/>login.html]
    ErrorType -->|403| RedirectPanel[Redirect to<br/>correct panel]
    ErrorType -->|404| ShowToast[Show Toast<br/>Not Found]
    ErrorType -->|NET| Retry[Show Toast<br/>Retry option]
    
    Process --> UpdateUI[Update UI]
    UpdateUI --> End[Done]
    ShowToast --> End
    Retry --> Start
    
    style ErrorType fill:#ffcdd2
    style Process fill:#c8e6c9
```

---

## 7. Performance Characteristics

### 7.1 Latency Benchmarks

| Operation | Typical Latency | Notes |
|-----------|----------------|-------|
| **Page Load (cached)** | 50-200ms | CDN edge cached |
| **Page Load (uncached)** | 200-500ms | First visit |
| **Redis GET** | 50-150ms | Round trip to Upstash |
| **Redis HSET** | 50-150ms | Write operation |
| **Session Validation** | 100-200ms | Two Redis calls |

### 7.2 Optimization Strategies

1. **Service Worker Caching**: Static assets cached after first load
2. **ES Module CDN**: esm.sh for optimized module delivery
3. **Auto-refresh Throttling**: 30-second intervals prevent excessive API calls
4. **Client-side Filtering**: Search filters run in-browser, not server-side

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

Since this is a serverless architecture:
- **No application server to scale**: Static files served from CDN
- **Redis auto-scales**: Upstash handles scaling automatically
- **Stateless clients**: Any browser can connect

### 8.2 Vertical Scaling Limits

| Component | Limit | Mitigation |
|-----------|-------|------------|
| **Ticket count** | Redis memory | Archive old tickets |
| **User count** | Redis memory | Pagination if needed |
| **Search** | Client-side only | Implement server-side search |
| **Session storage** | Redis memory | Session cleanup cron |

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
