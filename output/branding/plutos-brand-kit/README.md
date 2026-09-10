# Plutos A + 2 — kit de marque

Identité retenue : symbole carré 达, coin abricot, lettrage géométrique rond « plutos ».

## Formats inclus

- **SVG vectoriels** : logo couleur, logo pour fond sombre (mot blanc), logo monochrome et symbole seul. Redimensionnables sans limite de résolution. Le lettrage et le caractère chinois sont convertis en tracés : aucune police à installer.
- **25 tailles carrées PNG** : 16, 20, 24, 28, 32, 36, 40, 48, 64, 72, 96, 120, 128, 144, 152, 167, 180, 192, 196, 256, 384, 512, 768, 1024 et 2048 px.
- **13 dimensions du logo horizontal**, chacune en couleur, mot blanc et monochrome : 128×32, 160×40, 192×48, 256×64, 320×80, 480×120, 640×160, 960×240, 1280×320, 1920×480, 2560×640, 3840×960 et 4096×1024 px.
- **Favicon ICO** : sept résolutions incorporées — 16, 24, 32, 48, 64, 128 et 256 px.
- **Apple** : icône opaque 180×180 px.
- **Android** : icône maskable 512×512 px avec contenu dans la zone de sécurité centrale.

## Couleurs

Émeraude **#008767** · Abricot **#FFBA73** · Mot sombre **#123A32** · Blanc **#FFFFFF**.

Les PNG usuels ont un véritable canal alpha. Les variantes Apple et maskable ont volontairement un fond émeraude opaque. Utiliser le symbole seul pour les dimensions carrées ; le mot reste présent sur les logos horizontaux.

## Intégration dans Plutos

- Connexion, navigation étendue et navigation réduite.
- Métadonnées du navigateur : favicon ICO, PNG, SVG et Apple Touch.
- Manifeste de l'application avec icônes 192, 512 et maskable.
- Facture du point de vente et impression de la facture.
- Bons de commande A4 couleur et tickets thermiques monochromes.

Les SVG de production se trouvent dans `public/brand/`. Les composants consomment ces fichiers pour rester nets sur écran et papier.

## Régénérer les tailles

À la racine du projet :

```sh
npm run brand:export
```

Le script `scripts/export-brand-assets.mjs` utilise Sharp et les SVG de production comme sources. Il régénère les PNG, les icônes mobiles et `app/favicon.ico`. Le fichier `inventory.json` répertorie les exports et dimensions.

## Source

Les tracés suivent la proposition **A + 2** approuvée, issue des explorations imagegen intégrées. Les couleurs ont été normalisées aux valeurs ci-dessus. Les lettres sont dessinées dans les SVG ; aucun fichier de police commerciale n'est distribué. Voir `source-prompts.md` pour les prompts de la proposition retenue.

