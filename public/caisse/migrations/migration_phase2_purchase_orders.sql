-- PHASE 2: COMMANDES D'ACHAT - Migration SQL
-- Crée les tables pour la gestion des commandes d'achat, demandes d'achat et approbations
-- Date: 2026-05-26

-- Table 1: Demandes d'achat (Purchase Requests)
-- Permet aux utilisateurs de demander des produits, qui sont ensuite compilées en commandes
CREATE TABLE IF NOT EXISTS purchase_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL COMMENT 'Numéro de référence unique (auto-générée)',
    tenant_id INT NOT NULL DEFAULT 1 COMMENT 'Multi-tenant support',
    requested_by_id INT NOT NULL COMMENT 'ID de l\'utilisateur qui demande',
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    required_date DATE NOT NULL COMMENT 'Date requise de livraison',
    status ENUM('brouillon', 'validée', 'annulée', 'intégrée_commande') DEFAULT 'brouillon' COMMENT 'État de la demande',
    notes LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    INDEX idx_status (status),
    INDEX idx_requested_by (requested_by_id),
    INDEX idx_requested_date (requested_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Articles de demande d'achat
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL COMMENT 'Quantité demandée',
    unit_price DECIMAL(12,2) COMMENT 'Prix unitaire estimé',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_purchase_request (purchase_request_id),
    INDEX idx_product (product_id),
    UNIQUE KEY unique_request_product (purchase_request_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Commandes d'achat (Purchase Orders)
-- Commandes réelles envoyées aux fournisseurs
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL COMMENT 'Numéro de commande (ex: CMD-2026-001)',
    tenant_id INT NOT NULL DEFAULT 1,
    supplier_id INT NOT NULL COMMENT 'Fournisseur sélectionné',
    purchase_request_id INT COMMENT 'Demande d\'achat d\'origine (peut être NULL)',
    created_by_id INT NOT NULL COMMENT 'Utilisateur qui a créé la commande',
    approved_by_id INT COMMENT 'Utilisateur qui a approuvé',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATE COMMENT 'Date attendue de livraison',
    actual_delivery_date DATE,
    status ENUM('brouillon', 'validé', 'envoyé', 'réception_partielle', 'réception_complète', 'annulé', 'cloturé') DEFAULT 'brouillon' COMMENT 'État de la commande',
    delivery_address VARCHAR(255),
    warehouse_id INT COMMENT 'Entrepôt de destination',
    payment_terms VARCHAR(50) COMMENT 'Conditions paiement (ex: net_30)',
    total_amount DECIMAL(12,2) COMMENT 'Montant total (calculé)',
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    notes LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (approved_by_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    INDEX idx_status (status),
    INDEX idx_supplier (supplier_id),
    INDEX idx_created_by (created_by_id),
    INDEX idx_order_date (order_date),
    INDEX idx_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: Articles de commande d'achat
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    supplier_product_id INT COMMENT 'Référence au produit chez le fournisseur',
    product_id INT NOT NULL,
    quantity_ordered INT NOT NULL COMMENT 'Quantité commandée',
    quantity_received INT DEFAULT 0 COMMENT 'Quantité reçue',
    unit_price DECIMAL(12,2) NOT NULL COMMENT 'Prix unitaire',
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED COMMENT 'Total ligne',
    received_percent INT GENERATED ALWAYS AS (IF(quantity_ordered = 0, 0, ROUND((quantity_received / quantity_ordered) * 100))) STORED COMMENT 'Pourcentage reçu',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (supplier_product_id) REFERENCES supplier_products(id),
    INDEX idx_purchase_order (purchase_order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: Approbations de commande d'achat
CREATE TABLE IF NOT EXISTS purchase_order_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    approver_id INT NOT NULL COMMENT 'Utilisateur qui approuve',
    approval_level INT DEFAULT 1 COMMENT 'Niveau d\'approbation (1=manager, 2=directeur, 3=finance)',
    action ENUM('approuvé', 'rejeté', 'demande_modification') DEFAULT 'approuvé',
    comments TEXT,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id),
    INDEX idx_purchase_order (purchase_order_id),
    INDEX idx_approver (approver_id),
    INDEX idx_approved_at (approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: Historique des statuts de commande
CREATE TABLE IF NOT EXISTS purchase_order_status_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_id INT NOT NULL COMMENT 'Utilisateur qui a changé le statut',
    reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_id) REFERENCES users(id),
    INDEX idx_purchase_order (purchase_order_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vue: Résumé des commandes en attente
CREATE OR REPLACE VIEW v_pending_purchase_orders AS
SELECT 
    po.id,
    po.reference,
    s.name as supplier_name,
    po.total_amount,
    po.status,
    po.expected_delivery_date,
    COUNT(DISTINCT poi.id) as item_count,
    ROUND(AVG(poi.received_percent), 0) as avg_received_percent,
    u.username as created_by_user
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
LEFT JOIN users u ON po.created_by_id = u.id
WHERE po.status IN ('validé', 'envoyé', 'réception_partielle')
GROUP BY po.id
ORDER BY po.order_date DESC;

-- Vue: Statistiques fournisseur pour Phase 2
CREATE OR REPLACE VIEW v_supplier_purchase_stats AS
SELECT 
    s.id,
    s.name,
    COUNT(DISTINCT po.id) as total_orders,
    COUNT(DISTINCT CASE WHEN po.status = 'réception_complète' THEN po.id END) as completed_orders,
    SUM(CASE WHEN po.status = 'réception_complète' THEN po.total_amount ELSE 0 END) as total_spent,
    AVG(CASE WHEN po.actual_delivery_date IS NOT NULL THEN DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) ELSE NULL END) as avg_days_late,
    COUNT(DISTINCT CASE WHEN po.status = 'annulé' THEN po.id END) as cancelled_orders
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
GROUP BY s.id;

print 'Migration Phase 2 completed successfully';
