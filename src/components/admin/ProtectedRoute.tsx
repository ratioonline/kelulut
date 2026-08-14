import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function ProtectedRoute() {
  const { user, role, loading, initialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Masih menunggu inisialisasi selesai
  if (!initialized || loading) {
    return <LoadingSpinner fullPage />
  }

  // User belum login atau role tidak valid
  const allowedRoles = ['super_admin', 'umkm_user', 'proktor', 'kontributor', 'guest']
  if (!user || !allowedRoles.includes(role as string)) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

