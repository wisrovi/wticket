User Workflow Tutorial
======================

This tutorial guides you through the complete end-user experience with WTicket.

Objective
---------

By the end of this tutorial, you will be able to:

* Register a new user account
* Create and manage support tickets
* Add comments to tickets
* Track ticket resolution progress

Step 1: User Registration
-------------------------

First, register a new account to access the system.

**Code Example:**

.. code-block:: javascript

   import API from './js/app.js';

   async function registerUser() {
       try {
           const session = await API.register(
               'developer@techcorp.com',
               'SecurePass123!',
               'Jane Developer'
           );
           
           console.log('Registration successful!');
           console.log('Welcome,', session.name);
           console.log('Role:', session.role);
           
           return session;
       } catch (error) {
           console.error('Registration failed:', error.message);
       }
   }

**Expected Output:**

.. code-block:: text

   Registration successful!
   Welcome, Jane Developer
   Role: user

Step 2: Create a Support Ticket
-------------------------------

Create a ticket to report an issue or request assistance.

**Code Example:**

.. code-block:: javascript

   async function createSupportTicket() {
       const ticket = await API.createTicket(
           'Application crashes on startup',
           'When I try to launch the application, it immediately ' +
           'crashes with the following error: ' +
           '"Error: Cannot read property \'data\' of undefined"',
           'high',      // Priority: urgent, high, normal, low
           'technical'  // Category: general, technical, billing, 
                        // suggestion, bug, other
       );
       
       console.log('Ticket created with ID:', ticket.id);
       console.log('Status:', ticket.status);
       
       return ticket;
   }

**Expected Output:**

.. code-block:: text

   Ticket created with ID: 42
   Status: open

Step 3: Add Comments
---------------------

Communicate additional information on your ticket.

**Code Example:**

.. code-block:: javascript

   async function addTicketComment(ticketId) {
       const session = await API.validateSession();
       
       // Add initial comment
       await API.addComment(
           ticketId,
           'I am using Windows 11 with the latest updates.',
           session.email,
           session.name
       );
       
       // Add follow-up information
       await API.addComment(
           ticketId,
           'The issue started after the recent version update.',
           session.email,
           session.name
       );
       
       console.log('Comments added successfully');
   }

Step 4: Track Ticket Status
----------------------------

Monitor your ticket as it progresses through resolution.

**Code Example:**

.. code-block:: javascript

   async function trackTicket(ticketId) {
       // Get user's open tickets
       const session = await API.validateSession();
       const openTickets = await API.getUserOpenTickets(session.email);
       
       const myTicket = openTickets.find(t => t.id === ticketId);
       
       if (myTicket) {
           console.log('Your ticket is still open');
           console.log('Priority:', myTicket.priority);
           console.log('Created:', API.formatDate(myTicket.createdAt));
       } else {
           // Check closed tickets
           const closedTickets = await API.getUserClosedTickets(session.email);
           const resolved = closedTickets.find(t => t.id === ticketId);
           
           if (resolved) {
               console.log('Your ticket has been resolved!');
               console.log('Response:', resolved.response);
               console.log('Resolved on:', API.formatDate(resolved.responseAt));
           }
       }
   }

Step 5: Search Your Tickets
----------------------------

Find specific tickets quickly using search.

**Code Example:**

.. code-block:: javascript

   async function searchTickets(query) {
       const session = await API.validateSession();
       
       // Get all user tickets
       const openTickets = await API.getUserOpenTickets(session.email);
       const closedTickets = await API.getUserClosedTickets(session.email);
       const allTickets = [...openTickets, ...closedTickets];
       
       // Search by title or ID
       const results = API.searchTickets(allTickets, query);
       
       console.log(`Found ${results.length} matching tickets:`);
       results.forEach(t => {
           console.log(`#${t.id}: ${t.title} (${t.status})`);
       });
       
       return results;
   }

Verification
------------

To verify your implementation:

1. Register a new user account
2. Create at least 3 tickets with different priorities
3. Add comments to each ticket
4. Search for tickets by title
5. View ticket details and status

Next Steps
---------

* Learn about :doc:`admin_workflow` to understand administrator functions
* Explore :doc:`integration` to integrate WTicket with other systems
* Review the :doc:`../api_reference/index` for complete API details
