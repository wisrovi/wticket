Tickets API
==========

This section documents all ticket-related API methods.

createTicket(title, description, priority, category)
-----------------------------------------------------

Creates a new support ticket.

**Parameters:**

+-------------+----------+----------------------------------------+
| Name        | Type     | Description                            |
+=============+==========+========================================+
| title       | string   | Ticket title (required)                |
+-------------+----------+----------------------------------------+
| description | string   | Detailed description (optional)         |
+-------------+----------+----------------------------------------+
| priority    | string   | ``'urgent'``, ``'high'``, ``'normal'`` |
|             |          | or ``'low'`` (default: ``'normal'``)  |
+-------------+----------+----------------------------------------+
| category    | string   | ``'general'``, ``'technical'``,        |
|             |          | ``'billing'``, ``'suggestion'``,       |
|             |          | ``'bug'``, or ``'other'``              |
|             |          | (default: ``'general'``)              |
+-------------+----------+----------------------------------------+

**Returns:** ``Promise<Ticket>``

**Example:**

.. code-block:: javascript

   const ticket = await API.createTicket(
       'Login not working',
       'Cannot access my account since yesterday. Error: Invalid credentials.',
       'high',
       'technical'
   );
   console.log('Ticket created:', ticket.id);

getTicket(id)
-------------

Retrieves a single ticket by ID.

**Parameters:**

+------+----------+---------------------------+
| Name | Type     | Description               |
+======+==========+===========================+
| id   | number   | Ticket ID                 |
+------+----------+---------------------------+

**Returns:** ``Promise<Ticket|null>``

**Example:**

.. code-block:: javascript

   const ticket = await API.getTicket(123);
   if (ticket) {
       console.log('Title:', ticket.title);
       console.log('Status:', ticket.status);
   }

closeTicket(id, response)
-------------------------

Closes an open ticket with an administrator response.

**Parameters:**

+----------+----------+----------------------------------------+
| Name     | Type     | Description                            |
+==========+==========+========================================+
| id       | number   | Ticket ID                              |
+----------+----------+----------------------------------------+
| response | string   | Administrator's response (optional)     |
+----------+----------+----------------------------------------+

**Returns:** ``Promise<boolean>``

**Example:**

.. code-block:: javascript

   const success = await API.closeTicket(
       123,
       'Issue resolved by password reset. Please check your email.'
   );
   if (success) {
       console.log('Ticket resolved');
   }

addComment(ticketId, text, authorEmail, authorName)
---------------------------------------------------

Adds a comment to a ticket.

**Parameters:**

+-------------+----------+---------------------------+
| Name        | Type     | Description               |
+=============+==========+===========================+
| ticketId    | number   | Target ticket ID          |
+-------------+----------+---------------------------+
| text        | string   | Comment content           |
+-------------+----------+---------------------------+
| authorEmail | string   | Comment author's email    |
+-------------+----------+---------------------------+
| authorName  | string   | Comment author's name     |
+-------------+----------+---------------------------+

**Returns:** ``Promise<boolean>``

**Example:**

.. code-block:: javascript

   await API.addComment(
       123,
       'Thank you for the update!',
       'user@example.com',
       'John User'
   );

assignTicket(ticketId, adminEmail)
----------------------------------

Assigns a ticket to an administrator (admin only).

**Parameters:**

+-----------+----------+----------------------------------------+
| Name      | Type     | Description                            |
+===========+==========+========================================+
| ticketId  | number   | Ticket ID                              |
+-----------+----------+----------------------------------------+
| adminEmail | string   | Target administrator's email            |
+-----------+----------+----------------------------------------+

**Returns:** ``Promise<boolean>``

**Example:**

.. code-block:: javascript

   const admins = API.getAdmins();
   await API.assignTicket(123, admins[0].email);

Query Methods
-------------

getOpenTickets()
~~~~~~~~~~~~~~~~

Returns all open tickets sorted by creation date.

**Returns:** ``Promise<Ticket[]>``

getClosedTickets()
~~~~~~~~~~~~~~~~~~

Returns all closed tickets sorted by creation date (newest first).

**Returns:** ``Promise<Ticket[]>``

getUserOpenTickets(email)
~~~~~~~~~~~~~~~~~~~~~~~~~

Returns open tickets for a specific user.

**Returns:** ``Promise<Ticket[]>``

getUserClosedTickets(email)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Returns closed tickets for a specific user.

**Returns:** ``Promise<Ticket[]>``

getStats()
~~~~~~~~~~

Returns global statistics.

**Returns:** ``Promise<Stats>``

.. code-block:: javascript

   const stats = await API.getStats();
   console.log('Open:', stats.openCount);
   console.log('Closed:', stats.closedCount);
   console.log('Total:', stats.totalCount);

searchTickets(tickets, query)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Filters tickets by title or ID.

**Parameters:**

+-----------+----------+---------------------------+
| Name      | Type     | Description               |
+===========+==========+===========================+
| tickets   | Ticket[] | Array of tickets to filter|
+-----------+----------+---------------------------+
| query     | string   | Search query              |
+-----------+----------+---------------------------+

**Returns:** ``Ticket[]``

Ticket Object Schema
-------------------

.. code-block:: typescript

   interface Ticket {
       id: number;
       title: string;
       description: string;
       userEmail: string;
       priority: 'urgent' | 'high' | 'normal' | 'low';
       category: 'general' | 'technical' | 'billing' | 
                 'suggestion' | 'bug' | 'other';
       status: 'open' | 'closed';
       createdAt: number;
       response?: string;
       responseAt?: number;
       assignedTo?: string;
       assignedAt?: number;
       comments: Comment[];
   }

   interface Comment {
       text: string;
       authorEmail: string;
       authorName: string;
       createdAt: number;
   }

Priority Levels
---------------

+--------------+------------------------------------------+
| Level        | Description                              |
+==============+==========================================+
| urgent       | Critical issues requiring immediate       |
|              | attention (red indicator)                 |
+--------------+------------------------------------------+
| high         | Important issues (orange indicator)       |
+--------------+------------------------------------------+
| normal       | Standard priority (yellow indicator)      |
+--------------+------------------------------------------+
| low          | Minor issues (green indicator)            |
+--------------+------------------------------------------+

Categories
----------

+------------+----------------------------------------------------------+
| Category   | Use Case                                                |
+============+==========================================================+
| general    | General inquiries and questions                           |
+------------+----------------------------------------------------------+
| technical  | Technical issues and bug reports                         |
+------------+----------------------------------------------------------+
| billing    | Payment and subscription matters                         |
+------------+----------------------------------------------------------+
| suggestion | Feature requests and improvements                        |
+------------+----------------------------------------------------------+
| bug        | Application errors and malfunctions                      |
+------------+----------------------------------------------------------+
| other      | Miscellaneous issues                                     |
+------------+----------------------------------------------------------+
