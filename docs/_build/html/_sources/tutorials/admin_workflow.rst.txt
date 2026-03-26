Admin Workflow Tutorial
=====================

This tutorial covers administrator-specific functions in WTicket.

Objective
--------

By the end of this tutorial, you will:

* Login as an administrator
* View system-wide statistics
* Resolve and close tickets
* Assign tickets to other admins
* Export data to CSV

Step 1: Administrator Login
---------------------------

Admin login uses the same API but requires admin credentials.

.. code-block:: javascript

   import API from './js/app.js';

   async function adminLogin() {
       try {
           const session = await API.login(
               'wisrovi@wticket.com',
               'adminPassword123'
           );
           
           if (session.role !== 'admin') {
               throw new Error('Unauthorized access');
           }
           
           console.log('Admin access granted:', session.name);
           return session;
       } catch (error) {
           console.error('Admin login failed:', error.message);
       }
   }

Step 2: View System Statistics
------------------------------

Get comprehensive system metrics.

.. code-block:: javascript

   async function getSystemStats() {
       const stats = await API.getStats();
       
       console.log('=== System Statistics ===');
       console.log('Open Tickets:', stats.openCount);
       console.log('Closed Tickets:', stats.closedCount);
       console.log('Total Tickets:', stats.totalCount);
       
       return stats;
   }

Step 3: Browse Open Tickets
----------------------------

View all open tickets sorted by creation date.

.. code-block:: javascript

   async function browseOpenTickets() {
       const openTickets = await API.getOpenTickets();
       
       console.log(`Found ${openTickets.length} open tickets:`);
       
       openTickets.forEach(ticket => {
           console.log(`#${ticket.id}: ${ticket.title}`);
           console.log(`  Priority: ${ticket.priority}`);
           console.log(`  Category: ${ticket.category}`);
           console.log(`  Created: ${API.formatDate(ticket.createdAt)}`);
           
           if (ticket.assignedTo) {
               console.log(`  Assigned to: ${ticket.assignedTo}`);
           }
       });
       
       return openTickets;
   }

Step 4: Resolve a Ticket
-------------------------

Close a ticket with an administrator response.

.. code-block:: javascript

   async function resolveTicket(ticketId) {
       const response = `
           Thank you for reporting this issue.
           
           We have identified the root cause and implemented a fix.
           The changes will be deployed in the next release.
           
           If you need further assistance, please reply to this ticket.
       `;
       
       const success = await API.closeTicket(ticketId, response);
       
       if (success) {
           console.log(`Ticket #${ticketId} has been resolved`);
       }
       
       return success;
   }

Step 5: Assign Tickets to Admins
----------------------------------

Delegate tickets to other administrators.

.. code-block:: javascript

   async function assignTicket(ticketId, targetAdminEmail) {
       // Get list of available admins
       const admins = API.getAdmins();
       console.log('Available admins:');
       admins.forEach(admin => {
           console.log(`  - ${admin.name} (${admin.email})`);
       });
       
       // Assign ticket
       const success = await API.assignTicket(ticketId, targetAdminEmail);
       
       if (success) {
           console.log(`Ticket #${ticketId} assigned to ${targetAdminEmail}`);
       }
       
       return success;
   }

Step 6: Export Data to CSV
---------------------------

Download all tickets for external analysis.

The CSV export is available in the admin panel UI via the "Export CSV" button.
For programmatic export:

.. code-block:: javascript

   async function exportTicketsToCSV() {
       // Get all tickets
       const openTickets = await API.getOpenTickets();
       const closedTickets = await API.getClosedTickets();
       const allTickets = [...openTickets, ...closedTickets];
       
       // Build CSV content
       const headers = [
           'ID', 'Title', 'User', 'Priority', 
           'Category', 'Status', 'Assigned To',
           'Created', 'Response', 'Response Date'
       ];
       
       const rows = allTickets.map(t => [
           t.id,
           `"${t.title.replace(/"/g, '""')}"`,
           t.userEmail,
           t.priority,
           t.category,
           t.status,
           t.assignedTo || '',
           new Date(t.createdAt).toISOString(),
           t.response ? `"${t.response.replace(/"/g, '""')}"` : '',
           t.responseAt ? new Date(t.responseAt).toISOString() : ''
       ]);
       
       const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
       
       // Download file
       const blob = new Blob([csv], { type: 'text/csv' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = `wticket_export_${new Date().toISOString().split('T')[0]}.csv`;
       link.click();
       
       console.log('CSV export downloaded');
   }

Verification
-------------

To verify admin implementation:

1. Login with admin credentials
2. View statistics dashboard
3. Process at least 5 tickets
4. Assign tickets to different admins
5. Export ticket data to CSV

Next Steps
----------

* Explore :doc:`integration` for system integration options
* Review the :doc:`../api_reference/index` for complete API details
