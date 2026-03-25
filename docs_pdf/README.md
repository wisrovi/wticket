# WTicket PDF Documentation

This folder contains the LaTeX source files for the WTicket project documentation.

## Files

- `wticket-documentation.tex` - Main LaTeX source document
- `sources/` - Source images and assets
- `wticket-documentation.pdf` - Compiled PDF documentation

## Compiling

To recompile the documentation:

```bash
pdflatex wticket-documentation.tex
pdflatex wticket-documentation.tex  # Run twice for references
pdflatex wticket-documentation.tex  # Run thrice for TOC
```

## Requirements

- TeX Live or MiKTeX with pdflatex
- Required packages are included in standard TeX distributions

## Documentation Contents

1. Executive Summary
2. Introduction
3. Technical Architecture
4. Installation and Setup
5. User Guide
6. Security Architecture
7. API Reference
8. Best Practices and Troubleshooting
9. Conclusions and Future Work
10. Bibliography
11. Appendices
12. Acknowledgments
