import axios from 'axios';
import { initQzSecurity } from './qz-config';

// Initialisation de la sécurité QZ
initQzSecurity();

export const ACTIVE_REGISTER_KEY = 'pos_active_register';

export const getActiveRegister = () => {
    try {
        return localStorage.getItem(ACTIVE_REGISTER_KEY) === '2' ? '2' : '1';
    } catch {
        return '1';
    }
};

export const setActiveRegister = (registerId) => {
    const normalized = String(registerId) === '2' ? '2' : '1';
    try {
        localStorage.setItem(ACTIVE_REGISTER_KEY, normalized);
        window.dispatchEvent(new CustomEvent('pos-register-changed', { detail: normalized }));
    } catch {
        // ignore storage errors
    }
    return normalized;
};

/**
 * Service pour dispatcher l'impression vers QZ Tray (PC) ou RawBT (Android)
 */
export const printToLocalDevice = async (ticketHtml, destination, config) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Récupération des paramètres pour ce pôle
    // Destinations possibles : kitchen, bar, pizza, cakes, reports, receipt
    let printerIp = config[`${destination}_printer_ip`];
    let printerName = config[`${destination}_printer_name`];

    // Routage multi-caisse par poste (Caisse 1 ou Caisse 2 mémorisée sur l'appareil)
    if (destination === 'receipt' && getActiveRegister() === '2') {
        printerIp = config['receipt_printer_2_ip'] || config['receipt_printer_ip'];
        printerName = config['receipt_printer_2_name'] || config['receipt_printer_name'];
    }

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
                // S'assurer que le certificat et l'algorithme SHA1 sont bien configurés
                initQzSecurity();

                if (!qz.websocket.isActive()) {
                    await qz.websocket.connect();
                }
                
                // Configuration QZ Tray 2.2+ optimisée pour imprimante thermique 58mm / 80mm
                const targetPrinter = printerName || printerIp;
                const widthMm = config?.receipt_width === '58mm' ? 58 : 80;
                const configQz = qz.configs.create(targetPrinter, {
                    units: 'mm',
                    size: { width: widthMm },
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                    scaleContent: true,
                    rasterize: true,
                });

                const data = [{
                    type: 'pixel',
                    format: 'html',
                    flavor: 'plain',
                    data: ticketHtml
                }];

                await qz.print(configQz, data);
                console.log(`Impression QZ Tray réussie pour ${destination} sur "${targetPrinter}" (${widthMm}mm)`);
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
