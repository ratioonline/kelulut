import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Product, Umkm } from '../../types/database'
import { slugify } from '../../lib/utils'
import Button from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'

// Modular Components
import ProductKpiRibbon, { type ProductKpiStats } from '../../components/admin/products/ProductKpiRibbon'
import ProductToolbar, { type ProductFilterState } from '../../components/admin/products/ProductToolbar'
import ProductTable, { type ProductWithUmkm } from '../../components/admin/products/ProductTable'
import ProductFormModal, { type ProductFormData } from '../../components/admin/products/ProductFormModal'
import ProductQuickViewModal from '../../components/admin/products/ProductQuickViewModal'
import QuickStockModal from '../../components/admin/products/QuickStockModal'

const ITEMS_PER_PAGE = 20

export default function AdminProduk() {
  const { role, myUmkm } = useAuthStore()

  // State: Data
  const [products, setProducts] = useState<ProductWithUmkm[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [kpiStats, setKpiStats] = useState<ProductKpiStats>({ total: 0, active: 0, lowStock: 0, outOfStock: 0 })
  const [kpiLoading, setKpiLoading] = useState(true)
  const [umkmList, setUmkmList] = useState<Umkm[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // State: Filters & Pagination
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ProductFilterState>({
    search: '',
    umkmId: 'all',
    category: 'all',
    status: 'all',
    stockFilter: 'all',
    sortBy: 'created_at_desc',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // State: Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // State: Modals
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithUmkm | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithUmkm | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithUmkm | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)

  // Debounce search string (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch KPI Stats (Realtime counts)
  const fetchKpiStats = useCallback(async () => {
    setKpiLoading(true)
    try {
      let query = supabase.from('products').select('id, status, is_available, stock, minimum_stock, umkm_id')
      if (role === 'umkm_user') {
        if (myUmkm?.id) query = query.eq('umkm_id', myUmkm.id)
        else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
      }

      const { data } = await query
      if (data) {
        const total = data.length
        const active = data.filter((p) => p.status === 'active' && p.is_available).length
        const lowStock = data.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minimum_stock || 5)).length
        const outOfStock = data.filter((p) => (p.stock || 0) === 0).length

        setKpiStats({ total, active, lowStock, outOfStock })
      }
    } catch (err) {
      console.error('Error fetching product KPI stats:', err)
    } finally {
      setKpiLoading(false)
    }
  }, [role, myUmkm?.id])

  // Fetch Auxiliary Metadata (UMKMs & Categories)
  useEffect(() => {
    const fetchMetadata = async () => {
      // 1. UMKMs
      if (role !== 'umkm_user') {
        const { data: umkms } = await supabase.from('umkms').select('*').eq('status', 'active').order('name')
        if (umkms) setUmkmList(umkms as Umkm[])
      }

      // 2. Categories
      const { data: catData } = await supabase.from('products').select('category')
      if (catData) {
        const uniqueCats = Array.from(
          new Set(catData.map((c) => c.category).filter(Boolean) as string[])
        ).sort()
        setCategories(uniqueCats)
      }
    }
    fetchMetadata()
  }, [role])

  // Fetch Main Paginated Products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('products').select('*, umkm:umkms(*)', { count: 'exact' })

      // Access Control
      if (role === 'umkm_user') {
        if (myUmkm?.id) query = query.eq('umkm_id', myUmkm.id)
        else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
      } else if (filters.umkmId !== 'all') {
        if (filters.umkmId === 'official') {
          query = query.is('umkm_id', null)
        } else {
          query = query.eq('umkm_id', filters.umkmId)
        }
      }

      // Category Filter
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      // Status Filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Stock Filter
      if (filters.stockFilter === 'low_stock') {
        query = query.gt('stock', 0).lte('stock', 5)
      } else if (filters.stockFilter === 'out_of_stock') {
        query = query.eq('stock', 0)
      } else if (filters.stockFilter === 'active') {
        query = query.eq('status', 'active').eq('is_available', true)
      }

      // Search (Name or SKU)
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`)
      }

      // Sorting
      switch (filters.sortBy) {
        case 'name_asc':
          query = query.order('name', { ascending: true })
          break
        case 'name_desc':
          query = query.order('name', { ascending: false })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'sold_desc':
          query = query.order('sold_count', { ascending: false })
          break
        case 'stock_asc':
          query = query.order('stock', { ascending: true })
          break
        case 'created_at_desc':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Range Pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, count, error } = await query
      if (error) {
        toast.error('Gagal memuat produk')
      } else {
        setProducts((data || []) as ProductWithUmkm[])
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Terjadi kesalahan saat memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [role, myUmkm?.id, filters, debouncedSearch, page])

  useEffect(() => {
    fetchProducts()
    fetchKpiStats()
  }, [fetchProducts, fetchKpiStats])

  // Handle Filter Changes
  const handleFilterChange = (newFilters: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
    setSelectedIds([])
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      umkmId: 'all',
      category: 'all',
      status: 'all',
      stockFilter: 'all',
      sortBy: 'created_at_desc',
    })
    setPage(1)
    setSelectedIds([])
  }

  // Handle Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map((p) => p.id))
    }
  }

  // Form Submit (Create / Edit)
  const handleFormSubmit = async (
    data: ProductFormData,
    coverImage: string | null,
    extraImages: string[]
  ) => {
    try {
      const payload = {
        name: data.name,
        slug: editingProduct ? editingProduct.slug : slugify(`${data.name}-${Date.now().toString().slice(-4)}`),
        sku: data.sku || null,
        short_description: data.short_description || null,
        description: data.description || null,
        details: data.details || null,
        price: data.price,
        discount_price: data.discount_price || null,
        stock: data.stock,
        minimum_stock: data.minimum_stock,
        unit: data.unit,
        weight_gram: data.weight_gram || null,
        image_url: coverImage || null,
        images: extraImages,
        category: data.category || null,
        umkm_id: role === 'umkm_user' ? myUmkm?.id || null : data.umkm_id || null,
        status: data.status,
        is_available: data.is_available,
        updated_at: new Date().toISOString(),
      }

      if (editingProduct) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('products').update(payload as any).eq('id', editingProduct.id)
        if (error) throw error
        toast.success('Produk berhasil diperbarui')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newProd, error } = await supabase.from('products').insert(payload as any).select().single()
        if (error) throw error

        // Log initial stock movement
        if (data.stock > 0 && newProd) {
          await supabase.from('stock_movements').insert({
            product_id: newProd.id,
            previous_stock: 0,
            quantity: data.stock,
            movement_type: 'set',
            new_stock: data.stock,
            reason: 'Stok awal produk baru',
          })
        }
        toast.success('Produk baru berhasil ditambahkan')
      }

      setFormModalOpen(false)
      setEditingProduct(null)
      fetchProducts()
      fetchKpiStats()
    } catch (err) {
      console.error('Error saving product:', err)
      toast.error('Gagal menyimpan produk')
    }
  }

  // Quick Stock Adjustment with stock_movements log
  const handleQuickStockSave = async (product: Product, newStock: number, reason: string) => {
    try {
      const prevStock = product.stock || 0
      const diff = newStock - prevStock

      const { error } = await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', product.id)

      if (error) throw error

      // Log movement
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        previous_stock: prevStock,
        quantity: diff,
        movement_type: diff >= 0 ? 'add' : 'subtract',
        new_stock: newStock,
        reason: reason || 'Penyesuaian stok manual',
      })

      toast.success(`Stok ${product.name} diperbarui menjadi ${newStock}`)
      fetchProducts()
      fetchKpiStats()
    } catch (err) {
      console.error('Error updating stock:', err)
      toast.error('Gagal memperbarui stok')
    }
  }

  // Duplicate Product
  const handleDuplicate = async (product: ProductWithUmkm) => {
    try {
      const copyPayload = {
        name: `${product.name} (Salinan)`,
        slug: slugify(`${product.name}-salinan-${Date.now().toString().slice(-4)}`),
        sku: product.sku ? `${product.sku}-COPY` : null,
        short_description: product.short_description,
        description: product.description,
        details: product.details,
        price: product.price,
        discount_price: product.discount_price,
        stock: 0, // start with 0 stock for duplicated draft
        minimum_stock: product.minimum_stock || 5,
        unit: product.unit || 'pcs',
        weight_gram: product.weight_gram,
        image_url: product.image_url,
        images: product.images || [],
        category: product.category,
        umkm_id: product.umkm_id,
        status: 'draft',
        is_available: false,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newCopy, error } = await supabase.from('products').insert(copyPayload as any).select('*, umkm:umkms(*)').single()
      if (error) throw error

      toast.success(`Produk "${product.name}" berhasil diduplikasi sebagai Draft`)
      fetchProducts()
      fetchKpiStats()

      // Open in edit mode immediately
      if (newCopy) {
        setEditingProduct(newCopy as ProductWithUmkm)
        setFormModalOpen(true)
      }
    } catch (err) {
      console.error('Error duplicating product:', err)
      toast.error('Gagal menduplikasi produk')
    }
  }

  // Toggle Status (Active / Inactive)
  const handleToggleStatus = async (product: ProductWithUmkm) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', product.id)
      if (error) throw error

      toast.success(`Produk ${product.name} sekarang ${nextStatus === 'active' ? 'Aktif' : 'Dinonaktifkan'}`)
      if (quickViewProduct?.id === product.id) {
        setQuickViewProduct({ ...product, status: nextStatus })
      }
      fetchProducts()
      fetchKpiStats()
    } catch (err) {
      console.error('Error toggling product status:', err)
      toast.error('Gagal mengubah status produk')
    }
  }

  // Safe Delete Confirmation
  const confirmDeleteProduct = async (product: ProductWithUmkm) => {
    // Check if product is referenced in transaction_items
    const { count } = await supabase
      .from('transaction_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product.id)

    if (count && count > 0) {
      setDeleteWarning(
        `Produk ini memiliki ${count} riwayat transaksi. Untuk menjaga integritas laporan penjualan, produk tidak dapat dihapus permanen tetapi akan dinonaktifkan (arsip).`
      )
    } else {
      setDeleteWarning(null)
    }
    setDeleteTarget(product)
  }

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteWarning) {
        // Safe archive / deactivate instead of hard delete
        const { error } = await supabase
          .from('products')
          .update({ status: 'inactive', is_available: false })
          .eq('id', deleteTarget.id)
        if (error) throw error
        toast.success(`Produk "${deleteTarget.name}" berhasil dinonaktifkan`)
      } else {
        // Hard delete
        const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
        if (error) throw error
        toast.success(`Produk "${deleteTarget.name}" berhasil dihapus`)
      }

      setDeleteTarget(null)
      fetchProducts()
      fetchKpiStats()
    } catch (err) {
      console.error('Error deleting product:', err)
      toast.error('Gagal menghapus produk')
    } finally {
      setDeleting(false)
    }
  }

  // Bulk Actions
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return
    const { error } = await supabase
      .from('products')
      .update({ status: 'active', is_available: true })
      .in('id', selectedIds)
    if (!error) {
      toast.success(`${selectedIds.length} produk diaktifkan`)
      setSelectedIds([])
      fetchProducts()
      fetchKpiStats()
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return
    const { error } = await supabase
      .from('products')
      .update({ status: 'inactive', is_available: false })
      .in('id', selectedIds)
    if (!error) {
      toast.success(`${selectedIds.length} produk dinonaktifkan`)
      setSelectedIds([])
      fetchProducts()
      fetchKpiStats()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Hapus / nonaktifkan ${selectedIds.length} produk terpilih?`)) return

    const { error } = await supabase
      .from('products')
      .update({ status: 'inactive', is_available: false })
      .in('id', selectedIds)
    if (!error) {
      toast.success(`${selectedIds.length} produk berhasil diarsipkan`)
      setSelectedIds([])
      fetchProducts()
      fetchKpiStats()
    }
  }

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const startItem = totalCount === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(totalCount, page * ITEMS_PER_PAGE)

  return (
    <div className="space-y-4 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
            Produk
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola produk UMKM, stok, harga, dan informasi katalog Kebun-Kelulut.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingProduct(null)
            setFormModalOpen(true)
          }}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] self-start sm:self-auto shadow-2xs"
          size="sm"
        >
          <Plus size={15} />
          <span>Tambah Produk</span>
        </Button>
      </div>

      {/* ── KPI RIBBON ── */}
      <ProductKpiRibbon
        stats={kpiStats}
        loading={kpiLoading}
        selectedStockFilter={filters.stockFilter}
        onSelectStockFilter={(f) => handleFilterChange({ stockFilter: f })}
      />

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <ProductToolbar
        filters={filters}
        onChangeFilters={handleFilterChange}
        onResetFilters={handleResetFilters}
        umkmList={umkmList}
        categories={categories}
        role={role}
        selectedCount={selectedIds.length}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkDelete={handleBulkDelete}
      />

      {/* ── PRODUCT TABLE / CARDS ── */}
      <ProductTable
        products={products}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickView={(p) => setQuickViewProduct(p)}
        onEdit={(p) => {
          setEditingProduct(p)
          setFormModalOpen(true)
        }}
        onDuplicate={handleDuplicate}
        onQuickStock={(p) => setStockProduct(p)}
        onDelete={confirmDeleteProduct}
        onOpenCreate={() => {
          setEditingProduct(null)
          setFormModalOpen(true)
        }}
      />

      {/* ── PAGINATION BAR ── */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-gray-600">
          <p>
            Menampilkan <strong className="font-semibold">{startItem}</strong> -{' '}
            <strong className="font-semibold">{endItem}</strong> dari{' '}
            <strong className="font-semibold">{totalCount}</strong> produk
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  const isCurrent = page === pageNum
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-[#2D6A4F] text-white shadow-2xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Add / Edit Modal */}
      <ProductFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingProduct(null)
        }}
        editingProduct={editingProduct}
        onSubmit={handleFormSubmit}
        umkmList={umkmList}
        categories={categories}
        role={role}
        myUmkm={myUmkm}
      />

      {/* 2. Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onEdit={(p) => {
          setEditingProduct(p)
          setFormModalOpen(true)
        }}
        onDuplicate={handleDuplicate}
        onToggleStatus={handleToggleStatus}
        onDelete={confirmDeleteProduct}
      />

      {/* 3. Quick Stock Modal */}
      <QuickStockModal
        product={stockProduct}
        open={Boolean(stockProduct)}
        onClose={() => setStockProduct(null)}
        onSave={handleQuickStockSave}
      />

      {/* 4. Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={deleteWarning ? 'Nonaktifkan Produk' : 'Hapus Produk'}
        message={
          deleteWarning ||
          `Hapus produk "${deleteTarget?.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={deleteWarning ? 'Nonaktifkan' : 'Hapus Permanen'}
        confirmVariant={deleteWarning ? 'secondary' : 'danger'}
        loading={deleting}
      />
    </div>
  )
}
