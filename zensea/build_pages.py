# -*- coding: utf-8 -*-
import json, collections, sys, os, re, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zensea_lib import make_clean, walk, strip_apps
from page_copy import CONTACT, UNIVERS, PRO
from faq_copy import FAQ
from story_copy import HISTOIRE, HIST_META, PROMESSE, PROM_META

SRC='/home/user/Hydelis-guide-/velluce/templates/'
DST='/home/user/Hydelis-guide-/zensea/templates/'
OD=collections.OrderedDict

# ---- textes visibles des blocs custom-code -------------------------------
CC = [
 ("Centre d'aide Velluce","Centre d'aide Zensea"),
 ("Tout ce que vous devez savoir<br>avant d'éclairer votre intérieur.",
  "Tout ce que vous devez savoir<br>avant de poser les mains dessus."),
 ("Nous avons rassemblé ici les questions que l'on nous pose vraiment — dimensions, hauteurs de pose, ampoules, normes, livraison, garantie.",
  "Nous avons rassemblé ici les questions qu'on nous pose vraiment — gammes, nombre de notes, prise en main, accordage, entretien, livraison, retours."),
 ("Bien choisir","Bien choisir"),("Installation","Prise en main"),
 ("Ampoules &amp; lumière","Accordage"),("Retours &amp; garantie","Retours"),
 ("Normes","Qualité"),("Ventilateurs","Bols &amp; éveil"),
 ("Une hauteur dont vous n'êtes pas sûr, une pièce dont vous ne savez pas quoi faire, une photo de votre salon à nous montrer : écrivez-nous. Vous aurez une réponse d'une personne qui connaît les produits, pas un message automatique.",
  "Une gamme dont vous n'êtes pas sûr, un nombre de notes à valider, un doute sur la prise en main : écrivez-nous. Vous aurez une réponse d'une personne qui a l'instrument entre les mains, pas un message automatique."),
 ("Écrire sur WhatsApp","Écrire un e-mail"),
 ("Réponse en moins de 2 h en journée","Réponse sous 24 h en semaine"),
 ("contact@velluce.fr","contact.zensea@gmail.com"),
 ("Réponse sous 24 h, 7j/7","Réponse sous 24 h, du lundi au vendredi"),
 ("Pour les demandes détaillées","Pour les demandes détaillées"),
 # notre histoire
 ("Nous ne vendons pas des ampoules.","Nous ne vendons pas des objets en acier."),
 ("Nous vendons le moment où la pièce devient belle.","Nous vendons le moment où il est minuit sans qu'on s'en soit rendu compte."),
 ("Velluce est née d'un soir raté, dans un salon parisien mal éclairé. Voici comment une contrariété très banale est devenue une maison de luminaires.",
  "Zensea est née d'une vidéo vue à trois heures du matin, et d'un premier handpan qui est arrivé injouable. Voici comment une déception très banale est devenue une maison d'instruments."),
 # notre promesse
 ("Un luminaire, on le pose une fois.","Un instrument, on l'achète une fois."),
 ("On n'a pas le droit de se tromper.","On n'a pas le droit de se tromper."),
 ("Il restera au-dessus de votre table pendant les devoirs, les dimanches midi, les soirs où l'on ne fait rien. Vous le verrez tous les jours pendant des années. C'est pour cette raison que nous prenons autant de précautions avant qu'il n'entre dans notre catalogue — et que nous restons joignables longtemps après qu'il soit chez vous.",
  "Il restera posé dans votre salon pendant des années. Vous le prendrez le soir sans y penser, vous le tendrez à quelqu'un qui n'a jamais joué. C'est pour cette raison que nous prenons autant de précautions avant qu'il n'entre au catalogue — et que nous restons joignables longtemps après qu'il soit chez vous."),
 ("Une sélection resserrée","Une sélection courte"),
 ("Quelques dizaines de modèles choisis, pas dix mille références vues nulle part.","Quelques modèles choisis, joués un par un, pas deux cents références vues nulle part."),
 ("La lumière juste","L'accord vérifié"),
 ("2700K, IRC élevé, intensité variable : l'ambiance avant la puissance.","Note par note, au diapason 440 Hz : la justesse avant le volume."),
 ("Posé en 30 minutes","La gamme écrite"),
 ("Platine, vis et chevilles incluses. Cotes de pose indiquées noir sur blanc.","Gamme exacte et nombre de notes indiqués noir sur blanc sur chaque fiche."),
 ("Contrôlé avant d'entrer","Le pack complet"),
 ("Marquage CE, indice IP adapté à la pièce, sécurité électrique vérifiée.","Housse rembourrée, mailloches, huile d'entretien et livret de partitions."),
 ("Garanti 24 mois","30 jours d'essai"),
 ("Incluse d'office, sans surcoût, sans conditions cachées.","Sans avoir à vous justifier, bien au-delà des 14 jours légaux."),
 ("Une vraie personne","Une vraie personne"),
 ("Avant l'achat pour choisir, après la livraison pour poser. 7j/7.","Avant l'achat pour choisir, après la livraison pour progresser. En français."),
 ("Le prix affiché","Le prix affiché"),
]

BOOK = dict(CONTACT); BOOK.update(PRO)
BOOK.update({
 "Nous écrire sur WhatsApp":"Nous écrire par e-mail",
 "DÉCOUVRIR NOS COLLECTIONS":"DÉCOUVRIR NOS INSTRUMENTS",
 "48 vraies réponses, sans détour.":"48 vraies réponses, sans détour.",
 "La hauteur idéale au-dessus d'une table, les délais réels de livraison, ce que couvre la garantie : tout ce qu'on nous demande est écrit ici, sans détour et sans jargon.":
   "Quelle gamme choisir, combien de notes, comment tenir l'instrument, ce que couvre le retour : tout ce qu'on nous demande est écrit ici, sans détour et sans jargon.",
 "F.A.Q Velluce":"F.A.Q Zensea",
 "Mise à jour régulièrement · Réponse humaine 7j/7":"Mise à jour régulièrement · Réponse humaine en semaine",
})

def clean_factory():
    base = make_clean(BOOK)
    def c(v, key=None):
        # Les remplacements de texte passent AVANT le changement de marque :
        # sinon les cles ecrites avec Velluce ne correspondent plus a rien.
        if isinstance(v, str):
            for a,b in CC:
                if a in v: v = v.replace(a,b)
        return base(v, key)
    return c

def load(f):
    return json.load(open(SRC+f, encoding='utf-8'), object_pairs_hook=OD)

def save(doc, name):
    json.dump(doc, open(DST+name,'w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
    json.load(open(DST+name, encoding='utf-8'))
    return os.path.getsize(DST+name)

out=[]
def emit(name, size, note=''):
    out.append((name, size, note))

# ---------------------------------------------------------------- simples
for f in ['page.json','page.contact.json','page.contactez-nous.json','page.espace-pro.json']:
    d=load(f); strip_apps(d)
    emit(f, save(walk(d, clean_factory()), f))

# --------------------------------------------------------------- univers
base_univers = load('page.espace-salon.json')
for key,(titre,accroche,intro,handles) in UNIVERS.items():
    d=copy.deepcopy(base_univers); strip_apps(d)
    d=walk(d, clean_factory())
    for sid,s in d['sections'].items():
        if s.get('type')=='espace-collections':
            st=s.setdefault('settings',OD())
            st['eyebrow']=titre; st['title']=accroche; st['intro']=intro; st['handles']=handles
    emit('page.univers-%s.json'%key, save(d,'page.univers-%s.json'%key))

# --------------------------------------------------------------- histoire
d=load('page.notre-histoire.json'); strip_apps(d); d=walk(d, clean_factory())
i=0
for sid in d['order']:
    s=d['sections'][sid]
    if s.get('type')=='txtprem' and i<len(HISTOIRE):
        st=s.setdefault('settings',OD()); st['title'],st['text']=HISTOIRE[i]; i+=1
    if s.get('type')=='velluce-hero-3d':
        st=s.setdefault('settings',OD())
        st['eyebrow']=HIST_META['eyebrow']; st['heading']=HIST_META['heading']
        st['subheading']=HIST_META['subheading']; st['badge_text']=HIST_META['badge']
    if s.get('type')=='hero-vorha':
        st=s.setdefault('settings',OD())
        st['eyebrow']=HIST_META['hero_eyebrow']; st['heading']=HIST_META['hero_h']
        st['subheading']=HIST_META['hero_sub']
emit('page.notre-histoire.json', save(d,'page.notre-histoire.json'), '%d chapitres'%i)

# --------------------------------------------------------------- promesse
d=load('page.notre-promesse.json'); strip_apps(d); d=walk(d, clean_factory())
i=0
for sid in d['order']:
    s=d['sections'][sid]
    if s.get('type')=='txtprem' and i<len(PROMESSE):
        st=s.setdefault('settings',OD()); st['title'],st['text']=PROMESSE[i]; i+=1
    if s.get('type')=='velluce-hero-3d':
        st=s.setdefault('settings',OD())
        st['eyebrow']=PROM_META['eyebrow']; st['heading']=PROM_META['heading']
        st['subheading']=PROM_META['subheading']; st['badge_text']=PROM_META['badge']
    if s.get('type')=='hero-vorha':
        st=s.setdefault('settings',OD())
        st['eyebrow']=PROM_META['hero_eyebrow']; st['heading']=PROM_META['hero_h']
        st['subheading']=PROM_META['hero_sub']
    if s.get('type')=='title-premium':
        st=s.setdefault('settings',OD())
        if 'custom_title' in st: st['custom_title']=PROM_META['title']
emit('page.notre-promesse.json', save(d,'page.notre-promesse.json'), '%d engagements'%i)

# -------------------------------------------------------------------- FAQ
d=load('page.faq.json'); strip_apps(d); d=walk(d, clean_factory())
nq=0
for sid,(titre,sous,qs) in FAQ.items():
    s=d['sections'].get(sid)
    if s is None: continue
    st=s.setdefault('settings',OD()); st['title']=titre; st['subtitle']=sous
    proto=None
    for b in (s.get('blocks') or {}).values():
        if b.get('type')=='faq_item': proto=copy.deepcopy(b); break
    if proto is None: continue
    blocks=OD(); order=[]
    for n,(q,a) in enumerate(qs,1):
        b=copy.deepcopy(proto)
        b.setdefault('settings',OD())['question']=q
        b['settings']['answer']=a
        bid='%s_q%d'%(sid,n); blocks[bid]=b; order.append(bid); nq+=1
    s['blocks']=blocks; s['block_order']=order
emit('page.faq.json', save(d,'page.faq.json'), '%d questions'%nq)

# ------------------------------------------------------- gabarits de sonde
for probe in ['page.velluce-test.json']:
    save(OD([('sections',OD([('main',OD([('type','main-page'),('settings',OD())]))])),('order',['main'])]),
         'page.zensea-inutilise.json')
emit('page.zensea-inutilise.json', os.path.getsize(DST+'page.zensea-inutilise.json'), 'remplace page.velluce-test')

print('%-34s %8s  %s' % ('FICHIER','OCTETS','NOTE'))
print('-'*72)
for n,s,note in out: print('%-34s %8d  %s' % (n,s,note))
