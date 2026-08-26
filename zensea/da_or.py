# -*- coding: utf-8 -*-
"""Les accents dores de l'interface passent au vert.

Le chaud reste la ou il est voulu : le soleil des dunes et ses halos, le
laiton et le bois des illustrations codees, les etoiles de notation. Partout
ailleurs — liens, filets, bordures, survols, sur-titres — l'or se lisait
comme du jaune sur une charte verte.
"""
import json, os, re

# Fichiers ou le chaud est le sujet, pas un accent d'interface.
GARDE = {
    'sections__zensea-dunes.liquid',        # le soleil et ses halos
    'snippets__zensea-illus.liquid',        # laiton des bols, bois des maillets
    'snippets__zensea-illus-guide.liquid',
    'blocks__reviews-badge.liquid',         # etoiles de notation
    'blocks___story.liquid',                # anneaux des stories
}

HEX = {
    '#C49934': '#2E5E46', '#CBA03C': '#2E5E46', '#B98A2E': '#2E5E46',
    '#C8A24B': '#2E5E46', '#CFA74A': '#2E5E46', '#D3AF5B': '#2E5E46',
    '#A7822C': '#1F3D2F', '#997829': '#1F3D2F', '#9B7929': '#1F3D2F',
    '#E0B766': '#5B8F72', '#E5C075': '#5B8F72', '#E0AC43': '#5B8F72',
    '#E8C98A': '#C7D9D0', '#F3E2C0': '#DFEAE4', '#F8ECD5': '#DFEAE4',
    '#F4E1BC': '#DFEAE4', '#E9CF9B': '#C7D9D0', '#AE882E': '#2E5E46',
    '#CDA444': '#2E5E46', '#CDA445': '#2E5E46', '#CEA545': '#2E5E46',
    '#C19633': '#2E5E46', '#C29834': '#2E5E46', '#C69A34': '#2E5E46',
    '#967528': '#1F3D2F', '#9E7B2A': '#1F3D2F', '#846723': '#1F3D2F',
    '#7C6121': '#1F3D2F', '#765C1F': '#1F3D2F', '#8A6A38': '#1F3D2F',
}
RGB = {
    (196, 153, 52): (46, 94, 70),   (207, 167, 74): (46, 94, 70),
    (185, 138, 46): (46, 94, 70),   (166, 129, 44): (46, 94, 70),
    (73, 57, 19): (31, 61, 47),     (103, 80, 27): (31, 61, 47),
    (71, 55, 19): (31, 61, 47),     (147, 115, 39): (46, 94, 70),
    (242, 219, 173): (199, 217, 208),
}

# Reglages dont la valeur chaude est deliberee (halo lumineux derriere l'objet 3D).
CLES_CHAUDES = {'glow', 'sun', 'sun_edge', 'halo'}

HEXRE = re.compile(r'#(?:[0-9a-fA-F]{6})\b')
RGBRE = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')

stats = {}

def sub_hex(m):
    k = m.group(0).upper()
    if k in HEX:
        stats[k] = stats.get(k, 0) + 1
        return HEX[k]
    return m.group(0)

def sub_rgb(m):
    key = (int(m.group(2)), int(m.group(4)), int(m.group(6)))
    if key in RGB:
        r, g, b = RGB[key]
        n = 'rgb%s' % (key,)
        stats[n] = stats.get(n, 0) + 1
        return '%s%d%s%d%s%d' % (m.group(1), r, m.group(3), g, m.group(5), b)
    return m.group(0)

def fix(s):
    return RGBRE.sub(sub_rgb, HEXRE.sub(sub_hex, s))

def walk(v, key=None):
    if isinstance(v, dict):
        return {k: (x if k in CLES_CHAUDES else walk(x, k)) for k, x in v.items()}
    if isinstance(v, list):
        return [walk(x, key) for x in v]
    if isinstance(v, str):
        return fix(v)
    return v

changed = []
for d in ('liquid', 'sections', 'templates', 'config', 'assets'):
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        if f in GARDE: continue
        if not f.endswith(('.liquid', '.json', '.css')): continue
        p = os.path.join(d, f)
        src = open(p, encoding='utf-8').read()
        if f.endswith('.json'):
            doc = json.loads(src)
            out = json.dumps(walk(doc), ensure_ascii=False, indent=2)
            json.loads(out)
        else:
            out = fix(src)
        if out != src:
            open(p, 'w', encoding='utf-8').write(out)
            changed.append(p)

print('%d fichiers, %d occurrences' % (len(changed), sum(stats.values())))
for k in sorted(stats, key=lambda x: -stats[x]):
    print('  %-18s x%d' % (k, stats[k]))
