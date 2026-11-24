import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import apiClient from '@/api/client'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const { setVatRate } = useCartStore()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { data: config } = useQuery({
    queryKey: ['settings-config'],
    queryFn:  () => apiClient.get('/settings/config').then(r => r.data),
    enabled: !!isAuthenticated,
  })

  useEffect(() => {
    if (config?.default_vat_rate !== undefined) {
        setVatRate(config.default_vat_rate)
    }
  }, [config, setVatRate])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
