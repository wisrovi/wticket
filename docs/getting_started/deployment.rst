Deployment Guide
===============

WTicket can be deployed on any static hosting platform. This guide covers the most popular options.

GitHub Pages (Recommended)
---------------------------

GitHub Pages provides free hosting with HTTPS and global CDN distribution.

**Step 1: Create a GitHub Repository**

1. Navigate to `github.com <https://github.com>`_
2. Create a new repository named ``wticket``
3. Clone your repository locally

**Step 2: Push Code to Repository**

.. code-block:: bash

   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/wticket.git
   git push -u origin main

**Step 3: Enable GitHub Pages**

1. Navigate to repository **Settings**
2. Scroll to **Pages** section
3. Select source branch: ``main``
4. Select folder: ``/ (root)``
5. Click **Save**

**Step 4: Access Your Site**

Your site will be available at: ``https://yourusername.github.io/wticket``

.. note::

   Initial deployment may take 2-3 minutes. Enable HTTPS by checking "Enforce HTTPS" in Pages settings.

Netlify
-------

Netlify offers drag-and-drop deployment with automatic SSL certificates.

**Step 1: Connect Repository**

1. Visit `netlify.com <https://netlify.com>`_ and sign up
2. Click **Add new site** > **Import an existing project**
3. Connect your GitHub repository
4. Configure build settings (none required for WTicket)

**Step 2: Deploy**

Netlify automatically detects static files and deploys your site.

**Step 3: Custom Domain (Optional)**

1. Navigate to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration instructions

Vercel
------

Vercel provides zero-configuration deployment with edge network distribution.

**Step 1: Import Project**

1. Visit `vercel.com <https://vercel.com>`_ and sign up
2. Click **New Project** > **Import Git Repository**
3. Select your WTicket repository

**Step 2: Configure**

Vercel auto-detects static site configuration. No build command needed.

**Step 3: Deploy**

Click **Deploy** to publish your site.

Cloudflare Pages
----------------

Cloudflare Pages offers free hosting with global edge network.

**Step 1: Create Project**

1. Visit `pages.cloudflare.com <https://pages.cloudflare.com>`_
2. Connect your GitHub repository
3. Select the ``main`` branch

**Step 2: Configure Build**

* **Build command**: (leave empty)
* **Build output directory**: ``/``

**Step 3: Deploy**

Your site will be available at: ``https://project.pages.dev``

Custom Domain Configuration
---------------------------

After deployment, configure a custom domain:

**DNS Settings for Subdomain:**

.. code-block::

   Type    Name    Content                    Priority
   CNAME   wticket your-platform-pages.net   -

**Recommended Records:**

.. code-block::

   Type    Name           Content
   A       @              192.0.2.1 (platform IP)
   CNAME   www            your-site.pages.dev
   CNAME   wticket        your-platform-pages.net

SSL/TLS Certificates
--------------------

All recommended platforms provide automatic SSL certificates:

* **GitHub Pages**: Automatic after HTTPS enforcement
* **Netlify**: Automatic with Let's Encrypt
* **Vercel**: Automatic edge certificates
* **Cloudflare**: Automatic with full encryption

Performance Optimization
-----------------------

Enable browser caching by configuring cache headers:

.. code-block::

   # Cache static assets
   Cache-Control: public, max-age=31536000, immutable

   # Cache HTML (short)
   Cache-Control: public, max-age=3600

CDN Distribution
----------------

All recommended platforms provide automatic CDN distribution:

* **GitHub Pages**: 200+ global PoPs
* **Netlify**: 200+ edge locations
* **Vercel**: Edge network in 100+ regions
* **Cloudflare**: 300+ data centers

Cost Comparison
---------------

+--------------+----------+----------------+---------------+
| Platform     | Free Tier| Bandwidth      | Custom Domain |
+--------------+----------+----------------+---------------+
| GitHub Pages | Unlimited| 100 GB/month   | Free          |
+--------------+----------+----------------+---------------+
| Netlify      | 100 GB   | 400 GB/month   | Free          |
+--------------+----------+----------------+---------------+
| Vercel       | 100 GB   | 1 TB/month     | Free          |
+--------------+----------+----------------+---------------+
| Cloudflare   | Unlimited| Unlimited      | Free          |
+--------------+----------+----------------+---------------+
