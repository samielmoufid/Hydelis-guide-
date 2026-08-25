# -*- coding: utf-8 -*-
"""Construit templates/index.json pour Zensea à partir de la source Velluce."""
import json, re, collections, sys

SRC = '/home/user/Hydelis-guide-/velluce/templates/index.json'
OUT = sys.argv[1]

# ---------------------------------------------------------------- couleurs
COLORS = {
    # correspondances imposées par la mission
    '#cfc0ae': '#2E5E46', '#2c2c2c': '#22332A', '#faf8f5': '#FBF9F4',
    '#d4896b': '#B98A2E', '#b9a284': '#B98A2E', '#a96e4f': '#B98A2E',
    '#f0e7db': '#ECF1E8', '#f8f9fa': '#ECF1E8', '#1e1e1e': '#22332A',
    '#6b7280': '#5A6B60',
    # extensions cohérentes avec la palette Zensea
    '#1a1a1a': '#22332A', '#111111': '#22332A',
    '#b08d57': '#B98A2E', '#cfa76a': '#C8A24B', '#c98a6b': '#B98A2E',
    '#141210': '#1F3D2F', '#17120e': '#1F3D2F',
    '#6a635c': '#5A6B60', '#555555': '#5A6B60', '#666666': '#5A6B60',
    '#6b6b6b': '#5A6B60', '#5f5f5f': '#5A6B60', '#a08d74': '#5A6B60',
    '#e9e4dd': '#ECF1E8', '#ececec': '#ECF1E8',
    '#f7f2e9': '#FBF9F4', '#f6efe6': '#FBF9F4',
    '#b9ada0': '#A8BCAE', '#ffca7a': '#E8C98A',
}
HEX = re.compile(r'#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b')

def recolor(s):
    def rep(m):
        base = ('#' + m.group(1)).lower()
        alpha = m.group(2) or ''
        return COLORS.get(base, '#' + m.group(1)) + alpha
    return HEX.sub(rep, s)

# --------------------------------------------------------- collections
COLL = {
    'plafonniers': 'tous-les-handpans',
    'suspensions': 'tongue-drums',
    'lampes': 'kalimbas',
    'lustres': 'bols-chantants',
    'appliques': 'ocarinas',
    'appliques-murales': 'ocarinas',
    'lampadaires': 'accessoires',
    'ventilateurs': 'housses-et-supports',
    'ventilateurs-de-plafond': 'housses-et-supports',
    'exterieurs': 'maillets-et-entretien',
    'luminaires-exterieurs': 'maillets-et-entretien',
    'meilleurs-ventes': 'tous-les-handpans',
    'salon': 'handpans-9-notes',
    'chambre': 'handpans-12-notes',
    'cuisine': 'housses-et-supports',
    'salle-de-bain': 'tongue-drums',
}

WA = 'https://wa.me/message/V5U35J5ZWYZOA1'
MAILTO = 'mailto:contact.zensea@gmail.com'

def relink(s):
    if s == WA:
        return MAILTO
    m = re.match(r'^(/collections/)([a-z0-9-]+)(.*)$', s)
    if m and m.group(2) in COLL:
        return m.group(1) + COLL[m.group(2)] + m.group(3)
    if s in COLL:
        return COLL[s]
    return s

BRAND = [
    (re.compile(r'\bVELLUCE\b'), 'ZENSEA'),
    (re.compile(r'\bVelluce\b'), 'Zensea'),
    (re.compile(r'\bvelluce\b'), 'zensea'),
]

def rebrand(s):
    for rx, r in BRAND:
        s = rx.sub(r, s)
    return s

def is_asset(s):
    return s.startswith('shopify://') or s.startswith('https://cdn.shopify.com/')

def clean(v):
    """Transformations mécaniques appliquées à toute chaîne."""
    if not isinstance(v, str):
        return v
    if is_asset(v):
        return ''            # aucun visuel : le propriétaire mettra les siens
    v = recolor(v)
    v = relink(v)
    v = rebrand(v)
    return v

# Clés structurelles : jamais réécrites. Le "type" pointe vers un fichier
# de section réel ; le renommer ici casserait toutes les références.
STRUCT = {'type', 'block_order', 'id', 'shopify_attributes', 'disabled', 'static'}

def walk(o, key=None):
    if isinstance(o, dict):
        return collections.OrderedDict((k, walk(v, k)) for k, v in o.items())
    if isinstance(o, list):
        return [walk(v, key) for v in o]
    if key in STRUCT:
        return o
    return clean(o)

# --------------------------------------------------------------- montage
src = json.load(open(SRC, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
S = src['sections']

# ordre imposé par la mission (20 sections)
PLAN = [
    ('banniere_hero',        'banniere_hero_gMxea8'),
    ('grille',               'vgr_types_home'),
    ('collections_premium',  'collections_premium_AHr9UK'),
    ('par_usage',            'par_espace_pfTfWn'),
    ('collection_featured',  'collection_featured_ajDTpX'),
    ('choisir_zensea',       'choisir_velluce_dcVbQ7'),
    ('comparatif',           'velluce_comparatif'),
    ('manifeste',            'manifeste_velluce'),
    ('carrousel_images',     'carrousel_images_RDapf6'),
    ('chapitre_handpans',    'chapitre_appliques'),
    ('chapitre_tongue',      'chapitre_plafonniers'),
    ('chapitre_bols',        'chapitre_suspensions'),
    ('video_promo',          'video_promo_cknbEL'),
    ('reassurance_slider',   'custom_section_NJxRD7'),
    ('prise_en_main',        None),                       # section « assurance », créée
    ('engagement',           'image_texte_premium_dbmmzi'),
    ('faq',                  'faq_premium_HYDcNb'),
    ('support',              'support_steps_ihi6Df'),
    ('lettre',               'newsletter_velluce'),
    ('bas_footer',           'bas_footer_NhGUjw'),
]

ASSURANCE = collections.OrderedDict([
    ('type', 'assurance'),
    ('settings', collections.OrderedDict([
        ('badge', 'PRISE EN MAIN GUIDÉE'),
        ('title', 'Votre premier morceau, ce soir'),
        ('description', "Aucune leçon, aucune partition, aucun professeur. Trois gestes suffisent pour que l'instrument sonne — et il sonnera juste, quoi que vous jouiez."),
        ('step_1_title', 'Posez-le sur vos genoux'),
        ('step_1_text', "Le creux tourné vers vous, les avant-bras détendus, les épaules basses. La position fait la moitié du son : un instrument crispé sonne mat."),
        ('step_2_title', 'Frappez du bout des doigts'),
        ('step_2_text', "Jamais avec la paume, jamais avec la force. Un rebond sec au centre de la note, et l'acier chante tout seul pendant plusieurs secondes."),
        ('step_3_title', 'Laissez venir la suite'),
        ('step_3_text', "Enchaînez deux notes, puis trois. Comme elles appartiennent toutes à la même gamme, il n'y a rien à corriger : vous ne pouvez pas vous tromper."),
        ('video', ''), ('video_url', ''), ('video_autoplay', True),
        ('video_fit', 'auto'), ('video_height_desktop', 560), ('video_height_mobile', 320),
        ('image', ''), ('image_position', 'right'),
        ('bg_color', '#ECF1E8'), ('accent_color', '#2E5E46'),
        ('title_size_desktop', 42), ('title_size_mobile', 28),
        ('padding_top_desktop', 96), ('padding_bottom_desktop', 96),
        ('padding_top_mobile', 56), ('padding_bottom_mobile', 56),
    ])),
])

out_sections = collections.OrderedDict()
order = []
for newid, srcid in PLAN:
    if srcid is None:
        out_sections[newid] = ASSURANCE
    else:
        out_sections[newid] = walk(S[srcid])
    order.append(newid)

doc = collections.OrderedDict([('sections', out_sections), ('order', order)])
json.dump(doc, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.load(open(OUT, encoding='utf-8'))       # revalidation
print('index.json généré :', len(open(OUT, encoding='utf-8').read()), 'octets,', len(order), 'sections')
