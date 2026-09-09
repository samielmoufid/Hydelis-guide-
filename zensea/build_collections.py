# -*- coding: utf-8 -*-
import json, collections, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zensea_lib import make_clean, walk, strip_apps

SRC='/home/user/Hydelis-guide-/velluce/templates/'
DST='/home/user/Hydelis-guide-/zensea/templates/'

# ---- jeux de cartes, uniquement des collections Zensea qui existent -------
FAMILLE = [('tous-les-handpans','Tous les handpans'),('handpans-9-notes','Handpans 9 notes'),
           ('handpans-10-notes','Handpans 10 notes'),('handpans-12-notes','Handpans 12 notes'),
           ('tongue-drums','Tongue drums'),('kalimbas','Kalimbas'),
           ('bols-chantants','Bols chantants'),('ocarinas','Ocarinas')]
NOTES   = [('handpans-9-notes','9 notes'),('handpans-10-notes','10 notes'),
           ('handpans-12-notes','12 notes'),('handpans-440-hz','Accordés en 440 Hz'),
           ('tous-les-handpans','Tous les handpans')]
USAGE   = [('handpans-9-notes','Débuter'),('handpans-12-notes','Progresser'),
           ('housses-et-supports','Emporter partout'),('tongue-drums','Jouer à deux')]
ACCESS  = [('accessoires','Tous les accessoires'),('housses-et-supports','Housses et supports'),
           ('maillets-et-entretien','Maillets et entretien'),
           ('guide-debutant-par-ou-commencer','Guide débutant'),('tous-les-handpans','Les instruments')]

# ---- une entree par template : titres de la page + contenu des grilles ----
T = {
'collection.plafonniers.json': ('collection.handpans.json', {
  'nom':'handpans','prefixe':'Voir tous nos','coll':'tous-les-handpans',
  'titre':"Le handpan,", 'accent':"posez les mains",
  'intro':"Neuf, dix ou douze notes, toutes dans la même gamme. C'est le seul instrument sur lequel la fausse note n'existe pas — et le seul dont on joue le soir même.",
  'grids':[("PAR NOMBRE DE NOTES","Combien de","notes ?","Neuf pour débuter, douze pour la palette complète. Le nombre change ce que vous pourrez jouer, pas la justesse.",NOTES),
           ("LA FAMILLE AU COMPLET","Voir tous nos","handpans","Tous accordés au diapason 440 Hz, joués note par note avant l'expédition.",FAMILLE),
           ("PAR FAMILLE","Trouvez votre","instrument","Handpan, tongue drum, kalimba, bol chantant : quatre façons d'entrer dans la musique.",FAMILLE),
           ("PAR USAGE","Par où","commencer ?","Débuter, progresser, emporter partout, jouer à deux : quatre chemins, aucun ne demande de solfège.",USAGE)]}),
'collection.suspensions.json': ('collection.tongue-drums.json', {
  'nom':'tongue drums','prefixe':'Voir tous nos','coll':'tongue-drums',
  'titre':"Le tongue drum,", 'accent':"le plus simple",
  'intro':"Des lames d'acier accordées entre elles. On frappe aux mailloches ou du bout des doigts, et c'est immédiatement musical. Le format qu'on pose sur la table basse et que plus personne ne repose.",
  'grids':[("PAR TAILLE","Quel format","choisir ?","Quinze centimètres pour le nomade, trente pour le salon et une résonance bien plus profonde.",NOTES),
           ("LA GAMME AU COMPLET","Voir tous nos","tongue drums","Six à onze notes, acier accordé, mailloches fournies avec chaque instrument.",FAMILLE),
           ("PAR FAMILLE","Trouvez votre","instrument","Handpan, tongue drum, kalimba, bol chantant : quatre façons d'entrer dans la musique.",FAMILLE),
           ("PAR USAGE","Pour quel","moment ?","Le matin, le soir, à deux ou en voyage : l'instrument suit, il ne se range pas.",USAGE)]}),
'collection.lampes.json': ('collection.kalimbas.json', {
  'nom':'kalimbas','prefixe':'Voir toutes nos','coll':'kalimbas',
  'titre':"La kalimba,", 'accent':"la musique aux pouces",
  'intro':"Des lames numérotées, un livret qui suit la même numérotation. Vous lisez des chiffres, pas des notes — et en vingt minutes vous jouez une mélodie reconnaissable.",
  'grids':[("PAR NIVEAU","Par où","commencer ?","Dix-sept lames pour la plupart des morceaux, vingt et une pour aller plus loin.",USAGE),
           ("LA GAMME AU COMPLET","Voir toutes nos","kalimbas","Bois massif ou acrylique, marteau d'accordage et livret numéroté inclus.",FAMILLE),
           ("PAR FAMILLE","Trouvez votre","instrument","Handpan, tongue drum, kalimba, bol chantant : quatre façons d'entrer dans la musique.",FAMILLE),
           ("PAR USAGE","Pour quel","moment ?","Dans le train, au bureau, avant de dormir : la kalimba tient dans une poche.",USAGE)]}),
'collection.lustres.json': ('collection.bols-chantants.json', {
  'nom':'bols chantants','prefixe':'Voir tous nos','coll':'bols-chantants',
  'titre':"Le bol chantant,", 'accent':"une note qui reste",
  'intro':"On frotte le bord, le son monte, et il tient bien plus longtemps qu'on ne l'imagine. C'est l'outil de ceux qui ont besoin de marquer un début et une fin.",
  'grids':[("PAR FORMAT","Quel format","choisir ?","Douze à quinze centimètres pour une note claire, vingt à vingt-cinq pour un son grave qui remplit la pièce.",NOTES),
           ("LA GAMME AU COMPLET","Voir tous nos","bols chantants","Laiton martelé à la main, maillet et coussin fournis avec chaque bol.",FAMILLE),
           ("PAR FAMILLE","Trouvez votre","instrument","Handpan, tongue drum, kalimba, bol chantant : quatre façons d'entrer dans la musique.",FAMILLE),
           ("PAR USAGE","Pour quel","usage ?","Sophrologie, yoga, méditation, ou simplement refermer sa journée.",USAGE)]}),
'collection.appliques.json': ('collection.ocarinas.json', {
  'nom':'ocarinas','prefixe':'Voir tous nos','coll':'ocarinas',
  'titre':"L'ocarina,", 'accent':"souffler suffit",
  'intro':"Ni embouchure, ni contrôle du souffle à travailler. Vous soufflez doucement et régulièrement, et la note sort juste. Le livret montre chaque doigté en image.",
  'grids':[("PAR TONALITÉ","Quelle tonalité","choisir ?","Do alto pour un son grave et rond, sol soprano pour plus de clarté et de portée.",NOTES),
           ("LA GAMME AU COMPLET","Voir tous nos","ocarinas","Céramique ou plastique, cordon et étui fournis, livret de doigtés inclus.",FAMILLE),
           ("PAR FAMILLE","Trouvez votre","instrument","Handpan, tongue drum, kalimba, bol chantant : quatre façons d'entrer dans la musique.",FAMILLE),
           ("PAR USAGE","Pour quel","moment ?","Le soir en appartement, en randonnée, ou pour accompagner quelqu'un qui chante.",USAGE)]}),
'collection.lampadaires.json': ('collection.accessoires.json', {
  'nom':'accessoires','prefixe':'Voir tous nos','coll':'accessoires',
  'titre':"Les accessoires,", 'accent':"ce qui fait durer",
  'intro':"Une housse rembourrée, des mailloches de rechange, l'huile qui protège l'acier. Ce n'est pas du superflu : c'est ce qui garde un instrument juste pendant des années.",
  'grids':[("PAR BESOIN","De quoi avez-vous","besoin ?","Transporter, poser, entretenir, remplacer : chaque accessoire répond à un usage précis.",ACCESS),
           ("TOUT LE NÉCESSAIRE","Voir tous nos","accessoires","Housses, supports, mailloches, huiles et livrets, réunis au même endroit.",ACCESS),
           ("PAR FAMILLE","Pour quel","instrument ?","Handpan, tongue drum, kalimba, bol chantant : chacun a ses accessoires.",FAMILLE),
           ("PAR USAGE","Par où","commencer ?","Débuter, progresser, emporter partout, entretenir : quatre chemins.",USAGE)]}),
'collection.ventilateurs.json': ('collection.housses-et-supports.json', {
  'nom':'housses et supports','prefixe':'Voir toutes nos','coll':'housses-et-supports',
  'titre':"Housses et supports,", 'accent':"l'instrument protégé",
  'intro':"Un handpan se transporte, se pose, se range. Une housse rembourrée et un support stable évitent le choc qui coûte un réaccordage complet.",
  'grids':[("PAR BESOIN","Transporter ou","poser ?","La housse pour la route, le support pour la maison. Souvent les deux.",ACCESS),
           ("TOUT LE NÉCESSAIRE","Voir toutes nos","housses","Rembourrage épais, sangles réglables, formats adaptés à chaque diamètre.",ACCESS),
           ("PAR FAMILLE","Pour quel","instrument ?","Le format se choisit sur le diamètre de votre instrument, pas sur la marque.",FAMILLE),
           ("PAR USAGE","Pour quel","usage ?","Le train, la scène, le salon : le besoin n'est pas le même.",USAGE)]}),
'collection.exterieurs.json': ('collection.maillets-et-entretien.json', {
  'nom':'entretien','prefixe':'Voir tout notre','coll':'maillets-et-entretien',
  'titre':"Maillets et entretien,", 'accent':"garder l'accord",
  'intro':"Ce qui désaccorde un instrument, ce n'est pas l'usage : c'est un choc, une chaleur excessive ou la corrosion. Un chiffon, un peu d'huile, et il tient des années.",
  'grids':[("PAR BESOIN","De quoi avez-vous","besoin ?","Mailloches de rechange, huile protectrice, chiffon microfibre, marteau d'accordage.",ACCESS),
           ("TOUT LE NÉCESSAIRE","Voir tout notre","entretien","Le nécessaire pour qu'un instrument garde sa justesse saison après saison.",ACCESS),
           ("PAR FAMILLE","Pour quel","instrument ?","Chaque famille a son entretien : l'acier, le laiton et le bois ne se traitent pas pareil.",FAMILLE),
           ("PAR USAGE","À quelle","fréquence ?","Un passage d'huile par mois suffit. Le reste, c'est du bon sens.",USAGE)]}),
'collection.json': ('collection.json', {
  'nom':'instruments','prefixe':'Voir tous nos','coll':'tous-les-handpans',
  'titre':"Nos instruments,", 'accent':"tous accordés",
  'intro':"Handpans, tongue drums, kalimbas, bols chantants et ocarinas. Cinq familles, une même promesse : on en joue tout de suite, sans solfège et sans professeur.",
  'grids':[("PAR FAMILLE","Trouvez votre","instrument","Cinq familles, une même exigence. Commencez par ce que vous avez envie d'entendre.",FAMILLE),
           ("LA FAMILLE AU COMPLET","Voir tous nos","instruments","Chacun est reçu, joué et contrôlé au diapason avant d'entrer au catalogue.",FAMILLE),
           ("PAR NOMBRE DE NOTES","Combien de","notes ?","Neuf pour débuter, douze pour la palette complète.",NOTES),
           ("PAR USAGE","Par où","commencer ?","Débuter, progresser, emporter partout, jouer à deux.",USAGE)]}),
}

BOOK = {
 "Nous écrire sur WhatsApp":"Nous écrire par e-mail",
 "Besoin d'aide pour choisir le bon modèle ?":"Besoin d'aide pour choisir votre instrument ?",
 "Besoin d’aide pour choisir le bon modèle ?":"Besoin d'aide pour choisir votre instrument ?",
 "Notre équipe vous aide à comparer les modèles et à trouver celui qui correspond le mieux à vos besoins.":
   "Dites-nous ce que vous écoutez : on vous répond avec une gamme, un nombre de notes et un format précis.",
 "Découvrir la collection":"Découvrir la collection",
 "Tout voir":"Tout voir",
 "luminaire, luminaires, Velluce, éclairage, décoration, accessoires, prix-a-verifier, intérieur":
   "handpan, handpans, Zensea, instrument, percussion, 440hz",
 "univers-, import-, espace":"univers-, import-, source-",
 "luminaires d'extérieur":"maillets et entretien",
 "appliques murales":"ocarinas",
 "lampes à poser":"kalimbas",
 "ventilateurs de plafond":"housses et supports",
}

rep=[]
for src,(dst,spec) in T.items():
    doc=json.load(open(SRC+src,encoding='utf-8'),object_pairs_hook=collections.OrderedDict)
    removed=strip_apps(doc)
    out=walk(doc, make_clean(BOOK))
    # -- reecriture des grilles
    gi=0
    for sid in out['order']:
        s=out['sections'][sid]
        if s.get('type')!='velluce-grille': continue
        g=spec['grids'][gi % len(spec['grids'])]; gi+=1
        eyebrow,title,accent,intro,cards = g
        st=s.setdefault('settings',collections.OrderedDict())
        st['eyebrow'],st['title'],st['title_accent'],st['intro']=eyebrow,title,accent,intro
        st['cta_label']="Tout voir"; st['cta_link']="/collections/tous-les-handpans"
        order=s.get('block_order') or list((s.get('blocks') or {}).keys())
        for i,bid in enumerate(order):
            b=s['blocks'][bid]; h,t=cards[i%len(cards)]
            bs=b.setdefault('settings',collections.OrderedDict())
            bs['collection']=h; bs['title']=t; bs['image']=''; bs['link']=''
    # -- titre de page (velluce-voir-tout)
    for sid in out['order']:
        s=out['sections'][sid]
        if s.get('type')=='velluce-voir-tout':
            st=s.setdefault('settings',collections.OrderedDict())
            # 'accent' est un reglage de COULEUR dans ce schema : ne jamais
            # y ecrire du texte, Shopify rejette le fichier en silence.
            for k,v in (('titre',spec['titre']),('title',spec['titre']),
                        ('title_accent',spec['accent']),('titre_accent',spec['accent']),
                        ('intro',spec['intro']),('subtitle',spec['intro']),
                        ('sous_titre',spec['intro']),('text',spec['intro']),
                        ('nom',spec.get('nom')),('prefixe',spec.get('prefixe')),
                        ('collection',spec.get('coll')),('cta','Découvrir la collection'),
                        ('eyebrow','LA FAMILLE AU COMPLET'),('image','')):
                if v is not None and k in st and isinstance(st[k], str) and not st[k].startswith('#'):
                    st[k]=v
    json.dump(out,open(DST+dst,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
    json.load(open(DST+dst,encoding='utf-8'))
    txt=open(DST+dst,encoding='utf-8').read()
    left=len(re.findall(r'luminaire|plafonnier|suspension|applique|lustre|ampoule|lumière|velluce(?!_)',txt,re.I))
    rep.append((dst,len(out['order']),len(removed),gi,len(txt),left))
print('%-38s %4s %5s %6s %8s %6s' % ('FICHIER','SECT','APPS-','GRILL','OCTETS','RESTES'))
print('-'*78)
for r in rep: print('%-38s %4d %5d %6d %8d %6d' % r)
