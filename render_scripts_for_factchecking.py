# quarto render /Users/johannesgille/Desktop/CE_2026_4_drought/scripts/build_output_spreadsheets.ipynb --to pdf

import argparse
import copy
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path



# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def run(cmd: list[str], cwd: str | None = None) -> subprocess.CompletedProcess:
    """Run a command, stream output, and raise on failure."""
    print(f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    result.check_returncode()
    return result


def check_tool(name: str) -> bool:
    return shutil.which(name) is not None


# ─────────────────────────────────────────────
# R → PDF
# ─────────────────────────────────────────────

R_SPIN_TEMPLATE = """\
---
title: "{title}"
output: pdf_document
---

```{{r, echo=TRUE}}
{code}
```
"""

def convert_r_to_pdf(r_path: Path, out_dir: Path) -> None:
    """
    Strategy:
      1. If Rscript + rmarkdown available → wrap in .Rmd and render.
      2. Fallback: convert R script to plain text PDF via pandoc.
    """
    stem = r_path.stem
    out_pdf = out_dir / f"{stem}.pdf"
    print(f"\n[R] {r_path.name} → {out_pdf.name}")

    if not check_tool("Rscript"):
        print("  ⚠  Rscript not found – falling back to plain-text PDF via pandoc.")
        _r_fallback_pandoc(r_path, out_pdf)
        return

    # Check rmarkdown is installed
    check = subprocess.run(
        ["Rscript", "-e", "if (!requireNamespace('rmarkdown', quietly=TRUE)) quit(status=1)"],
        capture_output=True,
    )
    if check.returncode != 0:
        print("  ⚠  R package 'rmarkdown' not installed – falling back to pandoc.")
        _r_fallback_pandoc(r_path, out_pdf)
        return

    with tempfile.TemporaryDirectory() as tmp:
        code = r_path.read_text(encoding="utf-8", errors="replace")
        rmd_content = R_SPIN_TEMPLATE.format(title=stem, code=code)
        rmd_path = Path(tmp) / f"{stem}.Rmd"
        rmd_path.write_text(rmd_content, encoding="utf-8")

        run(
            [
                "Rscript", "-e",
                f"rmarkdown::render('{rmd_path}', output_file='{out_pdf.resolve()}')",
            ]
        )

    print(f"  ✓  {out_pdf}")


 
def _r_fallback_pandoc(r_path: Path, out_pdf: Path) -> None:
    """Plain-text → PDF via pandoc (syntax highlighting only)."""
    if not check_tool("pandoc"):
        print("  ✗  pandoc not found either. Skipping.")
        return
    run([
        "pandoc", str(r_path),
        "--highlight-style=tango",
        "-o", str(out_pdf),
    ])
    print(f"  ✓  {out_pdf}")
 



# ─────────────────────────────────────────────
# Jupyter → PDF  (with code / without code)
# ─────────────────────────────────────────────

def convert_notebook_to_pdf(nb_path: Path, out_dir: Path) -> None:
    """Plain-text → PDF via quarto (syntax highlighting only)."""
    out_path = str(nb_path.stem + ".pdf")
    run([
        "quarto", "render", str(nb_path),
        "--to", "pdf",
        "-o", out_path,
    ])
    print(f"  ✓  {out_path}")

# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert .R and .ipynb files in a directory to PDF."
    )
    parser.add_argument(
        "directory",
        nargs="?",
        default="scripts",
        help="Directory to scan (default: current directory)",
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="factchecking",
        help="Where to write PDFs (default: same as input directory)",
    )
    parser.add_argument(
        "--recursive", "-r",
        action="store_true",
        help="Recurse into subdirectories",
    )
    args = parser.parse_args()

    src_dir = Path(args.directory).resolve()
    if not src_dir.is_dir():
        sys.exit(f"Error: '{src_dir}' is not a directory.")

    out_dir = Path(args.output_dir).resolve() if args.output_dir else src_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    glob = "**/*" if args.recursive else "*"

    r_files  = sorted(src_dir.glob(f"{glob}.r"))
    nb_files = sorted(src_dir.glob(f"{glob}.ipynb"))

    if not r_files and not nb_files:
        print("No .R or .ipynb files found.")
        return

    print(f"Source : {src_dir}")
    print(f"Output : {out_dir}")
    print(f"Found  : {len(r_files)} R file(s), {len(nb_files)} notebook(s)\n")

    # for f in r_files:
    #     convert_r_to_pdf(f, out_dir)

    for f in nb_files:
        convert_notebook_to_pdf(f, out_dir)

    print("\nDone.")


if __name__ == "__main__":
    main()