"""
Build a thinned Open Peeps sprite sheet for the homepage crowd.

Skiper UI's CrowdCanvas walks every cell on whatever sheet it is given — there
is no count prop, and the component is vendored as it ships. So the only way to
put fewer people on the horizon is to hand it a sheet with fewer people on it.

The full sheet is a 15 x 7 grid of 240 x 324 cells (3600 x 2268). Both of the
component's slicing divisions have to come out exact:

    rectWidth  = imageWidth  / rows   ->  3600 / 15 = 240
    rectHeight = imageHeight / cols   ->   648 /  2 = 324

...so the column count stays at 15 and only whole rows may be dropped. Rather
than crop the top N rows and lose most of the cast, this samples evenly across
all 105 figures, so a 30-peep sheet still spans the full range of the original.

Usage (from website/):
    python scripts/build-peep-sheet.py
"""

from pathlib import Path

from PIL import Image

COLS = 15  # cells across — fixed by the source sheet's geometry
CELL_W, CELL_H = 240, 324

SRC = Path("public/images/peeps/all-peeps.png")
OUT = Path("public/images/peeps/peeps-thinned.png")
OUT_ROWS = 2  # rows of 15 -> 30 figures


def main() -> None:
    sheet = Image.open(SRC).convert("RGBA")
    src_cols, src_rows = sheet.width // CELL_W, sheet.height // CELL_H
    total = src_cols * src_rows
    want = COLS * OUT_ROWS
    if sheet.size != (src_cols * CELL_W, src_rows * CELL_H):
        raise SystemExit(f"{SRC} is {sheet.size}, not a whole number of {CELL_W}x{CELL_H} cells")

    out = Image.new("RGBA", (COLS * CELL_W, OUT_ROWS * CELL_H), (0, 0, 0, 0))
    for n in range(want):
        # Evenly spaced across the whole cast rather than the first N.
        i = round(n * (total - 1) / (want - 1))
        sx, sy = (i % src_cols) * CELL_W, (i // src_cols) * CELL_H
        cell = sheet.crop((sx, sy, sx + CELL_W, sy + CELL_H))
        out.paste(cell, ((n % COLS) * CELL_W, (n // COLS) * CELL_H))

    out.save(OUT, optimize=True)
    print(f"{SRC} {sheet.size} ({total} peeps) -> {OUT} {out.size} ({want} peeps)")
    print(f"pass rows={COLS} cols={OUT_ROWS}")


if __name__ == "__main__":
    main()
