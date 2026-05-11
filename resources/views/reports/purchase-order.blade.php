<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bon de Commande - {{ $purchaseOrder->reference }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 12px; line-height: 1.5; }
        .header { margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { vertical-align: top; width: 50%; }
        .section-title { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; }
        .items-table td { padding: 10px; border-bottom: 1px solid #f3f4f6; }
        .text-right { text-align: right; }
        .totals { width: 300px; float: right; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .grand-total { font-size: 16px; font-weight: bold; color: #1e40af; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 10px; }
        .footer { position: fixed; bottom: 0; width: 100%; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 10px; background: #e5e7eb; }
        .status-valide { background: #dcfce7; color: #166534; }
        .status-brouillon { background: #f3f4f6; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%">
            <tr>
                <td>
                    <div class="logo">KIAM WMS</div>
                    <div style="font-size: 10px; color: #666">MATIABA FIRM - Gestion d'Entrepôt</div>
                </td>
                <td class="text-right">
                    <h1 style="margin: 0; color: #1e40af;">BON DE COMMANDE</h1>
                    <div style="font-size: 14px; font-weight: bold">{{ $purchaseOrder->reference }}</div>
                    <div class="status-badge {{ 'status-'.$purchaseOrder->status }}">Statut: {{ strtoupper($purchaseOrder->status) }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="info-table">
        <tr>
            <td>
                <div class="section-title">Fournisseur</div>
                <strong>{{ $purchaseOrder->supplier->nom }}</strong><br>
                {{ $purchaseOrder->supplier->adresse }}<br>
                {{ $purchaseOrder->supplier->ville }}, {{ $purchaseOrder->supplier->pays }}<br>
                Tél: {{ $purchaseOrder->supplier->telephone }}<br>
                Email: {{ $purchaseOrder->supplier->email }}
            </td>
            <td class="text-right">
                <div class="section-title">Détails de Livraison</div>
                <strong>Entrepôt:</strong> {{ $purchaseOrder->warehouse->nom ?? 'Non défini' }}<br>
                <strong>Date de Commande:</strong> {{ $purchaseOrder->created_at->format('d/m/Y') }}<br>
                <strong>Date Prévue:</strong> {{ $purchaseOrder->expected_arrival_date ? date('d/m/Y', strtotime($purchaseOrder->expected_arrival_date)) : 'À confirmer' }}<br>
                <strong>Émetteur:</strong> {{ $purchaseOrder->user->name }}
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Désignation / Article</th>
                <th class="text-right">Quantité</th>
                <th class="text-right">Prix Unitaire</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchaseOrder->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->article->article }}</strong><br>
                    <small style="color: #666">REF: {{ $item->article->reference }}</small>
                </td>
                <td class="text-right">{{ number_format($item->quantity, 2, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($item->unit_price, 0, ',', ' ') }} FCFA</td>
                <td class="text-right">{{ number_format($item->total_price, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div style="padding: 15px; background: #f9fafb; border-radius: 8px;">
            <table style="width: 100%">
                <tr>
                    <td style="color: #666">Sous-total:</td>
                    <td class="text-right">{{ number_format($purchaseOrder->total_amount, 0, ',', ' ') }} FCFA</td>
                </tr>
                <tr class="grand-total">
                    <td>TOTAL TTC:</td>
                    <td class="text-right">{{ number_format($purchaseOrder->total_amount, 0, ',', ' ') }} FCFA</td>
                </tr>
            </table>
        </div>
    </div>

    @if($purchaseOrder->notes)
    <div style="margin-top: 30px;">
        <div class="section-title">Notes & Observations</div>
        <div style="font-size: 11px; color: #444; background: #fffbeb; padding: 10px; border-left: 4px solid #f59e0b;">
            {{ $purchaseOrder->notes }}
        </div>
    </div>
    @endif

    <div style="margin-top: 100px;">
        <table style="width: 100%">
            <tr>
                <td style="width: 50%">
                    <div style="border-top: 1px solid #ddd; width: 150px; margin-bottom: 5px;"></div>
                    <div style="font-size: 10px; color: #999">Signature Responsable Achats</div>
                </td>
                <td class="text-right">
                    <div style="border-top: 1px solid #ddd; width: 150px; margin-bottom: 5px; display: inline-block;"></div>
                    <div style="font-size: 10px; color: #999">Cachet de la Firme</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        KIAM ERP par Matiaba Firm - {{ date('Y') }} - Page 1/1
    </div>
</body>
</html>
