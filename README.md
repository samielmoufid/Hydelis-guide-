# Guides de pose Hydelis

Livres 3D interactifs des guides d'installation Hydelis : colonne de douche
classique (7 pages) et colonne thermostatique (8 pages). Vrai livre WebGL
(Three.js) dans un décor sombre, pages qui plient, tranche visible, zoom
pleine résolution, son de papier, sommaire à miniatures, bouton SAV WhatsApp.

La racine du site est un sélecteur de modèle (deux livres fermés côte à
côte) avec une transition « voyage temporel » vers le livre choisi.
Liens directs (un QR par gamme) :

- `/#classique` — colonne classique
- `/#thermostatique` — colonne thermostatique

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

Les pages des guides sont dans `src/assets/pages/classique/` (7) et
`src/assets/pages/thermostatique/` (8) — 1055 × 1491, pleine résolution
conservée pour le zoom. La configuration des deux livres vit dans
`src/books.js`. La couverture, les pages de garde, la page
« Merci » et la quatrième de couverture sont générées à la volée sur canvas
(`src/gen-textures.js`) avec la charte Hydelis :

- Teal `#1795A5` / `#0F6673`, encre `#11333B`
- Cormorant Garamond (titres) + Poppins (interface)

## Déploiement

Chaque push sur `main` (ou la branche de travail) déclenche
`.github/workflows/deploy.yml` : build Vite, puis commit du résultat sur la
branche `gh-pages` (en préservant son dossier `.github/`). Le workflow
`self-deploy.yml` présent sur `gh-pages` publie alors le contenu via l'API
Pages — une copie de référence est gardée dans
`.github/pages-self-deploy.yml.reference` au cas où la branche `gh-pages`
devrait être recréée.

Le site est servi sur **https://guide.hydelis.fr** (CNAME DNS géré dans
Shopify → Paramètres → Domaines → hydelis.fr ; le fichier `public/CNAME`
maintient le domaine à chaque déploiement). L'ancienne adresse
`samielmoufid.github.io/Hydelis-guide-/` redirige automatiquement. Pour brancher un sous-domaine (`guide.hydelis.fr`), voir la
documentation GitHub Pages : ajouter un enregistrement DNS `CNAME` vers
`samielmoufid.github.io`, déclarer le domaine dans Settings → Pages, et le
fichier `public/CNAME` sera à créer avec `guide.hydelis.fr`.
