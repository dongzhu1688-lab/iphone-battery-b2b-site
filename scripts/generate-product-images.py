import json
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = ROOT / "src" / "products.json"
OUT_DIR = ROOT / "assets" / "products"


def model_family(model):
    compact = model.lower().replace(" ", "")
    if compact in {"7g", "8g", "se2020", "se2022"}:
        return "classic"
    if compact in {"7p", "8p"}:
        return "plus"
    if compact in {"x", "xs", "xsmax", "11pro"}:
        return "stacked"
    if "promax" in compact or "plus" in compact:
        return "max"
    if "mini" in compact:
        return "mini"
    if compact in {"xr", "11", "12/12pro", "13", "14", "15", "16"}:
        return "standard"
    return "pro"


def connector(product, idx):
    accent = "#16a6c7" if product["categorySlug"] == "diagnostic" else "#a8e14a"
    if product["categorySlug"] == "pulled-original":
        accent = "#f5c451"
    points = [
        (450, 142, 520, 172),
        (116, 204, 64, 234),
        (438, 258, 514, 294),
        (214, 94, 184, 46),
    ][idx % 4]
    x1, y1, x2, y2 = points
    return f"""
      <path d="M{x1} {y1} C{x1 + 22} {y1 - 26}, {x2 - 30} {y2 + 30}, {x2} {y2}" fill="none" stroke="#252f3a" stroke-width="18" stroke-linecap="round"/>
      <path d="M{x1} {y1} C{x1 + 22} {y1 - 26}, {x2 - 30} {y2 + 30}, {x2} {y2}" fill="none" stroke="#56616c" stroke-width="8" stroke-linecap="round"/>
      <rect x="{x2 - 16}" y="{y2 - 13}" width="34" height="26" rx="4" fill="#1c252f" stroke="#75808a" stroke-width="2"/>
      <rect x="{x2 - 8}" y="{y2 - 6}" width="8" height="12" rx="2" fill="{accent}"/>
      <rect x="{x2 + 3}" y="{y2 - 6}" width="8" height="12" rx="2" fill="#d8e2ea"/>
    """


def battery_body(family, product, idx):
    label = escape(product["model"])
    series = escape(product["series"].replace(" series", " SERIES"))
    category = escape(product["badge"].upper())
    cap = "DIAGNOSTIC READY" if product["categorySlug"] == "diagnostic" else "ORIGINAL CELL"
    if product["categorySlug"] == "pulled-original":
        cap = "PULLED ORIGINAL"

    shapes = {
        "classic": '<rect x="190" y="72" width="205" height="276" rx="18"/>',
        "plus": '<rect x="172" y="54" width="238" height="314" rx="18"/>',
        "mini": '<rect x="198" y="84" width="190" height="248" rx="18"/>',
        "standard": '<rect x="172" y="56" width="230" height="306" rx="18"/>',
        "pro": '<rect x="168" y="48" width="240" height="318" rx="18"/>',
        "max": '<rect x="146" y="38" width="278" height="338" rx="20"/>',
        "stacked": '<path d="M154 54 h156 a18 18 0 0 1 18 18 v86 h86 a18 18 0 0 1 18 18 v170 a18 18 0 0 1 -18 18 h-260 a18 18 0 0 1 -18 -18 v-274 a18 18 0 0 1 18 -18z"/>',
    }
    body = shapes[family]
    transform = ["rotate(-6 290 210)", "rotate(3 290 210)", "rotate(-2 290 210)", "rotate(5 290 210)"][idx % 4]
    accent = "#16a6c7" if product["categorySlug"] == "diagnostic" else "#a8e14a"
    if product["categorySlug"] == "pulled-original":
        accent = "#f5c451"

    return f"""
    <g transform="{transform}">
      <g filter="url(#shadow)">
        <g fill="#151b22" stroke="#303b46" stroke-width="3">
          {body}
        </g>
        <path d="M190 86 h168" stroke="#2b3540" stroke-width="2" opacity=".75"/>
        <rect x="204" y="106" width="74" height="12" rx="6" fill="{accent}"/>
        <rect x="204" y="126" width="142" height="8" rx="4" fill="#60707f" opacity=".65"/>
        <rect x="204" y="142" width="112" height="8" rx="4" fill="#60707f" opacity=".45"/>
        <text x="204" y="203" fill="#f6fbff" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800">{label}</text>
        <text x="204" y="238" fill="#aeb9c4" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">{series}</text>
        <text x="204" y="274" fill="{accent}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800">{category}</text>
        <text x="204" y="308" fill="#dce6ed" font-family="Arial, Helvetica, sans-serif" font-size="16">{cap}</text>
      </g>
    </g>
    """


def svg(product, idx):
    family = model_family(product["model"])
    bg = "#edf7fb" if product["categorySlug"] == "diagnostic" else "#f7fafc"
    if product["categorySlug"] == "pulled-original":
        bg = "#fbf7ec"
    title = escape(f'{product["categoryName"]} {product["model"]}')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="720" height="506" viewBox="0 0 720 506" role="img" aria-label="{title}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#111923" flood-opacity=".24"/>
    </filter>
    <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="{bg}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="506" rx="0" fill="url(#card)"/>
  <circle cx="624" cy="76" r="88" fill="#dff5fa" opacity=".75"/>
  <circle cx="100" cy="420" r="130" fill="#e8eef3" opacity=".8"/>
  <g opacity=".42" fill="none" stroke="#c7d4de" stroke-width="2">
    <path d="M52 92h118M50 124h86M532 404h118M560 436h82"/>
  </g>
  {connector(product, idx)}
  {battery_body(family, product, idx)}
  <g transform="translate(44 42)">
    <rect width="126" height="34" rx="17" fill="#17212b"/>
    <text x="63" y="23" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800">{escape(product["series"].upper())}</text>
  </g>
  <g transform="translate(44 424)">
    <rect width="214" height="38" rx="19" fill="#ffffff" stroke="#dce5ee"/>
    <text x="107" y="25" text-anchor="middle" fill="#263747" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800">MODEL MATCHED IMAGE</text>
  </g>
</svg>
"""


def main():
    products = json.loads(PRODUCTS_PATH.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for idx, product in enumerate(products):
        image_path = OUT_DIR / f'{product["id"]}.svg'
        image_path.write_text(svg(product, idx))
        product["image"] = f'assets/products/{product["id"]}.svg'
    PRODUCTS_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n")
    print(f"Generated {len(products)} product images in {OUT_DIR}")


if __name__ == "__main__":
    main()
