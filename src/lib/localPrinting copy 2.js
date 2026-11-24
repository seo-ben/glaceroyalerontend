import axios from 'axios';
import { initQzSecurity } from './qz-config';

// Initialisation de la sécurité QZ
initQzSecurity();

/**
 * Service pour dispatcher l'impression vers QZ Tray (PC) ou RawBT (Android)
 */
export const printToLocalDevice = async (ticketHtml, destination, config) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Récupération des paramètres pour ce pôle
    // Destinations possibles : kitchen, bar, pizza, cakes, reports, receipt
    let printerIp = config[`${destination}_printer_ip`];
    let printerName = config[`${destination}_printer_name`];

    // Fallbacks intelligents : si pas d'IP spécifique pour les gâteaux ou rapports, on prend celle des gâteaux ou cuisine
    if (!printerIp && destination === 'cakes') {
        printerIp = config['kitchen_printer_ip'];
        printerName = config['kitchen_printer_name'];
    }
    if (!printerIp && destination === 'reports') {
        // Pour les rapports (inventaire/dépenses), on peut utiliser une IP spécifique 'reports_printer_ip'
        // ou retomber sur l'imprimante par défaut (souvent la cuisine ou le bureau)
        printerIp = config['reports_printer_ip'] || config['kitchen_printer_ip'];
        printerName = config['reports_printer_name'] || config['kitchen_printer_name'];
    }

    if (!printerIp && !printerName) {
        console.warn(`Aucune imprimante configurée pour ${destination}`);
        return;
    }

    if (isAndroid) {
        // --- MÉTHODE ANDROID (RawBT) ---
        // RawBT utilise un schéma d'URL spécial. 
        // On envoie le ticket en HTML.
        const base64Html = btoa(unescape(encodeURIComponent(ticketHtml)));
        const rawBtUrl = `rawbt:base64,${base64Html}`;
        
        // On tente d'ouvrir le lien RawBT
        window.location.href = rawBtUrl;
        console.log(`Impression Android (RawBT) lancée pour ${destination}`);
    } else {
        // --- MÉTHODE PC (QZ Tray) ---
        // On suppose que QZ Tray est installé et lancé sur le PC de caisse.
        // Note: QZ Tray requiert la librairie qz-print.js injectée dans le projet.
        if (window.qz) {
            try {
                if (!qz.websocket.isActive()) {
                    await qz.websocket.connect();
                }
                
                // On cherche l'imprimante par son nom (installée sur Windows)
                // ou par son IP si configuré dans QZ
                const configQz = qz.configs.create(printerName || printerIp);
                
                const data = [{
                    type: 'html',
                    format: 'plain',
                    data: ticketHtml
                }];
                
                await qz.print(configQz, data);
                console.log(`Impression QZ Tray réussie pour ${destination}`);
            } catch (err) {
                console.error("Erreur QZ Tray:", err);
                // Si QZ échoue, on peut proposer un fallback ou alerter
            }
            
        } else {
            // Fallback : Si ni Android ni QZ, on ouvre juste une fenêtre d'impression standard
            const printWindow = window.open('', '_blank');
            printWindow.document.write(ticketHtml);
            printWindow.document.close();
            printWindow.print();
        }
    }
};
