import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/lib/constants'

export function usePermissions() {
  const { user, isAdmin, isManager, hasPermission } = useAuthStore()

  const role = user?.role?.name

  return {
    role,
    isAdmin:    isAdmin(),
    isManager:  isManager(),
    isCashier:  role === ROLES.CASHIER,
    isWaiter:   role === ROLES.WAITER,
    isCook:     role === ROLES.COOK,
    isDriver:   role === ROLES.DRIVER,
    can: hasPermission,

    // Quick access helpers
    canManageOrders:   ['admin','manager','cashier'].includes(role),
    canManageStock:    ['admin','manager'].includes(role),
    canManageUsers:    ['admin','manager'].includes(role),
    canViewReports:    ['admin','manager'].includes(role),
    canApplyDiscount:  ['admin','manager'].includes(role),
    canCancelItems:    ['admin','manager'].includes(role),
    canAccessKitchen:  ['admin','manager','cook'].includes(role),
    canAccessPOS:      ['admin','manager','cashier'].includes(role),
    canApproveCancellations: ['admin','manager','cashier'].includes(role),
  }
}
