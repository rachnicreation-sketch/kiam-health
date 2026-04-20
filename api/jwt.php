<?php
// Zero-dependency simple JWT helper class for KIAM SaaS.

class JWT {
    // A secret key strictly reserved for the server backend. Adjust in config.php usually.
    private static $secret = 'kiam_saas_ultra_secure_super_secret_key_2026_xyz';

    public static function setSecret($secretKey) {
        self::$secret = $secretKey;
    }

    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }

    public static function encode($payload, $expirationMins = 1440) { // 24 hours default
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload['exp'] = time() + ($expirationMins * 60);
        $payload['iat'] = time();

        $payloadJson = json_encode($payload);

        $base64UrlHeader = self::base64url_encode($header);
        $base64UrlPayload = self::base64url_encode($payloadJson);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64url_encode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt) {
        $tokenParts = explode('.', $jwt);
        
        if (count($tokenParts) != 3) {
            return false;
        }

        $header = self::base64url_decode($tokenParts[0]);
        $payload = self::base64url_decode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];

        // Ensure validity
        if (!$header || !$payload) {
            return false;
        }

        $base64UrlHeader = self::base64url_encode($header);
        $base64UrlPayload = self::base64url_encode($payload);
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64url_encode($signature);

        // Verify signature
        if ($base64UrlSignature === $signatureProvided) {
            $payloadObj = json_decode($payload, true);
            // Verify expiration
            if (isset($payloadObj['exp']) && $payloadObj['exp'] < time()) {
                return false; // Expired
            }
            return $payloadObj;
        }
        
        return false;
    }

    public static function getBearerToken() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
}
?>
