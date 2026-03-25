# Frontend & User Interface Documentation

> **Technical Reference**: This document provides comprehensive documentation for the frontend components, user interface design, and user experience patterns of the ticket management microservice.

---

## 1. Frontend Architecture

### 1.1 Component Hierarchy

```mermaid
graph TD
    subgraph Pages["Page Components"]
        index[index.html<br/>Dashboard]
        login[login.html<br/>Auth]
        dashboard[dashboard.html<br/>User]
        admin[admin.html<br/>Admin]
    end
    
    subgraph Components["Reusable Components"]
        navbar[Navbar]
        card[Card]
        modal[Modal]
        button[Button]
        form[Form]
        toast[Toast]
    end
    
    subgraph Modules["JavaScript Modules"]
        app[js/app.js<br/>API]
        toast[toast.js<br/>Notifications]
    end
    
    subgraph Styles["Style System"]
        css[styles.css<br/>Design Tokens]
    end
    
    Pages --> Components
    Pages --> Modules
    Components --> Styles
    Modules --> Styles
    
    style Pages fill:#e3f2fd
    style Components fill:#e8f5e9
    style Styles fill:#fff3e0
```

### 1.2 Page Responsibilities

| Page | Responsibilities | State Dependencies |
|------|-----------------|------------------|
| **index.html** | Stats display, nav, actions | None (public) |
| **login.html** | Auth forms, validation | Session check |
| **dashboard.html** | Ticket CRUD, search, modals | User session |
| **admin.html** | Admin actions, stats, search | Admin session |

---

## 2. Design System

### 2.1 Design Tokens

```mermaid
graph TD
    subgraph Tokens["Design Tokens"]
        subgraph Colors["Color System"]
            primary[--primary<br/>#6366f1]
            success[--success<br/>#10b981]
            warning[--warning<br/>#f59e0b]
            danger[--danger<br/>#ef4444]
        end
        
        subgraph Typography["Typography"]
            font[--font-family<br/>Inter]
            sizes[--font-size-*]
        end
        
        subgraph Spacing["Spacing"]
            radius[--radius<br/>8px]
            shadow[--shadow-*]
        end
    end
    
    Tokens --> Components
    
    style Colors fill:#e3f2fd
    style Typography fill:#e8f5e9
    style Spacing fill:#fff3e0
```

### 2.2 Color Palette

| Token | Hex | Usage | States |
|-------|-----|-------|--------|
| `--primary` | `#6366f1` | Buttons, links, brand | Default |
| `--primary-dark` | `#4f46e5` | Hover states | Hover |
| `--success` | `#10b981` | Positive actions, closed | Success |
| `--warning` | `#f59e0b` | Warnings, pending | Warning |
| `--danger` | `#ef4444` | Errors, destructive | Error |
| `--gray-50` | `#f9fafb` | Light backgrounds | Background |
| `--gray-900` | `#111827` | Primary text | Text |

### 2.3 Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--font-size-base` | 14px | 400 | Body text |
| `--font-size-sm` | 12px | 400 | Meta text |
| `--font-size-xs` | 11px | 600 | Badges |
| `--font-size-lg` | 16px | 500 | Subheadings |
| `--font-size-xl` | 18px | 600 | Headings |
| `--font-size-2xl` | 28px | 700 | Page titles |

---

## 3. Component Specifications

### 3.1 Navigation Bar

```mermaid
graph LR
    subgraph Navbar["Navbar Structure"]
        Brand[Brand Logo<br/>WTicket]
        Links[Nav Links<br/>Inicio Login]
        Actions[CTA Button<br/>Create Ticket]
    end
    
    subgraph User["Conditional"]
        Avatar[User Avatar<br/>👤 Name]
        Role[Role Badge<br/>ADMIN]
        Logout[Logout Button]
    end
    
    Brand --> Links --> Actions
    User --> Logout
    
    style Brand fill:#e3f2fd
    style Links fill:#e8f5e9
    style User fill:#fff3e0
```

### 3.2 Card Component

```mermaid
graph TD
    subgraph Card["Card Structure"]
        Header[Card Header<br/>Title + Actions]
        Body[Card Body<br/>Content]
    end
    
    subgraph CardVariants["Variants"]
        Default[Default<br/>White bg]
        Stat[Stat Card<br/>Centered value]
        Ticket[Ticket Item<br/>Clickable]
    end
    
    Card --> CardVariants
    Header --> Body
    
    style Card fill:#e3f2fd
    style CardVariants fill:#e8f5e9
```

### 3.3 Button Variants

```mermaid
flowchart TD
    subgraph Buttons["Button Types"]
        primary[Primary<br/>Indigo bg]
        secondary[Secondary<br/>Gray bg]
        success[Success<br/>Green bg]
        danger[Danger<br/>Red bg]
        outline[Outline<br/>Border only]
    end
    
    subgraph States["States"]
        default[Default]
        hover[Hover<br/>Darker]
        disabled[Disabled<br/>Opacity 0.6]
        loading[Loading<br/>Spinner]
    end
    
    Buttons --> States
    
    style primary fill:#6366f1,color:#fff
    style secondary fill:#e5e7eb,color:#374151
    style success fill:#10b981,color:#fff
    style danger fill:#ef4444,color:#fff
```

### 3.4 Modal Component

```mermaid
stateDiagram-v2
    [*] --> Closed
    
    Closed --> Opening: openModal()
    Opening --> Open: animation complete
    Open --> Closing: closeModal()
    Closing --> Closed: animation complete
    
    Open --> Submitting: Form submit
    Submitting --> Processing: Show spinner
    Processing --> Success: API success
    Processing --> Error: API error
    
    Success --> Closing: Auto close
    Error --> Open: Show error toast
    
    note right of Opening: fade-in 0.3s
    note right of Closing: fade-out 0.3s
```

### 3.5 Toast Notifications

```mermaid
graph LR
    subgraph Toast["Toast Structure"]
        Icon[Icon<br/>✓ ✕ ℹ ⚠]
        Message[Message Text]
        Close[X Button]
    end
    
    subgraph Types["Toast Types"]
        success[Success<br/>Green]
        error[Error<br/>Red]
        info[Info<br/>Blue]
        warning[Warning<br/>Yellow]
    end
    
    Toast --> Types
    
    style Toast fill:#e3f2fd
    style Types fill:#e8f5e9
```

---

## 4. Page Layouts

### 4.1 Dashboard Layout

```mermaid
graph TD
    subgraph Layout["Dashboard Layout"]
        Nav[Navbar<br/>Brand Nav Actions]
        Header[Page Header<br/>Title Subtitle]
        Stats[Stats Grid<br/>4 Cards]
        Actions[Quick Actions<br/>Buttons]
        Footer[Footer<br/>Copyright]
    end
    
    Nav --> Header --> Stats --> Actions --> Footer
    
    style Nav fill:#e3f2fd
    style Stats fill:#e8f5e9
    style Actions fill:#fff3e0
```

### 4.2 User Dashboard Layout

```mermaid
graph TD
    subgraph Layout["User Dashboard"]
        Nav[Navbar]
        Header[Header + Create Button]
        Columns[Two Column Layout]
        Open[Open Tickets Column<br/>Search + List]
        Closed[Closed Tickets Column<br/>Search + List]
        Modals[Create Modal<br/>Detail Modal]
    end
    
    Nav --> Header --> Columns
    Columns --> Open
    Columns --> Closed
    Header --> Modals
    
    style Columns fill:#e8f5e9
    style Open fill:#e3f2fd
    style Closed fill:#fff3e0
```

### 4.3 Admin Panel Layout

```mermaid
graph TD
    subgraph Layout["Admin Panel"]
        Nav[Navbar<br/>Admin Badge]
        Stats[Stats Grid<br/>System Stats]
        Tabs[Admin Tabs<br/>Open / Closed]
        Search[Search Box<br/>Global Search]
        List[Ticket List<br/>Scrollable]
        Modal[Respond Modal<br/>Resolution Form]
    end
    
    Nav --> Stats --> Tabs --> Search --> List
    List --> Modal
    
    style Tabs fill:#e3f2fd
    style List fill:#e8f5e9
```

---

## 5. User Interactions

### 5.1 Form Interactions

```mermaid
sequenceDiagram
    participant U as User
    participant F as Form
    participant V as Validator
    participant API as API
    participant T as Toast
    
    U->>F: Fill form fields
    F->>V: On input change
    V->>V: Validate input
    V-->>F: Show inline error
    
    U->>F: Submit form
    F->>F: Disable submit button
    F->>API: Call API
    API-->>F: Show spinner
    
    alt Success
        API-->>T: Toast.success()
        T-->>U: Show notification
        F->>F: Close modal/redirect
    else Error
        API-->>T: Toast.error()
        T-->>U: Show error
        F->>F: Enable submit button
    end
```

### 5.2 Search Interaction

```mermaid
flowchart TD
    A[User types in search] --> B{Input event}
    B --> C[Debounce 300ms]
    C --> D[Get search query]
    D --> E[Filter tickets array]
    E --> F{Match found?}
    F -->|Yes| G[Update list view]
    F -->|No| H[Show empty state]
    G --> I[List updated]
    H --> I
    
    style B fill:#fff3e0
    style G fill:#c8e6c9
```

### 5.3 Modal Interactions

```mermaid
flowchart TD
    subgraph Open["Open Modal"]
        A[Click button] --> B[Add .active class]
        B --> C[CSS transition]
        C --> D[Modal visible]
    end
    
    subgraph Close["Close Modal"]
        E[Click X or Cancel] --> F[Remove .active]
        F --> G[Fade out]
        G --> H[Modal hidden]
    end
    
    subgraph Keyboard["Keyboard Support"]
        I[Press Escape] --> E
    end
    
    subgraph ClickOutside["Click Outside"]
        J[Click overlay] --> E
    end
    
    style Open fill:#e3f2fd
    style Close fill:#e8f5e9
```

---

## 6. Responsive Design

### 6.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 768px | Single column |
| **Tablet** | 768px - 1024px | Adaptive |
| **Desktop** | > 1024px | Full layout |

### 6.2 Responsive Grid

```mermaid
graph LR
    subgraph Mobile["Mobile (< 768px)"]
        M1[Column 1<br/>Full width]
    end
    
    subgraph Tablet["Tablet (768px+)"]
        T1[Column 1<br/>50%]
        T2[Column 2<br/>50%]
    end
    
    subgraph Desktop["Desktop (1024px+)"]
        D1[Column 1<br/>50%]
        D2[Column 2<br/>50%]
    end
    
    M1 --> T1
    M1 --> T2
    T1 --> D1
    T2 --> D2
    
    style Mobile fill:#ffcdd2
    style Tablet fill:#fff3e0
    style Desktop fill:#c8e6c9
```

### 6.3 Responsive Adjustments

| Element | Desktop | Mobile |
|---------|---------|--------|
| **Two Columns** | Side by side | Stacked |
| **Stats Grid** | 4 columns | 2 columns |
| **Navbar** | Full links | Hamburger (future) |
| **Modal** | 500px max-width | 90% width |

---

## 7. Accessibility

### 7.1 ARIA Labels

| Component | ARIA Attribute | Value |
|-----------|---------------|-------|
| **Navbar** | `role="navigation"` | ✅ |
| **Buttons** | `aria-label` | Dynamic |
| **Modals** | `role="dialog"` | ✅ |
| **Toasts** | `role="alert"` | ✅ |
| **Search** | `aria-label="Search"` | ✅ |

### 7.2 Keyboard Navigation

| Key | Action | Context |
|-----|--------|---------|
| **Tab** | Navigate focus | All interactive elements |
| **Enter** | Submit/Activate | Buttons, links |
| **Escape** | Close modal | Modals |
| **Focus trap** | Stay in modal | When modal open |

### 7.3 Color Contrast

| Element | Foreground | Background | Ratio | WCAG |
|---------|-----------|------------|-------|------|
| **Primary button** | White | #6366f1 | 4.5:1 | AA ✅ |
| **Body text** | #374151 | #f9fafb | 12:1 | AAA ✅ |
| **Muted text** | #6b7280 | White | 4.6:1 | AA ✅ |

---

## 8. Animation Specifications

### 8.1 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms | Hover states |
| `--transition-normal` | 300ms | Modals, toasts |
| `--transition-slow` | 500ms | Page transitions |

### 8.2 Animation Patterns

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide in (toast) */
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Spin (loading) */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 8.3 Loading States

```mermaid
flowchart TD
    A[Action triggered] --> B[Show spinner]
    B --> C[Disable button]
    C --> D[API call]
    D --> E{Response}
    
    E -->|Success| F[Show success toast]
    E -->|Error| G[Show error toast]
    
    F --> H[Enable button]
    G --> H
    H --> I[Remove spinner]
    
    style B fill:#fff3e0
    style F fill:#c8e6c9
    style G fill:#ffcdd2
```

---

## 9. PWA Integration

### 9.1 Install Prompt

```mermaid
flowchart TD
    A[User visits site] --> B{PWA criteria met?}
    B -->|Yes| C[Browser shows<br/>install banner]
    B -->|No| D[Standard experience]
    C --> E[User clicks Install]
    E --> F[PWA installed]
    D --> G[End]
    F --> G
    
    style C fill:#e3f2fd
    style D fill:#e8f5e9
```

### 9.2 Offline Capabilities

| Feature | Offline Support | Implementation |
|---------|----------------|----------------|
| **View pages** | ✅ Full | Service worker cache |
| **View cached data** | ❌ | Requires network |
| **Create tickets** | ❌ | Requires network |
| **Authenticate** | ❌ | Requires network |

---

## 10. Performance Optimizations

### 10.1 Loading Strategy

```mermaid
flowchart LR
    subgraph Network["Network"]
        HTML[HTML]
        CSS[CSS]
        JS[Javascript]
    end
    
    subgraph Render["Render"]
        PARSE[Parse HTML]
        LOAD[Load CSS]
        EXEC[Execute JS]
    end
    
    HTML --> PARSE
    CSS --> LOAD
    JS --> EXEC
    
    EXEC -->|Module import| ESM[ES Modules<br/>esm.sh CDN]
    
    style ESM fill:#e8f5e9
```

### 10.2 Lazy Interactions

| Interaction | Trigger | Implementation |
|-------------|---------|----------------|
| **Toast** | On demand | Dynamic injection |
| **Modal** | Click | Dynamic injection |
| **API calls** | On demand | No pre-fetch |

---

*Document Version: 1.0*  
*Last Updated: 2026-03-25*
