# -*- coding: utf-8 -*-
"""Transformations mécaniques partagées Velluce -> Zensea."""
import re, collections

COLORS = {
 '#cfc0ae':'#2E5E46','#2c2c2c':'#22332A','#faf8f5':'#FBF9F4','#d4896b':'#B98A2E',
 '#b9a284':'#B98A2E','#a96e4f':'#B98A2E','#f0e7db':'#ECF1E8','#f8f9fa':'#ECF1E8',
 '#1e1e1e':'#22332A','#6b7280':'#5A6B60','#1a1a1a':'#22332A','#111111':'#22332A',
 '#b08d57':'#B98A2E','#cfa76a':'#C8A24B','#c98a6b':'#B98A2E','#141210':'#1F3D2F',
 '#17120e':'#1F3D2F','#6a635c':'#5A6B60','#555555':'#5A6B60','#666666':'#5A6B60',
 '#6b6b6b':'#5A6B60','#5f5f5f':'#5A6B60','#a08d74':'#5A6B60','#e9e4dd':'#ECF1E8',
 '#ececec':'#ECF1E8','#f7f2e9':'#FBF9F4','#f6efe6':'#FBF9F4','#b9ada0':'#A8BCAE',
 '#ffca7a':'#E8C98A','#3c2d20':'#22332A','#a97c50':'#B98A2E',
}
HEX = re.compile(r'#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b')

# Les memes couleurs apparaissent aussi en rgba() decimal dans les CSS
# personnalises : un remplacement hexadecimal seul les laisserait passer.
RGBA = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*([,)])')
def _rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))
RGB_MAP = {}
for _src, _dst in COLORS.items():
    RGB_MAP[_rgb(_src)] = _rgb(_dst)

def rergba(s):
    def rep(m):
        t = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if t in RGB_MAP:
            r, g, b = RGB_MAP[t]
            return 'rgba(%d, %d, %d%s' % (r, g, b, m.group(4)) if m.group(4) == ',' \
                   else 'rgb(%d, %d, %d%s' % (r, g, b, m.group(4))
        return m.group(0)
    return RGBA.sub(rep, s)

COLL = {
 'plafonniers':'tous-les-handpans','suspensions':'tongue-drums','lampes':'kalimbas',
 'lustres':'bols-chantants','appliques':'ocarinas','appliques-murales':'ocarinas',
 'lampadaires':'accessoires','ventilateurs':'housses-et-supports',
 'ventilateurs-de-plafond':'housses-et-supports','exterieurs':'maillets-et-entretien',
 'luminaires-exterieurs':'maillets-et-entretien','meilleurs-ventes':'tous-les-handpans',
 'salon':'handpans-9-notes','chambre':'handpans-12-notes','cuisine':'housses-et-supports',
 'salle-de-bain':'tongue-drums','sale-de-bain':'tongue-drums',
 'vous-aimerez-aussi':'tous-les-handpans','espaces-de-vie':'tous-les-handpans',
 'tous-les-plafonniers':'tous-les-handpans','toutes-les-suspensions':'tongue-drums',
 'toutes-les-lampes-a-poser':'kalimbas','tous-les-lustres':'bols-chantants',
 'toutes-les-appliques-murales':'ocarinas','tous-les-lampadaires':'accessoires',
 'tous-les-ventilateurs-de-plafond':'housses-et-supports',
 'tous-les-luminaires-exterieurs':'maillets-et-entretien',
 'appliques-exterieures':'maillets-et-entretien','guirlandes-lumineuses':'maillets-et-entretien',
 'eclairage-solaire':'maillets-et-entretien','collections':'tous-les-handpans',
}
WA_RX = re.compile(r'https://wa\.me/\S*')
MAILTO = 'mailto:contact.zensea@gmail.com'
BRAND = [(re.compile(r'\bVELLUCE\b'),'ZENSEA'),(re.compile(r'\bVelluce\b'),'Zensea'),
         (re.compile(r'\bvelluce\b'),'zensea')]
STRUCT = {'type','block_order','id','shopify_attributes','disabled','static'}

def recolor(s):
    def rep(m):
        base=('#'+m.group(1)).lower(); a=m.group(2) or ''
        return COLORS.get(base,'#'+m.group(1))+a
    return HEX.sub(rep,s)

def relink(s):
    s = WA_RX.sub(MAILTO, s)
    def rc(m):
        h=m.group(2)
        return m.group(1)+COLL.get(h,h)+m.group(3)
    s = re.sub(r'(/collections/)([a-z0-9-]+)(.*)', rc, s)
    if s in COLL: return COLL[s]
    return s

def rebrand(s):
    for rx,r in BRAND: s = rx.sub(r,s)
    return s

def is_asset(s):
    return s.startswith('shopify://') or s.startswith('https://cdn.shopify.com/')

def make_clean(copybook):
    """copybook : dict de remplacements exacts, appliqué avant tout le reste."""
    def clean(v, key=None):
        if not isinstance(v,str): return v
        if key in STRUCT: return v
        if is_asset(v): return ''
        if v in copybook: return copybook[v]
        v = recolor(v); v = rergba(v); v = relink(v); v = rebrand(v)
        return v
    return clean

def walk(o, clean, key=None):
    if isinstance(o,dict):
        return collections.OrderedDict((k, walk(v,clean,k)) for k,v in o.items())
    if isinstance(o,list):
        return [walk(v,clean,key) for v in o]
    return clean(o,key)

def strip_apps(doc):
    """Retire les sections de type apps : elles pointent vers des apps Velluce."""
    removed=[]
    for k in list(doc.get('sections',{})):
        if doc['sections'][k].get('type')=='apps':
            removed.append(k); del doc['sections'][k]
    doc['order']=[k for k in doc['order'] if k not in removed]
    return removed
