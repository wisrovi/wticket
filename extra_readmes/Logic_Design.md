# Logic Design Documentation

> **Technical Reference**: This document details the business logic, algorithms, and decision flows of the ticket management microservice.

---

## 1. Business Logic Overview

### 1.1 Core Business Rules

```mermaid
graph TB
    subgraph Rules["Business Rules Engine"]
        R1["Ticket ID Generation<br/>Auto-increment atomic"]
        R2["Password Security<br/>SHA-256 + salt"]
        R3["Session Management<br/>24-hour TTL"]
        R4["Role Authorization<br/>user | admin"]
        R5["Status Transitions<br/>open → closed"]
    end
    
    subgraph Validations["Input Validations"]
        V1["Email Format"]
        V2["Password Length<br/>(min 4 chars)"]
        V3["Title Required"]
        V4["XSS Sanitization"]
    end
    
    Rules --> Validations
    
    style Rules fill:#e3f2fd
    style Validations fill:#fff3e0
```

### 1.2 Business Rules Matrix

| Rule ID | Rule Description | Priority | Enforced At |
|---------|-----------------|----------|-------------|
| BR-001 | Ticket IDs are sequential integers starting from 1 | Critical | Redis INCR |
| BR-002 | Passwords must be hashed before storage | Critical | app.js |
| BR-003 | Sessions expire after 24 hours | High | Redis EXPIRE |
| BR-004 | Only admins can resolve tickets | High | admin.html auth check |
| BR-005 | Users can only view their own tickets | High | getUserOpenTickets() |
| BR-006 | Ticket status can only transition open → closed | High | closeTicket() |
| BR-007 | Admin user is auto-created on first init | Medium | ensureAdminExists() |
| BR-008 | All user inputs are XSS-sanitized | Critical | escapeHtml() |

---

## 2. Authentication Logic

### 2.1 Password Hashing Algorithm

```mermaid
flowchart TD
    A[User Password] --> B[Append Salt]
    B --> C["Salt: 'wticket_salt'"]
    C --> D[Concatenate]
    D --> E[UTF-8 Encode]
    E --> F[Web Crypto API]
    F --> G[SHA-256 Digest]
    G --> H[Hexadecimal String]
    H --> I[Store in Redis]
    
    style F fill:#e8f5e9
    style G fill:#e8f5e9
```

```javascript
// Pseudocode
function hashPassword(password) {
    return sha256(password + 'wticket_salt');
}

async function sha256(str) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

### 2.2 Token Generation Algorithm

```mermaid
flowchart LR
    A[Generate 32 bytes] --> B[crypto.getRandomValues]
    B --> C[Convert to hex]
    C --> D[64-character string]
    D --> E[Store as session:{token}]
    E --> F[Set EXPIRE 86400]
```

```javascript
function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

### 2.3 Session Validation Flow

```mermaid
flowchart TD
    Start[Validate Session] --> GetToken
    GetToken[localStorage.getItem] --> Check{Token<br/>Exists?}
    Check -->|No| ReturnNull
    Check -->|Yes| QueryRedis
    
    QueryRedis[HGETALL session:{token}] --> Found{User<br/>Found?}
    Found -->|No| ClearStorage
    Found -->|Yes| CheckExpiry
    
    ClearStorage[localStorage.removeItem] --> ReturnNull
    CheckExpiry{Date.now <<br/> expiresAt?}
    CheckExpiry -->|Expired| DeleteSession
    CheckExpiry -->|Valid| ReturnSession
    
    DeleteSession[REDIS DEL session:{token}] --> ClearStorage
    
    ReturnNull[return null]
    ReturnSession[return {email, name, role}]
    
    style CheckExpiry fill:#fff3e0
    style ReturnNull fill:#ffcdd2
    style ReturnSession fill:#c8e6c9
```

---

## 3. Ticket Management Logic

### 3.1 Ticket ID Generation

```mermaid
flowchart TD
    A[Create Ticket] --> B[INCR ticket:counter]
    B --> C[Atomic Increment]
    C --> D[Return New ID]
    D --> E[HSET ticket:{id}]
    
    style B fill:#e3f2fd
    style C fill:#e8f5e9
```

### 3.2 Ticket Creation Flow

```mermaid
flowchart TD
    Start[Create Ticket] --> ValidateInput
    ValidateInput --> GetNextID
    
    GetNextID[INCR ticket:counter] --> CreateHash
    
    CreateHash[HSET ticket:{id}] --> AddToOpen
    CreateHash --> AddToUserOpen
    
    AddToOpen[ZADD tickets:open] --> ReturnID
    AddToUserOpen[SADD tickets:user:{email}:open] --> ReturnID
    
    ReturnID[return ticketId]
    
    subgraph Validation
        ValidateInput --> CheckTitle{title<br/>required?}
        CheckTitle -->|No| Error1[throw Error]
        CheckTitle -->|Yes| Sanitize[escapeHtml]
        Sanitize --> GetNextID
    end
    
    style GetNextID fill:#e8f5e9
    style CreateHash fill:#e3f2fd
```

### 3.3 Ticket Closure Flow (Admin)

```mermaid
flowchart TD
    Start[Admin Closes Ticket] --> FindTicket
    
    FindTicket[GET ticket:{id}] --> Found{Found?}
    Found -->|No| Error
    Found -->|Yes| UpdateHash
    
    UpdateHash[HSET status: closed<br/>response<br/>responseAt] --> UpdateIndexes
    
    UpdateIndexes --> RemoveFromOpen[ZREM tickets:open]
    UpdateIndexes --> AddToClosed[ZADD tickets:closed]
    UpdateIndexes --> RemoveFromUserOpen[SREM]
    UpdateIndexes --> AddToUserClosed[SADD]
    
    RemoveFromOpen --> Complete
    AddToClosed --> Complete
    RemoveFromUserOpen --> Complete
    AddToUserClosed --> Complete
    
    Complete[return]
    Error[throw Error]
    
    style UpdateHash fill:#e3f2fd
    style UpdateIndexes fill:#fff3e0
```

---

## 4. Search Logic

### 4.1 Search Algorithm

```mermaid
flowchart TD
    A[Search Query] --> B{Normalize}
    B --> C[Lowercase]
    C --> D[Trim whitespace]
    D --> E{Empty?}
    E -->|Yes| F[Return all tickets]
    E -->|No| G[For each ticket]
    
    G --> Match{Match<br/>Found?}
    Match -->|Title| H[Include]
    Match -->|ID| H
    Match -->|No| I[Exclude]
    
    H --> Next[Next ticket]
    I --> Next
    Next --> G
    
    G --> Done[Return filtered list]
    F --> Done
    
    style G fill:#e3f2fd
    style H fill:#c8e6c9
    style I fill:#ffcdd2
```

### 4.2 Search Implementation

```javascript
function searchTickets(tickets, query) {
    if (!query) return tickets;
    
    const q = query.toLowerCase();
    return tickets.filter(ticket => {
        const titleMatch = ticket.title.toLowerCase().includes(q);
        const idMatch = ticket.id.toString().includes(q);
        return titleMatch || idMatch;
    });
}
```

---

## 5. Data Indexing Logic

### 5.1 Index Maintenance

```mermaid
flowchart TB
    subgraph WriteOps["Write Operations"]
        Create[Create Ticket] --> ID1[ZADD tickets:open]
        Create --> ID2[SADD tickets:user:{email}:open]
        Close[Close Ticket] --> ID3[ZREM tickets:open]
        Close --> ID4[ZADD tickets:closed]
        Close --> ID5[SREM tickets:user:{email}:open]
        Close --> ID6[SADD tickets:user:{email}:closed]
    end
    
    subgraph ReadOps["Read Operations"]
        Open[Get Open Tickets] --> Query1[ZRANGE tickets:open]
        UserOpen[Get User Open] --> Query2[SMEMBERS tickets:user:{email}:open]
        Stats[Get Stats] --> Query3[ZCARD tickets:open<br/>ZCARD tickets:closed<br/>KEYS user:*]
    end
    
    style WriteOps fill:#e3f2fd
    style ReadOps fill:#e8f5e9
```

### 5.2 Sorted Set Ordering

```mermaid
graph LR
    subgraph tickets_open["tickets:open (Sorted Set)"]
        S1["Score: 1711390000000<br/>Member: 1"]
        S2["Score: 1711391000000<br/>Member: 2"]
        S3["Score: 1711392000000<br/>Member: 3"]
    end
    
    subgraph tickets_closed["tickets:closed (Sorted Set)"]
        C1["Score: 1711400000000<br/>Member: 4"]
    end
    
    S1 --> Oldest
    S2 --> Middle
    S3 --> Newest
    
    style S1 fill:#fff3e0
    style C1 fill:#c8e6c9
```

---

## 6. State Management

### 6.1 Application States

```mermaid
stateDiagram-v2
    [*] --> Loading: Page init
    
    Loading --> AuthChecking: API.init()
    
    AuthChecking --> PublicView: No auth required
    AuthChecking --> AuthRequired: Auth required
    
    PublicView --> LoginRequired: Click protected action
    LoginRequired --> AuthForm: Show login
    
    AuthForm --> AuthChecking: Login success
    
    AuthRequired --> Unauthenticated: No valid session
    AuthRequired --> Authorized: Valid session
    
    Unauthenticated --> AuthForm: Redirect to login
    
    Authorized --> Unauthorized: Role mismatch
    Authorized --> Dashboard: Role = user
    Authorized --> AdminPanel: Role = admin
    
    Dashboard --> Logout: User clicks logout
    AdminPanel --> Logout: User clicks logout
    Logout --> AuthChecking: Clear session
    
    Dashboard --> Refresh: 30s interval
    AdminPanel --> Refresh: 30s interval
    Refresh --> Dashboard
    Refresh --> AdminPanel
```

### 6.2 Modal States

```mermaid
stateDiagram-v2
    [*] --> Hidden
    
    Hidden --> Visible: openModal()
    Visible --> Hidden: closeModal()
    Visible --> Hidden: Escape key
    Visible --> Hidden: Click outside
    
    Visible --> Submitting: Form submit
    Submitting --> Processing: Show spinner
    Processing --> Success: API success
    Processing --> Error: API error
    
    Success --> Hidden: Close modal
    Error --> Visible: Show error toast
```

---

## 7. XSS Protection Logic

### 7.1 Sanitization Algorithm

```mermaid
flowchart TD
    A[User Input] --> B[Create div element]
    B --> C[Set textContent]
    C --> D[Read innerHTML]
    D --> E[Return sanitized]
    
    style C fill:#e8f5e9
    style E fill:#c8e6c9
```

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // Automatically escapes HTML
    return div.innerHTML;
}

// Example:
// Input:  <script>alert('xss')</script>
// Output: &lt;script&gt;alert('xss')&lt;/script&gt;
```

### 7.2 Sanitization Coverage

| Input Field | Sanitized | Method |
|-------------|-----------|--------|
| Ticket title | ✅ | escapeHtml() |
| Ticket description | ✅ | escapeHtml() |
| Admin response | ✅ | escapeHtml() |
| User name | ❌ | Not stored |
| Email | ❌ | Not rendered as HTML |

---

## 8. Error Handling Logic

### 8.1 Error Classification

```mermaid
flowchart TD
    subgraph Errors["Error Types"]
        E1[Validation Error<br/>400]
        E2[Auth Error<br/>401]
        E3[Not Found<br/>404]
        E4[Server Error<br/>500]
        E5[Network Error<br/>NET]
    end
    
    subgraph Handling["Handler"]
        H1[Toast.error]
        H2[Redirect to login]
        H3[Toast + log]
        H4[Toast + retry]
        H5[Toast + disable]
    end
    
    E1 --> H1
    E2 --> H2
    E3 --> H3
    E4 --> H4
    E5 --> H5
```

### 8.2 Retry Logic

```javascript
async function withRetry(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
