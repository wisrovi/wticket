Configuration Guide
==================

This section details all configuration options available in WTicket.

Application Constants
--------------------

Located in ``js/app.js``, these constants control core functionality:

.. code-block:: javascript
   :caption: Core Configuration

   // Administrator Credentials
   const ADMIN_EMAIL = 'wisrovi@wticket.com';
   const ADMIN_PASSWORD = 'wisrovi_wticket';

   // Session Configuration (milliseconds)
   const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

   // Application Salt for Password Hashing
   const HASH_SALT = 'wticket_salt';

JSONBin.io Configuration
-----------------------

.. code-block:: javascript
   :caption: JSONBin Configuration

   const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
   const JSONBIN_API_KEY = 'your-master-key-here';

   const BIN_IDS = {
       users: 'your-users-bin-id',
       tickets: 'your-tickets-bin-id',
       counter: 'your-counter-bin-id'
   };

JSONBin Free Tier Limits
------------------------

The JSONBin.io free tier provides:

* **3 Bins**: Sufficient for users, tickets, and counter
* **1000 Requests/Day**: Adequate for development and small deployments
* **1 MB per Bin**: Hold thousands of tickets and users
* **No Credit Card Required**: Completely free

Environment Variables
--------------------

For production deployments, consider using environment variables:

.. code-block:: javascript
   :caption: Environment-based Configuration

   const CONFIG = {
       jsonbin: {
           baseUrl: 'https://api.jsonbin.io/v3',
           apiKey: window.ENV_JSONBIN_KEY || 'default-key',
           bins: {
               users: window.ENV_USERS_BIN || 'default-users-bin',
               tickets: window.ENV_TICKETS_BIN || 'default-tickets-bin',
               counter: window.ENV_COUNTER_BIN || 'default-counter-bin'
           }
       }
   };

Theme Configuration
-------------------

Dark mode and theme settings are stored in localStorage:

.. code-block:: javascript

   // Set light theme
   localStorage.setItem('theme', 'light');

   // Set dark theme
   localStorage.setItem('theme', 'dark');

Session Configuration
--------------------

Sessions are managed through localStorage with the following structure:

.. code-block:: javascript

   {
       token: '256-bit-secure-token',
       email: 'user@example.com',
       name: 'User Name',
       role: 'user|admin',
       createdAt: 1234567890,
       expiresAt: 1234654290
   }

Security Recommendations
------------------------

.. warning::

   Always change default administrator credentials after initial setup.

Recommended Settings for Production:

1. **Strong Admin Password**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Unique API Key**: Generate a new master key for production
3. **Private Bins**: Configure bins to private in JSONBin.io settings
4. **CORS Restrictions**: Whitelist only your deployment domain

Customization Options
---------------------

The design system supports extensive customization through CSS custom properties:

.. code-block:: css
   :caption: Custom Theme Variables

   :root {
       --primary: #6366f1;
       --primary-hover: #4f46e5;
       --success: #10b981;
       --warning: #f59e0b;
       --danger: #ef4444;
       --font-family: 'Inter', sans-serif;
       --border-radius: 8px;
   }
