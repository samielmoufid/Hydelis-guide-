// Les 7 pages du guide (1055 × 1491, pleine résolution conservée pour le zoom).
import p1 from './assets/pages/page-01.jpg'
import p2 from './assets/pages/page-02.jpg'
import p3 from './assets/pages/page-03.jpg'
import p4 from './assets/pages/page-04.jpg'
import p5 from './assets/pages/page-05.jpg'
import p6 from './assets/pages/page-06.jpg'
import p7 from './assets/pages/page-07.jpg'

export const PAGES = [p1, p2, p3, p4, p5, p6, p7]

export const PAGE_TITLES = [
  'Présentation',
  'Avant de commencer',
  'Étapes 1 à 3 — Préparation',
  'Étape 4 — Assemblage',
  'Étapes 5 et 6 — Fixation',
  'Étapes 7 à 9 — Finalisation',
  'Vérifications finales'
]

// Rapport largeur/hauteur d'une page.
export const PAGE_RATIO = 1055 / 1491

// Nombre de feuilles du livre : couverture + 4 feuilles intérieures + dos.
// Faces (recto/verso par feuille) :
//  F0 couverture | F1 garde avant | F2..F8 pages 1-7 | F9 page « Merci »
//  F10 garde arrière | F11 quatrième de couverture
export const SHEET_COUNT = 6

// Spread affiché pour une page donnée (1-indexée) → nombre de feuilles tournées.
export function spreadForPage(page) {
  return Math.ceil((page + 1) / 2)
}

// Libellé du compteur pour un état donné (0..6 feuilles tournées).
export function spreadLabel(turned) {
  switch (turned) {
    case 0: return 'Couverture'
    case 1: return 'Page 1 / 7'
    case 2: return 'Pages 2–3 / 7'
    case 3: return 'Pages 4–5 / 7'
    case 4: return 'Pages 6–7 / 7'
    case 5: return 'Merci !'
    default: return 'Fin'
  }
}

// Pages (1-indexées) visibles pour un état donné — pour le zoom et le sommaire.
export function pagesAtSpread(turned) {
  switch (turned) {
    case 1: return [1]
    case 2: return [2, 3]
    case 3: return [4, 5]
    case 4: return [6, 7]
    default: return []
  }
}
