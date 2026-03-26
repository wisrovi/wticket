# WTicket Sphinx Documentation

Professional Sphinx-based documentation for the WTicket project.

## Quick Start

### Install Dependencies

```bash
cd docs
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

## Project Structure

```
docs/
├── source/
│   ├── _static/          # Static files (CSS, images)
│   ├── api_reference/    # API documentation
│   ├── getting_started/  # Installation guides
│   ├── tutorials/       # Step-by-step tutorials
│   ├── conf.py          # Sphinx configuration
│   └── index.rst        # Main documentation index
├── Makefile             # Build automation
└── README.md           # This file
```

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
