# -*- coding: utf-8 -*-
"""Deploie la garantie 24 mois Zensea sur toute la boutique."""
import json, copy, os

INK, GREEN, MUTED = '#22332A', '#2E5E46', '#5A6B60'
log = []

def load(p): return json.load(open(p, encoding='utf-8'))
def save(p, d):
    out = json.dumps(d, ensure_ascii=False, indent=2)
    json.loads(out)                                  # validation obligatoire
    open(p, 'w', encoding='utf-8').write(out)

# ---------------------------------------------------------------- 1. BANDEAU
p = 'sections/header-group.json'
h = load(p)
ab = next(k for k in h['sections'] if 'announcement' in k)
S = h['sections'][ab]
if 'a4' not in S['blocks']:
    a4 = copy.deepcopy(S['blocks']['a3'])
    a4['blocks']['txt']['settings']['text'] = '<p>GARANTIE 24 MOIS INCLUSE</p>'
    S['blocks']['a4'] = a4
    S['block_order'].append('a4')
    save(p, h); log.append('bandeau d\'annonce : 4e message « GARANTIE 24 MOIS INCLUSE »')

# ---------------------------------------------------------------- 2. ACCUEIL
p = 'templates/index.json'
d = load(p); S = d['sections']

# 2a. manifeste : 4e fait
m = S['manifeste']
if 'fact_4' not in m['blocks']:
    m['blocks']['fact_4'] = {'type': 'fact',
        'settings': {'label': 'GARANTIE', 'value': '24 mois incluse'}}
    m['block_order'].append('fact_4')
    log.append('accueil / manifeste : 4e fait « GARANTIE — 24 mois incluse »')

# 2b. engagement : 4e point + paragraphe
e = S['engagement']['settings']
e['point_4'] = 'Garantie 24 mois'
e['point_4_sub'] = 'incluse, sans surcoût'
e['title'] = 'Accordé avant l\'envoi, garanti 24 mois'
if 'garantie de 24 mois' not in e['text']:
    e['text'] = e['text'].replace(
        '<p>Un souci après réception ?',
        '<p>Chaque instrument est couvert par une <strong>garantie de 24 mois</strong>, '
        'incluse d\'office, sans option à cocher ni extension à payer. Elle couvre '
        'l\'instrument lui-même : un défaut de fabrication, une soudure qui lâche, '
        'une note qui décroche sans qu\'on y soit pour rien.</p>'
        '<p>Un souci après réception ?')
log.append('accueil / engagement : titre + 4e point + paragraphe garantie')

# 2c. bandeau de reassurance : 5e diapositive
rs = S['reassurance_slider']['blocks']['slider_XywcYe']
if 'slide_GAR24' not in rs['blocks']:
    src = copy.deepcopy(rs['blocks']['slide_FVXyh8'])
    ren = {bk: '%s_g24%d' % (bk.split('_')[0], i) for i, bk in enumerate(src['block_order'])}
    src['blocks'] = {ren[k]: v for k, v in src['blocks'].items()}
    src['block_order'] = [ren[k] for k in src['block_order']]
    b, order = src['blocks'], src['block_order']
    texts = [k for k in order if k.startswith('text')]
    for k in order:
        if k.startswith('icon'): b[k]['settings']['icon'] = 'verified_user'
    b[texts[0]]['settings']['text'] = '<p>Garantie 24 mois</p>'
    b[texts[1]]['settings']['text'] = (
        '<p>Incluse sur tout le catalogue. Défaut de fabrication constaté : '
        'on remplace ou on rembourse.</p>')
    rs['blocks']['slide_GAR24'] = src
    rs['block_order'].append('slide_GAR24')
    log.append('accueil / bandeau réassurance : 5e diapositive « Garantie 24 mois »')

# 2d. FAQ accueil : question dediee
f = S['faq']
if 'faq_item_home_7' not in f['blocks']:
    f['blocks']['faq_item_home_7'] = {'type': 'faq_item', 'settings': {
        'question': 'L\'instrument est garanti combien de temps ?',
        'answer': '<p><strong>24 mois</strong>, sur tout le catalogue, incluse dans le prix. '
                  'Aucune extension à acheter, aucune case à cocher au moment de payer.</p>'
                  '<p>Elle couvre les défauts de fabrication : une soudure qui cède, une note '
                  'qui décroche alors que l\'instrument a été traité normalement, un accessoire '
                  'défectueux à la réception. Vous écrivez, on répond en français, on remplace '
                  'ou on rembourse — sans expertise à vos frais.</p>'
                  '<p>À ne pas confondre avec les 30 jours pour changer d\'avis : ça, c\'est le '
                  'droit de nous renvoyer l\'instrument parce que le son ne vous parle pas. '
                  'Les deux se cumulent.</p>'}}
    f['block_order'].append('faq_item_home_7')
    log.append('accueil / FAQ : 7e question « L\'instrument est garanti combien de temps ? »')

# 2e. choisir_zensea : mention dans le 3e bloc
c = S['choisir_zensea']['blocks']['bloc_6b6VjG']['settings']
if '24 mois' not in c['text']:
    c['text'] = c['text'].rstrip() + ' Et au-delà de ces 30 jours, la garantie 24 mois prend le relais sur tout défaut de fabrication.'
    log.append('accueil / méthode Zensea : mention garantie dans le 3e bloc')
save(p, d)

# ---------------------------------------------------------------- 3. F.A.Q.
p = 'templates/page.faq.json'
d = load(p); r = d['sections']['faq_retours']
if 'faq_retours_q8' not in r['blocks']:
    r['blocks']['faq_retours_q8'] = {'type': 'faq_item', 'settings': {
        'question': 'Que couvre exactement la garantie 24 mois ?',
        'answer': '<p>Elle couvre l\'instrument contre les <strong>défauts de fabrication</strong> '
                  'pendant 24 mois à compter de la réception : soudure, assemblage, accordage qui '
                  'décroche sans cause extérieure, accessoire livré défectueux.</p>'
                  '<p>Elle ne couvre pas ce qui relève de l\'usage : un choc, une chute, un instrument '
                  'laissé dehors sous la pluie ou dans une voiture en plein soleil, un accordage '
                  'tenté soi-même avec un marteau. Rien de piégeux là-dedans — ce sont les mêmes '
                  'règles que pour n\'importe quel instrument en acier.</p>'
                  '<p>Mise en oeuvre : un e-mail à contact.zensea@gmail.com avec deux photos et, si '
                  'possible, un court enregistrement. On répond sous 24 h ouvrées et on remplace ou '
                  'on rembourse. Pas d\'expertise à vos frais, pas de formulaire à rallonge.</p>'}}
    r['block_order'].append('faq_retours_q8')
    log.append('page F.A.Q. / Retours : question « Que couvre exactement la garantie 24 mois ? »')
save(p, d)

# ---------------------------------------------------------------- 4. PROMESSE
p = 'templates/page.notre-promesse.json'
d = load(p); g = d['sections']['cc_grid']['settings']
cl = g.get('custom_liquid', '')
if '24 mois' not in cl and '<div class="vllc-pr-card"><span>0' in cl:
    n = cl.count('vllc-pr-card')
    card = ('<div class="vllc-pr-card"><span>%02d</span><strong>La garantie 24 mois</strong>'
            '<em>Incluse d\'office sur tout le catalogue. Un défaut de fabrication, on remplace '
            'ou on rembourse.</em></div>' % (n + 1))
    i = cl.rfind('</div>\n  </div>')
    if i == -1: i = cl.rfind('</div>')
    cl = cl[:i] + '\n    ' + card + '\n  ' + cl[i:]
    g['custom_liquid'] = cl
    log.append('page Notre promesse : %de carte « La garantie 24 mois »' % (n + 1))
save(p, d)

# ---------------------------------------------------------------- 5. COLLECTIONS
for f in sorted(os.listdir('templates')):
    if not f.startswith('collection.'): continue
    p = os.path.join('templates', f); d = load(p); touched = False
    for k, s in d.get('sections', {}).items():
        st = s.get('settings') or {}
        if s.get('type') == 'support-mini' and isinstance(st.get('description'), str) \
           and '24 mois' not in st['description']:
            st['description'] = st['description'].rstrip() + \
                ' Livraison offerte dès 30 €, 30 jours pour changer d\'avis et garantie 24 mois sur tout le catalogue.'
            touched = True
    if touched:
        save(p, d); log.append('%s : mention garantie dans le bloc d\'aide' % f)

print('\n'.join('  - ' + l for l in log))
print('\n%d emplacements' % len(log))
