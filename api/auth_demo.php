<?php
require_once 'config.php';
require_once 'functions.php';

// FAST TRACK FOR DEMO: Force a super admin login
sendResponse([
    "status" => "success",
    "user" => [
        "id" => "saas_master_demo",
        "email" => "master@kiam.tech",
        "role" => "saas_admin",
        "global_role" => "saas_admin",
        "clinicId" => null,
        "sector" => "health",
        "name" => "Kiam Master Admin"
    ]
]);
?>
