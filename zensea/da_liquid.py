# -*- coding: utf-8 -*-
"""Conversion colorimetrique Velluce -> Zensea sur les fichiers .liquid.

Principe : on ne remplace pas couleur par couleur (349 teintes distinctes),
on convertit par TEINTE en preservant la luminosite. Les degrades, les ombres
et les contrastes de l'illustration d'origine sont donc conserves ; seule la
famille chromatique change.
"""
import colorsys, os, re, json, collections

GREEN_H = 150 / 360.0     # vert nature Zensea
GOLD_H  =  42 / 360.0     # or Zensea (#B98A2E)

def hex2rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def rgb2hex(r, g, b):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * 255))) for c in (r, g, b))

def convert(r, g, b):
    """Renvoie (r,g,b) converti, ou None si la couleur doit rester telle quelle."""
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    deg = h * 360

    # 1. Neutres purs (gris) -> tres legere teinte verte ; blanc et noir intacts
    if s < 0.06:
        if l >= 0.985 or l <= 0.02:
            return None
        return colorsys.hls_to_rgb(GREEN_H, l, 0.06)

    # 2. Bande chaude : beiges, ors, bruns, terracotta
    if 10 <= deg <= 65:
        if l >= 0.95:
            # creme tres clair : c'est deja le papier Zensea (#FBF9F4)
            return None
        if s >= 0.62 and l >= 0.45:
            # soleil, halos, etoiles de notation, pastilles -> or Zensea
            return colorsys.hls_to_rgb(GOLD_H - 2/360.0, l, min(s, 0.72))
        if l >= 0.60:
            # surfaces claires (dunes, cartes, filets, fonds) -> vert Zensea
            return colorsys.hls_to_rgb(GREEN_H, l, 0.22 if l >= 0.85 else 0.16)
        if s >= 0.28:
            # accents (liens, fleches, prix, encadres) -> or Zensea #B98A2E
            return colorsys.hls_to_rgb(GOLD_H, l, 0.58)
        # bruns sourds et encres chaudes -> vert profond Zensea
        return colorsys.hls_to_rgb(GREEN_H, l, 0.12 if l >= 0.30 else 0.30)

    # 3. Rouges (< 10 deg) et toute la moitie froide : couleurs fonctionnelles
    #    (erreurs, soldes, Trustpilot, stock) -> inchangees
    return None

HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBF = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')

stats = collections.Counter()
mapping = {}

def do_hex(m):
    src = m.group(0)
    out = convert(*hex2rgb(src))
    if out is None: return src
    dst = rgb2hex(*out)
    if dst.lower() == src.lower(): return src
    stats[src.lower()] += 1
    mapping[src.lower()] = dst
    return dst

def do_rgb(m):
    vals = [int(m.group(i)) / 255.0 for i in (2, 4, 6)]
    out = convert(*vals)
    if out is None: return m.group(0)
    r, g, b = [max(0, min(255, round(c * 255))) for c in out]
    key = 'rgb(%d,%d,%d)' % tuple(int(v * 255) for v in vals)
    if (r, g, b) == tuple(int(v * 255) for v in vals): return m.group(0)
    stats[key] += 1
    mapping[key] = 'rgb(%d,%d,%d)' % (r, g, b)
    return '%s%d%s%d%s%d' % (m.group(1), r, m.group(3), g, m.group(5), b)

changed = []
for f in sorted(os.listdir('liquid')):
    p = os.path.join('liquid', f)
    src = open(p, encoding='utf-8').read()
    out = RGBF.sub(do_rgb, HEX.sub(do_hex, src))
    if out != src:
        open(p, 'w', encoding='utf-8').write(out)
        changed.append(f.replace('__', '/'))

print('Fichiers .liquid modifies : %d / 242' % len(changed))
print('Couleurs distinctes converties : %d' % len(mapping))
print('Occurrences remplacees : %d' % sum(stats.values()))
json.dump(mapping, open('da_liquid_map.json', 'w'), indent=1, sort_keys=True)
json.dump(changed, open('da_liquid_changed.json', 'w'), indent=1)
print('\nTop 30 conversions :')
for k, n in stats.most_common(30):
    print('  %-18s -> %-9s x%d' % (k, mapping[k], n))
