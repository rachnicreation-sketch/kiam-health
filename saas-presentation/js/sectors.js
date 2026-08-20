/* ═══════════════════════════════════════════════════════════════
   KIAM — Sector Data & Interactive Mockup Engine
   ═══════════════════════════════════════════════════════════════ */

const SECTORS = {
  health: {
    key: 'health',
    name: 'Kiam Health',
    icon: '🏥',
    shortName: 'Santé',
    title: 'Clinique & Cabinet Médical',
    color: '#0ea5e9',
    lightColor: '#e0f2fe',
    badge: 'Verticale Santé',
    heroWord: 'Cliniques.',
    url: 'solutions/health.html',
    tagline: 'Gérez le parcours complet de vos patients',
    text: 'Gérez le parcours complet de vos patients, des consultations aux dossiers médicaux partagés, en passant par le planning de garde du personnel soignant.',
    kpis: [
      { value: '45', label: 'Patients / Jour' },
      { value: '98%', label: 'Taux Guérison' },
      { value: '14', label: 'Consultations' }
    ],
    modules: ['Dossiers Médicaux', 'Consultations', 'Hospitalisations', 'Laboratoire', 'Agenda & RDV', 'Assurances', 'Pharmacie interne', 'Garde & Planning'],
    features: [
      '✓ Télétransmission d\'ordonnances aux pharmacies partenaires',
      '✓ Rapprochement automatique des parts mutuelles d\'assurance',
      '✓ Dossier patient unifié accessible par l\'équipe soignante',
      '✓ Planning de garde avec gestion des remplacements',
      '✓ Laboratoire intégré avec suivi des résultats',
      '✓ Historique complet des antécédents médicaux'
    ],
    useCases: [
      { title: 'Clinique privée', desc: 'Gérez 50+ lits, le bloc opératoire et la facturation en un seul outil.' },
      { title: 'Cabinet de ville', desc: 'Consultations, ordonnances et dossiers médicaux pour les praticiens solo ou en groupe.' },
      { title: 'Centre de santé communautaire', desc: 'Suivi des campagnes de vaccination, statistiques épidémiologiques et rapports DHIS2.' }
    ]
  },
  commerce: {
    key: 'commerce',
    name: 'Kiam ERP',
    icon: '🛒',
    shortName: 'Commerce',
    title: 'Commerce & ERP',
    color: '#8b5cf6',
    lightColor: '#ede9fe',
    badge: 'Verticale Commerce',
    heroWord: 'Commerces.',
    url: 'solutions/erp.html',
    tagline: 'Pilotez vos ventes et vos stocks',
    text: 'Suivez vos ventes comptoir, pilotez vos dépôts logistiques et gérez votre pipeline commercial depuis un tableau de bord consolidé.',
    kpis: [
      { value: '1.2M CFA', label: 'Ventes / Jour' },
      { value: '420', label: 'Articles' },
      { value: '12', label: 'Alertes Rupture' }
    ],
    modules: ['Point de Vente (POS)', 'Gestion des Stocks', 'Achat & Fournisseurs', 'CRM Commercial', 'E-commerce', 'Comptabilité OHADA', 'Logistique', 'Rapports'],
    features: [
      '✓ Caisse autonome synchronisée en temps réel',
      '✓ Gestion fine des stocks avec alertes de seuil critique',
      '✓ Pipeline de ventes interactif pour les commerciaux',
      '✓ Facturation multi-devises conforme OHADA',
      '✓ Gestion multi-dépôts et transferts inter-sites',
      '✓ Intégration Mobile Money pour les encaissements'
    ],
    useCases: [
      { title: 'Grande surface', desc: 'Gestion de 5000+ références, caisses multiples et fidélité clients.' },
      { title: 'Boutique de quartier', desc: 'POS simplifié avec gestion de stock et encaissement Mobile Money.' },
      { title: 'Grossiste B2B', desc: 'Bons de commande, livraisons programmées et facturation par lots.' }
    ]
  },
  school: {
    key: 'school',
    name: 'Kiam School',
    icon: '🎓',
    shortName: 'École',
    title: 'École & Établissement',
    color: '#f59e0b',
    lightColor: '#fef3c7',
    badge: 'Verticale École',
    heroWord: 'Écoles.',
    url: 'solutions/school.html',
    tagline: 'Digitalisez la vie scolaire',
    text: 'Prenez en charge le suivi scolaire complet de vos élèves. Édition de bulletins de notes, cantine, circuits de transport et portail parents.',
    kpis: [
      { value: '850', label: 'Élèves inscrits' },
      { value: '98%', label: 'Présence' },
      { value: '14.5/20', label: 'Moyenne Générale' }
    ],
    modules: ['Dossiers Élèves', 'Bulletins & Notes', 'Emploi du Temps', 'Portail Parents', 'Cantine & Bus', 'Comptabilité scolaire', 'Bibliothèque', 'Examens'],
    features: [
      '✓ Messagerie directe entre l\'école et les parents d\'élèves',
      '✓ Génération en masse de bulletins de notes certifiés',
      '✓ Suivi des navettes de bus scolaires en temps réel',
      '✓ Gestion des frais de scolarité et relances automatiques',
      '✓ Emplois du temps par classe avec gestion des conflits',
      '✓ Portail parents avec suivi des absences et notes'
    ],
    useCases: [
      { title: 'Lycée d\'enseignement général', desc: 'Notes, bulletins, conseils de classe et orientation post-bac.' },
      { title: 'École primaire', desc: 'Présence, cantine, transport scolaire et communication parents.' },
      { title: 'Université privée', desc: 'UE/crédits, parcours LMD et facturation par trimestre.' }
    ]
  },
  hotel: {
    key: 'hotel',
    name: 'Kiam Hotel',
    icon: '🏨',
    shortName: 'Hôtel',
    title: 'Hôtel & Résidence',
    color: '#ec4899',
    lightColor: '#fce7f3',
    badge: 'Verticale Hôtel',
    heroWord: 'Hôtels.',
    url: 'solutions/hotel.html',
    tagline: 'Optimisez votre établissement hôtelier',
    text: 'Optimisez la réception de vos clients, planifiez le ménage en chambre et centralisez toutes vos réservations provenant des canaux externes.',
    kpis: [
      { value: '82%', label: 'Taux Occupation' },
      { value: '35 000 CFA', label: 'Prix Moyen' },
      { value: '8', label: 'Départs du jour' }
    ],
    modules: ['Réservations', 'Housekeeping', 'Room Service', 'Channel Manager', 'Facturation', 'Restaurant & Bar', 'Spa & Loisirs', 'Rapports'],
    features: [
      '✓ Flux d\'état de nettoyage des chambres en temps réel',
      '✓ Synchronisation automatique Booking.com & AirBnB',
      '✓ Facturation globale intégrant le room service',
      '✓ Gestion des tarifs saisonniers et packages',
      '✓ Check-in / check-out numérique rapide',
      '✓ Tableau de bord des revenus par chambre et canal'
    ],
    useCases: [
      { title: 'Hôtel de charme', desc: 'Réservations, housekeeping et expérience client personnalisée.' },
      { title: 'Résidence meublée', desc: 'Contrats longue durée, facturation mensuelle et états des lieux.' },
      { title: 'Chaîne hôtelière', desc: 'Multi-sites, channel manager centralisé et reporting consolidé.' }
    ]
  },
  pharmacy: {
    key: 'pharmacy',
    name: 'Kiam Pharmacy',
    icon: '💊',
    shortName: 'Pharmacie',
    title: 'Pharmacie & Officine',
    color: '#10b981',
    lightColor: '#d1fae5',
    badge: 'Verticale Pharmacie',
    heroWord: 'Pharmacies.',
    url: 'solutions/pharmacy.html',
    tagline: 'Sécurisez votre officine',
    text: 'Sécurisez la dispensation de vos médicaments, contrôlez rigoureusement la péremption de vos lots et traquez vos stupéfiants.',
    kpis: [
      { value: '150', label: 'Lots critiques' },
      { value: '99.8%', label: 'Conformité' },
      { value: '84', label: 'Prescriptions' }
    ],
    modules: ['Vente & Caisse', 'Gestion par Lots', 'Registre Stupéfiants', 'Ordonnance Électronique', 'Fournisseurs', 'Garde & Astreinte', 'Alertes Péremption', 'Rapports'],
    features: [
      '✓ Alerte automatique par lot avant expiration',
      '✓ Registre réglementaire des stupéfiants traçable',
      '✓ Dispensation directe d\'ordonnances numériques',
      '✓ Suivi des gardes et astreintes par officine',
      '✓ Commande automatique auprès des grossistes',
      '✓ Historique complet de dispensation par patient'
    ],
    useCases: [
      { title: 'Officine de ville', desc: 'Dispensation au comptoir, péremptions et registre stupéfiants.' },
      { title: 'Pharmacie hospitalière', desc: 'Stock central, préparations magistrales et dotations de service.' },
      { title: 'Groupement de pharmacies', desc: 'Achats groupés, tarification centralisée et reporting multi-officines.' }
    ]
  },
  enterprise: {
    key: 'enterprise',
    name: 'Kiam Enterprise',
    icon: '🏢',
    shortName: 'Entreprise',
    title: 'Société de Services & PME',
    color: '#ef4444',
    lightColor: '#fee2e2',
    badge: 'Verticale Entreprise',
    heroWord: 'Entreprises.',
    url: 'solutions/enterprise.html',
    tagline: 'Pilotez vos projets et prestations',
    text: 'Pilotez vos chantiers ou prestations intellectuelles. Saisie de feuilles de temps, archivage documentaire et facturation clients.',
    kpis: [
      { value: '14', label: 'Projets actifs' },
      { value: '87%', label: 'Efficacité Équipe' },
      { value: '15.4M CFA', label: 'CA facturé' }
    ],
    modules: ['Projets & Tâches', 'Feuilles de Temps', 'Coffre-fort Doc', 'Comptabilité analytique', 'Rapports', 'RH & Paie', 'Contrats', 'Facturation'],
    features: [
      '✓ Chronomètre d\'activité pour suivi du temps facturable',
      '✓ Stockage sécurisé de fichiers et contrats par projet',
      '✓ Analyse de rentabilité projet en temps réel',
      '✓ Gestion des ressources humaines et feuilles de paie',
      '✓ Tableaux Kanban pour le suivi des livrables',
      '✓ Facturation au temps passé ou au forfait'
    ],
    useCases: [
      { title: 'Cabinet de conseil', desc: 'Feuilles de temps, facturation horaire et gestion documentaire sécurisée.' },
      { title: 'BTP & Construction', desc: 'Suivi de chantiers, pointage des ouvriers et budget prévisionnel.' },
      { title: 'Agence digitale', desc: 'Projets multiples, timetracking et collaboration d\'équipe.' }
    ]
  }
};

/* ── Auto-rotation engine ────────────────────────────────────── */
let activeSector = 'health';
let autoRotateInterval = null;

function selectSector(sectorKey) {
  activeSector = sectorKey;
  const sec = SECTORS[sectorKey];
  if (!sec) return;

  // Hero word
  const heroSector = document.getElementById('hero-sector');
  if (heroSector) { heroSector.textContent = sec.heroWord; heroSector.style.color = sec.color; }

  // Badges & CTAs
  const hb = document.getElementById('hero-badge'); if (hb) hb.style.backgroundColor = sec.color;
  const nc = document.getElementById('nav-cta'); if (nc) nc.style.backgroundColor = sec.color;
  const hcp = document.getElementById('hero-cta-primary');
  if (hcp) { hcp.style.backgroundColor = sec.color; hcp.style.boxShadow = `0 10px 15px -3px ${sec.color}33`; hcp.href = sec.url; }

  // Desc panel
  const db = document.getElementById('desc-badge');
  if (db) { db.style.backgroundColor = sec.color; db.textContent = sec.badge; }
  const dt = document.getElementById('desc-title'); if (dt) dt.textContent = sec.title;
  const dx = document.getElementById('desc-text'); if (dx) dx.textContent = sec.text;
  const dc = document.getElementById('desc-cta-btn');
  if (dc) { dc.style.backgroundColor = sec.color; dc.href = sec.url; }

  const df = document.getElementById('desc-features');
  if (df) df.innerHTML = sec.features.slice(0, 3).map(f => `<p style="font-size:0.8125rem;color:var(--muted)">${f}</p>`).join('');

  // Tabs
  document.querySelectorAll('.sector-btn').forEach(btn => {
    btn.style.backgroundColor = ''; btn.style.color = ''; btn.style.borderColor = '';
  });
  const ab = document.getElementById(`tab-${sectorKey}`);
  if (ab) { ab.style.backgroundColor = sec.color; ab.style.color = '#fff'; ab.style.borderColor = sec.color; }

  // Mockup
  const mu = document.getElementById('mockup-url'); if (mu) mu.textContent = sec.key;
  const mt = document.getElementById('mockup-title'); if (mt) mt.textContent = sec.name;
  const mb = document.getElementById('mockup-badge');
  if (mb) { mb.style.color = sec.color; mb.style.borderColor = sec.color + '66'; mb.style.backgroundColor = sec.color + '25'; }

  const kc = document.getElementById('mockup-kpis');
  if (kc) kc.innerHTML = sec.kpis.map(k => `
    <div style="background:#0f172a;border:1px solid #1e293b;padding:1rem;border-radius:0.75rem">
      <p class="text-label" style="color:#64748b;font-size:0.625rem">${k.label}</p>
      <p class="font-serif" style="font-weight:900;font-size:1.125rem;color:var(--paper);margin-top:0.25rem">${k.value}</p>
    </div>
  `).join('');

  const mc = document.getElementById('mockup-modules');
  if (mc) mc.innerHTML = sec.modules.map(m => `
    <span style="font-family:'IBM Plex Mono',monospace;font-size:0.5625rem;background:#0f172a;color:#94a3b8;padding:0.375rem 0.75rem;border-radius:0.5rem;border:1px solid #1e293b;text-transform:uppercase;letter-spacing:0.08em">${m}</span>
  `).join('');

  resetAutoRotate();
}

function rotateSector() {
  const keys = Object.keys(SECTORS);
  let idx = keys.indexOf(activeSector) + 1;
  if (idx >= keys.length) idx = 0;
  selectSector(keys[idx]);
}

function resetAutoRotate() {
  if (autoRotateInterval) clearInterval(autoRotateInterval);
  autoRotateInterval = setInterval(rotateSector, 6000);
}

function stopAutoRotate() {
  if (autoRotateInterval) clearInterval(autoRotateInterval);
}
