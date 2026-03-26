Installation Guide
=================

This guide provides step-by-step instructions for installing and running WTicket locally.

Step 1: Clone the Repository
----------------------------

Clone the WTicket repository from GitHub:

.. code-block:: bash

   git clone https://github.com/wisrovi/wticket.git
   cd wticket

Step 2: Create JSONBin.io Bins
------------------------------

JSONBin.io provides the data persistence layer for WTicket. Follow these steps:

1. Visit `JSONBin.io <https://jsonbin.io>`_ and create a free account
2. Navigate to the dashboard and create **three** new bins:

   * **Users Bin**: Stores user account data
   * **Tickets Bin**: Stores all ticket information
   * **Counter Bin**: Manages ticket ID sequencing

3. Copy the **Bin IDs** from each bin's URL
4. Navigate to your profile and generate an **API Key**

Step 3: Configure the Application
---------------------------------

Edit the configuration section in ``js/app.js``:

.. code-block:: javascript
   :caption: Configuration Setup

   // JSONBin.io Configuration
   const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
   const JSONBIN_API_KEY = 'your-master-key-here';

   const BIN_IDS = {
       users: 'your-users-bin-id',
       tickets: 'your-tickets-bin-id',
       counter: 'your-counter-bin-id'
   };

Step 4: Local Development Server
--------------------------------

Start a local HTTP server to test the application:

**Using Python 3:**

.. code-block:: bash

   python3 -m http.server 8000

**Using Node.js:**

.. code-block:: bash

   npx serve .

**Using PHP:**

.. code-block:: bash

   php -S localhost:8000

Access the application at ``http://localhost:8000``

Step 5: Verify Installation
---------------------------

After starting the server:

1. Open ``http://localhost:8000`` in your browser
2. Verify the public dashboard displays statistics
3. Navigate to the login page
4. Test user registration with a new account
5. Create a sample ticket to verify data persistence

Troubleshooting
---------------

**Issue: CORS Errors**

   Ensure your JSONBin bins are configured with proper CORS headers to allow requests from your domain.

**Issue: Service Worker Not Caching**

   Clear browser cache and unregister existing service workers before testing.

**Issue: Data Not Persisting**

   Verify your JSONBin API key has write permissions enabled.
