import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'

export function useNotifications() {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.list().then(r => r.data),
    refetchInterval: 60000,
  })

  return {
    alerts:    data?.notifications ?? [],
    hasDanger: data?.has_danger ?? false,
    count:     data?.count ?? 0,
    isLoading,
  }
}
