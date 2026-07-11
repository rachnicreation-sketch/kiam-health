<?php
$filename = 'c:/wamp64/www/kiam/images/logo-kiam.png';
$im = imagecreatefrompng($filename);
$width = imagesx($im);
$height = imagesy($im);

$colors = [];

for ($x = 0; $x < $width; $x += 5) {
    for ($y = 0; $y < $height; $y += 5) {
        $rgb = imagecolorat($im, $x, $y);
        $colorspace = imagecolorsforindex($im, $rgb);
        
        // Skip transparent and near-white/near-black pixels
        if ($colorspace['alpha'] > 100) continue;
        if ($colorspace['red'] > 240 && $colorspace['green'] > 240 && $colorspace['blue'] > 240) continue;
        if ($colorspace['red'] < 15 && $colorspace['green'] < 15 && $colorspace['blue'] < 15) continue;
        
        $hex = sprintf("#%02x%02x%02x", $colorspace['red'], $colorspace['green'], $colorspace['blue']);
        if (!isset($colors[$hex])) $colors[$hex] = 0;
        $colors[$hex]++;
    }
}

arsort($colors);
$top_colors = array_slice($colors, 0, 10, true);

echo "Dominant colors:\n";
foreach ($top_colors as $hex => $count) {
    echo "$hex ($count pixels)\n";
}
?>
