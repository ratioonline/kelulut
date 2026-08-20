import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { HelmetProvider, Helmet } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Layout
import Layout from './components/layout/Layout'

// Critical Public entry (Home is rendered on homepage)
import Home from './pages/client/Home'

// Secondary Public pages (Lazy loaded)
const ProgramPage = lazy(() => import('./pages/client/Program'))
const ProdukPage = lazy(() => import('./pages/client/Produk'))
const ProdukDetail = lazy(() => import('./pages/client/ProdukDetail'))
const ArtikelPage = lazy(() => import('./pages/client/Artikel'))
const ArtikelDetail = lazy(() => import('./pages/client/ArtikelDetail'))
const GaleriPage = lazy(() => import('./pages/client/Galeri'))
const KontakPage = lazy(() => import('./pages/client/Kontak'))
const ReservasiPage = lazy(() => import('./pages/client/Reservasi'))
const UmkmDirectory = lazy(() => import('./pages/client/UmkmDirectory'))
const UmkmPublicProfile = lazy(() => import('./pages/client/UmkmPublicProfile'))

// Admin Layout & Protected Route (Lazy loaded)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const ProtectedRoute = lazy(() => import('./components/admin/ProtectedRoute'))

// Admin pages (Lazy loaded)
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminReservasi = lazy(() => import('./pages/admin/AdminReservasi'))
const AdminProduk = lazy(() => import('./pages/admin/AdminProduk'))
const AdminArtikel = lazy(() => import('./pages/admin/AdminArtikel'))
const AdminGaleri = lazy(() => import('./pages/admin/AdminGaleri'))
const AdminProgram = lazy(() => import('./pages/admin/AdminProgram'))
const AdminHero = lazy(() => import('./pages/admin/AdminHero'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))
const AdminUmkmManagement = lazy(() => import('./pages/admin/AdminUmkmManagement'))
const AdminUmkmDetail = lazy(() => import('./pages/admin/AdminUmkmDetail'))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'))
const AdminTransaksi = lazy(() => import('./pages/admin/AdminTransaksi'))
const AdminPengguna = lazy(() => import('./pages/admin/AdminPengguna'))
const AdminProfilWebsite = lazy(() => import('./pages/admin/AdminProfilWebsite'))
const AdminUmkmGaleri = lazy(() => import('./pages/admin/AdminUmkmGaleri'))

// Auth store
import { useAuthStore } from './stores/authStore'

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
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
            <Route path="umkm-galeri" element={<AdminUmkmGaleri />} />
            <Route path="program"   element={<AdminProgram />} />
            <Route path="umkm-management" element={<AdminUmkmManagement />} />
            <Route path="umkm-management/:id" element={<AdminUmkmDetail />} />
            <Route path="transaksi" element={<AdminTransaksi />} />
            <Route path="pengguna"  element={<AdminPengguna />} />
            <Route path="profil-website" element={<AdminProfilWebsite />} />
          </Route>
        </Route>

        {/* ── 404 fallback ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 - Halaman Tidak Ditemukan | Kebun Kelulut Sangatta</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="min-h-screen bg-[#FAF3E0] flex flex-col items-center justify-center text-center px-4 py-16">
        <p className="text-7xl mb-3">🐝</p>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1B4332] mb-2">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
          Maaf, halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
        </p>
        <Link
          to="/"
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </>
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
