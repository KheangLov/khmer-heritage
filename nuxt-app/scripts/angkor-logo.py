"""Angkor Wat brand mark, taken from the national flag.

Source: scripts/flag-of-cambodia.svg — the Flag of Cambodia from Wikimedia
Commons (public domain). Its Angkor Wat emblem is copied path-for-path, so the
brand mark matches the flag exactly; only the colouring changes (gold fill,
dark engraved lines instead of white fill, black lines).

The temple group is split into parts so the header logo can build itself:
  gallery · centre tower · left tower · right tower (mirror of left) · base
and written to app/data/angkor-logo.json, plus public/favicon.svg.

Run:  python3 scripts/angkor-logo.py
The PNG/ICO icons (favicon.ico, apple-touch-icon.png, icon-192/512.png) are
rasterised from public/favicon.svg afterwards (headless Chrome + sips).
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'flag-of-cambodia.svg')

# Temple bounding box in the flag's local coordinates (measured with getBBox):
# x 66.23, y 552.64, w 258.26, h 166.63. Padded, with extra room on top for
# the rising sun behind the central tower.
VIEWBOX = '62 526 266.5 197'
AXIS_X = 390.74 / 2  # the flag mirrors the left tower about this axis


def children(markup):
    """Top-level <g>/<path>/<use> elements of an SVG fragment, in order."""
    out, depth, start = [], 0, 0
    for m in re.finditer(r'<(/?)(g|path|use)\b[^>]*?(/?)>', markup):
        closing, _, self_closing = m.groups()
        if not closing and depth == 0:
            start = m.start()
        if not closing and not self_closing:
            depth += 1
        if closing:
            depth -= 1
        if depth == 0:
            out.append(re.sub(r'\s+', ' ', markup[start:m.end()]))
    return out


def main():
    svg = open(SRC, encoding='utf-8').read()
    group = svg[svg.index('<g transform'):svg.rindex('</g>') + 4]
    kids = children(group[group.index('>') + 1:group.rindex('</g>')])

    left_i = next(i for i, k in enumerate(kids) if k.startswith('<g id="a"'))
    use_i = next(i for i, k in enumerate(kids) if k.startswith('<use'))
    left = re.sub(r'^<g id="a"', '<g', kids[left_i])  # no ids: the logo appears several times per page
    right = left.replace('<g', f'<g transform="matrix(-1 0 0 1 {AXIS_X * 2:.2f} 0)"', 1)

    parts = {
        'viewBox': VIEWBOX,
        'sun': {'cx': round(AXIS_X, 2), 'cy': 566, 'r': 44},
        'gallery': ''.join(kids[:1]),               # central gallery block + platform
        'centre': ''.join(kids[1:left_i]),          # central prang and its porches
        'left': left,
        'right': right,
        'base': ''.join(kids[use_i + 1:]),          # stepped pyramid, three stairways
    }
    assert kids[use_i + 1].startswith('<path d="M89.412 669.28'), 'flag layout changed'
    with open(os.path.join(ROOT, 'app', 'data', 'angkor-logo.json'), 'w', encoding='utf-8') as fh:
        json.dump(parts, fh, ensure_ascii=False, separators=(',', ':'))

    temple = parts['gallery'] + parts['centre'] + parts['left'] + parts['right'] + parts['base']
    # Favicon: gold temple with thin engraved lines on the site's moss tile.
    # A CSS rule (which beats the flag's per-path stroke-width attributes)
    # halves the line weight so the temple stays bright at 16–32 px.
    x, y, w, h = 66.23, 552.64, 258.26, 166.63  # temple bbox (getBBox)
    pad = 4.5
    scale = (64 - 2 * pad) / w
    ty = (64 - h * scale) / 2 + 1.5
    fav = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#F4DC8A"/><stop offset=".55" stop-color="#D4AF37"/><stop offset="1" stop-color="#B08D5F"/>'
        '</linearGradient><style>.t *{stroke-width:.45}</style></defs>'
        '<rect width="64" height="64" rx="14" fill="#14241B"/>'
        '<rect x=".75" y=".75" width="62.5" height="62.5" rx="13.3" fill="none" stroke="#D4AF37" stroke-opacity=".55" stroke-width="1.5"/>'
        f'<g class="t" transform="translate({pad - x * scale:.3f} {ty - y * scale:.3f}) scale({scale:.5f})" '
        f'fill="url(#g)" stroke="#14241B">{temple}</g></svg>'
    )
    with open(os.path.join(ROOT, 'public', 'favicon.svg'), 'w', encoding='utf-8') as fh:
        fh.write(fav)
    print('wrote app/data/angkor-logo.json and public/favicon.svg')


if __name__ == '__main__':
    main()
