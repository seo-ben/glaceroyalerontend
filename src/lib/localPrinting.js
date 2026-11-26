import axios from 'axios';
import html2canvas from 'html2canvas';
import { initQzSecurity } from './qz-config';

// Initialisation de la sécurité QZ
initQzSecurity();

/**
 * Convertit un ticket HTML en image PNG (base64 sans préfixe data:) via Chrome + html2canvas.
 * Évite les bugs de rendu blanc du moteur HTML JavaFX de QZ Tray sur Windows.
 */
const renderHtmlToBase64Png = async (ticketHtml, widthPx = 280) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = `${widthPx}px`;
    iframe.style.height = '10px';
    iframe.style.border = 'none';
    iframe.style.background = '#ffffff';
    document.body.appendChild(iframe);

    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(ticketHtml);
        doc.close();

        // Attendre le chargement éventuel des images (logo, etc.)
        const imgs = Array.from(doc.images || []);
        await Promise.all(
            imgs.map((img) =>
                img.complete
                    ? Promise.resolve()
                    : new Promise((res) => {
                          img.onload = res;
                          img.onerror = res;
                          setTimeout(res, 1500);
                      })
            )
        );

        // Ajuster la hauteur de l'iframe au contenu réel du ticket
        const contentHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 100);
        iframe.style.height = `${contentHeight + 20}px`;

        const canvas = await html2canvas(doc.body, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
            width: widthPx,
            height: contentHeight,
            windowWidth: widthPx,
            windowHeight: contentHeight,
        });

        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl.replace(/^data:image\/png;base64,/, '');
    } finally {
        document.body.removeChild(iframe);
    }
};

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
                
                // Rendu Chrome -> PNG base64 -> QZ Tray (évite les pages blanches JavaFX sur Windows)
                const targetPrinter = printerName || printerIp;
                const widthPx = config?.receipt_width === '58mm' ? 215 : 295;
                const base64Png = await renderHtmlToBase64Png(ticketHtml, widthPx);

                const configQz = qz.configs.create(targetPrinter, {
                    margins: 0,
                    scaleContent: true,
                    colorType: 'blackwhite',
                });

                const data = [{
                    type: 'pixel',
                    format: 'image',
                    flavor: 'base64',
                    data: base64Png
                }];

                await qz.print(configQz, data);
                console.log(`Impression QZ Tray (PNG) réussie pour ${destination} sur "${targetPrinter}"`);
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
