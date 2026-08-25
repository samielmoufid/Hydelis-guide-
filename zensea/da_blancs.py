# -*- coding: utf-8 -*-
"""Les blancs chauds (cremes) restants passent en blanc legerement vert.

La premiere conversion epargnait tout ce qui etait au-dessus de 95 % de
luminosite, au motif que c'etait deja le papier de la charte. Sur de grandes
surfaces — fond du menu, bloc epingle, vignettes — ces cremes se lisent
encore comme du beige. On les bascule donc aussi, en gardant la luminosite.
"""
import colorsys, os, re, collections

GREEN_H = 150 / 360.0
stats = collections.Counter()
mapping = {}

def conv(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    deg = h * 360
    if not (10 <= deg <= 65):    return None      # deja froid ou neutre
    if l < 0.90 or s < 0.05:     return None      # deja traite au tour precedent
    if s >= 0.55:                return None      # soleil, halos, ors pales : on garde
    return colorsys.hls_to_rgb(GREEN_H, l, min(s, 0.16))

def hx(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def fmt(r, g, b):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * 255))) for c in (r, g, b))

HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBF = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')

def sub_hex(m):
    src = m.group(0)
    if src.lower() in ('#ffffff', '#fff'): return src
    out = conv(*hx(src))
    if out is None: return src
    dst = fmt(*out)
    if dst.lower() == src.lower(): return src
    stats[src.lower()] += 1; mapping[src.lower()] = dst
    return dst

def sub_rgb(m):
    vals = [int(m.group(i)) / 255.0 for i in (2, 4, 6)]
    out = conv(*vals)
    if out is None: return m.group(0)
    r, g, b = [max(0, min(255, round(c * 255))) for c in out]
    if (r, g, b) == tuple(int(v * 255) for v in vals): return m.group(0)
    k = 'rgb(%d,%d,%d)' % tuple(int(v * 255) for v in vals)
    stats[k] += 1; mapping[k] = 'rgb(%d,%d,%d)' % (r, g, b)
    return '%s%d%s%d%s%d' % (m.group(1), r, m.group(3), g, m.group(5), b)

changed = []
for d in ('liquid', 'templates', 'sections', 'config', 'assets'):
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        if not (f.endswith('.liquid') or f.endswith('.json') or f.endswith('.css')): continue
        p = os.path.join(d, f)
        src = open(p, encoding='utf-8').read()
        out = RGBF.sub(sub_rgb, HEX.sub(sub_hex, src))
        if out != src:
            open(p, 'w', encoding='utf-8').write(out)
            changed.append(p)

print('%d fichiers, %d teintes, %d occurrences' % (len(changed), len(mapping), sum(stats.values())))
for k, n in stats.most_common(20):
    print('  %-16s -> %-9s x%d' % (k, mapping[k], n))
