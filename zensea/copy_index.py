# -*- coding: utf-8 -*-
"""Applique le copywriting handpan sur l'index Zensea."""
import json, collections, sys

P = sys.argv[1]
d = json.load(open(P, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
S = d['sections']

COPY = {}

# ------------------------------------------------------------------ 1 HERO
COPY['banniere_hero'] = {'settings': {
 'rating_text': "4,9/5 — plus de 1 800 musiciens équipés",
 'eyebrow': "Handpans accordés en 440 Hz",
 'title': "Posez les mains. La musique vient.",
 'mobile_title': "Posez les mains. La musique vient.",
 'description': "Le handpan est le seul instrument sur lequel la fausse note n'existe pas. Toutes ses notes appartiennent à la même gamme : dès le premier soir, tout ce que vous jouez sonne juste. Sans solfège, sans professeur, sans avoir jamais touché un instrument.",
 'mobile_description': "L'instrument où la fausse note n'existe pas. Vous en jouez dès le premier soir.",
 'primary_label': "Découvrir les handpans",
 'primary_link': "/collections/tous-les-handpans",
 'secondary_label': "Bien choisir ses notes",
 'secondary_link': "/pages/guide",
}}

# ---------------------------------------------------------------- 2 GRILLE
COPY['grille'] = {'settings': {
 'eyebrow': "TOUT L'UNIVERS ZENSEA",
 'title': "Voir tous nos",
 'title_accent': "instruments",
 'intro': "Cinq familles, une même promesse : on en joue tout de suite. Commencez par ce que vous avez envie d'entendre.",
 'cta_label': "Voir tout le catalogue",
 'cta_link': "/collections/tous-les-handpans",
}, 'blocks': {
 'c_1': {'collection': 'tous-les-handpans',  'title': "Tous les handpans"},
 'c_2': {'collection': 'handpans-9-notes',   'title': "Handpans 9 notes"},
 'c_3': {'collection': 'handpans-10-notes',  'title': "Handpans 10 notes"},
 'c_4': {'collection': 'handpans-12-notes',  'title': "Handpans 12 notes"},
 'c_5': {'collection': 'tongue-drums',       'title': "Tongue drums"},
 'c_6': {'collection': 'kalimbas',           'title': "Kalimbas"},
 'c_7': {'collection': 'bols-chantants',     'title': "Bols chantants"},
 'c_8': {'collection': 'ocarinas',           'title': "Ocarinas"},
}}

# --------------------------------------------------- 3 COLLECTIONS PREMIUM
COPY['collections_premium'] = {'settings': {
 'title': "Par famille d'instrument",
 'eyebrow': "Nos univers sonores",
 'subtitle': "Handpan, tongue drum, kalimba : trois façons d'entrer dans la musique sans jamais avoir appris à la lire.",
 'cta_label': "Voir tout le catalogue",
 'cta_url': "/collections/tous-les-handpans",
 'card_link_label': "Découvrir",
}, 'blocks': {
 'collection_X9CMgW': {'title': "Handpans", 'collection_url': "/collections/tous-les-handpans",
   'image_alt': "Handpan doré posé sur les genoux d'un joueur"},
 'collection_n6iYJz': {'title': "Handpans 9 notes", 'collection_url': "/collections/handpans-9-notes",
   'image_alt': "Handpan 9 notes vu du dessus, gamme gravée"},
 'collection_6N8ei8': {'title': "Handpans 12 notes", 'collection_url': "/collections/handpans-12-notes",
   'image_alt': "Handpan 12 notes en acier bronze"},
 'collection_prhfQg': {'title': "Tongue drums", 'collection_url': "/collections/tongue-drums",
   'image_alt': "Tongue drum en acier posé sur une table basse"},
 'collection_mDzTpY': {'title': "Kalimbas", 'collection_url': "/collections/kalimbas",
   'image_alt': "Kalimba en bois massif tenue à deux mains"},
 'collection_zce86f': {'title': "Bols chantants", 'collection_url': "/collections/bols-chantants",
   'image_alt': "Bol chantant en laiton martelé avec son maillet"},
 'collection_9pUHnk': {'title': "Ocarinas", 'collection_url': "/collections/ocarinas",
   'image_alt': "Ocarina en céramique tenu entre les mains"},
}}

# ------------------------------------------------------------- 4 PAR USAGE
COPY['par_usage'] = {'settings': {
 'title': "Par où commencer ?",
 'subtitle': "Quatre chemins selon ce que vous cherchez. Aucun ne demande de savoir lire une partition.",
 'button_text': "Voir tous les instruments",
 'button_url': "/collections/tous-les-handpans",
}, 'blocks': {
 'espace_apky7a': {'title': "Débuter",           'collection': 'handpans-9-notes',    'link_text': "Découvrir"},
 'espace_mk4cU8': {'title': "Progresser",        'collection': 'handpans-12-notes',   'link_text': "Découvrir"},
 'espace_Xz9PmP': {'title': "Emporter partout",  'collection': 'housses-et-supports', 'link_text': "Découvrir"},
 'espace_pYC8rV': {'title': "Jouer à deux",      'collection': 'tongue-drums',        'link_text': "Découvrir"},
}}

# --------------------------------------------------------- 5 CARROUSEL PDT
COPY['collection_featured'] = {'settings': {'collection': 'tous-les-handpans'}}

# ------------------------------------------------------------ 6 LA MÉTHODE
COPY['choisir_zensea'] = {'settings': {
 'eyebrow': "La méthode Zensea",
 'title': "Peu d'instruments. Tous accordés.",
 'intro': "Un handpan mal accordé n'est pas un instrument, c'est une sculpture. Chaque pièce est jouée note par note avant de partir — et celles qui ne tiennent pas ne partent pas.",
}, 'blocks': {
 'bloc_ETKdHR': {'title': "Accordé à l'oreille, pas au scanner",
   'text': "Chaque handpan est joué note par note et contrôlé au diapason 440 Hz avant l'expédition. Pas une case cochée sur une fiche qualité : une oreille humaine, un instrument à la fois."},
 'bloc_aLmCAH': {'title': "Vous ne pouvez pas jouer faux",
   'text': "Toutes les notes d'un handpan appartiennent à la même gamme. C'est le principe même de l'instrument : posez les mains, ce qui sort est juste. Le premier soir comme le centième."},
 'bloc_6b6VjG': {'title': "Et si le son ne vous parle pas",
   'text': "30 jours pour changer d'avis, sans avoir à vous justifier. Un instrument, ça se ressent — on préfère un retour à un objet qui prend la poussière dans un coin."},
}}

# ------------------------------------------------------------ 7 COMPARATIF
COPY['comparatif'] = {'settings': {
 'kicker': "Le vrai comparatif",
 'titre': "Ce que vous devriez exiger d'un vendeur de handpan",
 'sous_titre': "Six points vérifiables en deux minutes. Ouvrez n'importe quel autre site de handpans dans un onglet et contrôlez-les un par un avant de commander ici.",
 'marque': "ZENSEA", 'marque_sous': "France",
 'col_criteres': "Critères", 'col_nous': "Zensea", 'col_ailleurs': "Ce qu'on trouve ailleurs*",
 'note_1': "*Comparatif établi en analysant une à une 25 boutiques d'instruments en ligne, en août 2026.",
 'note_2': "Aucune n'indiquait la gamme exacte de ses handpans.",
}, 'blocks': {
 'ligne_1': {'critere': "La gamme exacte, écrite sur la fiche"},
 'ligne_2': {'critere': "L'accordage 440 Hz vérifié avant l'envoi"},
 'ligne_3': {'critere': "Le nombre de notes expliqué, pas juste affiché"},
 'ligne_4': {'critere': "On vous dit aussi quand prendre moins cher"},
 'ligne_5': {'critere': "Aucun compte à rebours, aucune fausse urgence"},
 'ligne_6': {'critere': "Une réponse humaine, en français, avant l'achat"},
}}

# ------------------------------------------------------------- 8 MANIFESTE
COPY['manifeste'] = {'settings': {
 'eyebrow': "LE MOMENT ZENSEA",
 'title': "L'instant où l'on",
 'title_accent': "arrête de compter",
 'intro': "<p>Le premier soir, on pose l'instrument sur ses genoux sans savoir quoi en faire. On effleure une note. Puis une autre. Et il est minuit.</p>",
 'text': "<p>Le handpan ne se travaille pas, il se laisse venir. Pas de solfège à réviser, pas de gammes à répéter, pas de professeur qui corrige. Juste une coupole d'acier accordée pour que tout ce que vos mains trouvent sonne juste.</p><p>C'est ce qui explique qu'on en joue des heures sans s'en apercevoir : il n'y a rien à réussir, donc rien à rater.</p>",
 'quote': "C'est le seul instrument qu'on ne rate jamais.",
 'signature': "ZENSEA — LE SON QUI APAISE",
 'image_alt': "Handpan Zensea posé sur les genoux, mains en approche",
 'image_caption': "PREMIER SOIR — 23 H 10",
 'ghost_text': "440",
 'cta_label': "DÉCOUVRIR NOS HANDPANS",
 'cta_link': "/collections/tous-les-handpans",
}, 'blocks': {
 'fact_1': {'label': "SÉLECTION", 'value': "Peu de modèles"},
 'fact_2': {'label': "ACCORDAGE", 'value': "Vérifié avant envoi"},
 'fact_3': {'label': "ESSAI",     'value': "30 jours inclus"},
}}

# ------------------------------------------------------------- 9 CARROUSEL
COPY['carrousel_images'] = {'settings': {
 'title': "Eux, ce soir, chez eux",
 'subtitle': "Des joueurs comme vous. Aucun n'était musicien avant.",
}}

# --------------------------------------------------------- 10-12 CHAPITRES
COPY['chapitre_handpans'] = {'settings': {
 'eyebrow': "HANDPANS",
 'title': "L'instrument qu'on joue",
 'title_accent': "dès le premier soir",
 'text': "<p>Aucune fausse note n'existe sur un handpan. Les neuf, dix ou douze notes appartiennent à la même gamme : tout ce que vos mains trouvent sonne juste, y compris la toute première fois.</p><p>C'est pour ça qu'on en joue des heures sans s'en rendre compte. On ne travaille pas — on cherche, et on tombe toujours sur quelque chose de beau.</p>",
 'spec_1': "Accordé en 440 Hz",
 'spec_2': "9, 10 ou 12 notes",
 'spec_3': "Housse et mailloches incluses",
 'image_alt': "Handpan doré posé sur les genoux d'un joueur",
 'card_label': "Handpans", 'card_cta': "Découvrir", 'styles_label': "PAR GAMME",
}}
COPY['chapitre_tongue'] = {'settings': {
 'eyebrow': "TONGUE DRUMS",
 'title': "Le plus simple pour",
 'title_accent': "commencer",
 'text': "<p>Même principe que le handpan, en plus petit et en plus doux. Les lames d'acier sont accordées entre elles : on frappe avec les mailloches ou du bout des doigts, et le résultat est immédiatement musical.</p><p>C'est l'instrument qu'on pose sur une table basse et que plus personne ne repose. Les enfants s'en emparent, les adultes aussi.</p>",
 'spec_1': "6 à 11 notes",
 'spec_2': "Formats 15 à 30 cm",
 'spec_3': "Mailloches fournies",
 'image_alt': "Tongue drum en acier posé sur une table basse",
 'card_label': "Tongue drums", 'card_cta': "Découvrir", 'styles_label': "PAR TAILLE",
}}
COPY['chapitre_bols'] = {'settings': {
 'eyebrow': "BOLS CHANTANTS",
 'title': "Une seule note, et",
 'title_accent': "la pièce se calme",
 'text': "<p>Un bol chantant ne se joue pas, il se fait résonner. On frotte le bord, le son monte, et il tient bien plus longtemps qu'on ne l'imagine.</p><p>Sophrologues, professeurs de yoga, praticiens : c'est l'outil de ceux qui ont besoin de marquer un début et une fin. Chez soi, c'est le geste qui referme la journée.</p>",
 'spec_1': "Laiton martelé à la main",
 'spec_2': "Maillet et coussin inclus",
 'spec_3': "Formats 12 à 25 cm",
 'image_alt': "Bol chantant en laiton martelé avec son maillet",
 'card_label': "Bols chantants", 'card_cta': "Découvrir", 'styles_label': "PAR FORMAT",
}}

# ----------------------------------------------------------- 13 VIDÉO PROMO
COPY['video_promo'] = {'settings': {
 'eyebrow': "CE QU'ON REFUSE DE VENDRE",
 'title': "Beaucoup de choses.",
 'subtitle': "Les handpans qui arrivent désaccordés. Ceux dont les notes bavent les unes sur les autres dès qu'on enchaîne. Ceux vendus sans housse, sans mailloches et sans mention de la gamme. Chaque instrument est reçu, joué, contrôlé au diapason — puis renvoyé s'il ne tient pas. Ce que vous voyez ici est simplement ce qui est resté.",
}}

# --------------------------------------------------- 16 ENGAGEMENT (image+texte)
COPY['engagement'] = {'settings': {
 'eyebrow': "L'engagement Zensea",
 'title': "Accordé avant l'envoi, garanti après",
 'text': "<p>Un handpan, on l'achète une fois. Il reste posé dans le salon pendant des années, on le prend le soir sans y penser, on le tend à quelqu'un qui n'a jamais joué. Il n'a pas le droit de sonner faux.</p><p>Chaque instrument Zensea est joué note par note et contrôlé au <strong>diapason 440 Hz</strong> avant de quitter l'atelier. La gamme est écrite noir sur blanc sur la fiche — pas « gamme au choix du fabricant », pas de surprise à l'ouverture du carton.</p><p>Un souci après réception ? Vous écrivez, on répond en français, on remplace ou on rembourse. Pas d'expertise à vos frais, pas de formulaire à rallonge, pas de service client qui vous fatigue jusqu'à ce que vous abandonniez.</p>",
 'point_1': "Accordage vérifié", 'point_1_sub': "à l'oreille, en 440 Hz",
 'point_2': "Livraison offerte", 'point_2_sub': "dès 30 € d'achat",
 'point_3': "30 jours pour changer d'avis", 'point_3_sub': "retour simple, sans justification",
 'button_text': "LIRE NOTRE PROMESSE", 'button_link': "/pages/a-propos",
 'caption': "ACCORDAGE — 440 Hz",
}}

# ------------------------------------------------------------------ 17 FAQ
COPY['faq'] = {'settings': {
 'title': "Vos questions, nos réponses.",
 'subtitle': "Y compris celles que les autres boutiques évitent.",
 'button_text': "Voir toutes les questions",
 'button_link': "/pages/faq",
}, 'blocks': {
 'faq_item_home_1': {'question': "Il faut savoir jouer d'un instrument ?",
   'answer': "<p>Non, et ce n'est pas une formule commerciale. Sur un handpan, toutes les notes appartiennent à une seule et même gamme : elles s'accordent entre elles quel que soit l'ordre dans lequel vous les jouez. Il est littéralement impossible de faire une fausse note. La majorité de nos clients n'avaient jamais touché un instrument avant, et jouent quelque chose d'agréable dès le premier soir. Ce que vous apprendrez ensuite, c'est le rythme et les nuances — pas le solfège.</p>"},
 'faq_item_home_2': {'question': "9, 10 ou 12 notes : je prends lequel ?",
   'answer': "<p>Neuf notes pour débuter : c'est le format le plus lisible, on repère les notes du regard et on improvise sans réfléchir. Dix notes ajoutent une couleur supplémentaire sans compliquer la lecture. Douze notes offrent la richesse harmonique la plus large, mais demandent un peu plus de repères — c'est le format vers lequel on va après quelques mois. Dans le doute, prenez neuf : personne n'a jamais regretté d'avoir commencé simple.</p>"},
 'faq_item_home_3': {'question': "Qu'est-ce qu'il y a dans le carton ?",
   'answer': "<p>L'instrument, une housse de transport rembourrée, une paire de mailloches, une fiole d'huile d'entretien et un livret de partitions numérotées pour vos premiers morceaux. Rien à racheter le lendemain. Chaque handpan part accordé, joué et contrôlé au diapason 440 Hz — l'accordage standard international, ce qui vous permet de jouer avec n'importe quel autre instrument.</p>"},
 'faq_item_home_4': {'question': "Est-ce que ça se désaccorde avec le temps ?",
   'answer': "<p>Un handpan bien traité garde son accord des années. Trois règles suffisent : ne jamais le laisser en plein soleil ou dans une voiture l'été, ne jamais frapper avec la paume ou avec un objet dur, et passer un chiffon avec l'huile fournie une fois par mois pour éviter la corrosion. Ce qui désaccorde un handpan, ce n'est pas l'usage — c'est un choc ou une chaleur excessive.</p>"},
 'faq_item_home_5': {'question': "Quels sont les délais de livraison ?",
   'answer': "<p>Votre commande est préparée sous 24 à 48 heures ouvrées, puis expédiée avec suivi. Comptez ensuite 7 à 13 jours ouvrés, soit 8 à 15 jours ouvrés au total. La livraison est offerte dès 30 € d'achat, et vous recevez un numéro de suivi dès le départ du colis.</p>"},
 'faq_item_home_6': {'question': "Et si le son ne me plaît pas ?",
   'answer': "<p>Vous avez 30 jours à compter de la réception pour changer d'avis, sans avoir à vous justifier. Les frais de retour sont à votre charge et le remboursement intervient sous 7 à 14 jours. C'est aussi pour ça qu'on écrit la gamme exacte sur chaque fiche et qu'on vous répond avant l'achat : le meilleur retour est celui qui n'a pas lieu.</p>"},
}}

# -------------------------------------------------------------- 18 SUPPORT
COPY['support'] = {'settings': {
 'label_text': "AVANT • PENDANT • APRÈS",
 'title': "Quelqu'un qui joue, au bout du fil",
 'cta_title': "Une question avant de commander ?",
 'cta_desc': "Écrivez-nous : réponse en français, du lundi au vendredi de 9h à 18h, par quelqu'un qui a l'instrument entre les mains.",
 'whatsapp_btn_text': "Nous écrire par e-mail",
 'whatsapp_link': "mailto:contact.zensea@gmail.com",
}, 'blocks': {
 'step_card_iDjqW7': {'card_title': "Avant d'acheter",
   'card_text': "Dites-nous ce que vous écoutez, on vous dit quelle gamme et combien de notes vous conviennent."},
 'step_card_PRnhki': {'card_title': "Les premiers jours",
   'card_text': "Un doute sur la position des mains, sur une note qui sonne mat ? On vous répond avec des exemples."},
 'step_card_PTUN9c': {'card_title': "Après la livraison",
   'card_text': "Entretien, réaccordage, housse abîmée : on reste joignable longtemps après la commande."},
}}

# -------------------------------------------------------------- 19 LETTRE
COPY['lettre'] = {'settings': {
 'eyebrow': "La lettre Zensea",
 'title': "Deux e-mails par mois. Pas un de plus.",
 'placeholder': "Votre adresse e-mail",
 'button': "Je m'inscris",
 'legal': "Désinscription en un clic, à tout moment.",
 'success': "C'est noté. Votre première lettre arrive bientôt.",
}}

# ------------------------------------------------------- 14 SLIDER RÉASSURANCE
SLIDES = {
 "<p>Livraison offerte</p>": "<p>Livraison offerte</p>",
 "<p>Sans minimum d'achat. Les frais de port sont pour nous, même pour un seul article.</p>":
   "<p>Dès 30 € d'achat, partout en France. Colis suivi et calage renforcé pour l'instrument.</p>",
 "<p>Expédié en 24 à 48 h</p>": "<p>Expédié en 24 à 48 h</p>",
 "<p>Votre commande part sous 24 à 48 h ouvrées, avec un numéro de suivi dès le départ.</p>":
   "<p>Préparation sous 24 à 48 h ouvrées, puis 7 à 13 jours ouvrés jusqu'à chez vous.</p>",
 "<p>Paiement sécurisé</p>": "<p>Paiement sécurisé</p>",
 "<p>CB, Apple Pay, PayPal ou Klarna. Vos données sont chiffrées en SSL.</p>":
   "<p>CB, Apple Pay ou PayPal. Vos données sont chiffrées, rien n'est stocké chez nous.</p>",
 "<p>Garantie 24 mois</p>": "<p>Accordé avant l'envoi</p>",
 "<p>Vérifié avant l'envoi, couvert deux ans. Un souci ? On remplace ou on rembourse.</p>":
   "<p>Joué note par note et contrôlé au diapason 440 Hz. 30 jours pour changer d'avis.</p>",
}

def swap_slides(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and v in SLIDES:
                o[k] = SLIDES[v]
            else:
                swap_slides(v)
    elif isinstance(o, list):
        for v in o:
            swap_slides(v)

# ------------------------------------------------------------------ montage
applied = []
for sid, spec in COPY.items():
    sec = S[sid]
    for k, v in spec.get('settings', {}).items():
        sec.setdefault('settings', collections.OrderedDict())[k] = v
        applied.append('%s.settings.%s' % (sid, k))
    for bid, bs in spec.get('blocks', {}).items():
        blk = sec.get('blocks', {}).get(bid)
        if blk is None:
            raise SystemExit('bloc introuvable : %s / %s' % (sid, bid))
        for k, v in bs.items():
            blk.setdefault('settings', collections.OrderedDict())[k] = v
            applied.append('%s.%s.%s' % (sid, bid, k))

swap_slides(S['reassurance_slider'])

json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.load(open(P, encoding='utf-8'))
print('%d réglages réécrits sur %d sections' % (len(applied), len(COPY) + 1))
