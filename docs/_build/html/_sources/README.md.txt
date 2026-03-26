# WTicket Sphinx Documentation

Professional Sphinx-based documentation for the WTicket project.

**Live Documentation**: https://wticket.readthedocs.io

This documentation is automatically built and deployed by ReadTheDocs.

## Quick Start (Local Development)

### Install Dependencies

```bash
cd docs
pip install -r requirements.txt
# or
make install-deps
```

### Build Documentation

```bash
make html
```

### Preview Documentation

```bash
make serve
```

Then open http://localhost:8000 in your browser.

## Online Documentation

The official documentation is available at: **https://wticket.readthedocs.io**

This is automatically built from the latest code on every commit.

## Project Structure

```
docs/
├── _static/              # Static files (CSS, images)
├── _templates/          # Sphinx templates
├── api_reference/       # API documentation
├── getting_started/     # Installation guides
├── tutorials/          # Step-by-step tutorials
├── conf.py             # Sphinx configuration
├── index.rst           # Main documentation index
├── understanding.rst    # Architecture concepts
├── architecture.rst    # System architecture
├── faq.rst             # Frequently asked questions
├── bibliography.rst     # References and resources
├── Makefile            # Build automation
├── requirements.txt     # Python dependencies
└── README.md          # This file
```

## Documentation Sections

### Getting Started
- Installation guide
- Configuration options
- Deployment instructions

### API Reference
- Authentication API
- Ticket management API
- User management API
- Utility functions

### Tutorials
- User workflow tutorial
- Admin workflow tutorial
- Integration examples

### Additional Resources
- Architecture deep dive
- Understanding serverless concepts
- FAQ and troubleshooting
- Bibliography

## Available Make Commands

| Command | Description |
|---------|-------------|
| `make html` | Build HTML documentation |
| `make serve` | Build and serve locally |
| `make clean` | Remove build artifacts |
| `make install-deps` | Install Sphinx dependencies |
| `make help` | Show available commands |

## Author

**William Rodriguez**  
Telecommunications Engineer & AI Solutions Architect

* LinkedIn: https://es.linkedin.com/in/wisrovi-rodriguez
* GitHub: https://github.com/wisrovi

## License

MIT License
