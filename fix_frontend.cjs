const fs = require('fs');
const path = require('path');

const tenants = {
    'kiam_health': ['hotel', 'erp', 'pharmacy', 'enterprise', 'school', 'saas'],
    'kiam_hopital': ['hotel', 'erp', 'pharmacy', 'enterprise', 'school', 'saas'],
    'kiam_ecole': ['health', 'hotel', 'erp', 'pharmacy', 'enterprise', 'saas'],
    'kiam_erp': ['health', 'hotel', 'pharmacy', 'enterprise', 'school', 'saas'],
    'kiam_ges': ['health', 'hotel', 'erp', 'pharmacy', 'school', 'saas'],
    'kiam_hotel': ['health', 'erp', 'pharmacy', 'enterprise', 'school', 'saas'],
    'kiam_caisse': ['health', 'hotel', 'erp', 'enterprise', 'school', 'saas'],
    'kiam_saas': ['health', 'hotel', 'erp', 'pharmacy', 'enterprise', 'school']
};

for (const [tenant, toRemove] of Object.entries(tenants)) {
    const appPath = path.join(__dirname, tenant, 'src', 'App.tsx');
    if (!fs.existsSync(appPath)) {
        console.log(`Skipping ${appPath}, not found.`);
        continue;
    }

    let content = fs.readFileSync(appPath, 'utf8');
    const lines = content.split('\n');
    
    const newLines = lines.filter(line => {
        for (const mod of toRemove) {
            // General module paths and routes
            if (line.includes(`/modules/${mod}/`) || 
                line.includes(`module="${mod}"`) || 
                line.includes(`module="${mod}_hr"`) || 
                line.includes(`path="/${mod}"`) ||
                line.includes(`path="/${mod}/`)) {
                return false;
            }
            // SaaS specific admin pages
            if (mod === 'saas') {
                if (line.includes(`core/pages/SaaS`) || 
                    line.includes(`core/pages/saas/`) ||
                    line.includes(`path="/saas/`) || 
                    line.includes(`module="saas"`)) {
                    return false;
                }
            }
        }
        return true;
    });

    fs.writeFileSync(appPath, newLines.join('\n'));
    console.log(`Cleaned imports in ${tenant}/src/App.tsx`);
}
