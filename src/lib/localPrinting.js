import { initQzSecurity } from './qz-config';

// Initialisation de la sécurité QZ
initQzSecurity();

const cleanText = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/œ/g, 'oe')
        .replace(/Œ/g, 'OE')
        .replace(/×/g, 'x')
        .replace(/•/g, '-')
        .replace(/€/g, 'EUR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const padLine = (left, right, width) => {
    const l = cleanText(left);
    const r = cleanText(right);
    if (!r) return l;
    if (l.length + r.length + 1 > width) {
        const maxLeft = Math.max(4, width - r.length - 1);
        return `${l.slice(0, maxLeft)} ${r}`;
    }
    return `${l}${' '.repeat(width - l.length - r.length)}${r}`;
};

const wrapText = (text, maxWidth) => {
    const clean = cleanText(text);
    if (!clean) return [];
    if (clean.length <= maxWidth) return [clean];
    const words = clean.split(' ');
    const lines = [];
    let current = '';
    for (const w of words) {
        if (!current) {
            current = w.slice(0, maxWidth);
        } else if (current.length + 1 + w.length <= maxWidth) {
            current += ` ${w}`;
        } else {
            lines.push(current);
            current = w.slice(0, maxWidth);
        }
    }
    if (current) lines.push(current);
    return lines;
};

/**
 * Formate une ligne de tableau à 4 colonnes : Art | Qt | PU | Tot
 * 80mm (42 col) : 19 + 4 + 9 + 10 = 42
 * 58mm (32 col) : 13 + 3 + 8 + 8  = 32
 */
const formatFourColRow = (art, qt, pu, tot, widthCols) => {
    const [wArt, wQt, wPu, wTot] = widthCols >= 42 ? [19, 4, 9, 10] : [13, 3, 8, 8];
    const artLines = wrapText(art, wArt);
    const firstArt = (artLines[0] || '').padEnd(wArt, ' ');
    const qtStr = cleanText(qt).slice(0, wQt).padStart(wQt, ' ');
    const puStr = cleanText(pu).slice(0, wPu).padStart(wPu, ' ');
    const totStr = cleanText(tot).slice(0, wTot).padStart(wTot, ' ');

    const rows = [`${firstArt}${qtStr}${puStr}${totStr}`];
    for (let i = 1; i < artLines.length; i++) {
        rows.push(artLines[i]);
    }
    return rows.join('\n') + '\n';
};

/**
 * Convertit un ticket HTML en commandes RAW ESC/POS natives (58mm = 32 col, 80mm = 42 col).
 * Reproduit fidèlement la mise en page du ticket (en-tête centré, 4 colonnes Art/Qt/PU/Tot, totaux, pied de page).
 */
const htmlToEscPos = (ticketHtml, widthCols = 42) => {
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = `${ESC}@`;
    const ALIGN_LEFT = `${ESC}a\x00`;
    const ALIGN_CENTER = `${ESC}a\x01`;
    const BOLD_ON = `${ESC}E\x01`;
    const BOLD_OFF = `${ESC}E\x00`;
    const SIZE_NORMAL = `${GS}!\x00`;
    const SIZE_DOUBLE = `${GS}!\x11`;
    const SIZE_TALL = `${GS}!\x01`;
    const CUT = `\n\n\n\n${GS}V\x41\x03`;
    const DIVIDER = `${'-'.repeat(widthCols)}\n`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(ticketHtml || '', 'text/html');
    const chunks = [INIT, ALIGN_LEFT, SIZE_NORMAL, BOLD_OFF];

    const pushWrappedText = (text, { center = false, bold = false, size = SIZE_NORMAL }) => {
        const effectiveWidth = size === SIZE_DOUBLE ? Math.floor(widthCols / 2) : widthCols;
        const lines = wrapText(text, effectiveWidth);
        if (lines.length === 0) return;
        chunks.push(center ? ALIGN_CENTER : ALIGN_LEFT);
        chunks.push(bold ? BOLD_ON : BOLD_OFF);
        chunks.push(size);
        for (const line of lines) {
            chunks.push(`${line}\n`);
        }
        chunks.push(SIZE_NORMAL, BOLD_OFF, ALIGN_LEFT);
    };

    const walk = (node, ctx = { center: false, bold: false }) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const txt = cleanText(node.textContent);
            if (txt) {
                pushWrappedText(txt, { center: ctx.center, bold: ctx.bold, size: SIZE_NORMAL });
            }
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tag = node.tagName.toLowerCase();
        if (['style', 'script', 'head', 'img', 'svg', 'br'].includes(tag)) return;

        const cls = (node.getAttribute('class') || '').toLowerCase();
        const style = (node.getAttribute('style') || '').toLowerCase();

        if (cls.includes('divider') || tag === 'hr') {
            chunks.push(ALIGN_LEFT, BOLD_OFF, SIZE_NORMAL, DIVIDER);
            return;
        }

        const isCenter = ctx.center || cls.includes('center') || style.includes('text-align: center') || style.includes('text-align:center');
        const isBold = ctx.bold || tag === 'strong' || tag === 'b' || tag === 'th' || cls.includes('bold') || cls.includes('total-row') || style.includes('font-weight: bold') || style.includes('font-weight:bold');
        const isXLarge = cls.includes('xlarge') || style.includes('font-size: 14px') || style.includes('font-size: 18px');
        const isLarge = cls.includes('large') || cls.includes('total-row') || style.includes('font-size: 13px');

        if (cls.includes('boxed')) {
            const inner = Math.floor(widthCols / 2) - 2;
            const label = cleanText(node.textContent).slice(0, inner);
            const padL = Math.floor((inner - label.length) / 2);
            const padR = inner - label.length - padL;
            chunks.push(ALIGN_LEFT, BOLD_ON, SIZE_NORMAL, `+${'-'.repeat(widthCols - 2)}+\n`);
            chunks.push(SIZE_DOUBLE, `|${' '.repeat(padL)}${label}${' '.repeat(padR)}|\n`);
            chunks.push(SIZE_NORMAL, `+${'-'.repeat(widthCols - 2)}+\n`, BOLD_OFF);
            return;
        }

        if (tag === 'tr' && cls.includes('kitem-tr')) {
            for (const child of Array.from(node.querySelectorAll('td'))) walk(child, { center: false, bold: true });
            chunks.push(ALIGN_LEFT, BOLD_OFF, SIZE_NORMAL, DIVIDER);
            return;
        }

        if (cls.includes('kitem')) {
            const kids = Array.from(node.children);
            const left = cleanText(kids[0]?.textContent);
            const right = cleanText(kids[kids.length - 1]?.textContent);
            chunks.push(ALIGN_LEFT, BOLD_ON, SIZE_TALL, `${padLine(left, right, widthCols)}\n`, SIZE_NORMAL, BOLD_OFF);
            return;
        }

        if (tag === 'tr') {
            if (cls.includes('total-row')) {
                chunks.push(ALIGN_LEFT, BOLD_OFF, SIZE_NORMAL, DIVIDER);
            }
            const cells = Array.from(node.querySelectorAll(':scope > td, :scope > th'));
            if (cells.length === 4) {
                const isHeader = node.parentElement?.tagName?.toLowerCase() === 'thead';
                chunks.push(ALIGN_LEFT, (isBold || isHeader) ? BOLD_ON : BOLD_OFF, SIZE_NORMAL);
                chunks.push(formatFourColRow(
                    cells[0].textContent,
                    cells[1].textContent,
                    cells[2].textContent,
                    cells[3].textContent,
                    widthCols
                ));
                chunks.push(BOLD_OFF);
                return;
            }
            if (cells.length >= 2) {
                const left = cells.slice(0, -1).map((c) => cleanText(c.textContent)).filter(Boolean).join(' ');
                const right = cleanText(cells[cells.length - 1].textContent);
                chunks.push(ALIGN_LEFT);
                chunks.push(isBold ? BOLD_ON : BOLD_OFF);
                chunks.push(isLarge ? SIZE_TALL : SIZE_NORMAL);
                chunks.push(`${padLine(left, right, widthCols)}\n`);
                chunks.push(SIZE_NORMAL, BOLD_OFF);
                return;
            }
        }

        // Ligne flex à 2 colonnes (ex: tickets cuisine/gâteaux)
        if (style.includes('justify-content:space-between') || style.includes('justify-content: space-between')) {
            const children = Array.from(node.children);
            if (children.length >= 2) {
                const left = cleanText(children[0].textContent);
                const right = cleanText(children[children.length - 1].textContent);
                chunks.push(ALIGN_LEFT, isBold ? BOLD_ON : BOLD_OFF, SIZE_NORMAL);
                chunks.push(`${padLine(left, right, widthCols)}\n`);
                chunks.push(BOLD_OFF);
                return;
            }
        }

        const hasBlockChildren = Array.from(node.children).some((c) =>
            ['div', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'p', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'hr', 'br'].includes(c.tagName.toLowerCase())
        );

        if (!hasBlockChildren) {
            const txt = cleanText(node.textContent);
            if (txt) {
                const size = isXLarge ? SIZE_DOUBLE : (isLarge ? SIZE_TALL : SIZE_NORMAL);
                pushWrappedText(txt, { center: isCenter, bold: isBold, size });
            }
            return;
        }

        for (const child of Array.from(node.childNodes)) {
            walk(child, { center: isCenter, bold: isBold });
        }
    };

    walk(doc.body);
    chunks.push(SIZE_NORMAL, BOLD_OFF, ALIGN_LEFT, CUT);
    return chunks;
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
                
                // Impression RAW ESC/POS native vers QZ Tray (garanti non-blanc sur Birch / POS80 / 58mm)
                const targetPrinter = printerName || printerIp;
                const widthCols = config?.receipt_width === '58mm' ? 32 : 42;
                const escPosData = htmlToEscPos(ticketHtml, widthCols);

                const configQz = qz.configs.create(targetPrinter);
                await qz.print(configQz, escPosData);
                console.log(`Impression QZ Tray (RAW ESC/POS ${widthCols}col) réussie pour ${destination} sur "${targetPrinter}"`);
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
