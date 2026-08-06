# Guide de pose Hydelis — Colonne de douche

Livre 3D interactif présentant le guide d'installation de la colonne de douche
Hydelis : un vrai livre WebGL (Three.js) posé dans un décor sombre, pages qui
plient, tranche visible, zoom pleine résolution, son de papier, sommaire à
miniatures et bouton SAV WhatsApp.

## Développement

```bash
npm install
npm run dev        # serveur local (http://localhost:5173)
npm run build      # build de production dans dist/
npm run preview    # sert le build de production
```

Options utiles :

- `?no3d` dans l'URL force le flipbook CSS (fallback sans WebGL).
- `npm run build:single` produit `dist-single/index.html`, un fichier unique
  avec tout inliné (images, polices, JS) — pratique à envoyer tel quel.

## Scripts

- `node scripts/og.mjs` — régénère `public/og-cover.jpg` (aperçu de lien
  WhatsApp / réseaux sociaux, 1200 × 630).
- `node scripts/shots.mjs` — captures d'écran automatiques (desktop, mobile
  portrait/paysage, fallback) pour vérification visuelle.

## Contenu

Les 7 pages du guide sont dans `src/assets/pages/` (1055 × 1491, pleine
résolution conservée pour le zoom). La couverture, les pages de garde, la page
« Merci » et la quatrième de couverture sont générées à la volée sur canvas
(`src/gen-textures.js`) avec la charte Hydelis :

- Teal `#1795A5` / `#0F6673`, encre `#11333B`
- Cormorant Garamond (titres) + Poppins (interface)

## Déploiement

Chaque push sur `main` (ou la branche de travail) déclenche le workflow
`.github/workflows/deploy.yml`, qui build le site et le publie sur GitHub
Pages. Pour brancher un sous-domaine (`guide.hydelis.fr`), voir la
documentation GitHub Pages : ajouter un enregistrement DNS `CNAME` vers
`samielmoufid.github.io`, déclarer le domaine dans Settings → Pages, et le
fichier `public/CNAME` sera à créer avec `guide.hydelis.fr`.
