import { jsPDF } from 'jspdf';

const fmtNumber = (num, decimals = 2) => {
  const n = Number(num) || 0;
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const fmtAmount = (amount) => {
  const n = Math.round(Number(amount) || 0);
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
};

/**
 * Native Vector A4 Stock PDF generator using pure jsPDF
 */
export const downloadStockPDFClient = (rawIngredients = [], rawAlerts = [], totalValue = 0, settings = {}) => {
  const ingredients = Array.isArray(rawIngredients) ? rawIngredients : [];
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : [];
  
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const companyName  = String(settings?.restaurant_name || 'SMARTFLOW POS / CIGUSTA');
  const address      = String(settings?.restaurant_address || 'Cotonou, Benin');
  const companyPhone = String(settings?.restaurant_phone || '');
  const vatNumber    = String(settings?.vat_number || '1001580865');

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const fileDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Palette
  const dark  = [15, 23, 42];
  const slate = [71, 85, 105];
  const red   = [220, 38, 38];
  const green = [22, 101, 52];
  const bgBox = [248, 250, 252];

  let y = 15;
  const mL = 15;
  const pageW = 210;
  const contentW = pageW - mL * 2;

  // ── HEADER ──
  doc.setTextColor(...dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), mL, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);
  doc.text(`${address} | Tel: ${companyPhone} | IFU: ${vatNumber}`, mL, y + 5);

  doc.setTextColor(...red);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DU STOCK & ETAT DES MANQUANTS', mL, y + 12);

  // Meta Right
  doc.setTextColor(...slate);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${dateStr} - ${timeStr}`, pageW - mL, y + 5, { align: 'right' });
  doc.text('Format: A4 Vectoriel', pageW - mL, y + 10, { align: 'right' });

  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(mL, y + 16, pageW - mL, y + 16);

  y += 22;

  // ── SUMMARY CARDS ──
  const cardW = (contentW - 8) / 3;
  
  // Card 1: Total
  doc.setFillColor(...bgBox);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(mL, y, cardW, 16, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(...slate);
  doc.text('TOTAL ARTICLES', mL + cardW / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(ingredients.length.toString(), mL + cardW / 2, y + 12, { align: 'center' });

  // Card 2: Alerts
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(mL + cardW + 4, y, cardW, 16, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.text('ARTICLES EN MANQUE / RUPTURE', mL + cardW + 4 + cardW / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.text(alerts.length.toString(), mL + cardW + 4 + cardW / 2, y + 12, { align: 'center' });

  // Card 3: Value
  doc.setFillColor(...bgBox);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(mL + (cardW + 4) * 2, y, cardW, 16, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(...slate);
  doc.text('VALEUR TOTALE STOCK', mL + (cardW + 4) * 2 + cardW / 2, y + 5, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(fmtAmount(totalValue), mL + (cardW + 4) * 2 + cardW / 2, y + 12, { align: 'center' });

  y += 22;

  // ── SECTION 1: MANQUANTS / ALERTE ──
  if (alerts.length > 0) {
    doc.setFillColor(...red);
    doc.rect(mL, y, contentW, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUITS & INGREDIENTS A REAPPROVISIONNER (CE QUI MANQUE)', mL + 3, y + 4.2);

    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(mL, y, contentW, 6, 'F');
    doc.setTextColor(...slate);
    doc.setFontSize(7);
    doc.text('DESIGNATION', mL + 3, y + 4);
    doc.text('UNITE', mL + 75, y + 4, { align: 'center' });
    doc.text('STOCK RESTANT', mL + 105, y + 4, { align: 'right' });
    doc.text('SEUIL MIN', mL + 135, y + 4, { align: 'right' });
    doc.text('MANQUANT A COMMANDER', pageW - mL - 3, y + 4, { align: 'right' });

    y += 6;

    alerts.forEach((item) => {
      const nameStr = String(item?.name || 'Produit').substring(0, 35);
      const unitStr = String(item?.unit || 'g');
      const qtyNum = Number(item?.quantity || 0);
      const minNum = Number(item?.min_quantity || 0);
      const shortage = Math.max(0, minNum - qtyNum);

      doc.setFillColor(254, 242, 242);
      doc.rect(mL, y, contentW, 6, 'F');
      doc.setTextColor(...dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(nameStr, mL + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.text(unitStr, mL + 75, y + 4, { align: 'center' });

      doc.setTextColor(...red);
      doc.setFont('helvetica', 'bold');
      doc.text(fmtNumber(qtyNum), mL + 105, y + 4, { align: 'right' });

      doc.setTextColor(...slate);
      doc.setFont('helvetica', 'normal');
      doc.text(fmtNumber(minNum), mL + 135, y + 4, { align: 'right' });

      doc.setTextColor(...red);
      doc.setFont('helvetica', 'bold');
      doc.text(`+ ${fmtNumber(shortage)} ${unitStr}`, pageW - mL - 3, y + 4, { align: 'right' });

      y += 6.5;
    });

    y += 4;
  }

  // ── SECTION 2: INVENTAIRE GLOBAL (CE QUI RESTE) ──
  doc.setFillColor(...dark);
  doc.rect(mL, y, contentW, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTAIRE COMPLET DU STOCK (CE QUI RESTE)', mL + 3, y + 4.2);

  y += 8;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(mL, y, contentW, 6, 'F');
  doc.setTextColor(...slate);
  doc.setFontSize(7);
  doc.text('DESIGNATION', mL + 3, y + 4);
  doc.text('CATEGORIE', mL + 70, y + 4);
  doc.text('STOCK RESTANT', mL + 120, y + 4, { align: 'right' });
  doc.text('SEUIL MIN', mL + 150, y + 4, { align: 'right' });
  doc.text('STATUT', pageW - mL - 3, y + 4, { align: 'right' });

  y += 6;

  ingredients.forEach((item, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }

    const nameStr = String(item?.name || 'Produit').substring(0, 32);
    const catStr  = String(item?.category || 'General').substring(0, 20);
    const unitStr = String(item?.unit || 'g');
    const qtyNum = Number(item?.quantity || 0);
    const minNum = Number(item?.min_quantity || 0);

    const level = qtyNum <= 0 ? 'RUPTURE' : (qtyNum <= minNum ? 'FAIBLE' : 'OK');

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(mL, y, contentW, 5, 'F');
    }

    doc.setTextColor(...dark);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(nameStr, mL + 3, y + 3.6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    doc.text(catStr, mL + 70, y + 3.6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(`${fmtNumber(qtyNum)} ${unitStr}`, mL + 120, y + 3.6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    doc.text(`${fmtNumber(minNum)} ${unitStr}`, mL + 150, y + 3.6, { align: 'right' });

    if (level === 'RUPTURE') {
      doc.setTextColor(...red);
      doc.setFont('helvetica', 'bold');
    } else if (level === 'FAIBLE') {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...green);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(level, pageW - mL - 3, y + 3.6, { align: 'right' });

    y += 5;
  });

  // Footer Signatures
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 8;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineDash([2, 2]);
  doc.line(mL, y, mL + 60, y);
  doc.line(pageW - mL - 60, y, pageW - mL, y);

  doc.setFontSize(7);
  doc.setTextColor(...slate);
  doc.text('Signature Responsable Stock', mL + 30, y + 4, { align: 'center' });
  doc.text('Cachet & Direction', pageW - mL - 30, y + 4, { align: 'center' });

  // Numerotation des pages (Page X sur Y)
  const totalPages = doc.internal.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setFontSize(7);
    doc.setTextColor(...slate);
    doc.text(`Page ${pageNum} sur ${totalPages}`, pageW - mL, 290, { align: 'right' });
    doc.text(`SMARTFLOW POS - Document d'Inventaire Officiel`, mL, 290);
  }

  // Output Blob & trigger explicit download link
  const filename = `Rapport_Stock_${fileDate}.pdf`;
  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (blobErr) {
    console.warn('Fallback doc.save:', blobErr);
    doc.save(filename);
  }
};
