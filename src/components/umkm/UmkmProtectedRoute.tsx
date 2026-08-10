import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function UmkmProtectedRoute() {
  const { user, loading, initialized, role } = useAuthStore()

  if (!initialized || loading) {
    return <LoadingSpinner fullPage />
  }

  if (!user) {
    return <Navigate to="/umkm/login" replace />
  }

  // Super admin can also access UMKM dashboard
  if (role !== 'umkm_user' && role !== 'super_admin') {
    return <Navigate to="/umkm/login" replace />
  }

  return <Outlet />
}
