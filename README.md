# Louboutin · La collection en 3D

Landing page de démonstration : une sélection d'escarpins Christian Louboutin
à explorer en 3D interactive (préchargement avec compteur, carrousel plein
écran dont l'ambiance change à chaque modèle, galerie, savoir-faire, contact).

> Site de démonstration. Christian Louboutin est une marque appartenant à ses
> propriétaires. Ce site n'est pas affilié à la marque.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # version de production
```

Stack : Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4,
Motion (`motion/react`), Three.js via `@react-three/fiber` et
`@react-three/drei`, `lottie-react`, `lucide-react`.

## Organisation

```
app/                 layout (polices, script de session) et page
components/
  Preloader.tsx      écran de chargement : Lottie + compteur lié au vrai chargement
  Navbar.tsx         navigation fixe floutée + menu burger mobile
  ShoeCarousel.tsx   hero : fond d'ambiance, titres, flèches, points, swipe, clavier
  ShoeViewer.tsx     Canvas R3F (chargé sans SSR) : modèles, lumière, contrôles
  ProductDrawer.tsx  panneau de détails (latéral desktop, bottom sheet mobile)
  Gallery.tsx        grille des 5 modèles
  Features.tsx       cartes savoir-faire
  Footer.tsx         contact, liens, mention légale
data/products.ts     toutes les données produits (voir « Données » ci-dessous)
lib/                 hooks (WebGL, media queries) + animation Lottie du préchargement
models-source/       modèles .glb d'origine (non servis)
public/models/       modèles .glb compressés, servis au navigateur
public/images/       rendus statiques (miniatures + fallback sans WebGL)
scripts/             script de compression des modèles
```

## Ajouter ou remplacer un modèle 3D

1. **Déposer le fichier source** dans `models-source/`, avec un nom court en
   kebab-case, par exemple `models-source/so-kate-rouge.glb`.

2. **Compresser** : géométrie Meshopt et textures WebP 1024 px, sans
   simplifier le maillage.

   ```bash
   ./scripts/compress-models.sh
   # textures plus fines (plus lourd) :
   TEXTURE_SIZE=2048 ./scripts/compress-models.sh
   ```

   Le script traite tous les fichiers de `models-source/` et écrit le
   résultat dans `public/models/` sous le même nom. Visez **moins de 3 Mo**
   par modèle : les 5 modèles actuels pèsent entre 0,9 et 1,4 Mo (contre 6 à
   16 Mo à l'origine).

   Pour un seul fichier, la commande équivalente est :

   ```bash
   npx gltf-transform optimize models-source/so-kate-rouge.glb public/models/so-kate-rouge.glb \
     --compress meshopt --texture-compress webp --texture-size 1024 \
     --simplify false --instance false --flatten false
   ```

   Meshopt est décodé directement par `useGLTF` (drei), sans fichier
   externe. Évitez Draco, qui télécharge son décodeur depuis un CDN.

3. **Créer la miniature** `public/images/so-kate-rouge.webp` : un rendu du
   modèle sur fond transparent (environ 900 × 900 px). Elle sert dans la
   galerie et remplace la 3D quand WebGL est indisponible.

4. **Déclarer le produit** dans `data/products.ts` : `model`
   (`/models/so-kate-rouge.glb`), `image`, couleurs d'`ambiance`, et les
   informations produit.

Le cadrage est automatique : chaque modèle est centré, mis à l'échelle
(plus grande dimension = 2,2 unités) et posé sur le sol, donc toutes les
paires partagent le même cadrage caméra. Seul le premier modèle est
préchargé ; les autres sont chargés en tâche de fond une fois le premier
affiché.

## Données produits

`data/products.ts` ne contient **aucune donnée inventée** :

- un champ introuvable reste vide et s'affiche « Non communiqué » ;
- aucun prix n'est affiché ;
- `toConfirm` signale une correspondance incertaine entre le fichier 3D et
  une fiche officielle. Le panneau de détails affiche alors « Modèle à
  confirmer », la piste trouvée et un lien vers la collection officielle.

Pour confirmer un modèle : renseignez `name`, `material`, `heelHeight`,
`description`, `url`, puis passez `toConfirm` à `null`.

## Accessibilité et performance

- Canvas chargé en `dynamic(..., { ssr: false })`, `dpr` limité à `[1, 2]`
  et ajusté par `PerformanceMonitor`, rendu arrêté quand le hero est hors
  écran ou que le panneau est ouvert.
- Bundle initial ~173 Ko : three.js, drei et Lottie sont chargés à part.
- `prefers-reduced-motion` : pas de rotation automatique, transitions
  instantanées, Lottie non bouclée.
- Mobile : le canvas laisse passer le défilement vertical (`touch-action:
  pan-y`), la rotation se fait au glisser horizontal, le zoom au pincement.
  Sur desktop, la molette fait défiler la page ; zoom avec Ctrl/⌘ + molette.
- Cibles tactiles de 44 px minimum, `aria-label` sur les boutons, focus
  visible, panneau fermable avec Échap ou clic à l'extérieur.
- Préchargement affiché une seule fois par session (`sessionStorage`, dans un
  `try/catch`), durée minimale 1,5 s, scroll bloqué pendant l'affichage.
