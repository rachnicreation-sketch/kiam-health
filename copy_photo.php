<?php
$src = 'C:/Users/USER02/.gemini/antigravity/brain/5a58b5e8-0c57-45f9-858f-c869a4650e50/media__1773831103227.jpg';
$dst = 'c:/wamp64/www/kiam-website/rm-matiaba.jpg';
if (copy($src, $dst)) {
    echo "OK: copied to $dst\n";
} else {
    echo "FAIL\n";
}
