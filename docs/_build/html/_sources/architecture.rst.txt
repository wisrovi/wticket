Architecture Deep Dive
======================

This section provides an in-depth exploration of WTicket's system architecture, design decisions, and technical implementation details.

System Architecture Overview
----------------------------

WTicket employs a modern three-tier architecture optimized for serverless deployment and scalability. The architecture prioritizes simplicity, maintainability, and cost efficiency while delivering enterprise-grade functionality.

**Architecture Principles:**

1. **Separation of Concerns**: Clear boundaries between presentation, logic, and data layers
2. **Stateless Design**: Each request contains all information needed for processing
3. **Cache-First Strategy**: Local caching reduces network requests and improves responsiveness
4. **Graceful Degradation**: Application continues functioning during network interruptions

**Technology Layer Mapping:**

+------------------------+------------------------------------------+
| Layer                 | Technologies Used                        |
+========================+==========================================+
| Presentation          | HTML5, CSS3, Vanilla JavaScript ES6+     |
+------------------------+------------------------------------------+
| Business Logic        | ES Modules, Service Workers              |
+------------------------+------------------------------------------+
| Data Management       | JSONBin.io REST API, IndexedDB          |
+------------------------+------------------------------------------+
| Infrastructure        | GitHub Pages CDN, Browser Runtime        |
+------------------------+------------------------------------------+

Client-Side Architecture
-------------------------

### Module Structure

The application consists of seven core modules, each responsible for specific functionality:

**Core Modules:**

.. code-block:: text

    js/
    ├── app.js           # Central API and business logic
    ├── toast.js         # User notification system
    ├── shortcuts.js     # Keyboard shortcut handling
    ├── utils.js         # Shared utility functions
    ├── db.js            # IndexedDB cache management
    ├── i18n.js          # Internationalization
    └── achievements.js   # Gamification system

**Module Dependencies:**

.. code-block:: text

    app.js (Core)
       ├── toast.js
       ├── shortcuts.js
       ├── utils.js
       ├── db.js
       ├── i18n.js
       └── achievements.js

### Page Architecture

Six HTML pages serve distinct user journeys:

**Public Pages:**

* ``index.html``: Landing page with public statistics
* ``contact.html``: Developer contact information

**Authenticated Pages:**

* ``login.html``: Authentication gateway
* ``dashboard.html``: User ticket management
* ``admin.html``: Administrator control panel
* ``profile.html``: Account settings and achievements

### Data Flow Architecture

.. code-block:: text

    User Action
         │
         ▼
    HTML Event Handler
         │
         ▼
    JavaScript Module
         │
         ├──► IndexedDB Cache (immediate read)
         │
         ▼
    JSONBin.io API (async)
         │
         ▼
    Server Response
         │
         ▼
    Update Cache ──► Update UI
         │
         ▼
    Display Result

Data Layer Design
-----------------

### JSONBin.io Integration

JSONBin.io serves as the primary persistent data store, providing RESTful access to JSON documents.

**Bin Structure:**

+----------+--------------------------------+----------------------------+
| Bin      | Purpose                        | Data Volume Estimate        |
+==========+================================+============================+
| Users    | User accounts and profiles     | ~1KB per user             |
+----------+--------------------------------+----------------------------+
| Tickets  | Support tickets and comments   | ~2KB per ticket           |
+----------+--------------------------------+----------------------------+
| Counter  | Ticket ID sequence             | ~20 bytes                 |
+----------+--------------------------------+----------------------------+

**API Operations:**

.. code-block:: javascript

    // Read operation
    GET /b/{bin_id}/latest
    Headers: X-Master-Key: {api_key}
    
    // Write operation  
    PUT /b/{bin_id}
    Headers: 
        X-Master-Key: {api_key}
        Content-Type: application/json
    Body: { json_data }

### Synchronization Strategy

The sync-before-write pattern prevents data loss from concurrent operations.

**The Problem:**

When multiple users operate simultaneously, naive write operations can overwrite concurrent changes.

**The Solution:**

.. code-block:: javascript

    async function safeWrite(binId, localData) {
        // 1. Fetch latest server state
        const serverData = await fetchLatest(binId);
        
        // 2. Merge changes (local takes precedence)
        const mergedData = merge(serverData, localData);
        
        // 3. Write merged data
        await writeToServer(binId, mergedData);
        
        // 4. Update local cache
        localCache = mergedData;
    }

### IndexedDB Caching

IndexedDB provides client-side persistence for offline access and performance optimization.

**Database Schema:**

.. code-block:: javascript

    Database: wticket_db (version 1)
    
    Object Stores:
    ├── users
    │   └── keyPath: email
    ├── tickets
    │   └── keyPath: id
    ├── counter
    │   └── keyPath: id
    └── sync
        └── keyPath: type

**Cache Operations:**

* ``cacheUsers()``: Persist user data locally
* ``getCachedUsers()``: Retrieve cached user data
* ``cacheTickets()``: Store tickets for offline access
* ``getCachedTickets()``: Access cached ticket data
* ``cacheCounter()``: Preserve ID sequence
* ``getCachedCounter()``: Retrieve cached counter value

### localStorage Usage

Session and preference data use localStorage for immediate access.

**Stored Items:**

* Session token and user information
* Theme preference (light/dark)
* Language preference (es/en)
* Last sync timestamps

Authentication Architecture
---------------------------

### Session Management

Sessions provide authenticated state across page navigations.

**Session Lifecycle:**

1. **Creation**: User submits credentials
2. **Validation**: Server (JSONBin) validates against stored hash
3. **Token Generation**: 256-bit cryptographically random token created
4. **Storage**: Token stored in localStorage
5. **Validation**: Token checked on each authenticated action
6. **Expiration**: Token expires after 24 hours
7. **Cleanup**: Expired tokens trigger re-authentication

**Session Object Structure:**

.. code-block:: javascript

    {
        token: "a1b2c3d4e5f6...",  // 256-bit secure token
        email: "user@example.com",
        name: "John Doe",
        role: "user",               // or "admin"
        createdAt: 1711459200000,   // Unix timestamp
        expiresAt: 1711545600000    // 24 hours later
    }

### Password Security

Passwords undergo client-side hashing before transmission and storage.

**Hashing Process:**

.. code-block:: javascript

    async function hashPassword(password) {
        const salt = 'wticket_salt';
        const data = new TextEncoder().encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

**Security Considerations:**

* Salt prevents rainbow table attacks
* SHA-256 is computationally intensive
* Client-side hashing does not replace server-side bcrypt
* Transport over HTTPS is mandatory

Role-Based Access Control
------------------------

### User Roles

Two roles provide appropriate access levels:

**User Role:**

* Create tickets
* View own tickets
* Add comments to own tickets
* Update own profile
* View own achievements

**Admin Role:**

* All user permissions plus:
* View all tickets
* Close any ticket
* Assign tickets to admins
* Export ticket data
* View system statistics

### Authorization Decorator

The ``requireAuth()`` decorator enforces access control:

.. code-block:: javascript

    async function requireAuth(allowedRoles) {
        return async function() {
            const session = await validateSession();
            
            if (!session) {
                redirectToLogin();
                return null;
            }
            
            if (!allowedRoles.includes(session.role)) {
                showUnauthorizedError();
                return null;
            }
            
            return session;
        };
    }

Presentation Layer Architecture
--------------------------------

### CSS Design System

A comprehensive design system ensures visual consistency.

**Design Tokens:**

.. code-block:: css

    :root {
        /* Colors */
        --primary: #6366f1;
        --primary-hover: #4f46e5;
        --success: #10b981;
        --warning: #f59e0b;
        --danger: #ef4444;
        
        /* Typography */
        --font-family: 'Inter', system-ui, sans-serif;
        --font-size-base: 16px;
        
        /* Spacing */
        --spacing-unit: 4px;
        --spacing-sm: 8px;
        --spacing-md: 16px;
        --spacing-lg: 24px;
        
        /* Borders */
        --border-radius: 8px;
        --border-color: #e5e7eb;
        
        /* Shadows */
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

### Dark Mode Implementation

Theme switching uses CSS custom properties and data attributes.

**Implementation:**

.. code-block:: javascript

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

**CSS Variables for Dark Mode:**

.. code-block:: css

    [data-theme="dark"] {
        --bg-primary: #111827;
        --bg-secondary: #1f2937;
        --text-primary: #f9fafb;
        --text-secondary: #d1d5db;
        --border-color: #374151;
    }

### Responsive Breakpoints

Mobile-first design with progressive enhancement.

**Breakpoints:**

* ``< 640px``: Mobile devices
* ``640px - 768px``: Small tablets
* ``768px - 1024px``: Tablets
* ``> 1024px``: Desktops

### Navigation Architecture

Segmented navigation improves usability on all devices.

**Desktop Layout:**

.. code-block:: text

    [Hamburger] [Logo] | [Nav Links] ..................... [User] [Theme] [Actions]

**Mobile Layout:**

.. code-block:: text

    [Hamburger] [Logo]
    
    Slide-out drawer on hamburger click:
    ┌─────────────────────────┐
    │ [User Info]             │
    │─────────────────────────│
    │ Inicio                  │
    │ Contacto                │
    │ Mi Perfil               │
    │─────────────────────────│
    │ 🌙 Theme    🔄 Refresh │
    │ 🚪 Logout              │
    └─────────────────────────┘

Progressive Web App Architecture
--------------------------------

### Service Worker Strategy

Service workers enable offline functionality and performance optimization.

**Caching Strategy:**

* **Cache-First**: Static assets (HTML, CSS, JS, images)
* **Network-First**: Dynamic data (JSONBin requests bypassed)
* **Stale-While-Revalidate**: Best effort with cache fallback

**Cached Assets:**

.. code-block:: javascript

    const CACHE_NAME = 'wticket-v3';
    const STATIC_ASSETS = [
        'index.html',
        'login.html',
        'dashboard.html',
        'admin.html',
        'profile.html',
        'contact.html',
        'css/styles.css',
        'js/app.js',
        'js/toast.js',
        'js/shortcuts.js',
        'js/utils.js',
        'js/db.js',
        'js/i18n.js',
        'js/achievements.js',
        'manifest.json'
    ];

### Web App Manifest

The manifest enables installation on home screens.

**Manifest Properties:**

.. code-block:: json

    {
        "name": "WTicket - Sistema de Tickets",
        "short_name": "WTicket",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#f3f4f6",
        "theme_color": "#6366f1",
        "icons": [
            {
                "src": "/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            }
        ],
        "shortcuts": [
            {
                "name": "Crear Ticket",
                "url": "/login.html?tab=register"
            }
        ]
    }

Error Handling Architecture
---------------------------

### API Error Handling

Consistent error handling provides clear feedback.

**Error Categories:**

* **Network Errors**: Connection failures, timeouts
* **Authentication Errors**: Invalid credentials, expired sessions
* **Validation Errors**: Invalid input data
* **Server Errors**: JSONBin service issues

**Error Handler Implementation:**

.. code-block:: javascript

    async function safeApiCall(apiFunction) {
        try {
            return await apiFunction();
        } catch (error) {
            if (error.name === 'NetworkError') {
                Toast.error('Network connection failed. Please check your internet.');
            } else if (error.message.includes('Session')) {
                redirectToLogin();
            } else {
                Toast.error(`Error: ${error.message}`);
            }
            throw error;
        }
    }

### UI Error States

Graceful degradation maintains user experience during errors.

**Error States:**

* **Empty States**: No data to display
* **Loading States**: Data being fetched
* **Error States**: Operation failed
* **Offline States**: No network connectivity

Performance Optimization
-----------------------

### Code Splitting

Modules load on demand, reducing initial bundle size.

**Deferred Modules:**

* ``achievements.js``: Loaded only on profile page
* ``i18n.js``: Loaded only when language switching needed

### Debouncing and Throttling

Input handling optimizes performance.

**Search Input:**

.. code-block:: javascript

    const debouncedSearch = debounce((query) => {
        filterTickets(query);
    }, 300);

**Refresh Button:**

.. code-block:: javascript

    const throttledRefresh = throttle(() => {
        loadTickets();
    }, 1000);

### Lazy Loading Images

Images below viewport load on scroll.

**Implementation:**

.. code-block:: html

    <img data-src="image.jpg" class="lazy" alt="Description">

.. code-block:: javascript

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.src = entry.target.dataset.src;
                observer.unobserve(entry.target);
            }
        });
    });

Extensibility Points
-------------------

### Adding New Modules

Extend functionality by creating new modules.

**Module Template:**

.. code-block:: javascript

    // js/newModule.js
    export function newFeature() {
        // Implementation
    }
    
    // Import in app.js
    import { newFeature } from './newModule.js';

### Custom Themes

Create custom themes by extending CSS variables.

**Theme File Template:**

.. code-block:: css

    [data-theme="custom"] {
        --primary: #custom-color;
        --primary-hover: #custom-hover;
        /* Override other variables */
    }

### API Extensions

Extend the API with custom functions.

**Extension Pattern:**

.. code-block:: javascript

    // In app.js
    export const extendedAPI = {
        ...API,
        customFunction: async (param) => {
            // Custom implementation
        }
    };
