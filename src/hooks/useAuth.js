import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { setAuth, logout: clearAuth } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token)
      queryClient.clear()
      navigate('/dashboard')
    },
  })

  const pinMutation = useMutation({
    mutationFn: (data) => authApi.loginPin(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token)
      queryClient.clear()
      navigate('/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
    onError: () => {
      clearAuth()
      navigate('/login')
    },
  })

  return {
    login:     loginMutation,
    loginPin:  pinMutation,
    logout:    logoutMutation,
  }
}
