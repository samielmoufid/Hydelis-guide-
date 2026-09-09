# -*- coding: utf-8 -*-
"""Reecriture du vocabulaire Velluce -> Zensea dans les fichiers .liquid.

On n'intervient QUE sur les valeurs de texte destinees a l'oeil (schema :
name / label / default / info / content / placeholder / paragraph, et le texte
visible en HTML). Les identifiants, les types de section, les noms de classes
CSS et les appels {% render %} ne sont jamais touches : ils servent de cle
technique et seront renommes a la toute fin.
"""
import json, os, re

# ordre important : les expressions les plus longues d'abord
SUBS = [
    # --- marque
    ('Velluce', 'Zensea'),
    ('velluce.fr', 'zensea.fr'),
    ('contact@zensea.fr', 'contact.zensea@gmail.com'),
    # --- familles de produits
    ("lampe à poser", 'kalimba'), ("lampes à poser", 'kalimbas'),
    ("Lampe à poser", 'Kalimba'), ("Lampes à poser", 'Kalimbas'),
    ('applique murale', 'ocarina'), ('appliques murales', 'ocarinas'),
    ('Applique murale', 'Ocarina'), ('Appliques murales', 'Ocarinas'),
    ('ventilateur de plafond', 'housse de transport'),
    ('ventilateurs de plafond', 'housses de transport'),
    ('Ventilateur de plafond', 'Housse de transport'),
    ('Ventilateurs de plafond', 'Housses de transport'),
    ('plafonniers', 'handpans'), ('plafonnier', 'handpan'),
    ('Plafonniers', 'Handpans'), ('Plafonnier', 'Handpan'),
    ('suspensions', 'tongue drums'), ('suspension', 'tongue drum'),
    ('Suspensions', 'Tongue drums'), ('Suspension', 'Tongue drum'),
    ('lampadaires', 'kalimbas'), ('lampadaire', 'kalimba'),
    ('Lampadaires', 'Kalimbas'), ('Lampadaire', 'Kalimba'),
    ('lustres', 'bols chantants'), ('lustre', 'bol chantant'),
    ('Lustres', 'Bols chantants'), ('Lustre', 'Bol chantant'),
    ('appliques', 'ocarinas'), ('applique', 'ocarina'),
    ('Appliques', 'Ocarinas'), ('Applique', 'Ocarina'),
    ('ventilateurs', 'housses'), ('ventilateur', 'housse'),
    ('Ventilateurs', 'Housses'), ('Ventilateur', 'Housse'),
    ('luminaires', 'instruments'), ('luminaire', 'instrument'),
    ('Luminaires', 'Instruments'), ('Luminaire', 'Instrument'),
    ('ampoules', 'mailloches'), ('ampoule', 'mailloche'),
    ('Ampoules', 'Mailloches'), ('Ampoule', 'Mailloche'),
    # --- vocabulaire lumiere -> son
    ("l'éclairage", 'le son'), ('éclairage', 'son'), ('Éclairage', 'Son'),
    ('température de couleur', 'accordage'),
    ('Température de couleur', 'Accordage'),
    ('lumière chaude', 'son chaud'), ('lumière douce', 'son doux'),
    ('la lumière', 'le son'), ('La lumière', 'Le son'),
    ('lumens', 'Hz'), ('Lumens', 'Hz'), ('kelvins', 'notes'), ('Kelvin', 'Notes'),
    ('certifié CE', 'accordé au diapason'), ('certifiée CE', 'accordée au diapason'),
    # --- pieces de la maison -> univers Zensea
    ('salle à manger', 'cercle de musique'),
    ('la chambre', 'la chambre'),   # neutre : on garde
]

MODEL = ('https://cdn.shopify.com/s/files/1/1015/2122/8163/files/'
         'deco-ampoule-velluce-v2.glb?v=1787244213')

TAGS_OLD = ('luminaire, luminaires, Velluce, éclairage, décoration, accessoires, '
            'prix-a-verifier, intérieur')
TAGS_NEW = 'handpan, handpans, Zensea, instrument, percussion, 440hz'

TEXT_KEYS = {'name', 'label', 'default', 'info', 'content', 'placeholder',
             'paragraph', 'header', 'title'}

def tr(v):
    for a, b in SUBS:
        v = v.replace(a, b)
    return v

def walk(node, key=None):
    if isinstance(node, dict):
        return {k: walk(x, k) for k, x in node.items()}
    if isinstance(node, list):
        return [walk(x, key) for x in node]
    if isinstance(node, str) and key in TEXT_KEYS:
        if node == TAGS_OLD: return TAGS_NEW
        if node == MODEL: return ''          # modele 3D Velluce : emplacement laisse vide
        if node.startswith('shopify://') or node.startswith('http'): return node
        return tr(node)
    return node

SCHEMA = re.compile(r'(\{%-?\s*schema\s*-?%\})(.*?)(\{%-?\s*endschema\s*-?%\})', re.S)

changed, nsch = [], 0
for f in sorted(os.listdir('liquid')):
    p = os.path.join('liquid', f)
    src = open(p, encoding='utf-8').read()

    def repl(m):
        global nsch
        try:
            doc = json.loads(m.group(2))
        except Exception:
            return m.group(0)
        out = json.dumps(walk(doc), ensure_ascii=False, indent=2)
        json.loads(out)                       # validation obligatoire
        nsch += 1
        return m.group(1) + '\n' + out + '\n' + m.group(3)

    out = SCHEMA.sub(repl, src)
    if out != src:
        open(p, 'w', encoding='utf-8').write(out)
        changed.append(f.replace('__', '/'))

print('Schemas reecrits : %d' % nsch)
print('Fichiers modifies : %d' % len(changed))
for c in changed: print('   ', c)
