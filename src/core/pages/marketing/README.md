# Kiam Official Site — Marketing Web Platform

## 📋 Vue d'ensemble

Le site officiel de **Kiam** est un véritable site marketing complet avec :
- **Navigation complète et fonctionnelle** (aucun lien mort)
- **6 solutions présentées avec routes dynamiques** (`/solutions/:slug`)
- **Pages statiques** (À propos, Contact, FAQ, Blog, Carrières, Tarifs, Démo)
- **Design premium cohérent** respectant l'identité visuelle Kiam
- **Responsive design** (Desktop, Tablette, Mobile)
- **Animations fluides** (transitions 350-500ms)
- **Footer et Header intelligents** avec mégamenu

---

## 🎨 Design & Identité Visuelle

### Palette de couleurs

| Élément | Couleur | Usage |
|---------|---------|-------|
| Fond principal | `#EEEDE7` | Pages de contenu |
| Fond secondaire | `#E4E2DA` | Zones neutres |
| Texte principal | `#15181C` | Titres et contenus |
| Texte secondaire | `#4B5157` | Descriptions |
| Bordures | `#D6D3C9` | Délimiteurs visuels |
| Fond sombre | `#15181C` | Sections night-mode |

### Couleurs par solution

| Solution | Accent | Usage |
|----------|--------|-------|
| Kiam Health | `#0EA5E9` (Sky) | Badges, highlights |
| Kiam ERP | `#8B5CF6` (Violet) | Badges, highlights |
| Kiam School | `#F59E0B` (Amber) | Badges, highlights |
| Kiam Hotel | `#EC4899` (Pink) | Badges, highlights |
| Kiam Pharmacy | `#10B981` (Green) | Badges, highlights |
| Kiam Enterprise | `#EF4444` (Red) | Badges, highlights |

### Typographies

```
Titres (h1, h2, h3)       → Fraunces, 500-800, très grandes tailles
Sous-titres (h4, h5)      → IBM Plex Sans SemiBold
Paragraphes (body)         → IBM Plex Sans Regular
Badges & labels (uppercase)→ IBM Plex Mono
Monospace (code)           → IBM Plex Mono
```

Les polices sont importées via **Google Fonts** dans `index.css`.

---

## 🗂️ Structure du code

```
src/core/pages/marketing/
├── MarketingSite.tsx
│   ├── HomePage()
│   ├── SolutionsPage()
│   ├── SolutionPage() [dynamique, route: /solutions/:slug]
│   ├── PricingPage()
│   ├── DemoPage()
│   ├── AboutPage()
│   ├── ContactPage()
│   ├── FaqPage()
│   ├── BlogPage()
│   ├── CareersPage()
│   ├── PrivacyPage()
│   ├── TermsPage()
│   ├── DocsPage()
│   └── Composants réutilisables:
│       ├── MarketingLayout() [header + footer]
│       ├── PageShell() [structure de page standard]
│       └── SectionTitle() [titres d'sections]
```

---

## 🛣️ Routes publiques

Toutes ces routes sont maintenant **actives et fonctionnelles** :

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Accueil avec démo interactive |
| `/solutions` | SolutionsPage | Galerie de 6 solutions |
| `/solutions/health` | SolutionPage | Kiam Health |
| `/solutions/erp` | SolutionPage | Kiam ERP |
| `/solutions/school` | SolutionPage | Kiam School |
| `/solutions/hotel` | SolutionPage | Kiam Hotel |
| `/solutions/pharmacy` | SolutionPage | Kiam Pharmacy |
| `/solutions/enterprise` | SolutionPage | Kiam Enterprise |
| `/pricing` | PricingPage | Trois plans tarifaires |
| `/demo` | DemoPage | Formulaire de demande |
| `/about` | AboutPage | Présentation Kiam |
| `/contact` | ContactPage | Coordonnées + formulaire |
| `/faq` | FaqPage | Questions fréquentes |
| `/blog` | BlogPage | Articles (avec recherche) |
| `/careers` | CareersPage | Recrutement |
| `/privacy` | PrivacyPage | Politique confidentialité |
| `/terms` | TermsPage | Conditions utilisation |
| `/docs` | DocsPage | Documentation |
| `/login` | Login | Authentification |
| `/signup` | Register | Création de compte |

---

## 🔑 Fonctionnalités principales

### 1. **Home Page — Démo interactive 6 secondes**

- Sélecteur visuel de solutions
- Rotation automatique toutes les 6 secondes
- Affichage dynamique:
  - Nom et couleur de la solution
  - 3 KPIs adaptés au secteur
  - Modules clés
  - Témoignage client
- Animation fluide (400ms entre solutions)
- Boutons CTA toujours visibles

### 2. **Solutions — Présentation unifiée**

- Grille 2×3 (resp: 1×6 sur mobile)
- Cartes cliquables vers pages détail
- Badges de secteur avec couleur spécifique
- Descriptions courtes et claires

### 3. **Solution Page — Fiche produit complète**

- Présentation longue du produit
- 3 KPIs spécifiques au secteur
- Modules (liste cliquable)
- FAQ rapide (3-4 questions)
- Captures & vidéos (4 zones)
- Boutons "Demander une démo" et "Voir les tarifs"

### 4. **Pricing — Trois niveaux**

- Plans : **Essentiel** (150k), **Croissance** (450k), **Entreprise** (devis)
- Tableau comparatif des fonctionnalités
- Descriptions claires et CTA contextuels
- Devise : **FCFA**

### 5. **Demo — Formulaire intelligent**

- Sélection du logiciel (dropdown)
- Nombre d'utilisateurs
- Entreprise
- Téléphone
- Email
- Confirmation après soumission

### 6. **Navigation responsive**

#### Desktop

- Menu horizontal complet
- **Mega Menu** pour Solutions (2×3 grille)
- Boutons Connexion + Essai gratuit

#### Mobile

- Hamburger menu
- Collapse/expand menu
- Tous les liens accessibles
- Hauteur optimisée

### 7. **Footer professionnel**

- 4 colonnes: Marque, Produits, Entreprise, Support
- Liens sociaux (LinkedIn, Twitter, Instagram, Facebook)
- Mentions légales © 2026 Kiam
- Design sombre (`#15181C`)
- Consistent avec l'identité visuelle

---

## 🎯 Points clés d'implémentation

### ✅ Tous les boutons fonctionnent

| Bouton | Action | Route |
|--------|--------|-------|
| Découvrir les solutions | Navigate | `/solutions` |
| Essayer gratuitement | Navigate | `/signup` |
| Voir les tarifs | Navigate | `/pricing` |
| Demander une démo | Navigate | `/demo` |
| Connexion | Navigate | `/login` |
| Articles (blog) | Navigate | `/blog` |
| Tout contact | Navigate | `/contact` |

### ✅ Aucun lien mort

- Tous les `href` pointent vers des routes actives
- Les images/vidéos sont des placeholders visuels
- Les formulaires affichent une confirmation

### ✅ Design premium maintenu

- Typographies exactes (Fraunces, IBM Plex)
- Espaces généreux (padding/margins Tailwind)
- Couleurs douces et coordonnées
- Animations discrètes (transitions 350-500ms)
- Cartes modernes avec bordures subtiles
- Ombres progressives (hover)

### ✅ Responsive complété

- Grilles fluides (2 cols → 1 col mobile)
- Textes redimensionnés (text-sm → text-lg)
- Padding adapté (`px-6 md:px-8 lg:px-10`)
- Mobile-first approach
- Aucune fonctionnalité cachée

### ✅ Accessibilité

- Labels associés aux inputs
- ARIA labels sur boutons d'interaction
- Contraste respecté (texte sombre sur fond clair)
- Structure HTML sémantique (nav, footer, sections)

---

## 🚀 Comment utiliser

### Démarrer le serveur de développement

```bash
cd c:\wamp64\www\kiam
npm run dev
```

Puis naviguer vers `http://localhost:5173/` (ou votre port Vite).

### Compiler pour production

```bash
npm run build
npm run preview
```

### Ajouter une nouvelle page marketing

1. Créer une fonction `export function NewPage()` dans `MarketingSite.tsx`
2. L'envelopper avec `<PageShell>` ou `<MarketingLayout>`
3. Ajouter la route dans `App.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```
4. Ajouter le lien dans le menu `navItems` ou `footer`

---

## 📱 Vérification responsive

Tester sur:
- Desktop (1920×1080, 1440×900)
- Tablette (768×1024, iPad)
- Mobile (375×667, 414×896, iPhone)

Utiliser les DevTools (F12) et responsive mode.

---

## 🔐 Points de sécurité

- Aucun formulaire ne stocke localement les données
- Les CTA "Demander une démo" affichent un message de confirmation
- Aucun appel API frontend direct (prêt pour intégration backend)
- Validation basique sur inputs email

---

## 🎬 Animations

Toutes les transitions utilisent Tailwind's `transition` et Framer Motion :
- **Hover cards**: `-translate-y-1` + `shadow-xl` (350ms)
- **Menu**: `opacity-0 scale-95` → `opacity-100 scale-100` (200ms)
- **Links**: `hover:text-[#0EA5E9]` (200ms)
- **Démo interactive**: Rotation auto 6s, animation 400ms entre solutions

---

## 📊 Données mockées

### Solutions (6)

Chaque solution a:
- `slug` (health, erp, school, hotel, pharmacy, enterprise)
- `name`, `shortName`, `accent`, `accentSoft`
- `tagline`, `description`
- `features[]` (3 principales)
- `modules[]` (5 modules)
- `kpis[]` ({ label, value })
- `testimonial` ({ quote, person, role })
- `highlights[]` (3 points clés)

### Plans de pricing

- **Essentiel**: 150 000 FCFA/mois
- **Croissance**: 450 000 FCFA/mois
- **Entreprise**: Sur devis

### Blog & Careers

Articles et postes sont mockés (prêts pour intégration CMS).

---

## 📝 Prochaines étapes (optionnel)

1. **Backend pour formulaires**: Connecter demo + contact à une API
2. **CMS pour contenu**: Blog articles, FAQ, actualités
3. **Analytics**: Google Analytics ou Mixpanel
4. **SEO**: Meta tags dynamiques, sitemap.xml
5. **CDN d'images**: Remplacer les placeholders par vraies images
6. **Langage**: Ajouter i18n (FR, EN, ES)
7. **Chat support**: Crisp ou Intercom
8. **Newsletter**: Mailchimp ou ConvertKit

---

## 📞 Support

Pour toute modification ou extension du site marketing:
1. Modifier le fichier `MarketingSite.tsx`
2. Ajouter les routes correspondantes dans `App.tsx`
3. Tester en local avec `npm run dev`
4. Compiler avec `npm run build`

---

**Créé le**: 2026-07-10  
**Dernière mise à jour**: 2026-07-10  
**Version**: 1.0.0
