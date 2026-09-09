// Les deux guides Hydelis : configuration des livres (pages 1055 × 1491,
// pleine résolution conservée pour le zoom).

import c1 from './assets/pages/classique/page-01.jpg'
import c2 from './assets/pages/classique/page-02.jpg'
import c3 from './assets/pages/classique/page-03.jpg'
import c4 from './assets/pages/classique/page-04.jpg'
import c5 from './assets/pages/classique/page-05.jpg'
import c6 from './assets/pages/classique/page-06.jpg'
import c7 from './assets/pages/classique/page-07.jpg'
import t1 from './assets/pages/thermostatique/page-01.jpg'
import t2 from './assets/pages/thermostatique/page-02.jpg'
import t3 from './assets/pages/thermostatique/page-03.jpg'
import t4 from './assets/pages/thermostatique/page-04.jpg'
import t5 from './assets/pages/thermostatique/page-05.jpg'
import t6 from './assets/pages/thermostatique/page-06.jpg'
import t7 from './assets/pages/thermostatique/page-07.jpg'
import t8 from './assets/pages/thermostatique/page-08.jpg'

export const PAGE_RATIO = 1055 / 1491

export const BOOKS = {
  classique: {
    id: 'classique',
    label: 'Colonne classique',
    tag: 'Mitigeur à levier',
    coverTitle: 'Colonne de douche',
    coverSub: 'avec étagère intégrée et jet d’hygiène',
    picto: 'drop',
    pages: [c1, c2, c3, c4, c5, c6, c7],
    titles: [
      'Présentation',
      'Avant de commencer',
      'Étapes 1 à 3 — Préparation',
      'Étape 4 — Assemblage',
      'Étapes 5 et 6 — Fixation',
      'Étapes 7 à 9 — Finalisation',
      'Vérifications finales'
    ]
  },
  thermostatique: {
    id: 'thermostatique',
    label: 'Colonne thermostatique',
    tag: 'Bloc à boutons · sécurité 38 °C',
    coverTitle: 'Colonne thermostatique',
    coverSub: 'bloc à boutons et sécurité 38 °C',
    picto: 'thermo',
    pages: [t1, t2, t3, t4, t5, t6, t7, t8],
    titles: [
      'Présentation',
      'Avant de commencer',
      'Étapes 1 à 3 — Préparation',
      'Étape 4 — Assemblage',
      'Étapes 5 et 6 — Fixation',
      'Étapes 7 à 9 — Finalisation',
      'Utilisation du thermostat',
      'Vérifications finales'
    ]
  }
}

// Nombre de feuilles pour n pages : couverture + garde, pages, « Merci »,
// (garde arrière si n impair), quatrième de couverture.
export function sheetsFor(n) {
  return (4 + n + (n % 2)) / 2
}

// Spread affiché pour une page donnée (1-indexée) → nombre de feuilles tournées.
export function spreadForPage(page) {
  return Math.ceil((page + 1) / 2)
}

// Pages (1-indexées) visibles pour un état donné.
export function pagesAtSpread(T, n) {
  const out = []
  for (const f of [2 * T - 1, 2 * T]) {
    if (f >= 2 && f <= n + 1) out.push(f - 1)
  }
  return out
}

// Libellé du compteur.
export function spreadLabel(T, n) {
  const S = sheetsFor(n)
  if (T <= 0) return 'Couverture'
  if (T >= S) return 'Fin'
  const v = pagesAtSpread(T, n)
  if (!v.length) return 'Merci !'
  return v.length === 1 ? `Page ${v[0]} / ${n}` : `Pages ${v[0]}–${v[1]} / ${n}`
}

// Ordre des faces d'un livre : recto/verso de chaque feuille.
// gen = { cover, innerCover, thanks, innerBack, backCover }, pages = n faces.
export function buildFaceList(gen, pages) {
  const n = pages.length
  const faces = [gen.cover, gen.innerCover, ...pages, gen.thanks]
  if (n % 2 === 1) faces.push(gen.innerBack)
  faces.push(gen.backCover)
  return faces
}
