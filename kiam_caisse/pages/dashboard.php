<?php
/**
 * Vue Tableau de Bord - KIAM Caisse
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Récupérer les ventes récentes pour la liste d'activités
$recentSalesStmt = $pdo->query("
    SELECT s.*, u.name as cashier_name, c.name as client_name
    FROM sales s
    JOIN users u ON s.user_id = u.id
    JOIN clients c ON s.client_id = c.id
    ORDER BY s.created_at DESC
    LIMIT 5
");
$recentSales = $recentSalesStmt->fetchAll();

// Récupérer les produits en stock critique pour le panneau d'alertes
$lowStockStmt = $pdo->query("
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.stock_qty <= p.min_stock_alert
    ORDER BY p.stock_qty ASC
    LIMIT 6
");
$lowStockProducts = $lowStockStmt->fetchAll();
?>

<!-- Bibliothèque de graphiques Chart.js (CDN ultra rapide) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Grille des indicateurs clés (KPIs) -->
<div class="stats-grid">
    <!-- CA du jour -->
    <div class="card card-sales">
        <div class="card-stat">
            <div class="stat-info">
                <h3>Ventes du Jour (CA)</h3>
                <p id="kpi-ca">0 FCFA</p>
            </div>
            <div class="stat-icon">
                <svg viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 1 12 22"></path><path d="M22 2v10h-10"></path></svg>
            </div>
        </div>
        <div class="stat-trend trend-up" id="kpi-ca-trend">
            <span>Données temps réel</span>
        </div>
    </div>

    <!-- Bénéfices du jour -->
    <div class="card card-profits">
        <div class="card-stat">
            <div class="stat-info">
                <h3>Bénéfices du Jour</h3>
                <p id="kpi-profit">0 FCFA</p>
            </div>
            <div class="stat-icon">
                <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
        </div>
        <div class="stat-trend trend-up" id="kpi-profit-trend">
            <span>Marge brute estimée</span>
        </div>
    </div>

    <!-- Charges du mois -->
    <div class="card card-expenses">
        <div class="card-stat">
            <div class="stat-info">
                <h3>Charges du Mois</h3>
                <p id="kpi-expenses">0 FCFA</p>
            </div>
            <div class="stat-icon">
                <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
        </div>
        <div class="stat-trend trend-down" id="kpi-expenses-trend">
            <span>Dépenses mensuelles</span>
        </div>
    </div>

    <!-- Alertes stock faible -->
    <div class="card card-alert">
        <div class="card-stat">
            <div class="stat-info">
                <h3>Stocks Critiques</h3>
                <p id="kpi-stock">0 Articles</p>
            </div>
            <div class="stat-icon">
                <svg viewBox="0 0 24 24"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
        </div>
        <div class="stat-trend trend-neutral" id="kpi-stock-trend">
            <span>Sous le seuil d'alerte</span>
        </div>
    </div>
</div>

<!-- Ligne des graphiques statistiques -->
<div class="dashboard-row">
    <!-- Courbe d'évolution des ventes et bénéfices -->
    <div class="card">
        <div class="card-title-row">
            <h2>Évolution Financière (10 derniers jours)</h2>
        </div>
        <div style="height: 300px; position: relative;">
            <canvas id="salesTrendsChart"></canvas>
        </div>
    </div>

    <!-- Répartition des ventes par catégorie -->
    <div class="card">
        <div class="card-title-row">
            <h2>Ventes par Catégorie</h2>
        </div>
        <div style="height: 300px; position: relative; display: flex; align-items: center; justify-content: center;">
            <canvas id="categoriesDistributionChart"></canvas>
        </div>
    </div>
</div>

<!-- Ligne des tableaux de bord (Activités récentes + Ruptures) -->
<div class="dashboard-row">
    <!-- Dernières ventes réalisées -->
    <div class="card">
        <div class="card-title-row">
            <h2>Dernières Ventes Enregistrées</h2>
            <a href="index.php?page=reports" class="btn btn-secondary btn-sm">Voir tout</a>
        </div>
        
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>N° Facture</th>
                        <th>Client</th>
                        <th>Caissier</th>
                        <th>Règlement</th>
                        <th style="text-align: right;">Montant Net</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($recentSales)): ?>
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--text-tertiary); padding: 20px;">Aucune vente enregistrée aujourd'hui.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($recentSales as $sale): ?>
                            <tr>
                                <td><strong style="color: var(--erp-primary);"><?php echo htmlspecialchars($sale['invoice_no']); ?></strong></td>
                                <td><?php echo htmlspecialchars($sale['client_name']); ?></td>
                                <td><?php echo htmlspecialchars($sale['cashier_name']); ?></td>
                                <td>
                                    <span class="erp-badge erp-badge-success">
                                        <?php 
                                            $method = strtolower($sale['payment_method']);
                                            if ($method === 'cash') echo 'Espèces';
                                            elseif ($method === 'mobile_money') echo 'Mobile Money';
                                            elseif ($method === 'card') echo 'Carte';
                                            else echo $sale['payment_method'];
                                        ?>
                                    </span>
                                </td>
                                <td style="text-align: right;"><strong><?php echo number_format($sale['net_amount'], 0, ',', ' '); ?> FCFA</strong></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Alertes rupture de stock -->
    <div class="card">
        <div class="card-title-row">
            <h2>Alertes Ruptures & Seuil Bas</h2>
            <a href="index.php?page=stock" class="erp-btn erp-btn-secondary">Réapprovisionner</a>
        </div>
        
        <div style="background: white; border: 1px solid var(--erp-border); border-radius: 4px; overflow-x: auto;">
            <table class="erp-list-view">
                <thead>
                    <tr>
                        <th>Article</th>
                        <th>Catégorie</th>
                        <th>Quantité</th>
                        <th>Seuil Min</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($lowStockProducts)): ?>
                        <tr>
                            <td colspan="4" style="text-align: center; color: #059669; font-weight: 500; padding: 20px;">✓ Tous vos stocks sont à niveau !</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($lowStockProducts as $prod): ?>
                            <tr>
                                <td style="font-weight: 500; color: var(--erp-primary);"><?php echo htmlspecialchars($prod['name']); ?></td>
                                <td><span style="font-size: 0.85rem; color: var(--text-secondary);"><?php echo htmlspecialchars($prod['category_name'] ?: 'Autre'); ?></span></td>
                                <td>
                                    <span class="erp-badge <?php echo $prod['stock_qty'] <= 0 ? 'erp-badge-danger' : 'erp-badge-success'; ?>">
                                        <?php echo $prod['stock_qty']; ?> Unités
                                    </span>
                                </td>
                                <td><?php echo $prod['min_stock_alert']; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
