# -*- coding: utf-8 -*-
"""Renommage final : les fichiers velluce-* deviennent zensea-*.

On ne remplace QUE les jetons entierement entre guillemets (le nom exact du
fichier). C'est ce qui distingue une reference technique — {% render 'x' %},
"type": "x" — d'un nom de classe CSS, qui n'est jamais cite en entier.
"""
import json, os, re

SECTIONS = ['choisir-velluce', 'contact-3d-velluce', 'contact-velluce', 'newsletter-velluce',
            'velluce-3d', 'velluce-bundles', 'velluce-chapitre', 'velluce-comparatif',
            'velluce-dunes', 'velluce-espace-pro', 'velluce-grille', 'velluce-hero-3d',
            'velluce-lettre-simple', 'velluce-manifeste', 'velluce-scroll-3d',
            'velluce-voir-tout', 'velluce-vous-aimerez']
BLOCKS   = ['velluce-3d-mini', 'velluce-split-title']
SNIPPETS = ['velluce-3d-mini', 'velluce-cart-skin', 'velluce-color-hex', 'velluce-illus-guide',
            'velluce-illus', 'velluce-menu-thumb', 'velluce-motion', 'velluce-packs',
            'velluce-photo-search', 'velluce-product-accordions', 'velluce-radius-fix']

def zen(n):
    if n.endswith('-velluce'):  return n[:-len('-velluce')] + '-zensea'
    if n == 'contact-3d-velluce': return 'contact-3d-zensea'
    return n.replace('velluce-', 'zensea-', 1)

RENAME = {}
for n in SECTIONS + BLOCKS + SNIPPETS:
    RENAME[n] = zen(n)
RENAME['velluce-trustap.css'] = 'zensea-trustap.css'

# du plus long au plus court : velluce-illus-guide avant velluce-illus
KEYS = sorted(RENAME, key=len, reverse=True)

def patch(s):
    n = 0
    for old in KEYS:
        new = RENAME[old]
        for q in ("'", '"'):
            a, b = q + old + q, q + new + q
            n += s.count(a)
            s = s.replace(a, b)
    return s, n

total = 0
changed = []
for d in ('liquid', 'templates', 'sections', 'config'):
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if not (f.endswith('.liquid') or f.endswith('.json')): continue
        src = open(p, encoding='utf-8').read()
        out, n = patch(src)
        if n:
            if f.endswith('.json'):
                json.loads(out)                    # validation obligatoire
            open(p, 'w', encoding='utf-8').write(out)
            changed.append((p, n)); total += n

print('%d references renommees dans %d fichiers' % (total, len(changed)))
for p, n in changed: print('  %-58s %d' % (p.replace('__', '/'), n))

# le fichier lui-meme change de nom sur le disque local
os.makedirs('liquid_new', exist_ok=True)
moved = []
for f in sorted(os.listdir('liquid')):
    folder, base = f.split('__', 1)
    stem = base[:-len('.liquid')]
    if stem in RENAME and ((folder == 'sections' and stem in SECTIONS)
                           or (folder == 'blocks' and stem in BLOCKS)
                           or (folder == 'snippets' and stem in SNIPPETS)):
        new = '%s__%s.liquid' % (folder, RENAME[stem])
        moved.append(('%s/%s.liquid' % (folder, stem), '%s/%s.liquid' % (folder, RENAME[stem])))
    else:
        new = f
    open('liquid_new/' + new, 'w', encoding='utf-8').write(open('liquid/' + f, encoding='utf-8').read())
json.dump(moved, open('renames.json', 'w'), indent=1, ensure_ascii=False)
print('\n%d fichiers renommes :' % len(moved))
for a, b in moved: print('  %-46s -> %s' % (a, b))
