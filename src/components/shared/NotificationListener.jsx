import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useToast } from '@/components/ui/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { usePrint } from '@/hooks/usePrint'

window.Pusher = Pusher

export default function NotificationListener() {
    const { user } = useAuthStore()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const { printRawTickets } = usePrint()

    useEffect(() => {
        if (!user) return

        const echoConfig = {
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_KEY || 'local',
            cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'mt1',
            forceTLS: true,
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
        }

        if (import.meta.env.VITE_SOKETI_HOST) {
            echoConfig.wsHost = import.meta.env.VITE_SOKETI_HOST
            echoConfig.wsPort = import.meta.env.VITE_SOKETI_PORT || 80
            echoConfig.wssPort = import.meta.env.VITE_SOKETI_PORT || 443
            echoConfig.forceTLS = import.meta.env.VITE_PUSHER_SCHEME === 'https'
        }

        const echo = new Echo(echoConfig)

        // Canal public ou privé ? Ici on utilise le canal public du restaurant
        const channelName = `restaurant.${user.restaurant_id}`
        
        console.log(`🔔 Écoute des notifications sur: ${channelName}`)

        echo.channel(channelName)
            .listen('.order.created', (e) => {
                console.log('📦 Nouvelle commande reçue:', e.order)
                
                // Jouer le son
                playNotificationSound()

                // Impression automatique des tickets de production (Cuisine, Bar, Pizza)
                if (e.tickets && e.tickets.length > 0) {
                    console.log('🖨️ Impression automatique des bons de production...');
                    printRawTickets(e.tickets);
                }

                // Afficher un toast
                toast({
                    title: "🔔 Nouvelle Commande !",
                    description: `Commande N°${e.order.order_number} (${e.order.type === 'dine_in' ? 'Sur Place' : 'A Emporter'})`,
                    variant: "default",
                })

                // Rafraîchir les données des commandes
                queryClient.invalidateQueries({ queryKey: ['orders'] })
                queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            })

        return () => {
            echo.leave(channelName)
        }
    }, [user])

    // Fonction pour générer un son de notification (Ding)
    const playNotificationSound = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)()
            const osc = context.createOscillator()
            const gain = context.createGain()

            osc.type = 'triangle' // Son doux
            osc.frequency.setValueAtTime(880, context.currentTime) // Note La
            osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5)

            gain.gain.setValueAtTime(0.5, context.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)

            osc.connect(gain)
            gain.connect(context.destination)

            osc.start()
            osc.stop(context.currentTime + 0.5)
        } catch (e) {
            console.error("Impossible de jouer le son de notification:", e)
        }
    }

    return null // Ce composant ne rend rien visuellement
}
