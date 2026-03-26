User Management API
===================

This section documents user-related API methods.

updateUserName(email, newName)
------------------------------

Updates a user's display name.

**Parameters:**

+----------+----------+---------------------------+
| Name     | Type     | Description               |
+==========+==========+===========================+
| email    | string   | User's email address      |
+----------+----------+---------------------------+
| newName  | string   | New display name          |
+----------+----------+---------------------------+

**Returns:** ``Promise<boolean>``

**Example:**

.. code-block:: javascript

   const success = await API.updateUserName(
       'user@example.com',
       'John Smith'
   );
   if (success) {
       console.log('Name updated successfully');
   }

updateUserPassword(email, currentPassword, newPassword)
-------------------------------------------------------

Updates a user's password after verifying current password.

**Parameters:**

+-----------------+----------+--------------------------------+
| Name            | Type     | Description                    |
+=================+==========+================================+
| email           | string   | User's email address           |
+-----------------+----------+--------------------------------+
| currentPassword | string   | Current password for           |
|                 |          | verification                   |
+-----------------+----------+--------------------------------+
| newPassword     | string   | New password                   |
+-----------------+----------+--------------------------------+

**Returns:** ``Promise<boolean>``

**Example:**

.. code-block:: javascript

   try {
       const success = await API.updateUserPassword(
           'user@example.com',
           'oldPassword123',
           'newSecurePassword456'
       );
       if (success) {
           console.log('Password changed successfully');
       }
   } catch (error) {
       if (error.message === 'Current password incorrect') {
           console.log('Please verify your current password');
       }
   }

getAdmins()
-----------

Returns a list of all administrator accounts.

**Returns:** ``Array<{email: string, name: string}>``

**Example:**

.. code-block:: javascript

   const admins = API.getAdmins();
   admins.forEach(admin => {
       console.log(`${admin.name}: ${admin.email}`);
   });

User Object Schema
------------------

.. code-block:: typescript

   interface User {
       email: string;
       name: string;
       role: 'user' | 'admin';
       passwordHash: string;
       createdAt: number;
   }

Role Types
----------

+--------+----------------------------------------------------------+
| Role   | Permissions                                             |
+========+==========================================================+
| user   | Create tickets, add comments, manage own profile         |
+--------+----------------------------------------------------------+
| admin  | All user permissions plus:                              |
|        | - View all tickets                                       |
|        | - Close any ticket                                      |
|        | - Assign tickets to admins                              |
|        | - Export data to CSV                                    |
|        | - View system statistics                                |
+--------+----------------------------------------------------------+

Password Security
-----------------

Passwords are protected using:

1. **SHA-256 Hashing**: One-way cryptographic hash
2. **Application Salt**: Prevents rainbow table attacks
3. **No Plain Storage**: Original passwords never stored

.. warning::

   Client-side hashing provides basic protection but cannot replace
   server-side bcrypt or Argon2 for high-security applications.

User Achievements
-----------------

The system includes a gamification layer with achievement badges:

.. code-block:: javascript

   import { getAchievements } from './js/achievements.js';

   const user = {
       ticketCount: 10,
       resolvedCount: 5,
       createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
       daysSinceCreated: 30
   };

   const achievements = getAchievements(user);
   achievements.forEach(a => {
       if (a.unlocked) {
           console.log(`Badge: ${a.name} - ${a.description}`);
       }
   });

Available Achievements
~~~~~~~~~~~~~~~~~~~~~

+----------------+-------------------------------------------+
| Achievement    | Unlock Condition                          |
+===============+===========================================+
| first_ticket   | Created first ticket                      |
+----------------+-------------------------------------------+
| five_tickets   | Created 5 tickets                         |
+----------------+-------------------------------------------+
| ten_tickets    | Created 10 tickets                        |
+----------------+-------------------------------------------+
| first_resolved | First ticket was resolved                  |
+----------------+-------------------------------------------+
| five_resolved  | 5 tickets resolved                        |
+----------------+-------------------------------------------+
| old_user       | Account older than 30 days                |
+----------------+-------------------------------------------+
| early_bird     | Account created before specific date       |
+----------------+-------------------------------------------+
