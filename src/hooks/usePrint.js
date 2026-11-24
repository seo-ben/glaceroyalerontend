import { useCallback } from 'react'
import { receiptsApi } from '@/api/receipts'
import { printToLocalDevice } from '@/lib/localPrinting'
import apiClient from '@/api/client'
import { toast } from '@/components/ui/use-toast'

export function usePrint() {
  const getSettings = async () => {
    const { data } = await apiClient.get('/settings');
    return data.settings || {};
  };

  const printReceipt = useCallback(async (orderId, type = 'receipt') => {
    try {
      const { data: html } = type === 'invoice' 
        ? await receiptsApi.invoiceHtml(orderId)
        : await receiptsApi.html(orderId)
        
      const htmlContent = typeof html === 'string' ? html : html.html;

      const win = window.open('', '_blank', 'width=800,height=900')
      win.document.write(htmlContent)
      win.document.close()
      win.focus()
      setTimeout(() => { win.print(); win.close() }, 500)
    } catch (err) {
      console.error('Print error:', err)
    }
  }, [])

  const downloadReceipt = useCallback(async (orderId, type = 'receipt') => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/orders/${orderId}/ticket?type=${type}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download error:', err)
    }
  }, [])

  const printNetworkReceipt = useCallback(async (orderId) => {
    try {
      toast({
        title: "Impression",
        description: "Envoi à l'imprimante en cours...",
      });
      
      // 1. On récupère l'HTML du ticket
      const { data } = await receiptsApi.html(orderId);
      const htmlContent = typeof data === 'string' ? data : data.html;
      
      // 2. On récupère les réglages pour l'imprimante
      const settings = await getSettings();
      
      // 3. On envoie au bridge local (QZ Tray ou RawBT)
      await printToLocalDevice(htmlContent, 'receipt', settings);
      
      console.log('Impression locale lancée via bridge');
      toast({
        title: "Succès",
        description: "Ticket imprimé avec succès.",
      });
    } catch (err) {
      console.error('Local Bridge Print error:', err);
      toast({
        title: "Erreur d'impression",
        description: "Impossible d'imprimer. Vérifiez QZ Tray et l'imprimante.",
        variant: "destructive"
      });
    }
  }, []);

  const bulkPrintNetwork = useCallback(async (orderIds) => {
    try {
      const settings = await getSettings();
      for (const id of orderIds) {
        const { data } = await receiptsApi.html(id);
        const htmlContent = typeof data === 'string' ? data : data.html;
        await printToLocalDevice(htmlContent, 'receipt', settings);
      }
    } catch (err) {
      console.error('Bulk Local Print error:', err);
    }
  }, []);

  const printCakeNetwork = useCallback(async (id) => {
    try {
      toast({ title: "Impression", description: "Envoi à l'imprimante..." });
      const { data: ticketData } = await apiClient.get(`/cake-orders/${id}/ticket?format=html`);
      const settings = await getSettings();
      await printToLocalDevice(ticketData.html, 'receipt', settings);
      toast({ title: "Succès", description: "Ticket de gâteau imprimé." });
    } catch (err) {
        console.error('Cake Print error:', err);
        toast({ title: "Erreur d'impression", description: "Vérifiez QZ Tray.", variant: "destructive" });
    }
  }, []);

  const printTabNetwork = useCallback(async (id) => {
    try {
      const { data: ticketData } = await apiClient.get(`/customer-tabs/${id}/invoice`);
      const settings = await getSettings();
      await printToLocalDevice(ticketData.html, 'receipt', settings);
    } catch (err) {
        console.error('Tab Print error:', err);
    }
  }, []);

  const printRawTickets = useCallback(async (tickets) => {
    try {
      if (!tickets || tickets.length === 0) return;
      
      const settings = await getSettings();
      for (const ticket of tickets) {
        // ticket.destination est 'kitchen', 'bar', ou 'pizza'
        // ticket.html contient le code HTML généré par l'API
        await printToLocalDevice(ticket.html, ticket.destination, settings);
      }
    } catch (err) {
      console.error('Raw tickets printing error:', err);
    }
  }, []);

  return { 
    printReceipt, 
    downloadReceipt, 
    printNetworkReceipt,
    printCakeNetwork,
    printTabNetwork,
    bulkPrintNetwork,
    printRawTickets,
    printInvoice: (id) => printReceipt(id, 'invoice'), 
    downloadInvoice: (id) => downloadReceipt(id, 'invoice') 
  }
}
