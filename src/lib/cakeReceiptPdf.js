import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * PDF-safe amount formatter.
 * Intl.NumberFormat('fr-FR') uses U+202F (narrow no-break space) as thousands separator,
 * which jsPDF's built-in Helvetica cannot render (shows as "/" or garbage).
 * This function uses a regular ASCII space instead.
 */
const fmtAmount = (amount) => {
  const n = Math.round(Number(amount) || 0);
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
};

/**
 * Generate and download a professional PDF receipt for a cake order.
 * Pure jsPDF vector drawing — crisp at any zoom, small file size.
 */
export const downloadCakeReceiptPDF = (order, settings = {}, forceInvoice = false) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Data ──
  const companyName  = settings?.restaurant_name || 'Omega POS';
  const address      = settings?.restaurant_address || '';
  const companyPhone = settings?.restaurant_phone || '';
  const email        = settings?.restaurant_email || '';
  const vatNumber    = settings?.vat_number || '1001580865';

  const deliveryDate = new Date(order.delivery_date);
  const deliveryTime = order.delivery_time ? order.delivery_time.substring(0, 5) : '12:00';
  const totalPrice   = Number(order.total_price || order.total || 0);
  const advancePaid  = Number(order.advance_paid || 0);
  const balance      = totalPrice - advancePaid;
  const isPaid       = order.is_paid || balance <= 0 || forceInvoice;
  const orderRef     = order.order_number ? order.order_number : `GC-${order.id.toString().padStart(5, '0')}`;
  const notes        = order.notes || order.description || 'Gateau personnalise selon specifications client.';
  const nowStr       = format(new Date(), 'dd/MM/yyyy HH:mm');
  const nowFull      = format(new Date(), "dd MMMM yyyy 'a' HH:mm", { locale: fr });
  const paymentMethod = (order.payment_method || 'ESPECES').toUpperCase();

  // ── Palette ──
  const ink       = [15, 23, 42];
  const slate     = [71, 85, 105];
  const muted     = [148, 163, 184];
  const faint     = [203, 213, 225];
  const accent    = [219, 39, 119];
  const emerald   = [5, 150, 105];
  const bgPanel   = [248, 250, 252];
  const bgDark    = [15, 23, 42];
  const white     = [255, 255, 255];

  // ── Layout constants ──
  const mL = 20;                // left margin
  const mR = 20;                // right margin
  const pW = 210 - mL - mR;    // page width usable = 170mm
  const rX = mL + pW;          // right edge X

  let y = 0;

  // ── Helpers ──
  const txt = (str, x, yy, { sz = 10, c = ink, bold = false, align = 'left' } = {}) => {
    doc.setFontSize(sz);
    doc.setTextColor(...c);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(String(str), x, yy, { align });
  };

  const line = (x1, yy, x2, c = faint, w = 0.3) => {
    doc.setDrawColor(...c);
    doc.setLineWidth(w);
    doc.line(x1, yy, x2, yy);
  };

  const box = (x, yy, w, h, c) => {
    doc.setFillColor(...c);
    doc.rect(x, yy, w, h, 'F');
  };

  const roundedBox = (x, yy, w, h, r, c) => {
    doc.setFillColor(...c);
    doc.roundedRect(x, yy, w, h, r, r, 'F');
  };

  // ══════════════════════════════════════════════════
  //  TOP BANNER — Dark header bar
  // ══════════════════════════════════════════════════
  box(0, 0, 210, 38, bgDark);

  // Company name
  txt(companyName.toUpperCase(), mL, 14, { sz: 18, c: white, bold: true });

  // Subtitle line
  const subParts = [address, companyPhone ? `Tel: ${companyPhone}` : '', `IFU: ${vatNumber}`].filter(Boolean);
  if (subParts.length) {
    txt(subParts.join('  |  '), mL, 22, { sz: 7, c: muted });
  }

  // Document type badge (right side of banner)
  if (isPaid) {
    roundedBox(rX - 55, 8, 55, 22, 3, emerald);
    txt('FACTURE', rX - 55 + 27.5, 18, { sz: 9, c: white, bold: true, align: 'center' });
    txt('FACTURE PAYEE', rX - 55 + 27.5, 24, { sz: 6, c: [200, 255, 220], align: 'center' });
  } else {
    roundedBox(rX - 55, 8, 55, 22, 3, accent);
    txt('BON DE COMMANDE', rX - 52 + 24, 18, { sz: 9, c: white, bold: true, align: 'center' });
    txt('CONFIRMATION GATEAU', rX - 52 + 24, 24, { sz: 6, c: [255, 200, 230], align: 'center' });
  }

  y = 48;

  // ══════════════════════════════════════════════════
  //  REFERENCE + DATE ROW
  // ══════════════════════════════════════════════════
  txt(`Ref: ${orderRef}`, mL, y, { sz: 12, bold: true, c: isPaid ? emerald : accent });
  txt(`Emis le ${nowFull}`, rX, y, { sz: 8, c: muted, align: 'right' });

  y += 10;
  line(mL, y, rX, faint, 0.4);
  y += 8;

  // ══════════════════════════════════════════════════
  //  CLIENT & DELIVERY — Two-column info cards
  // ══════════════════════════════════════════════════
  const cardW = (pW - 8) / 2;

  // Left card: Client
  roundedBox(mL, y, cardW, 30, 2.5, bgPanel);
  txt('DOIT A (CLIENT)', mL + 5, y + 6, { sz: 6, c: muted, bold: true });
  txt(order.customer_name || '-', mL + 5, y + 13, { sz: 12, bold: true });
  txt(order.customer_phone || 'Pas de numero', mL + 5, y + 19, { sz: 8, c: slate });

  // Right card: Delivery / Status
  const rcX = mL + cardW + 8;
  roundedBox(rcX, y, cardW, 30, 2.5, bgPanel);
  txt('LIVRAISON PREVUE', rcX + 5, y + 6, { sz: 6, c: muted, bold: true });
  txt(format(deliveryDate, 'EEEE dd MMMM yyyy', { locale: fr }), rcX + 5, y + 13, { sz: 11, bold: true });
  txt(`a ${deliveryTime}`, rcX + 5, y + 19, { sz: 10, c: isPaid ? emerald : accent, bold: true });

  y += 38;

  // ══════════════════════════════════════════════════
  //  ORDER TABLE
  // ══════════════════════════════════════════════════
  // Table header
  box(mL, y, pW, 9, bgDark);
  txt('DESIGNATION', mL + 4, y + 6, { sz: 7, c: white, bold: true });
  txt('QTE', mL + 100, y + 6, { sz: 7, c: white, bold: true, align: 'center' });
  txt('PRIX UNIT.', mL + 135, y + 6, { sz: 7, c: white, bold: true, align: 'right' });
  txt('TOTAL', rX - 4, y + 6, { sz: 7, c: white, bold: true, align: 'right' });

  y += 9;

  // Table row
  const rowH = 12;
  box(mL, y, pW, rowH, [255, 255, 255]);
  line(mL, y + rowH, rX, faint, 0.2);

  txt('Gateau Personnalise', mL + 4, y + 8, { sz: 10, bold: true });
  txt('1', mL + 100, y + 8, { sz: 10, align: 'center' });
  txt(fmtAmount(totalPrice), mL + 135, y + 8, { sz: 10, align: 'right' });
  txt(fmtAmount(totalPrice), rX - 4, y + 8, { sz: 10, bold: true, align: 'right' });

  y += rowH + 8;

  // ══════════════════════════════════════════════════
  //  NOTES / PERSONALIZATION SECTION
  // ══════════════════════════════════════════════════
  txt('DETAILS DE PERSONNALISATION', mL, y, { sz: 7, c: muted, bold: true });
  y += 5;

  const noteLines = doc.splitTextToSize(notes, pW - 14);
  const noteH = Math.max(noteLines.length * 4.5 + 8, 18);

  roundedBox(mL, y, pW, noteH, 2, bgPanel);
  // Accent left bar
  doc.setFillColor(...(isPaid ? emerald : accent));
  doc.rect(mL, y, 1.5, noteH, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...slate);
  doc.setFont('helvetica', 'italic');
  doc.text(noteLines, mL + 7, y + 6);

  y += noteH + 10;

  // ══════════════════════════════════════════════════
  //  TOTALS BLOCK — Right-aligned
  // ══════════════════════════════════════════════════
  const totW = 85;
  const totX = rX - totW;

  if (isPaid) {
    const vatAmount = Math.round((totalPrice * 0.18) / 1.18);
    const amountHt = Math.max(0, totalPrice - vatAmount);

    // Montant HT row
    txt('MONTANT TOTAL HT', totX, y, { sz: 8, c: slate, bold: true });
    txt(`${fmtAmount(amountHt)} FCFA`, rX - 4, y, { sz: 8, align: 'right' });
    y += 6;

    // TVA row
    txt('TVA (18%)', totX, y, { sz: 8, c: slate, bold: true });
    txt(`${fmtAmount(vatAmount)} FCFA`, rX - 4, y, { sz: 8, align: 'right' });
    y += 7;

    line(totX, y, rX, ink, 0.6);
    y += 2;

    // TOTAL NET TTC box
    const soldeH = 16;
    roundedBox(totX, y, totW, soldeH, 2.5, emerald);
    txt('TOTAL NET TTC', totX + 5, y + 10, { sz: 8, c: white, bold: true });
    txt(`${fmtAmount(totalPrice)} FCFA`, rX - 5, y + 10, { sz: 12, c: white, bold: true, align: 'right' });

    y += soldeH + 10;

    // Payment details box
    roundedBox(mL, y, pW, 14, 2, bgPanel);
    txt(`MODE DE PAIEMENT : ${paymentMethod}`, mL + 5, y + 6, { sz: 8, c: ink, bold: true });
    txt('STATUT : INTEGRALEMENT PAYE ET ENCAISSE (RESTE : 0 FCFA)', mL + 5, y + 11, { sz: 7, c: emerald, bold: true });
    y += 20;
  } else {
    // Sous-total row
    txt('Sous-total', totX, y, { sz: 10, c: slate });
    txt(fmtAmount(totalPrice), rX - 4, y, { sz: 10, align: 'right' });
    y += 7;

    // Acompte row
    txt('Acompte recu', totX, y, { sz: 10, c: emerald, bold: true });
    txt(`- ${fmtAmount(advancePaid)}`, rX - 4, y, { sz: 10, c: emerald, bold: true, align: 'right' });
    y += 4;

    line(totX, y, rX, ink, 0.6);
    y += 2;

    // SOLDE box
    const soldeH = 16;
    roundedBox(totX, y, totW, soldeH, 2.5, bgDark);
    txt('SOLDE A PAYER', totX + 5, y + 10, { sz: 8, c: muted, bold: true });
    txt(fmtAmount(balance), rX - 5, y + 10, { sz: 14, c: white, bold: true, align: 'right' });

    y += soldeH + 16;
  }

  // ══════════════════════════════════════════════════
  //  SIGNATURES (two columns)
  // ══════════════════════════════════════════════════
  const sigW = 60;
  // Left signature
  line(mL, y, mL + sigW, faint, 0.3);
  txt('Signature du Client', mL + sigW / 2, y + 4, { sz: 7, c: muted, align: 'center' });

  // Right signature
  line(rX - sigW, y, rX, faint, 0.3);
  txt('Cachet / Direction', rX - sigW / 2, y + 4, { sz: 7, c: muted, align: 'center' });

  y += 18;

  // ══════════════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════════════
  line(mL, y, rX, [241, 245, 249], 0.2);
  y += 5;
  const cX = mL + pW / 2;
  const docNotice = isPaid 
    ? 'Facture certifiee par Omega POS.'
    : 'Ce document sert de bon de commande officiel.';
  txt(docNotice, cX, y, { sz: 7, c: muted, align: 'center' });
  y += 3.5;
  txt(`${companyName} | ${nowStr}`, cX, y, { sz: 6, c: faint, align: 'center' });

  // ── Download ──
  const safeName = (order.customer_name || 'client').replace(/[^a-zA-Z0-9]/g, '_');
  const filePrefix = isPaid ? 'Facture' : 'Recu_Gateau';
  doc.save(`${filePrefix}_${orderRef}_${safeName}.pdf`);
};
