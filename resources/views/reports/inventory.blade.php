<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport d'Inventaire #{{ $session->id }} - KIAM</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
        .header h1 { color: #0056b3; text-transform: uppercase; margin: 0; font-size: 20px; }
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-col { display: table-cell; width: 50%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 9px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .discrepancy { font-weight: bold; }
        .loss { color: #ef4444; }
        .gain { color: #10b981; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #999; padding-top: 10px; border-top: 1px solid #eee; }
        .stats-box { border: 1px solid #e5e7eb; padding: 10px; background: #f9fafb; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="header" style="position: relative;">
        <img src="{{ public_path('images/logo-kiam.png') }}" style="position: absolute; left: 0; top: 0; height: 50px; width: auto;">
        <h1>Rapport d'Inventaire <span style="color: #e11d48;">Session #{{ $session->id }}</span></h1>
        <p>KIAM - Audit et Ajustement Physique</p>
    </div>

    <div class="info-grid">
        <div class="info-col">
            <p><strong>Entrepôt:</strong> {{ $session->warehouse?->nom }}</p>
            <p><strong>Localisation:</strong> {{ $session->warehouse?->adresse }}</p>
        </div>
        <div class="info-col text-right">
            <p><strong>Date début:</strong> {{ $session->date_debut ? \Carbon\Carbon::parse($session->date_debut)->format('d/m/Y H:i') : '-' }}</p>
            <p><strong>Clôturé le:</strong> {{ $session->date_fin ? \Carbon\Carbon::parse($session->date_fin)->format('d/m/Y H:i') : '-' }}</p>
            <p><strong>Responsable:</strong> {{ $session->user?->name }}</p>
        </div>
    </div>

    <div class="stats-box">
        <p><strong>Statistiques Clés:</strong></p>
        <p>Progression: {{ $progression }}% | Écarts détectés: {{ $discrepancies }} | Impact Financier: {{ number_format($totalAdjustmentValue, 2) }} CFA</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Article / Référence</th>
                <th class="text-center">Théorique</th>
                <th class="text-center">Physique</th>
                <th class="text-center">Écart</th>
                <th class="text-right">Impact (CFA)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($session->lines as $line)
            <tr>
                <td>
                    <strong>{{ $line->article?->article }}</strong><br>
                    <span style="font-size: 8px; color: #666;">{{ $line->article?->reference }}</span>
                </td>
                <td class="text-center">{{ $line->qte_theorique }}</td>
                <td class="text-center">{{ $line->qte_reelle }}</td>
                <td class="text-center discrepancy {{ $line->ecart < 0 ? 'loss' : ($line->ecart > 0 ? 'gain' : '') }}">
                    {{ $line->ecart > 0 ? '+' : '' }}{{ $line->ecart }}
                </td>
                <td class="text-right">
                    {{ number_format($line->ecart * ($line->article?->prix_achat ?? 0), 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Document certifié généré par KIAM Inventory System &copy; {{ date('Y') }} - Software developed by MATIABA Firm
    </div>
</body>
</html>
