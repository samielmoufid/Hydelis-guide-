# -*- coding: utf-8 -*-
import json, collections, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zensea_lib import make_clean, walk, strip_apps
from prod_copy import COMMON, FAMILY, SUBSTR, PREFIX

SRC = '/home/user/Hydelis-guide-/velluce/templates/'
DST = '/home/user/Hydelis-guide-/zensea/templates/'
os.makedirs(DST, exist_ok=True)

MAP = [
 ('product.plafonnier.json',      'product.handpan.json',      'handpan'),
 ('product.suspension.json',      'product.tongue-drum.json',  'tongue-drum'),
 ('product.lampe.json',           'product.kalimba.json',      'kalimba'),
 ('product.lustre.json',          'product.bol-chantant.json', 'bol-chantant'),
 ('product.applique-murale.json', 'product.ocarina.json',      'ocarina'),
 ('product.json',                 'product.json',              'base'),
]

report = []
for src, dst, fam in MAP:
    doc = json.load(open(SRC+src, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
    book = dict(COMMON); book.update(FAMILY[fam])
    # Le dictionnaire est ecrit sur les chaines source : si une cle a ete
    # redigee avec Zensea, on enregistre aussi sa variante Velluce.
    for k in list(book):
        if 'Zensea' in k: book.setdefault(k.replace('Zensea','Velluce'), book[k])
        if 'ZENSEA' in k: book.setdefault(k.replace('ZENSEA','VELLUCE'), book[k])
    removed = strip_apps(doc)
    base_clean = make_clean(book)
    def clean(v, key=None):
        v = base_clean(v, key)
        if isinstance(v, str):
            for a, b in PREFIX:
                if v.lstrip().startswith(a): return b
            for a, b in SUBSTR:
                if a in v: v = v.replace(a, b)
        return v
    out = walk(doc, clean)
    json.dump(out, open(DST+dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.load(open(DST+dst, encoding='utf-8'))
    txt = open(DST+dst, encoding='utf-8').read()
    left = len(re.findall(r'luminaire|plafonnier|suspension|applique|lustre|ampoule|éclair|lumière|Velluce|wa\.me|shopify://', txt, re.I))
    report.append((dst, fam, len(doc['order']), len(removed), len(txt), left))

print('%-28s %-13s %4s %5s %8s %6s' % ('FICHIER','FAMILLE','SECT','APPS-','OCTETS','RESTES'))
print('-'*80)
for r in report: print('%-28s %-13s %4d %5d %8d %6d' % r)
