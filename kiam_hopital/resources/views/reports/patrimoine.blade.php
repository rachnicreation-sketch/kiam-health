<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport Patrimoine - KIAM</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
        .header h1 { color: #0056b3; text-transform: uppercase; margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; }
        .text-right { text-align: right; }
        .status { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
        .status-actif { background-color: #d1fae5; color: #065f46; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; padding-top: 10px; border-top: 1px solid #eee; }
        .summary { margin-top: 20px; background: #f0f7ff; padding: 15px; border-radius: 8px; }
        .summary-item { margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header" style="position: relative;">
        <img src="{{ public_path('images/logo-kiam.png') }}" style="position: absolute; left: 0; top: 0; height: 60px; width: auto;">
        <h1>Inventaire du <span style="color: #e11d48;">Patrimoine</span></h1>
        <p>KIAM - Système de Gestion d'Inventaire Intégré</p>
        <p style="font-size: 10px; font-weight: normal;">Généré le: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Code Visuel</th>
                <th class="text-right">Stock</th>
                <th class="text-right">Prix Unitaire</th>
                <th class="text-right">Valeur Totale</th>
            </tr>
        </thead>
        <tbody>
            @foreach($articles as $article)
            <tr>
                <td style="font-family: monospace;">{{ $article->reference }}</td>
                <td><strong>{{ $article->article }}</strong></td>
                <td>{{ $article->category->name ?? $article->categorie }}</td>
                <td style="text-align: center;">
                    <div style="margin-bottom: 5px;">
                        {!! $generator->getBarcode($article->article . ' | REF: ' . $article->reference, $generator::TYPE_CODE_128, 1, 20) !!}
                        <div style="font-size: 8px; font-family: monospace;">{{ $article->article }} | {{ $article->reference }}</div>
                    </div>
                    <img src="https://bwipjs-api.metafloor.com/?bcid=qrcode&text={{ urlencode($article->article . ' | REF: ' . $article->reference) }}&scale=1" width="40">
                </td>
                <td class="text-right">{{ $article->quantite_stock }}</td>
                <td class="text-right">{{ number_format($article->prix_achat, 2) }} CFA</td>
                <td class="text-right">{{ number_format($article->prix_achat * $article->quantite_stock, 2) }} CFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-item"><strong>Nombre total d'articles:</strong> {{ count($articles) }}</div>
        <div class="summary-item"><strong>Quantité totale en stock:</strong> {{ $articles->sum('quantite_stock') }}</div>
        <div class="summary-item"><strong>Valeur totale de l'inventaire:</strong> {{ number_format($articles->sum(fn($a) => $a->prix_achat * $a->quantite_stock), 2) }} CFA</div>
    </div>

    <div class="footer">
        Document confidentiel généré par KIAM Inventory System &copy; {{ date('Y') }} - Software developed by MATIABA Firm
    </div>
</body>
</html>
