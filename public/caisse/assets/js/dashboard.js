/**
 * Contrôleur du Tableau de Bord - KIAM Caisse
 * Charge dynamiquement les statistiques et dessine les graphiques Chart.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Récupérer les statistiques en AJAX
    fetchDashboardStats();
});

function fetchDashboardStats() {
    fetch('api/stats.php')
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                console.warn("Accès restreint aux statistiques : " + data.error);
                // Si l'utilisateur est un simple caissier, il n'a pas accès aux statistiques avancées.
                // Masquer gracieusement les sections analytiques pour préserver une expérience fluide.
                hideAdvancedStats();
                return;
            }

            // 2. Mettre à jour les indicateurs textuels (KPIs)
            updateKPIs(data);

            // 3. Dessiner les graphiques
            drawSalesTrendChart(data.charts);
            drawCategoriesDistributionChart(data.category_distribution);
        })
        .catch(err => {
            console.error("Erreur chargement stats : ", err);
        });
}

function updateKPIs(data) {
    document.getElementById('kpi-ca').textContent = formatCFA(data.ca_today);
    document.getElementById('kpi-profit').textContent = formatCFA(data.profit_today);
    document.getElementById('kpi-expenses').textContent = formatCFA(data.expenses_month);
    
    const stockKpi = document.getElementById('kpi-stock');
    stockKpi.textContent = `${data.low_stock_count} Produit${data.low_stock_count > 1 ? 's' : ''}`;
    if (data.low_stock_count > 0) {
        stockKpi.style.color = 'var(--warning)';
    } else {
        stockKpi.style.color = 'var(--success)';
    }
}

function hideAdvancedStats() {
    // Si l'utilisateur n'a pas les privilèges stats (ex: simple caissier),
    // on vide les blocs financiers secrets pour conserver la confidentialité métier.
    const statsGrid = document.querySelector('.stats-grid');
    const chartsRow = document.querySelector('.dashboard-row');
    
    if (statsGrid) {
        // Laisser uniquement l'indicateur des alertes stock visible pour le caissier s'il le souhaite, ou masquer la grille financière
        const cards = statsGrid.querySelectorAll('.card');
        cards[0].style.display = 'none'; // CA masqué
        cards[1].style.display = 'none'; // Bénéfices masqués
        cards[2].style.display = 'none'; // Dépenses masquées
    }
    
    if (chartsRow) {
        chartsRow.style.display = 'none'; // Masquer les graphiques
    }
}

/**
 * DESSIN DES GRAPHIPHES INTERACTIFS (CHART.JS)
 */
function drawSalesTrendChart(chartData) {
    const ctx = document.getElementById('salesTrendsChart').getContext('2d');
    if (!ctx) return;

    // Déterminer la couleur des textes selon le thème actif
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9ca3af' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // Créer des dégradés de couleurs pour les courbes
    const salesGradient = ctx.createLinearGradient(0, 0, 0, 300);
    salesGradient.addColorStop(0, 'rgba(0, 102, 204, 0.25)');
    salesGradient.addColorStop(1, 'rgba(0, 102, 204, 0)');

    const profitGradient = ctx.createLinearGradient(0, 0, 0, 300);
    profitGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    profitGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Chiffre d\'Affaires (Ventes)',
                    data: chartData.sales,
                    borderColor: '#0066cc',
                    borderWidth: 3,
                    backgroundColor: salesGradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#0066cc',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Bénéfice Brut',
                    data: chartData.profits,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    backgroundColor: profitGradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: { family: 'Outfit', size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    padding: 12,
                    titleFont: { family: 'Outfit', size: 13, weight: '700' },
                    bodyFont: { family: 'Outfit', size: 12 },
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label} : ${formatCFA(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'transparent' },
                    ticks: {
                        color: textColor,
                        font: { family: 'Outfit', size: 11 }
                    }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Outfit', size: 11 },
                        callback: function(value) {
                            return value >= 1000 ? (value / 1000) + 'k' : value;
                        }
                    }
                }
            }
        }
    });
}

function drawCategoriesDistributionChart(catData) {
    const canvas = document.getElementById('categoriesDistributionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9ca3af' : '#475569';

    if (catData.length === 0) {
        // Écrire un petit texte de rechange si aucune vente
        ctx.fillStyle = textColor;
        ctx.font = "14px Outfit";
        ctx.textAlign = "center";
        ctx.fillText("Aucune vente catégorisée disponible", canvas.width/2, canvas.height/2);
        return;
    }

    const labels = catData.map(c => c.category);
    const dataValues = catData.map(c => parseInt(c.qty));

    // Palette KIAM harmonieuse
    const bgColors = [
        '#0066cc', // Bleu KIAM
        '#66dd00', // Vert KIAM
        '#f59e0b', // Ambre
        '#ec4899', // Rose
        '#00ccff', // Cyan
        '#003d99'  // Bleu foncé
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors.slice(0, labels.length),
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#111827' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: { family: 'Outfit', size: 11, weight: '500' }
                    }
                },
                tooltip: {
                    padding: 10,
                    titleFont: { family: 'Outfit', size: 12, weight: '700' },
                    bodyFont: { family: 'Outfit', size: 11 },
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const val = context.raw;
                            const pct = Math.round((val / total) * 100);
                            return ` ${context.label} : ${val} art. (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function formatCFA(val) {
    const formatted = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} FCFA`;
}
