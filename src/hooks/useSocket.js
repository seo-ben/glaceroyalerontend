import { useEffect, useRef, useCallback } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useAuthStore } from '@/stores/authStore'

let echoInstance = null

function getEcho(token) {
  if (echoInstance) return echoInstance

  window.Pusher = Pusher

  const echoConfig = {
    broadcaster: 'pusher',
    key:     import.meta.env.VITE_PUSHER_KEY,
    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    forceTLS: true,
    disableStats: true,
    authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
    auth: { headers: { Authorization: `Bearer ${token}` } },
  }

  if (import.meta.env.VITE_SOKETI_HOST) {
    echoConfig.wsHost = import.meta.env.VITE_SOKETI_HOST
    echoConfig.wsPort = import.meta.env.VITE_SOKETI_PORT || 80
    echoConfig.wssPort = import.meta.env.VITE_SOKETI_PORT || 443
    echoConfig.forceTLS = import.meta.env.VITE_PUSHER_SCHEME === 'https'
  }

  echoInstance = new Echo(echoConfig)

  return echoInstance
}

export function useSocket(channel, event, callback) {
  const { token, isAuthenticated } = useAuthStore()
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!isAuthenticated || !token || !channel || !event) return

    const echo = getEcho(token)
    const ch   = echo.private(channel)
    ch.listen(event, (data) => cbRef.current(data))

    return () => {
      ch.stopListening(event)
    }
  }, [channel, event, isAuthenticated, token])
}

export function useSocketPresence(channel) {
  const { token, isAuthenticated } = useAuthStore()
  const membersRef = useRef([])

  useEffect(() => {
    if (!isAuthenticated || !token || !channel) return

    const echo = getEcho(token)
    echo.join(channel)
      .here((users) => { membersRef.current = users })
      .joining((user) => { membersRef.current = [...membersRef.current, user] })
      .leaving((user) => { membersRef.current = membersRef.current.filter(u => u.id !== user.id) })

    return () => echo.leave(channel)
  }, [channel, isAuthenticated, token])

  return membersRef
}
