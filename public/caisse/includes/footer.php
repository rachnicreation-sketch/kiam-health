<?php
/**
 * Pied de Page Commun - KIAM Caisse
 */
?>
        </div> <!-- Fin .erp-view-content -->
    </div> <!-- Fin .erp-main -->
</div> <!-- Fin .erp-layout -->

<!-- JS Global de l'Application -->
<script src="assets/js/main.js"></script>

<!-- Scripts spécifiques à chaque page injectés si définis -->
<?php if (isset($pageJavascript) && !empty($pageJavascript)): ?>
    <script src="<?php echo $pageJavascript; ?>"></script>
<?php endif; ?>

</body>
</html>
