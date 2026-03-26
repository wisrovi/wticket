Authentication API
=================

This section documents all authentication-related API methods.

register(email, password, name)
------------------------------

Creates a new user account and initiates a session.

**Parameters:**

+----------+----------+---------------------------+
| Name     | Type     | Description               |
+==========+==========+===========================+
| email    | string   | User's email address      |
+----------+----------+---------------------------+
| password | string   | Account password          |
+----------+----------+---------------------------+
| name     | string   | Display name (optional)   |
+----------+----------+---------------------------+

**Returns:** ``Promise<Session>``

**Example:**

.. code-block:: javascript

   try {
       const session = await API.register(
           'developer@company.com',
           'securePassword123',
           'John Developer'
       );
       console.log('Account created:', session.name);
   } catch (error) {
       if (error.message === 'User already exists') {
           console.log('Email already registered');
       }
   }

login(email, password)
-----------------------

Authenticates user credentials and establishes a session.

**Parameters:**

+----------+----------+---------------------------+
| Name     | Type     | Description               |
+==========+==========+===========================+
| email    | string   | Registered email address  |
+----------+----------+---------------------------+
| password | string   | Account password          |
+----------+----------+---------------------------+

**Returns:** ``Promise<Session>``

**Example:**

.. code-block:: javascript

   try {
       const session = await API.login(
           'user@example.com',
           'userPassword456'
       );
       console.log(`Welcome back, ${session.name}!`);
       console.log(`Role: ${session.role}`);
   } catch (error) {
       console.error('Authentication failed:', error.message);
   }

logout()
--------

Terminates the current user session.

**Returns:** ``Promise<void>``

**Example:**

.. code-block:: javascript

   await API.logout();
   console.log('Session terminated');

validateSession()
-----------------

Validates the current session and returns session details.

**Returns:** ``Promise<Session|null>``

Returns the session object if valid, or ``null`` if no valid session exists.

**Example:**

.. code-block:: javascript

   const session = await API.validateSession();
   if (session) {
       console.log('Valid session for:', session.email);
       console.log('Expires at:', new Date(session.expiresAt));
   } else {
       console.log('No active session');
       // Redirect to login
   }

requireAuth(roles)
------------------

Decorator function that redirects to login if session is invalid or unauthorized.

**Parameters:**

+----------+----------+---------------------------+
| Name     | Type     | Description               |
+==========+==========+===========================+
| roles    | array    | Required role(s):         |
|          |          | ``['user']`` or          |
|          |          | ``['admin']``            |
+----------+----------+---------------------------+

**Returns:** ``Promise<Session|null>``

**Example:**

.. code-block:: javascript

   // Require admin authentication
   const session = await API.requireAuth(['admin'])();
   if (!session) {
       // Redirected to login
       return;
   }
   // Admin access granted

refreshData()
-------------

Forces a data refresh from JSONBin.io servers.

**Returns:** ``Promise<void>``

**Example:**

.. code-block:: javascript

   await API.refreshData();
   console.log('Data synchronized');

Session Object
-------------

The session object contains the following properties:

+----------+----------+---------------------------+
| Property | Type     | Description               |
+==========+==========+===========================+
| token    | string   | Unique session identifier |
+----------+----------+---------------------------+
| email    | string   | User's email address      |
+----------+----------+---------------------------+
| name     | string   | User's display name       |
+----------+----------+---------------------------+
| role     | string   | ``'user'`` or ``'admin'`` |
+----------+----------+---------------------------+
| createdAt| number   | Session creation timestamp|
+----------+----------+---------------------------+
| expiresAt| number   | Session expiration        |
+----------+----------+---------------------------+

Session Security
----------------

* Sessions expire after 24 hours
* Tokens are 256-bit cryptographically random
* Passwords are hashed with SHA-256 and application salt
* Sessions are stored in localStorage
