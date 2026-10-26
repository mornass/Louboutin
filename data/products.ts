// Données des 5 paires présentées.
// Règle : aucune donnée inventée. Un champ introuvable reste vide ("").
// `toConfirm` signale qu'on n'est pas certain de la correspondance entre
// le fichier 3D et une fiche produit officielle.

export type Ambiance = {
  /** Couleur de fond principale de la page pour ce slide */
  base: string;
  /** Couleur du halo radial derrière le talon */
  glow: string;
  /** Couleur du texte principal sur ce fond */
  ink: string;
  /** Couleur d'accent (lignes, numéros) */
  accent: string;
};

export type Product = {
  id: string;
  /** Nom affiché. Générique si le modèle n'est pas confirmé. */
  name: string;
  /** Mot géant affiché en arrière-plan du hero */
  heroWord: string;
  /** Sous-titre court affiché dans le hero */
  tagline: string;
  color: string;
  material: string;
  /** Hauteur de talon, ex. "100 mm". Vide si non confirmée. */
  heelHeight: string;
  /** Description issue (ou paraphrasée) du site officiel. Vide si introuvable. */
  description: string;
  /** URL de la fiche produit officielle. Vide si introuvable. */
  url: string;
  /** Page officielle de repli (collection) quand la fiche exacte manque */
  fallbackUrl: string;
  /** null = correspondance confirmée ; sinon explication + piste */
  toConfirm: null | {
    note: string;
    candidateName?: string;
    candidateUrl?: string;
  };
  model: string;
  image: string;
  ambiance: Ambiance;
};

const KATE_COLLECTION = "https://eu.christianlouboutin.com/fr_fr/kate";
const PUMPS_COLLECTION =
  "https://eu.christianlouboutin.com/fr_fr/mesdames/souliers/escarpins/";

export const products: Product[] = [
  {
    id: "kate-noir",
    name: "Kate",
    heroWord: "Kate",
    tagline: "Escarpins 100 mm · Vernis noir",
    color: "Noir",
    material: "Cuir de veau verni",
    heelHeight: "100 mm",
    description:
      "Silhouette fine et pointue, l'escarpin Kate est réalisé en cuir de veau verni noir. Son talon aiguille de 100 mm laisse apparaître la semelle rouge Loubi iconique.",
    url: "https://eu.christianlouboutin.com/fr_fr/kate-black-3191411bk01.html",
    fallbackUrl: KATE_COLLECTION,
    toConfirm: null,
    model: "/models/kate-noir.glb",
    image: "/images/kate-noir.webp",
    ambiance: {
      base: "#07070a",
      glow: "#2a2a33",
      ink: "#f4efe6",
      accent: "#c8102e",
    },
  },
  {
    id: "kate-bordeaux",
    name: "Kate",
    heroWord: "Kate",
    tagline: "Escarpins · Vernis bordeaux",
    color: "Bordeaux",
    material: "Cuir de veau verni",
    heelHeight: "",
    description: "",
    url: "",
    fallbackUrl: KATE_COLLECTION,
    toConfirm: {
      note: "Coloris bordeaux introuvable dans les fiches officielles indexées : référence, hauteur de talon et URL à confirmer.",
    },
    model: "/models/kate-bordeaux.glb",
    image: "/images/kate-bordeaux.webp",
    ambiance: {
      base: "#1d0508",
      glow: "#5e0f1b",
      ink: "#f6e9e4",
      accent: "#e04a5f",
    },
  },
  {
    id: "kate-zebre",
    name: "Kate",
    heroWord: "Kate",
    tagline: "Escarpins · Imprimé zèbre",
    color: "Zèbre noir et blanc",
    material: "",
    heelHeight: "",
    description: "",
    url: "",
    fallbackUrl: KATE_COLLECTION,
    toConfirm: {
      note: "Aucune fiche officielle trouvée. Un revendeur (Mytheresa) propose une « Kate 100 » en poil de veau imprimé zèbre, issue d'une capsule exclusive FW23 : à vérifier.",
      candidateName: "Kate 100 imprimé zèbre (Mytheresa)",
      candidateUrl:
        "https://www.mytheresa.com/gb/en/women/christian-louboutin-kate-100-zebra-print-calf-hair-pumps-multicoloured-p00813260",
    },
    model: "/models/kate-zebre.glb",
    image: "/images/kate-zebre.webp",
    ambiance: {
      base: "#e9e1d3",
      glow: "#fbf7ef",
      ink: "#111111",
      accent: "#c8102e",
    },
  },
  {
    id: "noir-tissu",
    name: "Escarpin noir dentelle",
    heroWord: "Dentelle",
    tagline: "Escarpins · Dentelle et résille noires",
    color: "Noir",
    material: "",
    heelHeight: "",
    description: "",
    url: "",
    fallbackUrl: PUMPS_COLLECTION,
    toConfirm: {
      note: "Piste la plus proche : Miss Z Mesh, escarpins 100 mm en dentelle, résille et cuir de veau, noir (réf. 3260239B439).",
      candidateName: "Miss Z Mesh 100 mm",
      candidateUrl:
        "https://us.christianlouboutin.com/us_en/miss-z-mesh-black-lin-black-3260239b439.html",
    },
    model: "/models/noir-tissu.glb",
    image: "/images/noir-tissu.webp",
    ambiance: {
      base: "#16171a",
      glow: "#3b3d44",
      ink: "#ecebe8",
      accent: "#c8102e",
    },
  },
  {
    id: "argente",
    name: "Escarpin argenté",
    heroWord: "Argent",
    tagline: "Escarpins · Argent scintillant",
    color: "Argent",
    material: "",
    heelHeight: "",
    description: "",
    url: "",
    fallbackUrl: PUMPS_COLLECTION,
    toConfirm: {
      note: "Piste la plus proche : Kate Strass, escarpins 100 mm en suède métallisé orné de strass, coloris Version AB (réf. 1200479W081).",
      candidateName: "Kate Strass 100 mm · Version AB",
      candidateUrl:
        "https://us.christianlouboutin.com/us_en/kate-strass-version-ab-1200479w081.html",
    },
    model: "/models/argente.glb",
    image: "/images/argente.webp",
    ambiance: {
      base: "#8d939b",
      glow: "#e4e8ee",
      ink: "#0c0d10",
      accent: "#9e0b23",
    },
  },
];

export const BRAND_URL = "https://eu.christianlouboutin.com/fr_fr/";
