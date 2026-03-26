API Reference
=============

Complete reference documentation for the WTicket JavaScript API.

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   authentication
   tickets
   users
   utilities

Overview
--------

The WTicket API is exposed through the ``API`` object exported from ``js/app.js``.
All methods return Promises for asynchronous operation.

.. code-block:: javascript

   import API from './js/app.js';

   // Usage example
   const session = await API.login('user@example.com', 'password123');

Module Structure
----------------

The API is organized into the following functional modules:

+------------------------+--------------------------------------------------+
| Module                 | Description                                      |
+========================+==================================================+
| Authentication         | Login, logout, session management                |
+------------------------+--------------------------------------------------+
| User Management        | Registration, profile updates                    |
+------------------------+--------------------------------------------------+
| Ticket Operations      | CRUD operations for tickets                      |
+------------------------+--------------------------------------------------+
| Query Functions        | Data retrieval and filtering                     |
+------------------------+--------------------------------------------------+
| Utility Functions      | Formatting, escaping, date handling              |
+------------------------+--------------------------------------------------+

Base Configuration
------------------

The API connects to JSONBin.io for data persistence:

.. code-block:: javascript

   const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
   const JSONBIN_API_KEY = 'your-master-key';

Error Handling
--------------

All API methods throw errors on failure. Wrap calls in try-catch blocks:

.. code-block:: javascript

   try {
       const session = await API.login(email, password);
       console.log('Login successful:', session);
   } catch (error) {
       console.error('Login failed:', error.message);
   }

Common Error Messages
---------------------

+------------------+----------------------------------------------------+
| Error            | Description                                        |
+------------------+----------------------------------------------------+
| User not found   | Email not registered in system                    |
+------------------+----------------------------------------------------+
| Invalid password | Password does not match stored hash                |
+------------------+----------------------------------------------------+
| User exists      | Email already registered                           |
+------------------+----------------------------------------------------+
| Session expired  | Token has exceeded 24-hour duration                |
+------------------+----------------------------------------------------+
| Network error    | Failed to reach JSONBin.io servers                 |
+------------------+----------------------------------------------------+
