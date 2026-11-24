import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user:  null,
        token: null,
        isAuthenticated: false,
      }),

      updateUser: (data) => set((state) => ({
        user: { ...state.user, ...data },
      })),

      isAdmin:   () => get().user?.role?.name === 'admin',
      isManager: () => ['admin', 'manager'].includes(get().user?.role?.name),
      isCashier: () => get().user?.role?.name === 'cashier',
      isWaiter:  () => get().user?.role?.name === 'waiter',
      isCook:    () => get().user?.role?.name === 'cook',
      isDriver:  () => get().user?.role?.name === 'driver',

      hasPermission: (permission) => {
        const perms = get().user?.role?.permissions ?? []
        return perms.includes('*') || perms.includes(permission)
      },

      restaurantId: () => get().user?.restaurant_id,
    }),
    {
      name: 'smartflow-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
