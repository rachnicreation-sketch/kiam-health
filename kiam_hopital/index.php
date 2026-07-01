<?php
/**
 * Kiam SaaS — Public Landing Page with live platform stats
 * Serves the saas-presentation/landing.html and injects live data from the database.
 */

// Fetch live platform stats
$stats = [
    'totalTenants'  => 0,
    'activeTenants' => 0,
    'totalUsers'    => 0,
    'totalModules'  => 6,
    'sectors'       => [],
];

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=kiam_saas;charset=utf8mb4",
        "root", "",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    // Count tenants
    $row = $pdo->query("SELECT COUNT(*) as cnt FROM kiam_tenants")->fetch();
    $stats['totalTenants'] = (int)($row['cnt'] ?? 0);

    $row = $pdo->query("SELECT COUNT(*) as cnt FROM kiam_tenants WHERE subscription_status = 'active'")->fetch();
    $stats['activeTenants'] = (int)($row['cnt'] ?? 0);

    // Count users
    $row = $pdo->query("SELECT COUNT(*) as cnt FROM kiam_global_users")->fetch();
    $stats['totalUsers'] = (int)($row['cnt'] ?? 0);

    // Count sectors breakdown
    $sectors = $pdo->query("SELECT sector, COUNT(*) as cnt FROM kiam_tenants GROUP BY sector ORDER BY cnt DESC")->fetchAll();
    $stats['sectors'] = $sectors;

    // Count modules
    $row = $pdo->query("SELECT COUNT(*) as cnt FROM kiam_modules")->fetch();
    if ($row && (int)$row['cnt'] > 0) {
        $stats['totalModules'] = (int)$row['cnt'];
    }
} catch (Exception $e) {
    // Silently fail — show page without live stats
}

// Read the landing HTML
$html = file_get_contents(__DIR__ . '/saas-presentation/landing.html');

// Build a dynamic stats banner to inject right after <body>
$sectorLabels = [
    'health' => '🏥 Santé',
    'erp' => '📦 ERP',
    'school' => '🎓 École',
    'hotel' => '🏨 Hôtel',
    'pharmacy' => '💊 Pharmacie',
    'enterprise' => '🏢 Entreprise',
    'shop' => '🛒 Commerce',
];

$sectorBadges = '';
foreach ($stats['sectors'] as $s) {
    $label = $sectorLabels[$s['sector']] ?? ucfirst($s['sector']);
    $sectorBadges .= '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300">' . $label . ' <span class="text-brand-blue font-black">' . $s['cnt'] . '</span></span>';
}

$liveBanner = <<<HTML
<!-- LIVE PLATFORM STATS (injected by PHP) -->
<div id="live-stats-ticker" class="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1628]/95 backdrop-blur-xl border-t border-brand-blue/20 py-2.5 px-4" style="display:none;">
  <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <span class="flex items-center gap-1.5 text-xs font-bold text-brand-green">
        <span class="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span> PLATEFORME EN LIGNE
      </span>
      <span class="text-slate-600 text-xs">|</span>
      <span class="text-xs text-slate-400">
        <span class="text-white font-black">{$stats['totalTenants']}</span> espaces actifs
      </span>
      <span class="text-slate-600 text-xs hidden sm:inline">|</span>
      <span class="text-xs text-slate-400 hidden sm:inline">
        <span class="text-white font-black">{$stats['totalUsers']}</span> utilisateurs
      </span>
      <span class="text-slate-600 text-xs hidden md:inline">|</span>
      <span class="text-xs text-slate-400 hidden md:inline">
        <span class="text-white font-black">{$stats['totalModules']}</span> modules
      </span>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      {$sectorBadges}
    </div>
  </div>
</div>
<script>
  // Show the stats ticker after 2s for a nice reveal effect
  setTimeout(function() {
    var el = document.getElementById("live-stats-ticker");
    if (el) { el.style.display = "block"; el.style.animation = "slideUp 0.5s ease-out"; }
  }, 2000);
</script>
<style>
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  /* Add bottom padding to body so the ticker doesn't overlap footer */
  body { padding-bottom: 48px; }
</style>
HTML;


// Inject after <body...>
$html = preg_replace('/(<body[^>]*>)/i', '$1' . $liveBanner, $html);

// Also replace static stat values in the hero section if they exist
// Replace "8+" modules stat with real count
$html = str_replace(
    '<span class="text-4xl font-extrabold text-white">8+</span>',
    '<span class="text-4xl font-extrabold text-white">' . $stats['totalModules'] . '+</span>',
    $html
);

echo $html;
?>
