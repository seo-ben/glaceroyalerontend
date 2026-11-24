import axios from 'axios';
import { initQzSecurity } from './qz-config';

// Initialisation de la sécurité QZ
initQzSecurity();

const connectQzTray = async () => {
    const qz = window.qz;
    if (!qz) {
        throw new Error('QZ Tray n’est pas chargé');
    }

    if (qz.websocket.isActive()) {
        return;
    }

    const endpoints = [
        { host: '127.0.0.1', port: 8181, secure: true },
        { host: '127.0.0.1', port: 8182, secure: false }
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
        try {
            await qz.websocket.connect(endpoint);
            console.log(`QZ Tray connecté sur ${endpoint.host}:${endpoint.port} secure=${endpoint.secure}`);
            return;
        } catch (err) {
            lastError = err;
            console.warn(`Échec connexion QZ Tray ${endpoint.host}:${endpoint.port} secure=${endpoint.secure}`, err);
        }
    }

    throw lastError || new Error('Connexion à QZ Tray impossible');
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
        const base64Html = btoa(unescape(encodeURIComponent(ticketHtml)));
        const rawBtUrl = `rawbt:base64,${base64Html}`;
        
        window.location.href = rawBtUrl;
        console.log(`Impression Android (RawBT) lancée pour ${destination}`);
    } else {
        // --- MÉTHODE PC (QZ Tray) ---
        if (window.qz) {
            try {
                await connectQzTray();

                const qz = window.qz;
                const configQz = qz.configs.create(printerName || printerIp);
                const data = [{
                    type: 'html',
                    format: 'plain',
                    data: ticketHtml
                }];

                await qz.print(configQz, data);
                console.log(`Impression QZ Tray réussie pour ${destination}`);
            } catch (err) {
                console.error('Erreur QZ Tray :', err);
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(ticketHtml);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        } else {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(ticketHtml);
                printWindow.document.close();
                printWindow.print();
            }
        }
    }
};
