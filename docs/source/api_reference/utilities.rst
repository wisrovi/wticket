Utility Functions
=================

This section documents utility modules and helper functions.

Date Formatting
---------------

formatDate(timestamp)
~~~~~~~~~~~~~~~~~~~~~

Formats a Unix timestamp into a Spanish date string.

**Parameters:**

+------------+----------+----------------------------------------+
| Name       | Type     | Description                            |
+============+==========+========================================+
| timestamp  | number   | Unix timestamp in milliseconds          |
+------------+----------+----------------------------------------+

**Returns:** ``string``

**Example:**

.. code-block:: javascript

   const formatted = API.formatDate(Date.now());
   console.log(formatted); // "26/03/2026 14:30"

XSS Prevention
--------------

escapeHtml(text)
~~~~~~~~~~~~~~~~

Escapes HTML special characters to prevent XSS attacks.

**Parameters:**

+------+----------+---------------------------+
| Name | Type     | Description               |
+======+==========+===========================+
| text | string   | String to escape          |
+------+----------+---------------------------+

**Returns:** ``string``

**Example:**

.. code-block:: javascript

   const userInput = '<script>alert("xss")</script>';
   const safe = API.escapeHtml(userInput);
   console.log(safe);
   // Output: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

Debounce Utility
----------------

The debounce utility delays function execution until after a specified wait time.

.. code-block:: javascript

   import { debounce } from './js/utils.js';

   const handleSearch = debounce((query) => {
       console.log('Searching for:', query);
   }, 300);

   // Will only execute 300ms after last call
   handleSearch('query1');
   handleSearch('query2');
   handleSearch('query3');
   // Only executes once with 'query3'

**Parameters:**

+------+----------+----------------------------------------+
| Name | Type     | Description                            |
+======+==========+========================================+
| func | function | Function to debounce                   |
+------+----------+----------------------------------------+
| wait | number   | Milliseconds to wait                   |
+------+----------+----------------------------------------+

**Returns:** ``function``

Throttle Utility
----------------

The throttle utility limits function execution to once per specified interval.

.. code-block:: javascript

   import { throttle } from './js/utils.js';

   const handleScroll = throttle(() => {
       console.log('Scrolled!');
   }, 1000);

   // Will execute at most once per second
   window.addEventListener('scroll', handleScroll);

Internationalization
--------------------

The i18n module provides multi-language support.

.. code-block:: javascript

   import { t, setLang, getLang, toggleLang } from './js/i18n.js';

   // Get current language
   const currentLang = getLang();
   console.log(currentLang); // 'es' or 'en'

   // Translate a key
   const greeting = t('login');
   console.log(greeting); // 'Iniciar Sesión' or 'Login'

   // Set language
   setLang('en');

   // Toggle between languages
   toggleLang();

IndexedDB Cache
---------------

The db module provides offline data persistence.

.. code-block:: javascript

   import {
       initDB,
       cacheUsers,
       getCachedUsers,
       cacheTickets,
       getCachedTickets
   } from './js/db.js';

   // Initialize database
   await initDB();

   // Cache user data
   await cacheUsers(userData);

   // Retrieve cached users
   const users = await getCachedUsers();

   // Cache ticket data
   await cacheTickets(ticketData);

   // Retrieve cached tickets
   const tickets = await getCachedTickets();

Keyboard Shortcuts
------------------

Global keyboard shortcuts for power users.

.. code-block:: javascript

   import { initKeyboardShortcuts } from './js/shortcuts.js';

   initKeyboardShortcuts({
       onSearch: () => {
           document.getElementById('search').focus();
       },
       onRefresh: () => {
           location.reload();
       },
       onToggleTheme: () => {
           toggleTheme();
       }
   });

Available Shortcuts
~~~~~~~~~~~~~~~~~~~

+------+----------------------------------------------------------+
| Key  | Action                                                  |
+======+==========================================================+
| n    | Create new ticket                                       |
+------+----------------------------------------------------------+
| /    | Focus search input                                      |
+------+----------------------------------------------------------+
| r    | Refresh data                                            |
+------+----------------------------------------------------------+
| d    | Toggle dark mode                                        |
+------+----------------------------------------------------------+
| Esc  | Close modal dialogs                                     |
+------+----------------------------------------------------------+

Toast Notifications
-------------------

Visual feedback for user actions.

.. code-block:: javascript

   import Toast from './js/toast.js';

   // Initialize toast system
   Toast.init();

   // Show different notification types
   Toast.success('Operation completed successfully!');
   Toast.error('An error occurred');
   Toast.info('New update available');
   Toast.warning('Please review your settings');

   // Custom notification
   Toast.show('Custom message', 'success', 5000);

Toast Types
~~~~~~~~~~~

+---------+------------------+----------------------------------------+
| Type    | Default Duration | Use Case                              |
+=========+==================+========================================+
| success | 4 seconds        | Confirmations, successful operations   |
+---------+------------------+----------------------------------------+
| error   | 6 seconds        | Errors, failed operations              |
+---------+------------------+----------------------------------------+
| info    | 4 seconds        | Information, updates                   |
+---------+------------------+----------------------------------------+
| warning | 5 seconds        | Warnings, alerts                       |
+---------+------------------+----------------------------------------+
