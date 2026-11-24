import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatAmount } from './formatters';

export const generateCakeTicketHTML = (order, settings = {}) => {
  const date = new Date(order.delivery_date);
  const time = order.delivery_time ? order.delivery_time.substring(0, 5) : '12:00';
  const logo = settings?.receipt_logo || '';
  const name = settings?.restaurant_name || 'smartflow POS';
  const address = settings?.restaurant_address || '';
  const phone = settings?.restaurant_phone || '';
  const email = settings?.restaurant_email || '';
  const totalPrice = Number(order.total_price || order.total || 0);
  const advancePaid = Number(order.advance_paid || 0);
  const balance = totalPrice - advancePaid;
  const isPaid = order.is_paid || balance <= 0;
  const orderRef = order.order_number ? order.order_number : `GC-${order.id.toString().padStart(5, '0')}`;
  const vatAmount = Math.round((totalPrice * 0.18) / 1.18);
  const amountHt = Math.max(0, totalPrice - vatAmount);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 10mm; color: #1e293b; line-height: 1.4; background: #fff; }
            .container { max-width: 170mm; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo { max-height: 20mm; filter: grayscale(1); }
            .company-info { text-align: right; }
            .company-name { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: -1px; }
            .company-details { font-size: 10px; color: #64748b; }
            
            .doc-title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: -1.5px; color: #0f172a; border-left: 6px solid ${isPaid ? '#059669' : '#db2777'}; padding-left: 15px; }
            
            .grid { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 30px; }
            .section-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 6px; }
            .info-box { flex: 1; }
            .info-value { font-size: 13px; font-weight: 700; color: #334155; }
            
            .order-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
            .order-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            .order-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            
            .notes-section { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 3px solid #e2e8f0; }
            .notes-text { font-size: 12px; font-style: italic; color: #475569; }
            
            .totals { margin-left: auto; width: 70mm; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
            .total-final { font-size: 20px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 12px; }
            
            .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 10mm; } }
        </style>
    </head>
    <body onload="window.print()">
        <div class="container">
            <div class="header">
                ${logo ? `<img src="${logo}" class="logo">` : '<div></div>'}
                <div class="company-info">
                    <div class="company-name">${name}</div>
                    <div class="company-details">
                        ${address}<br>
                        Tél: ${phone}<br>
                        ${email}
                    </div>
                </div>
            </div>

            <div class="doc-title">${isPaid ? 'Facture' : 'Bon de Commande'}<br><span style="font-size: 16px; color: #64748b; letter-spacing: 0;">${orderRef}</span></div>

            <div class="grid">
                <div class="info-box">
                    <div class="section-title">Doit À (Client)</div>
                    <div class="info-value">${order.customer_name}</div>
                    <div class="info-value" style="font-weight: 500; font-size: 12px; margin-top: 5px;">${order.customer_phone || '-'}</div>
                </div>
                <div class="info-box" style="text-align: right;">
                    <div class="section-title">Livraison Prévue</div>
                    <div class="info-value">${format(date, 'EEEE dd MMMM yyyy', { locale: fr })}</div>
                    <div class="info-value" style="color: ${isPaid ? '#059669' : '#db2777'};">à ${time}</div>
                </div>
            </div>

            <table class="order-table">
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th style="text-align: center;">Quantité</th>
                        <th style="text-align: right;">Prix Unitaire</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: 700;">Gâteau Personnalisé</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">${formatAmount(totalPrice)}</td>
                        <td style="text-align: right; font-weight: 800;">${formatAmount(totalPrice)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-title">Détails de Personnalisation</div>
            <div class="notes-section">
                <div class="notes-text">${(order.notes || order.description || 'Gâteau personnalisé selon spécifications client.').replace(/\n/g, '<br>')}</div>
            </div>

            <div class="totals">
                <div class="total-row">
                    <span>MONTANT TOTAL HT</span>
                    <span>${formatAmount(amountHt)} FCFA</span>
                </div>
                ${isPaid ? `
                <div class="total-row">
                    <span>TVA (18%)</span>
                    <span>${formatAmount(vatAmount)} FCFA</span>
                </div>
                <div class="total-row total-final">
                    <span>TOTAL NET TTC</span>
                    <span>${formatAmount(totalPrice)} FCFA</span>
                </div>
                ` : `
                <div class="total-row">
                    <span>TVA (18%)</span>
                    <span>${formatAmount(vatAmount)} FCFA</span>
                </div>
                <div class="total-row" style="color: #059669; font-weight: 700;">
                    <span>Acompte Reçu</span>
                    <span>-${formatAmount(advancePaid)} FCFA</span>
                </div>
                <div class="total-row total-final">
                    <span>SOLDE À PAYER</span>
                    <span>${formatAmount(balance)} FCFA</span>
                </div>
                `}
            </div>

            <div class="footer">
                ${isPaid ? 'Facture certifiée par Omega POS.' : 'Ce document sert de bon de commande officiel.'}<br><br>
                <strong>smartflow POS</strong> - Gestion Intégrée pour Pâtisseries & Restaurants - ${format(new Date(), 'dd/MM/yyyy HH:mm')}
            </div>
        </div>
    </body>
    </html>
  `;
};
