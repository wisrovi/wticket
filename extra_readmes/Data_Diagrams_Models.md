# Data Diagrams & Models Documentation

> **Technical Reference**: This document provides comprehensive data models, entity relationships, and schema definitions for the ticket management microservice.

---

## 1. Entity Relationship Diagram

### 1.1 Core Entities

```mermaid
erDiagram
    USER ||--o{ TICKET : creates
    USER {
        string email PK
        string passwordHash
        string name
        string role
        int createdAt
    }
    
    TICKET ||--|| TICKET_STATUS : has
    TICKET {
        int id PK
        string title
        string description
        string userEmail FK
        string status
        int createdAt
        string response
        int responseAt
    }
    
    TICKET_STATUS {
        string name PK
    }
    
    USER ||--o{ SESSION : has
    SESSION {
        string token PK
        string email FK
        string name
        string role
        int createdAt
        int expiresAt
    }
    
    USER ||--o{ USER_OPEN_TICKETS : owns
    USER ||--o{ USER_CLOSED_TICKETS : owns
```

### 1.2 Index Relationships

```mermaid
erDiagram
    TICKET_INDEX_OPEN }o--o{ TICKET : indexes
    TICKET_INDEX_OPEN {
        int score PK "Unix timestamp"
        int ticketId PK
    }
    
    TICKET_INDEX_CLOSED }o--o{ TICKET : indexes
    TICKET_INDEX_CLOSED {
        int score PK "Unix timestamp"
        int ticketId PK
    }
    
    USER_OPEN_INDEX ||--|| USER : tracks
    USER_OPEN_INDEX ||--o{ TICKET : contains
    USER_OPEN_INDEX {
        string userEmail PK
        int ticketId PK
    }
    
    USER_CLOSED_INDEX ||--|| USER : tracks
    USER_CLOSED_INDEX ||--o{ TICKET : contains
    USER_CLOSED_INDEX {
        string userEmail PK
        int ticketId PK
    }
```

---

## 2. Redis Data Models

### 2.1 Key Structure Overview

```mermaid
graph TB
    subgraph Keys["Redis Keys"]
        subgraph Counter["Counter"]
            C1["ticket:counter<br/>Integer"]
        end
        
        subgraph TicketData["Ticket Data"]
            T1["ticket:{id}<br/>Hash"]
        end
        
        subgraph Indexes["Indexes"]
            O1["tickets:open<br/>Sorted Set"]
            C2["tickets:closed<br/>Sorted Set"]
        end
        
        subgraph UserIndexes["User Indexes"]
            UO["tickets:user:{email}:open<br/>Set"]
            UC["tickets:user:{email}:closed<br/>Set"]
        end
        
        subgraph UserData["User Data"]
            U["user:{email}<br/>Hash"]
        end
        
        subgraph SessionData["Session Data"]
            S["session:{token}<br/>Hash"]
        end
    end
    
    style Counter fill:#e3f2fd
    style TicketData fill:#e8f5e9
    style Indexes fill:#fff3e0
    style UserData fill:#fce4ec
    style SessionData fill:#f3e5f5
```

### 2.2 Hash Structures

#### User Hash (`user:{email}`)

```mermaid
classDiagram
    class UserHash {
        <<Hash Structure>>
        +email: string PK "Unique identifier"
        +passwordHash: string "SHA-256 + salt"
        +name: string "Display name"
        +role: string "user | admin"
        +createdAt: number "Unix timestamp"
    }
    
    note for UserHash "Key: user:{email}\nTTL: None (permanent)"
```

#### Ticket Hash (`ticket:{id}`)

```mermaid
classDiagram
    class TicketHash {
        <<Hash Structure>>
        +id: number PK "Auto-increment"
        +title: string "Sanitized subject"
        +description: string "Optional details"
        +userEmail: string FK "Creator reference"
        +status: string "open | closed"
        +createdAt: number "Unix timestamp"
        +response: string "Admin response"
        +responseAt: number "Resolution timestamp"
    }
    
    note for TicketHash "Key: ticket:{id}\nTTL: None (permanent)"
```

#### Session Hash (`session:{token}`)

```mermaid
classDiagram
    class SessionHash {
        <<Hash Structure>>
        +email: string FK "User reference"
        +name: string "Cached display name"
        +role: string "user | admin"
        +createdAt: number "Login timestamp"
        +expiresAt: number "Expiry timestamp"
    }
    
    note for SessionHash "Key: session:{token}\nTTL: 86400 seconds (24h)"
```

### 2.3 Sorted Set Structures

```mermaid
classDiagram
    class TicketsOpenSortedSet {
        <<Sorted Set>>
        +Key: "tickets:open"
        +Score: Unix timestamp (ms)
        +Member: ticket ID (string)
        +Ordering: ASC (oldest first)
    }
    
    class TicketsClosedSortedSet {
        <<Sorted Set>>
        +Key: "tickets:closed"
        +Score: Unix timestamp (ms)
        +Member: ticket ID (string)
        +Ordering: ASC (oldest first)
    }
    
    note for TicketsOpenSortedSet "Use ZRANGE for chronological ordering"
    note for TicketsClosedSortedSet "Use ZREVRANGE for reverse chronological"
```

### 2.4 Set Structures

```mermaid
classDiagram
    class UserOpenTicketsSet {
        <<Set>>
        +Key: "tickets:user:{email}:open"
        +Members: ticket IDs (string)
        +Type: Set (unique members)
    }
    
    class UserClosedTicketsSet {
        <<Set>>
        +Key: "tickets:user:{email}:closed"
        +Members: ticket IDs (string)
        +Type: Set (unique members)
    }
    
    note for UserOpenTicketsSet "Use SMEMBERS to get all user's open tickets"
    note for UserClosedTicketsSet "Use SMEMBERS to get all user's closed tickets"
```

---

## 3. JSON Data Schemas

### 3.1 User Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "Unique email identifier"
    },
    "passwordHash": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 hexadecimal hash"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Display name"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"],
      "description": "User role for authorization"
    },
    "createdAt": {
      "type": "integer",
      "minimum": 0,
      "description": "Unix timestamp in milliseconds"
    }
  },
  "required": ["email", "passwordHash", "role", "createdAt"]
}
```

### 3.2 Ticket Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Ticket",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1,
      "description": "Auto-increment ticket identifier"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500,
      "description": "Ticket subject (XSS sanitized)"
    },
    "description": {
      "type": "string",
      "maxLength": 5000,
      "description": "Detailed description (XSS sanitized)"
    },
    "userEmail": {
      "type": "string",
      "format": "email",
      "description": "Creator's email address"
    },
    "status": {
      "type": "string",
      "enum": ["open", "closed"],
      "description": "Current ticket status"
    },
    "createdAt": {
      "type": "integer",
      "minimum": 0,
      "description": "Creation Unix timestamp"
    },
    "response": {
      "type": "string",
      "maxLength": 5000,
      "description": "Admin response (XSS sanitized)"
    },
    "responseAt": {
      "type": "integer",
      "minimum": 0,
      "description": "Resolution Unix timestamp"
    }
  },
  "required": ["id", "title", "userEmail", "status", "createdAt"]
}
```

### 3.3 Session Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Session",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "Associated user email"
    },
    "name": {
      "type": "string",
      "description": "Cached user display name"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"],
      "description": "Cached user role"
    },
    "createdAt": {
      "type": "integer",
      "minimum": 0,
      "description": "Session creation timestamp"
    },
    "expiresAt": {
      "type": "integer",
      "minimum": 0,
      "description": "Session expiry timestamp"
    }
  },
  "required": ["email", "role", "expiresAt"]
}
```

### 3.4 Stats Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Stats",
  "type": "object",
  "properties": {
    "openCount": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of open tickets"
    },
    "closedCount": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of closed tickets"
    },
    "totalCount": {
      "type": "integer",
      "minimum": 0,
      "description": "Total ticket count"
    },
    "userCount": {
      "type": "integer",
      "minimum": 0,
      "description": "Registered user count"
    }
  },
  "required": ["openCount", "closedCount", "totalCount", "userCount"]
}
```

---

## 4. Data Flow Diagrams

### 4.1 Registration Data Flow

```mermaid
flowchart TD
    subgraph Input["Client Input"]
        Email[email: string]
        Pass[password: string]
        Name[name: string]
    end
    
    subgraph Processing["Processing"]
        Hash[hashPassword()<br/>SHA-256 + salt]
        Validate[Validate email<br/>format]
    end
    
    subgraph Storage["Redis Storage"]
        UserHash["user:{email}<br/>HSET"]
    end
    
    Email --> Validate
    Pass --> Hash
    Name --> UserHash
    Hash --> UserHash
    Validate --> Hash
    
    style Input fill:#e3f2fd
    style Processing fill:#fff3e0
    style Storage fill:#e8f5e9
```

### 4.2 Ticket Creation Data Flow

```mermaid
flowchart TD
    subgraph Input["Client Input"]
        Title[title: string]
        Desc[description: string]
        Email[userEmail: string]
    end
    
    subgraph Processing["Processing"]
        Sanitize[escapeHtml()<br/>XSS prevention]
        GenID[INCR ticket:counter]
        Timestamp[Date.now()]
    end
    
    subgraph Storage["Redis Storage"]
        TicketHash["ticket:{id}<br/>HSET"]
        OpenIndex["tickets:open<br/>ZADD"]
        UserOpen["tickets:user:{email}:open<br/>SADD"]
    end
    
    Title --> Sanitize
    Desc --> Sanitize
    Sanitize --> TicketHash
    GenID --> TicketHash
    Timestamp --> OpenIndex
    GenID --> OpenIndex
    GenID --> UserOpen
    Email --> UserOpen
    
    style Input fill:#e3f2fd
    style Processing fill:#fff3e0
    style Storage fill:#e8f5e9
```

---

## 5. Data Model Relationships

### 5.1 User-Ticket Relationship

```mermaid
graph LR
    subgraph User["USER Entity"]
        U1["email: user@example.com"]
        U2["name: John Doe"]
        U3["role: user"]
    end
    
    subgraph Tickets["TICKET Entities"]
        T1["id: 1<br/>title: Issue 1"]
        T2["id: 2<br/>title: Issue 2"]
        T3["id: 5<br/>title: Issue 3"]
    end
    
    subgraph Indexes["INDEX Entities"]
        IO["tickets:user:user@example.com:open"]
        IC["tickets:user:user@example.com:closed"]
    end
    
    U1 --> IO
    U1 --> IC
    
    IO --> T1
    IO --> T2
    IC --> T3
    
    style User fill:#e3f2fd
    style Tickets fill:#e8f5e9
    style Indexes fill:#fff3e0
```

### 5.2 Global Ticket Index

```mermaid
graph TB
    subgraph GlobalIndexes["Global Indexes"]
        Open["tickets:open<br/>Sorted Set"]
        Closed["tickets:closed<br/>Sorted Set"]
    end
    
    subgraph Tickets["Tickets"]
        T1["ticket:1"]
        T2["ticket:2"]
        T3["ticket:3"]
        T4["ticket:4"]
        T5["ticket:5"]
    end
    
    Open --> T1
    Open --> T2
    Open --> T3
    Open --> T4
    
    Closed --> T5
    
    style GlobalIndexes fill:#fff3e0
    style Tickets fill:#e8f5e9
```

---

## 6. Data Type Reference

### 6.1 Redis Data Types Used

| Redis Type | Keys Using | Purpose |
|------------|------------|---------|
| **String** | `ticket:counter` | Atomic counter |
| **Hash** | `ticket:{id}`, `user:{email}`, `session:{token}` | Structured data |
| **Sorted Set** | `tickets:open`, `tickets:closed` | Ordered by timestamp |
| **Set** | `tickets:user:{email}:open`, `tickets:user:{email}:closed` | Unique membership |

### 6.2 Field Type Mappings

| Field | Redis Type | Serialization |
|-------|------------|--------------|
| email | String (Hash field) | Plain string |
| passwordHash | String (Hash field) | 64-char hex |
| name | String (Hash field) | Plain string |
| role | String (Hash field) | "user" or "admin" |
| createdAt | String (Hash field) | Unix ms as string |
| id | String (Hash field) | Integer as string |
| status | String (Hash field) | "open" or "closed" |

---

## 7. Data Integrity Constraints

### 7.1 Constraints Matrix

| Constraint | Type | Enforcement |
|------------|------|-------------|
| Email uniqueness | UNIQUE | Redis key prefix |
| Ticket ID uniqueness | AUTO_INCREMENT | Redis INCR |
| Role values | ENUM | Client-side validation |
| Status transitions | STATE_MACHINE | closeTicket() only |
| Session expiry | TTL | Redis EXPIRE |

### 7.2 State Transition Rules

```mermaid
stateDiagram-v2
    [*] --> Open: createTicket()
    
    state Open {
        [*] --> Indexed
        Indexed --> [*]
    }
    
    Open --> Closed: closeTicket()
    
    state Closed {
        [*] --> Responded
        Responded --> [*]
    }
    
    Closed --> [*]: Archive (future)
    
    note for Open: Only valid initial state
    note for Closed: Terminal state
```

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
