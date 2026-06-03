<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_GET['action'] = 'tenants';
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'api/saas_admin.php';
?>
