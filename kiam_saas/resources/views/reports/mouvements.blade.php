<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Historique des Mouvements - KIAM</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
        .header h1 { color: #0056b3; text-transform: uppercase; margin: 0; font-size: 22px; }
        .header p { margin: 5px 0 0; color: #666; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 9px; color: #555; }
        .text-right { text-align: right; }
        .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; color: white; display: inline-block; }
        .type-entree { background-color: #10b981; }
        .type-sortie { background-color: #ef4444; }
        .type-transfert { background-color: #3b82f6; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #999; padding-top: 10px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header" style="position: relative;">
        <img src="{{ public_path('images/logo-kiam.png') }}" style="position: absolute; left: 0; top: 0; height: 50px; width: auto;">
        <h1>Historique des <span style="color: #e11d48;">Mouvements</span></h1>
        <p>KIAM - Gestion des Flux de Stocks</p>
        <p style="font-size: 9px; font-weight: normal;">Période: {{ $start_date ?? 'Début' }} au {{ $end_date ?? 'Maintenant' }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Article</th>
                <th>Référence</th>
                <th>Type</th>
                <th class="text-right">Quantité</th>
                <th>Auteur</th>
            </tr>
        </thead>
        <tbody>
            @foreach($movements as $m)
            <tr>
                <td style="white-space: nowrap;">{{ $m->created_at->format('d/m/Y H:i') }}</td>
                <td><strong>{{ $m->article?->article }}</strong></td>
                <td style="font-family: monospace;">{{ $m->article?->reference }}</td>
                <td>
                    <span class="badge type-{{ $m->type }}">{{ strtoupper($m->type) }}</span>
                </td>
                <td class="text-right" style="font-weight: bold; color: {{ $m->type === 'entree' ? '#059669' : '#dc2626' }}">
                    {{ $m->type === 'entree' ? '+' : '-' }}{{ $m->quantite }}
                </td>
                <td>{{ $m->user?->name }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Document généré par KIAM Inventory System &copy; {{ date('Y') }} - Software developed by MATIABA Firm - Page {PAGENO}
    </div>
</body>
</html>
