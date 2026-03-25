# Communication Flow Documentation

> **Technical Reference**: This document details all communication patterns, data flows, and integration points of the ticket management microservice.

---

## 1. External Communication Overview

### 1.1 Communication Topology

```mermaid
graph TB
    subgraph External["External Systems"]
        User[(User<br/>Browser)]
        CDN[CDN Network<br/>GitHub Pages]
    end
    
    subgraph Application["Application Layer"]
        HTML[HTML Pages<br/>index, login, dashboard, admin]
        JS[JavaScript<br/>app.js, toast.js]
        CSS[CSS<br/>styles.css]
    end
    
    subgraph Data["Data Layer"]
        UpstashAPI[Upstash REST API<br/>HTTPS]
        RedisDB[(Redis<br/>Serverless)]
    end
    
    subgraph PWA["Progressive Web App"]
        SW[Service Worker<br/>Cache Layer]
        Manifest[PWA Manifest<br/>App Metadata]
    end
    
    User -->|HTTPS GET| CDN
    CDN -->|Serve Static| HTML
    CDN -->|Serve Static| CSS
    CDN -->|Serve Module| JS
    User -->|HTTPS POST/GET| UpstashAPI
    UpstashAPI -->|Read/Write| RedisDB
    User -->|Background Sync| SW
    User -->|Install Prompt| Manifest
    
    style External fill:#e3f2fd
    style Application fill:#e8f5e9
    style Data fill:#fff3e0
    style PWA fill:#fce4ec
```

### 1.2 Protocol Summary

| Communication Path | Protocol | Security | Port |
|-------------------|----------|----------|------|
| Browser → CDN | HTTPS | TLS 1.3 | 443 |
| Browser → Upstash | HTTPS | TLS 1.3 | 443 |
| CDN → Browser | HTTPS | TLS 1.3 | 443 |
| Service Worker → Cache | Internal | N/A | N/A |

---

## 2. Internal Module Communication

### 2.1 Module Dependency Flow

```mermaid
flowchart LR
    subgraph HTML["HTML Pages"]
        index[index.html]
        login[login.html]
        dashboard[dashboard.html]
        admin[admin.html]
    end
    
    subgraph JS["JavaScript Modules"]
        app[app.js<br/>Core API]
        toast[toast.js<br/>Notifications]
    end
    
    subgraph Redis["Upstash Redis"]
        API[REST API]
        DB[(Database)]
    end
    
    HTML -->|import| JS
    app -->|HTTPS| API
    API -->|Read/Write| DB
    app -->|call| toast
    
    style HTML fill:#e3f2fd
    style JS fill:#e8f5e9
    style Redis fill:#fff3e0
```

### 2.2 Cross-Module Data Exchange

```mermaid
sequenceDiagram
    participant HTML as HTML Page
    participant App as app.js
    participant Toast as toast.js
    participant Redis as Upstash
    
    Note over HTML,Redis: Standard User Flow
    
    HTML->>App: import API from './js/app.js'
    HTML->>Toast: import Toast from './js/toast.js'
    
    HTML->>App: API.init()
    App->>Redis: ensureAdminExists()
    Redis-->>App: OK
    
    HTML->>App: API.login(email, password)
    App->>Redis: HGETALL user:{email}
    Redis-->>App: user data
    App->>App: Validate credentials
    App->>Redis: HSET session:{token}
    Redis-->>App: OK
    App-->>HTML: {token, user}
    
    alt Success
        HTML->>Toast: Toast.success("Login successful")
        Toast-->>HTML: Display success toast
    else Failure
        HTML->>Toast: Toast.error("Login failed")
        Toast-->>HTML: Display error toast
    end
```

---

## 3. Authentication Communication Patterns

### 3.1 Login/Register Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant F as Login Form
    participant A as app.js
    participant R as Upstash Redis
    participant LS as localStorage
    participant T as toast.js
    
    rect rgb(240, 248, 255)
        Note over U,T: Login Sequence
        U->>F: Submit credentials
        F->>A: login(email, password)
        A->>R: HGETALL user:{email}
        R-->>A: {passwordHash, ...}
        A->>A: sha256(password + salt)
        alt Credentials Valid
            A->>A: generateToken()
            A->>R: HSET session:{token}
            A->>R: EXPIRE session:{token} 86400
            R-->>A: OK
            A->>LS: setItem('wticket_token', token)
            A-->>F: {token, user}
            F->>T: Toast.success()
            T-->>F: Show notification
            F->>U: Redirect to panel
        else Invalid Credentials
            A-->>F: throw Error
            F->>T: Toast.error()
            T-->>F: Show error
        end
    end
```

### 3.2 Session Validation Flow

```mermaid
sequenceDiagram
    participant P as Protected Page
    participant A as app.js
    participant LS as localStorage
    participant R as Upstash Redis
    
    rect rgb(255, 245, 238)
        Note over P,R: On Protected Page Load
        P->>A: requireAuth(['admin'])()
        A->>LS: getItem('wticket_token')
        alt No Token
            A-->>P: Redirect to login.html
        else Token Exists
            A->>R: HGETALL session:{token}
            R-->>A: {email, role, expiresAt}
            alt Session Expired
                A->>R: DEL session:{token}
                A->>LS: removeItem('wticket_token')
                A-->>P: Redirect to login.html
            else Session Valid
                alt Role Authorized
                    A-->>P: Return session object
                    P->>P: Render protected content
                else Role Not Authorized
                    A-->>P: Redirect to appropriate panel
                end
            end
        end
    end
```

---

## 4. Ticket Operations Communication

### 4.1 Create Ticket Flow

```mermaid
sequenceDiagram
    participant U as User
    participant D as dashboard.html
    participant A as app.js
    participant R as Upstash Redis
    participant T as toast.js
    
    rect rgb(230, 255, 230)
        Note over U,R: Ticket Creation Sequence
        U->>D: Fill form + Submit
        D->>A: createTicket(title, desc, email)
        
        par Parallel Redis Operations
            A->>R: INCR ticket:counter
            R-->>A: nextId
        and
            A->>A: escapeHtml(title)
            A->>A: escapeHtml(description)
        end
        
        A->>R: HSET ticket:{id}<br/>{title, desc, userEmail, status, createdAt}
        R-->>A: OK
        
        par Parallel Indexing
            A->>R: ZADD tickets:open<br/>{score: timestamp, member: id}
            R-->>A: 1
            A->>R: SADD tickets:user:{email}:open<br/>{id}
            R-->>A: 1
        end
        
        A-->>D: ticketId
        D->>T: Toast.success("Ticket #X created")
        T-->>D: Show notification
        D->>D: refreshTicketList()
    end
```

### 4.2 Close Ticket Flow (Admin)

```mermaid
sequenceDiagram
    participant A as Admin User
    participant P as admin.html
    participant API as app.js
    participant R as Upstash Redis
    participant T as toast.js
    
    rect rgb(255, 230, 230)
        Note over A,R: Ticket Resolution Sequence
        A->>P: Click "Atender Ticket"
        P->>P: Open respond modal
        A->>P: Enter response + Submit
        P->>API: closeTicket(id, response)
        
        API->>R: HGETALL ticket:{id}
        R-->>API: current ticket data
        
        par Updates
            API->>R: HSET ticket:{id}<br/>{status: "closed", response, responseAt}
            R-->>API: OK
        and
            API->>R: ZREM tickets:open {id}
            R-->>API: 1
            API->>R: ZADD tickets:closed<br/>{score: timestamp, member: id}
            R-->>API: 1
            API->>R: SREM tickets:user:{email}:open {id}
            R-->>API: 1
            API->>R: SADD tickets:user:{email}:closed {id}
            R-->>API: 1
        end
        
        API-->>P: void
        P->>T: Toast.success("Ticket resolved")
        T-->>P: Show notification
        P->>P: Refresh ticket lists
    end
```

---

## 5. Real-Time Updates Communication

### 5.1 Auto-Refresh Pattern

```mermaid
sequenceDiagram
    participant U as User Browser
    participant P as Page
    participant A as app.js
    participant R as Upstash Redis
    
    Note over U,R: Auto-refresh every 30 seconds
    loop Every 30 seconds
        P->>A: loadTickets()
        par Parallel Queries
            A->>R: ZRANGE tickets:open 0 -1
            A->>R: ZRANGE tickets:closed 0 -1
        end
        R-->>A: ticket IDs
        loop For Each ID
            A->>R: HGETALL ticket:{id}
            R-->>A: ticket data
        end
        A-->>P: tickets array
        P->>P: re-render ticket list
    end
```

### 5.2 Stats Update Pattern

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant A as app.js
    participant R as Upstash Redis
    
    Note over D,R: Public Stats Refresh
    D->>A: getStats()
    par Parallel Queries
        A->>R: ZCARD tickets:open
        R-->>A: openCount
        A->>R: ZCARD tickets:closed
        R-->>A: closedCount
        A->>R: KEYS user:*
        R-->>A: all user keys
    end
    A->>A: Filter session/tickets keys
    A-->>D: {openCount, closedCount, totalCount, userCount}
    D->>D: Update stat cards
```

---

## 6. Service Worker Communication

### 6.1 Cache Strategy

```mermaid
flowchart TB
    subgraph Request["Fetch Request"]
        BR[Browser<br/>Request]
    end
    
    subgraph SW["Service Worker"]
        SW_Check{Cache<br/>Exists?}
        SW_Network[Fetch from<br/>Network]
        SW_Cache[Return from<br/>Cache]
        SW_Update[Update Cache<br/>+ Return]
    end
    
    subgraph CDN["Network"]
        CDN_Server[Origin Server<br/>GitHub Pages]
    end
    
    BR -->|GET /resource| SW_Check
    SW_Check-->|Yes| SW_Cache
    SW_Check-->|No| SW_Network
    SW_Network-->CDN_Server
    CDN_Server-->SW_Update
    SW_Update-->|Clone| SW_Cache
    SW_Cache-->|Response| BR
    
    Note over SW_Check,SW_Update: Cache-First Strategy<br/>for Static Assets
```

### 6.2 Cache Update Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant SW as Service Worker
    participant C as Cache API
    participant O as Origin
    
    rect rgb(240, 255, 240)
        Note over B,O: First Request (Cache Miss)
        B->>SW: Fetch /css/styles.css
        SW->>C: caches.match('/css/styles.css')
        C-->>SW: undefined
        SW->>O: fetch('/css/styles.css')
        O-->>SW: Response
        SW->>C: caches.open('wticket-v1')
        C-->>SW: cache
        SW->>C: cache.put(request, response.clone())
        SW-->>B: Response
    end
    
    rect rgb(255, 240, 255)
        Note over B,O: Subsequent Request (Cache Hit)
        B->>SW: Fetch /css/styles.css
        SW->>C: caches.match('/css/styles.css')
        C-->>SW: Cached Response
        SW-->>B: Response
    end
```

---

## 7. Error Communication Paths

### 7.1 Network Error Handling

```mermaid
flowchart TD
    A[API Call] --> B{Network<br/>Available?}
    B -->|No| C[Show Toast<br/>Network Error]
    B -->|Yes| D{Upstash<br/>Reachable?}
    D -->|No| E[Show Toast<br/>Service Unavailable]
    D -->|Yes| F{Redis<br/>Operation OK?}
    F -->|Yes| G[Process<br/>Response]
    F -->|No| H{Error<br/>Type?}
    H -->|404| I[Show Toast<br/>Not Found]
    H -->|500| J[Show Toast<br/>Server Error]
    C --> K[End]
    E --> K
    I --> K
    J --> K
    G --> K
    
    style B fill:#fff3e0
    style F fill:#e3f2fd
```

### 7.2 Redis Error Response Mapping

| Redis Error | HTTP Code | User Message | Action |
|-------------|-----------|--------------|--------|
| Connection timeout | 503 | "Connection error. Please retry." | Retry button |
| Auth failure | 401 | "Session expired. Please login." | Redirect to login |
| Rate limit | 429 | "Too many requests. Please wait." | Disable buttons |
| Invalid command | 500 | "An error occurred." | Log to console |

---

## 8. Data Serialization Formats

### 8.1 Request Format (JSON)

```json
// Registration Request (via Redis HSET)
{
  "email": "user@example.com",
  "passwordHash": "a1b2c3d4e5f6...",
  "name": "John Doe",
  "role": "user",
  "createdAt": 1711400000000
}

// Ticket Creation (via Redis HSET)
{
  "id": 42,
  "title": "Login issue",
  "description": "Cannot access my account",
  "userEmail": "user@example.com",
  "status": "open",
  "createdAt": 1711400000000,
  "response": "",
  "responseAt": 0
}
```

### 8.2 Response Format

```json
// Session Response
{
  "token": "abc123...",
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}

// Stats Response
{
  "openCount": 15,
  "closedCount": 42,
  "totalCount": 57,
  "userCount": 12
}
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
