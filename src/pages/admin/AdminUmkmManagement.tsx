import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Umkm } from '../../types/database'
import { slugify } from '../../lib/utils'
import Button from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'

// Modular Components
import UmkmKpiRibbon, { type UmkmKpiStats } from '../../components/admin/umkm/UmkmKpiRibbon'
import UmkmToolbar, { type UmkmFilterState } from '../../components/admin/umkm/UmkmToolbar'
import UmkmCardGrid, { type UmkmWithStats } from '../../components/admin/umkm/UmkmCardGrid'
import UmkmFormModal, { type UmkmFormData } from '../../components/admin/umkm/UmkmFormModal'
import UmkmDetailModal from '../../components/admin/umkm/UmkmDetailModal'

export default function AdminUmkmManagement() {
  const { role, myUmkm, user } = useAuthStore()
  const navigate = useNavigate()

  // State: Data
  const [umkms, setUmkms] = useState<UmkmWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [kpiStats, setKpiStats] = useState<UmkmKpiStats>({
    totalUmkm: 0,
    activeUmkm: 0,
    totalProducts: 0,
    totalSales: 0,
  })
  const [kpiLoading, setKpiLoading] = useState(true)

  // State: Filters
  const [filters, setFilters] = useState<UmkmFilterState>({
    search: '',
    status: 'all',
    performance: 'all',
    sortBy: 'sales_desc',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // State: Modals
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingUmkm, setEditingUmkm] = useState<Umkm | null>(null)
  const [detailUmkm, setDetailUmkm] = useState<UmkmWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UmkmWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)

  // Debounce search string (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch Main UMKM Data + Stats Aggregations
  const fetchUmkmsData = useCallback(async () => {
    setLoading(true)
    setKpiLoading(true)

    try {
      // 1. Fetch UMKMs
      let query = supabase.from('umkms').select('*').order('created_at', { ascending: false })
      if (role === 'umkm_user' && myUmkm?.id) {
        query = query.eq('id', myUmkm.id)
      }

      // 2. Fetch all products & transactions for aggregation
      const [{ data: umkmList }, { data: allProds }, { data: allTrx }] = await Promise.all([
        query,
        supabase.from('products').select('id, umkm_id, status, is_available'),
        supabase.from('transactions').select('id, umkm_id, total_amount, status'),
      ])

      const validTrx = (allTrx || []).filter((t) => t.status !== 'cancelled' && t.status !== 'failed')

      // Enrich UMKMs with stats
      const enriched: UmkmWithStats[] = ((umkmList || []) as Umkm[]).map((u) => {
        const uProducts = (allProds || []).filter((p) => p.umkm_id === u.id)
        const uTrx = validTrx.filter((t) => t.umkm_id === u.id)
        const totalSales = uTrx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)

        return {
          ...u,
          product_count: uProducts.length,
          total_sales: totalSales,
          transactions_count: uTrx.length,
        }
      })

      setUmkms(enriched)

      // Compute KPI Stats
      const totalUmkm = enriched.length
      const activeUmkm = enriched.filter((u) => u.status === 'active').length
      const totalProducts = (allProds || []).length
      const totalSales = validTrx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)

      setKpiStats({
        totalUmkm,
        activeUmkm,
        totalProducts,
        totalSales,
      })
    } catch (err) {
      console.error('Error fetching UMKM management data:', err)
      toast.error('Gagal memuat data UMKM')
    } finally {
      setLoading(false)
      setKpiLoading(false)
    }
  }, [role, myUmkm?.id])

  useEffect(() => {
    fetchUmkmsData()
  }, [fetchUmkmsData])

  // Filter & Sort Logic
  const filteredUmkms = useMemo(() => {
    return umkms
      .filter((u) => {
        // Status filter
        if (filters.status !== 'all' && u.status !== filters.status) return false

        // Performance filter
        if (filters.performance === 'top_sales' && u.total_sales <= 0) return false
        if (filters.performance === 'most_products' && u.product_count <= 0) return false
        if (filters.performance === 'no_sales' && u.total_sales > 0) return false

        // Search
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase()
          const matchName = u.name?.toLowerCase().includes(q)
          const matchOwner = u.owner_name?.toLowerCase().includes(q)
          const matchCity = u.city?.toLowerCase().includes(q)
          if (!matchName && !matchOwner && !matchCity) return false
        }

        return true
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'sales_desc':
            return b.total_sales - a.total_sales
          case 'products_desc':
            return b.product_count - a.product_count
          case 'name_asc':
            return a.name.localeCompare(b.name)
          case 'name_desc':
            return b.name.localeCompare(a.name)
          case 'created_at_desc':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })
  }, [umkms, filters, debouncedSearch])

  // Handlers
  const handleFilterChange = (newFilters: Partial<UmkmFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      performance: 'all',
      sortBy: 'sales_desc',
    })
  }

  // Create / Edit UMKM
  const handleFormSubmit = async (
    data: UmkmFormData,
    logo: string | null,
    coverImage: string | null
  ) => {
    try {
      let createdUserId: string | null = null

      // If requested to create user account login
      if (data.create_account && data.account_email && data.account_password && !editingUmkm) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.account_email,
          password: data.account_password,
        })
        if (authError) throw authError
        if (authData.user) {
          createdUserId = authData.user.id
          await supabase.from('user_profiles').insert({
            id: authData.user.id,
            role: 'proktor',
            full_name: data.owner_name || data.name,
          })
        }
      }

      const payload = {
        name: data.name,
        slug: editingUmkm ? editingUmkm.slug : slugify(`${data.name}-${Date.now().toString().slice(-4)}`),
        owner_name: data.owner_name || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        short_description: data.short_description || null,
        description: data.description || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postal_code || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        website: data.website || null,
        logo: logo || null,
        cover_image: coverImage || null,
        status: data.status,
        updated_at: new Date().toISOString(),
        ...(createdUserId ? { user_id: createdUserId } : {}),
      }

      const client = supabaseAdmin || supabase
      if (editingUmkm) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updatedData, error } = await client
          .from('umkms')
          .update(payload as any)
          .eq('id', editingUmkm.id)
          .select()
        if (error) throw error
        if (!updatedData || updatedData.length === 0) {
          throw new Error('Gagal memperbarui database (0 baris terupdate). Pastikan RLS policy Supabase mengizinkan role Anda.')
        }
        toast.success('Profil UMKM berhasil diperbarui')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: insertedData, error } = await client
          .from('umkms')
          .insert(payload as any)
          .select()
        if (error) throw error
        if (!insertedData || insertedData.length === 0) {
          throw new Error('Gagal menambahkan UMKM ke database. Pastikan RLS policy Supabase mengizinkan role Anda.')
        }
        toast.success('Mitra UMKM baru berhasil ditambahkan')
      }

      setFormModalOpen(false)
      setEditingUmkm(null)
      fetchUmkmsData()
    } catch (err) {
      console.error('Error saving UMKM:', err)
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan UMKM'
      toast.error(msg)
    }
  }

  // Toggle Status (Active / Inactive)
  const handleToggleStatus = async (umkm: UmkmWithStats) => {
    const nextStatus = umkm.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('umkms')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', umkm.id)
      if (error) throw error

      toast.success(`UMKM "${umkm.name}" sekarang ${nextStatus === 'active' ? 'Aktif' : 'Dinonaktifkan'}`)
      if (detailUmkm?.id === umkm.id) {
        setDetailUmkm({ ...detailUmkm, status: nextStatus })
      }
      fetchUmkmsData()
    } catch (err) {
      console.error('Error toggling UMKM status:', err)
      toast.error('Gagal mengubah status UMKM')
    }
  }

  // Safe Delete / Deactivation
  const confirmDeleteUmkm = async (umkm: UmkmWithStats) => {
    if (umkm.product_count > 0 || umkm.total_sales > 0) {
      setDeleteWarning(
        `UMKM "${umkm.name}" memiliki ${umkm.product_count} produk dan ${umkm.transactions_count} transaksi penjualan. Untuk menjaga keutuhan data riwayat transaksi, UMKM ini tidak dapat dihapus permanen tetapi akan dinonaktifkan (arsip).`
      )
    } else {
      setDeleteWarning(null)
    }
    setDeleteTarget(umkm)
  }

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteWarning) {
        // Safe deactivate
        const { error } = await supabase
          .from('umkms')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('id', deleteTarget.id)
        if (error) throw error
        toast.success(`UMKM "${deleteTarget.name}" berhasil dinonaktifkan`)
      } else {
        // Hard delete
        const { error } = await supabase.from('umkms').delete().eq('id', deleteTarget.id)
        if (error) throw error
        toast.success(`UMKM "${deleteTarget.name}" berhasil dihapus`)
      }

      setDeleteTarget(null)
      fetchUmkmsData()
    } catch (err) {
      console.error('Error deleting UMKM:', err)
      toast.error('Gagal menghapus UMKM')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
            Mitra UMKM
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola profil, produk, dan performa mitra UMKM Kebun-Kelulut.
          </p>
        </div>

        {role !== 'umkm_user' && (
          <Button
            onClick={() => {
              setEditingUmkm(null)
              setFormModalOpen(true)
            }}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] self-start sm:self-auto shadow-2xs"
            size="sm"
          >
            <Plus size={15} />
            <span>Tambah UMKM</span>
          </Button>
        )}
      </div>

      {/* ── KPI RIBBON ── */}
      <UmkmKpiRibbon
        stats={kpiStats}
        loading={kpiLoading}
        selectedFilter={filters.status === 'active' ? 'active' : 'all'}
        onSelectFilter={(f) => {
          if (f === 'active') handleFilterChange({ status: 'active' })
          else handleFilterChange({ status: 'all' })
        }}
      />

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <UmkmToolbar
        filters={filters}
        onChangeFilters={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* ── UMKM CARD GRID ── */}
      <UmkmCardGrid
        umkms={filteredUmkms}
        loading={loading}
        onQuickView={(u) => setDetailUmkm(u)}
        onEdit={(u) => {
          setEditingUmkm(u)
          setFormModalOpen(true)
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={confirmDeleteUmkm}
        onOpenCreate={() => {
          setEditingUmkm(null)
          setFormModalOpen(true)
        }}
      />

      {/* ── MODALS ── */}

      {/* 1. Add / Edit Modal */}
      <UmkmFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingUmkm(null)
        }}
        editingUmkm={editingUmkm}
        onSubmit={handleFormSubmit}
      />

      {/* 2. Detail Modal (Overview, Products, Sales, Info) */}
      <UmkmDetailModal
        umkm={detailUmkm}
        open={Boolean(detailUmkm)}
        onClose={() => setDetailUmkm(null)}
        onEdit={(u) => {
          setEditingUmkm(u)
          setFormModalOpen(true)
        }}
        onToggleStatus={handleToggleStatus}
        onAddProduct={(u) => {
          navigate('/admin/produk')
        }}
      />

      {/* 3. Delete / Archive Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={deleteWarning ? 'Nonaktifkan Mitra UMKM' : 'Hapus Mitra UMKM'}
        message={
          deleteWarning ||
          `Hapus mitra UMKM "${deleteTarget?.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={deleteWarning ? 'Nonaktifkan' : 'Hapus Permanen'}
        confirmVariant={deleteWarning ? 'secondary' : 'danger'}
        loading={deleting}
      />
    </div>
  )
}
