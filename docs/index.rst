WTicket Documentation
=====================

Welcome to the official **WTicket** documentation!

WTicket is an enterprise-grade, serverless ticket management system engineered with vanilla JavaScript and JSONBin.io. Designed for zero-infrastructure deployment on static hosting platforms, it delivers production-ready functionality without the complexity of traditional backend systems.

.. image:: _static/logo.png
   :width: 200
   :align: center
   :alt: WTicket Logo

Live Demo: https://wisrovi.github.io/wticket

Features
--------

* **Zero Infrastructure**: Deploy on any static hosting provider (GitHub Pages, Netlify, Vercel)
* **Serverless Architecture**: No backend servers required - pure client-side application
* **Real-time Statistics**: Live dashboard with ticket metrics and charts
* **Role-Based Access**: Administrator and user panels with proper authorization
* **Progressive Web App**: Installable on iOS, Android, and Desktop
* **Offline Support**: Service Worker caching for partial offline functionality
* **Multi-language**: Spanish and English support with runtime switching
* **Dark Mode**: Built-in theme customization with localStorage persistence
* **Keyboard Shortcuts**: Power-user productivity features
* **CSV Export**: Download all ticket data for external analysis
* **Gamification**: User achievements and badges for engagement

Quick Start
-----------

Get up and running in under 5 minutes:

.. code-block:: bash

   # Clone the repository
   git clone https://github.com/wisrovi/wticket.git
   cd wticket

   # Start a local server
   python3 -m http.server 8000

   # Open in browser
   # http://localhost:8000

For detailed installation instructions, see :doc:`getting_started/index`.

System Requirements
------------------

+------------------+--------------------------------------------------+
| Requirement      | Description                                      |
+==================+==================================================+
| Browser          | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  |
+------------------+--------------------------------------------------+
| Network          | HTTPS connection required for JSONBin.io          |
+------------------+--------------------------------------------------+
| JSONBin Account  | Free tier at https://jsonbin.io                  |
+------------------+--------------------------------------------------+

Why WTicket?
------------

Traditional ticket management systems require significant infrastructure:

* Application servers
* Database management systems
* DevOps expertise
* Ongoing maintenance

WTicket eliminates these requirements while providing:

* Zero hosting costs
* Automatic scaling
* No server maintenance
* Production-ready functionality

Architecture Highlights
----------------------

WTicket uses a modern three-tier architecture:

1. **Presentation Layer**: HTML5, CSS3, Vanilla JavaScript ES6+
2. **Business Logic**: ES Modules with Service Workers
3. **Data Layer**: JSONBin.io REST API + IndexedDB cache

Author
------

**William Rodriguez**
Telecommunications Engineer & AI Solutions Architect

* LinkedIn: https://es.linkedin.com/in/wisrovi-rodriguez
* GitHub: https://github.com/wisrovi
* Email: wisrovi@wticket.com

License
-------

This project is released under the MIT License.

Documentation Contents
---------------------

.. toctree::
   :maxdepth: 2
   :caption: Getting Started

   getting_started/index

.. toctree::
   :maxdepth: 2
   :caption: User Guide

   understanding
   architecture

.. toctree::
   :maxdepth: 2
   :caption: Tutorials

   tutorials/index

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api_reference/index

.. toctree::
   :maxdepth: 2
   :caption: Resources

   faq
   bibliography

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
