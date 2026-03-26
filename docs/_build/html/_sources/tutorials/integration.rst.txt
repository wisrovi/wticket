Integration Tutorial
=================

This tutorial covers integrating WTicket with external systems and custom applications.

Objective
---------

Learn how to integrate WTicket functionality into your existing applications.

Embedding WTicket Widget
-----------------------

Embed a simplified ticket creation widget in external pages.

.. code-block:: html

   <!-- Add to your page -->
   <div id="wticket-embed"></div>
   
   <script type="module">
       import API from 'https://your-domain.com/js/app.js';
       
       async function initWidget() {
           const session = await API.validateSession();
           if (!session) {
               document.getElementById('wticket-embed').innerHTML = 
                   '<p>Please login first</p>';
               return;
           }
           
           // Embed ticket form
           document.getElementById('wticket-embed').innerHTML = `
               <form id="quick-ticket">
                   <input type="text" id="title" placeholder="Issue title">
                   <textarea id="desc" placeholder="Description"></textarea>
                   <button type="submit">Submit Ticket</button>
               </form>
           `;
       }
       
       initWidget();
   </script>

Custom Data Fetching
--------------------

Fetch ticket data for external dashboards.

.. code-block:: javascript

   class WTicketClient {
       constructor(apiKey, bins) {
           this.baseUrl = 'https://api.jsonbin.io/v3';
           this.apiKey = apiKey;
           this.bins = bins;
       }
       
       async get(endpoint) {
           const response = await fetch(
               `${this.baseUrl}/b/${this.bins[endpoint]}/latest`,
               {
                   headers: { 'X-Master-Key': this.apiKey }
               }
           );
           return (await response.json()).record;
       }
       
       async getStats() {
           const tickets = await this.get('tickets');
           const users = await this.get('users');
           
           const open = Object.values(tickets)
               .filter(t => t.status === 'open').length;
           const closed = Object.values(tickets)
               .filter(t => t.status === 'closed').length;
           
           return {
               openCount: open,
               closedCount: closed,
               totalCount: open + closed,
               userCount: Object.keys(users).length
           };
       }
   }

   // Usage
   const client = new WTicketClient(API_KEY, BIN_IDS);
   const stats = await client.getStats();
   console.log(stats);

Webhook Notifications
--------------------

Set up custom notifications when tickets are created.

.. code-block:: javascript

   // Monitor for new tickets using polling
   class TicketWebhook {
       constructor(callback, interval = 5000) {
           this.callback = callback;
           this.interval = interval;
           this.lastTicketId = 0;
       }
       
       async check() {
           const tickets = await API.getOpenTickets();
           const newest = Math.max(...tickets.map(t => t.id));
           
           if (newest > this.lastTicketId) {
               this.lastTicketId = newest;
               const newTickets = tickets.filter(t => t.id > this.lastTicketId);
               newTickets.forEach(t => this.callback(t));
           }
       }
       
       start() {
           this.check();
           setInterval(() => this.check(), this.interval);
       }
   }

   // Usage
   const webhook = new TicketWebhook((ticket) => {
       console.log('New ticket:', ticket.title);
       // Send email, Slack notification, etc.
   });
   webhook.start();

External Dashboard Integration
-----------------------------

Create a custom admin dashboard.

.. code-block:: javascript

   async function buildDashboard(containerId) {
       const container = document.getElementById(containerId);
       
       // Fetch data
       const stats = await API.getStats();
       const openTickets = await API.getOpenTickets();
       const closedTickets = await API.getClosedTickets();
       
       // Build dashboard HTML
       container.innerHTML = `
           <div class="dashboard">
               <div class="stat-card">
                   <h3>Open</h3>
                   <div class="stat-value">${stats.openCount}</div>
               </div>
               <div class="stat-card">
                   <h3>Closed</h3>
                   <div class="stat-value">${stats.closedCount}</div>
               </div>
               <div class="stat-card">
                   <h3>Resolution Rate</h3>
                   <div class="stat-value">
                       ${((stats.closedCount / stats.totalCount) * 100).toFixed(1)}%
                   </div>
               </div>
           </div>
           <div class="tickets-list">
               <h2>Recent Tickets</h2>
               ${openTickets.slice(0, 10).map(t => `
                   <div class="ticket-item">
                       <span>#${t.id}</span>
                       <span>${t.title}</span>
                       <span class="priority-${t.priority}">${t.priority}</span>
                   </div>
               `).join('')}
           </div>
       `;
   }

Verification
-------------

To verify integration:

1. Embed widget in a test page
2. Create a ticket through the widget
3. Verify data appears in main system
4. Check webhook notifications

Next Steps
----------

* Review :doc:`../api_reference/index` for complete API details
* Check :doc:`../faq` for common integration issues
