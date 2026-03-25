# Security, Hardening & Resiliency Documentation

> **Technical Reference**: This document details security measures, hardening procedures, and resilience patterns implemented in the ticket management microservice.

---

## 1. Security Architecture Overview

### 1.1 Security Layers

```mermaid
graph TB
    subgraph Security["Security Layers"]
        L1["Input Validation<br/>Client-side sanitization"]
        L2["Authentication<br/>Password hashing + sessions"]
        L3["Authorization<br/>Role-based access control"]
        L4["Data Protection<br/>TLS encryption"]
    end
    
    subgraph Threats["Potential Threats"]
        T1["XSS Injection"]
        T2["Credential Brute Force"]
        T3["Session Hijacking"]
        T4["Man-in-Middle"]
    end
    
    L1 -->|Mitigates| T1
    L2 -->|Mitigates| T2
    L3 -->|Mitigates| T3
    L4 -->|Mitigates| T4
    
    style Security fill:#e8f5e9
    style Threats fill:#ffcdd2
```

### 1.2 Security Controls Matrix

| Control | Type | Implementation | Effectiveness |
|---------|------|---------------|---------------|
| **Input Sanitization** | Preventive | escapeHtml() | High |
| **Password Hashing** | Preventive | SHA-256 + salt | High |
| **Session Tokens** | Preventive | 256-bit crypto | High |
| **Session Expiry** | Detective | 24h TTL | Medium |
| **Role Authorization** | Preventive | requireAuth() | High |
| **TLS Encryption** | Preventive | HTTPS (Upstash) | High |

---

## 2. Authentication Security

### 2.1 Password Security Implementation

```mermaid
flowchart TD
    A[User Password] --> B[Password Policy]
    B --> C{Min 4 chars?}
    C -->|No| D[Reject]
    C -->|Yes| E[Append Salt]
    E --> F["Salt: 'wticket_salt'"]
    F --> G[Concatenate]
    G --> H[UTF-8 Encode]
    H --> I[Web Crypto API]
    I --> J[SHA-256 Digest]
    J --> K[Hex Encode]
    K --> L[Store Hash]
    
    style I fill:#e8f5e9
    style J fill:#e8f5e9
```

### 2.2 Token Security

```mermaid
flowchart LR
    subgraph Generation["Token Generation"]
        G1[32 random bytes]
        G2[crypto.getRandomValues]
        G3[Hex encode]
        G4[64-char token]
    end
    
    subgraph Validation["Token Validation"]
        V1[Extract token]
        V2[Query Redis]
        V3{Check expiry}
        V4[Return user]
    end
    
    G1 --> G2 --> G3 --> G4
    G4 --> V1
    V1 --> V2 --> V3
    V3 -->|Valid| V4
    V3 -->|Expired| X[Delete + reject]
    
    style Generation fill:#e3f2fd
    style Validation fill:#fff3e0
```

---

## 3. XSS Protection

### 3.1 Sanitization Flow

```mermaid
flowchart TD
    subgraph Input["User Input"]
        I1[Title]
        I2[Description]
        I3[Response]
    end
    
    subgraph Sanitize["Sanitization"]
        S1[Create div element]
        S2[Set textContent]
        S3[Read innerHTML]
    end
    
    subgraph Storage["Redis Storage"]
        R1[Stored safely]
    end
    
    I1 --> S1
    I2 --> S1
    I3 --> S1
    S1 --> S2 --> S3 --> R1
    
    Note over S1,S3: textContent automatically escapes<br/>HTML entities
    
    style Input fill:#e3f2fd
    style Sanitize fill:#e8f5e9
```

### 3.2 XSS Prevention Examples

| Input | Stored As | Rendered As |
|-------|-----------|-------------|
| `<script>alert(1)</script>` | `&lt;script&gt;alert(1)&lt;/script&gt;` | Plain text |
| `<img src=x onerror=alert(1)>` | Escaped | Plain text |
| `Normal text` | `Normal text` | Normal text |

---

## 4. Authorization Model

### 4.1 Role-Based Access Control

```mermaid
graph TD
    subgraph Roles["User Roles"]
        Admin["admin<br/>Full access"]
        User["user<br/>Limited access"]
    end
    
    subgraph Resources["Resources"]
        Public["Public Dashboard<br/>index.html"]
        Login["Login/Register<br/>login.html"]
        UserDash["User Dashboard<br/>dashboard.html"]
        AdminDash["Admin Panel<br/>admin.html"]
    end
    
    subgraph Permissions["Permissions"]
        P1["view: stats, create: tickets, view: own"]
        P2["view: all, resolve: tickets, search: all"]
    end
    
    Public -->|All| Roles
    Login -->|All| Roles
    UserDash -->|user| User
    AdminDash -->|admin| Admin
    
    Admin --> P2
    User --> P1
    
    style Admin fill:#ffcdd2
    style User fill:#e8f5e9
```

### 4.2 Authorization Flow

```mermaid
flowchart TD
    Start[Access Resource] --> CheckAuth{Authenticated?}
    CheckAuth -->|No| RedirectLogin
    CheckAuth -->|Yes| CheckRole{Valid Role?}
    
    RedirectLogin -->|Return| CheckAuth
    
    CheckRole -->|No| RedirectPanel
    CheckRole -->|Yes| GrantAccess
    
    RedirectPanel -->|user| UserDashboard
    RedirectPanel -->|admin| AdminDashboard
    
    GrantAccess --> End[Resource Loaded]
    
    style CheckAuth fill:#fff3e0
    style CheckRole fill:#fff3e0
    style GrantAccess fill:#c8e6c9
```

---

## 5. Session Management

### 5.1 Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: login()
    
    state Created {
        [*] --> TokenGenerated: generateToken()
        TokenGenerated --> Stored: Redis HSET
        Stored --> Active: Return to client
    }
    
    Active --> Validated: Every request
    Validated --> Active: Continue
    
    Active --> Expiring: 24h TTL
    Expiring --> Expired: Time reached
    
    Expired --> [*]: Auto-cleanup
    
    Active --> Logout: User logout
    Logout --> [*]: Manual cleanup
```

### 5.2 Session Storage Schema

```
session:{token} Hash
├── email: string       # User email
├── name: string        # Display name
├── role: string        # user | admin
├── createdAt: number   # Creation timestamp
└── expiresAt: number  # Expiry timestamp
    └── TTL: 86400 seconds (24 hours)
```

---

## 6. Network Security

### 6.1 Transport Security

| Layer | Protocol | Protection |
|-------|----------|------------|
| **Browser → Upstash** | HTTPS | TLS 1.3 encryption |
| **Browser → CDN** | HTTPS | TLS 1.3 encryption |
| **API Authentication** | Bearer Token | Token in Authorization header |

### 6.2 Data Flow Security

```mermaid
graph LR
    subgraph Client["Client Browser"]
        HTTPS1[HTTPS]
    end
    
    subgraph Upstash["Upstash Cloud"]
        HTTPS2[HTTPS]
        Redis[(Redis<br/>Encrypted at rest)]
    end
    
    Client -->|Encrypted| Upstash
    Upstash -->|Encrypted| Client
    Upstash --> Redis
    
    style HTTPS1 fill:#c8e6c9
    style HTTPS2 fill:#c8e6c9
    style Redis fill:#e3f2fd
```

---

## 7. Resiliency Patterns

### 7.1 Error Handling Flow

```mermaid
flowchart TD
    A[API Call] --> B{Success?}
    B -->|Yes| C[Process Response]
    B -->|No| D{Error Type?}
    
    D -->|Network| E[Toast: Retry]
    D -->|Auth| F[Redirect: Login]
    D -->|Not Found| G[Toast: Not found]
    D -->|Server| H[Toast: Error]
    
    C --> I[Update UI]
    E --> J[User retry option]
    F --> K[Clear session]
    G --> L[Log error]
    H --> L
    
    style B fill:#fff3e0
    style D fill:#fff3e0
```

### 7.2 Retry Logic

```javascript
// Implemented in auto-refresh
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## 8. Security Hardening Recommendations

### 8.1 Production Hardening Checklist

| Item | Priority | Status |
|------|----------|--------|
| Move Redis credentials to backend | Critical | Pending |
| Implement rate limiting | High | Pending |
| Add CORS restrictions | High | Pending |
| Enable Redis firewall | Medium | Pending |
| Implement audit logging | Medium | Pending |
| Add request signing | Medium | Pending |

### 8.2 Backend Proxy Architecture

```mermaid
graph TB
    subgraph Current["Current Architecture (Insecure)"]
        FE1[Frontend JS]
        REDIS1[(Redis<br/>Credentials exposed)]
    end
    
    Current --> REDIS1
    
    subgraph Hardened["Hardened Architecture"]
        FE2[Frontend JS]
        BE[Backend Proxy<br/>Node.js/Python/Go]
        REDIS2[(Redis<br/>Credentials hidden)]
        CORS[CORS Middleware]
        RATE[Rate Limiter]
    end
    
    FE2 --> BE
    BE --> CORS
    BE --> RATE
    BE --> REDIS2
    
    style Current fill:#ffcdd2,stroke:#d32f2f
    style Hardened fill:#c8e6c9,stroke:#388e3c
```

### 8.3 Rate Limiting Configuration

```javascript
// Example: Backend rate limiting (pseudocode)
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests"
};
```

---

## 9. Security Logging

### 9.1 Events to Log

| Event | Severity | Data |
|-------|----------|------|
| Failed login | Warning | email, IP, timestamp |
| Successful login | Info | email, role, timestamp |
| Session expired | Info | sessionId, timestamp |
| Ticket created | Debug | ticketId, user, timestamp |
| Ticket resolved | Info | ticketId, admin, timestamp |
| XSS attempt | Critical | input, user, timestamp |

### 9.2 Log Format

```json
{
  "timestamp": "2026-03-25T12:00:00.000Z",
  "level": "warning",
  "event": "failed_login",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 10. Known Limitations

### 10.1 Current Security Limitations

| Limitation | Risk | Mitigation |
|------------|------|------------|
| Token in frontend | Credential exposure | Use for demos only |
| No rate limiting | DoS vulnerability | Deploy backend proxy |
| No server validation | Trust client data | Add backend validation |
| No audit trail | Compliance gap | Implement logging |
| CORS not enforced | Unauthorized access | Configure Upstash CORS |

### 10.2 Security Comparison

| Aspect | Current | Production |
|--------|---------|------------|
| **Credentials** | Exposed in JS | Hidden in backend |
| **Rate Limiting** | None | Redis-based |
| **Input Validation** | Client-side only | Server-side required |
| **Audit Logging** | Console only | Persistent storage |
| **CORS** | Default allow | Explicit whitelist |

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
