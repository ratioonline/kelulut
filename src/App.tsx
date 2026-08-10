import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'

// Layout
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Public pages
import Home from './pages/client/Home'
import ProgramPage from './pages/client/Program'
import ProdukPage from './pages/client/Produk'
import ProdukDetail from './pages/client/ProdukDetail'
import ArtikelPage from './pages/client/Artikel'
import ArtikelDetail from './pages/client/ArtikelDetail'
import GaleriPage from './pages/client/Galeri'
import KontakPage from './pages/client/Kontak'
import ReservasiPage from './pages/client/Reservasi'

// Admin pages
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import AdminReservasi from './pages/admin/AdminReservasi'
import AdminProduk from './pages/admin/AdminProduk'
import AdminArtikel from './pages/admin/AdminArtikel'
import AdminGaleri from './pages/admin/AdminGaleri'
import AdminProgram from './pages/admin/AdminProgram'
import AdminHero from './pages/admin/AdminHero'
import AdminMedia from './pages/admin/AdminMedia'
import AdminUmkmManagement from './pages/admin/AdminUmkmManagement'
import AdminUmkmDetail from './pages/admin/AdminUmkmDetail'
import AdminProfile from './pages/admin/AdminProfile'

// UMKM pages are now handled within the Admin routes

import UmkmDirectory from './pages/client/UmkmDirectory'
import UmkmPublicProfile from './pages/client/UmkmPublicProfile'

// Auth store
import { useAuthStore } from './stores/authStore'

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="program" element={<ProgramPage />} />
        <Route path="produk" element={<ProdukPage />} />
        <Route path="produk/:slug" element={<ProdukDetail />} />
        <Route path="artikel" element={<ArtikelPage />} />
        <Route path="artikel/:slug" element={<ArtikelDetail />} />
        <Route path="galeri" element={<GaleriPage />} />
        <Route path="kontak" element={<KontakPage />} />
        <Route path="reservasi" element={<ReservasiPage />} />
        <Route path="umkm-directory" element={<UmkmDirectory />} />
        <Route path="umkm/:slug" element={<UmkmPublicProfile />} />
      </Route>

      {/* ── Redirect old UMKM Routes to Admin ── */}
      <Route path="umkm/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="umkm/*" element={<Navigate to="/admin/dashboard" replace />} />

      {/* ── Admin Login (no layout) ── */}
      <Route path="admin/login" element={<AdminLogin />} />

      {/* ── Admin Protected Routes ── */}
      <Route path="admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profil"    element={<AdminProfile />} />
          <Route path="media"     element={<AdminMedia />} />
          <Route path="hero"      element={<AdminHero />} />
          <Route path="reservasi" element={<AdminReservasi />} />
          <Route path="produk"    element={<AdminProduk />} />
          <Route path="artikel"   element={<AdminArtikel />} />
          <Route path="galeri"    element={<AdminGaleri />} />
          <Route path="program"   element={<AdminProgram />} />
          <Route path="umkm-management" element={<AdminUmkmManagement />} />
          <Route path="umkm-management/:id" element={<AdminUmkmDetail />} />
        </Route>
      </Route>

      {/* ── 404 fallback ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF3E0] flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl mb-4">🐝</p>
      <h1 className="text-4xl font-bold text-[#1B4332] mb-2">404</h1>
      <p className="text-gray-600 mb-6">Halaman yang kamu cari tidak ditemukan.</p>
      <a
        href="/"
        className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Kembali ke Beranda
      </a>
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: '#1B4332',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#F5A623', secondary: '#fff' },
            },
            error: {
              style: { background: '#dc2626' },
            },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  )
}
