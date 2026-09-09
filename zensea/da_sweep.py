# -*- coding: utf-8 -*-
"""Balayage DA v2 : elimine les beiges/gris hors charte restants -> DA verte Zensea."""
import json, os, re, sys

# --- Charte Zensea (tokens officiels) -------------------------------------
INK      = '#22332A'   # encre principale
DEEP     = '#1F3D2F'   # vert profond
GREEN    = '#2E5E46'   # vert signature
MUTED    = '#5A6B60'   # texte secondaire (vert-gris)
PAPER    = '#FBF9F4'   # fond papier
MIST     = '#ECF1E8'   # vert tres clair (cartes, filets)
BORDER   = '#DCE6D8'   # filet vert clair (equivalent DA de #e5e5e5)
GOLD     = '#B98A2E'
GOLD_S   = '#C8A24B'
GOLD_L   = '#E8C98A'   # or pale (halos)
SAGE     = '#A8BCAE'

MAP = {
    # --- beiges / tons chauds encore presents -----------------------------
    '#14100c': INK,     '#ece2d3': MIST,    '#fdfbf8': PAPER,
    '#6b645c': MUTED,   '#f4f0eb': MIST,    '#f4ede4': MIST,
    '#fbe9d2': GOLD_L,  '#e6dcd0': MIST,
    # --- teintes hors charte ---------------------------------------------
    '#141827': INK,     '#f7fafb': PAPER,
    # --- neutres gris -> neutres verts ------------------------------------
    '#4a4a4a': MUTED,   '#444444': MUTED,   '#444': MUTED,
    '#555555': MUTED,   '#555': MUTED,      '#8a8a8a': MUTED,
    '#999999': MUTED,   '#999': MUTED,      '#7d7d7d': MUTED,
    '#6f6f6f': MUTED,   '#666': MUTED,      '#6b7280': MUTED,
    '#111111': INK,     '#111': INK,        '#000000': INK,   '#000': INK,
    '#1a1a1a': INK,     '#1e1e1e': INK,     '#2c2c2c': INK,
    '#fafafa': PAPER,   '#f5f5f5': PAPER,   '#f8f9fa': MIST,
    # --- filets / bordures neutres ---------------------------------------
    '#e5e5e5': BORDER,  '#e9e9e9': BORDER,  '#e5e7eb': BORDER,
    '#ececec': BORDER,  '#eeeeee': BORDER,  '#eee': BORDER,
    '#dddddd': BORDER,  '#ddd': BORDER,
}
# On ne touche jamais au blanc pur (fond de cartes legitime).
KEEP = {'#ffffff', '#fff'}

def _rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# equivalents rgba() : (r,g,b) source -> "r, g, b" cible
RGB_MAP = {}
for src, dst in MAP.items():
    RGB_MAP[_rgb(src)] = _rgb(dst)

HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBA = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')

STRUCT = {'type', 'block_order', 'id', 'shopify_attributes', 'disabled', 'static', 'order'}

stats = {}

def sub_hex(m):
    v = m.group(0).lower()
    if v in KEEP: return m.group(0)
    if v in MAP:
        stats[v] = stats.get(v, 0) + 1
        return MAP[v]
    return m.group(0)

def sub_rgba(m):
    key = (int(m.group(2)), int(m.group(4)), int(m.group(6)))
    if key in RGB_MAP:
        r, g, b = RGB_MAP[key]
        stats['rgb%s' % (key,)] = stats.get('rgb%s' % (key,), 0) + 1
        return '%s%d%s%d%s%d' % (m.group(1), r, m.group(3), g, m.group(5), b)
    return m.group(0)

def fix(s):
    return RGBA.sub(sub_rgba, HEX.sub(sub_hex, s))

def walk(v, key=None):
    if isinstance(v, dict):
        return {k: (x if k in STRUCT else walk(x, k)) for k, x in v.items()}
    if isinstance(v, list):
        return [walk(x) for x in v]
    if isinstance(v, str):
        return fix(v)
    return v

changed = []
for d in ('templates', 'sections', 'config'):
    for f in sorted(os.listdir(d)):
        if not f.endswith('.json'): continue
        p = os.path.join(d, f)
        raw = open(p, encoding='utf-8').read()
        doc = json.loads(raw)
        new = walk(doc)
        out = json.dumps(new, ensure_ascii=False, indent=2)
        json.loads(out)                      # validation obligatoire
        if out != json.dumps(doc, ensure_ascii=False, indent=2):
            open(p, 'w', encoding='utf-8').write(out)
            changed.append(p)

print('Fichiers modifies : %d' % len(changed))
for c in changed: print('   ', c)
print('\nRemplacements :')
for k in sorted(stats, key=lambda x: -stats[x]):
    print('  %-16s x%d' % (k, stats[k]))
