import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, ImagePlus, X as XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Product, Umkm } from '../../types/database'
import { formatCurrency, slugify } from '../../lib/utils'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  sku: z.string().optional().nullable(),
  short_description: z.string().max(100, 'Maksimal 100 karakter').optional().nullable(),
  description: z.string().optional(),
  details: z.string().optional(),
  price: z.number({ invalid_type_error: 'Harga harus angka' }).min(0),
  discount_price: z.number().min(0).nullable().optional(),
  stock: z.number({ invalid_type_error: 'Stok harus angka' }).min(0),
  minimum_stock: z.number().min(0).optional().default(5),
  unit: z.string().optional().default('pcs'),
  weight_gram: z.number().min(0).nullable().optional(),
  category: z.string().optional(),
  umkm_id: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional().default('active'),
  is_available: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminProduk() {
  const [products, setProducts] = useState<(Product & { umkm?: Umkm | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const ITEMS_PER_PAGE = 20

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<(Product & { umkm?: Umkm | null }) | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stockTarget, setStockTarget] = useState<Product | null>(null)
  const [quickStock, setQuickStock] = useState(0)
  const [umkmList, setUmkmList] = useState<Umkm[]>([])
  const { role, myUmkm } = useAuthStore()

  // Image state: main cover + up to 4 extra
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [extraImages, setExtraImages] = useState<(string | null)[]>([null, null, null, null])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = async (isReset = false) => {
    if (isReset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    const currentPage = isReset ? 0 : page

    let query = supabase
      .from('products')
      .select('*, umkm:umkms(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (role === 'umkm_user') {
      if (myUmkm) query = query.eq('umkm_id', myUmkm.id)
      else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
    }

    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`)
    }

    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    query = query.range(start, end)

    const { data, count, error } = await query
    
    if (!error && data) {
      setProducts(prev => isReset ? (data as (Product & { umkm?: Umkm | null })[]) : [...prev, ...(data as (Product & { umkm?: Umkm | null })[])])
      setHasMore(count ? (start + data.length) < count : false)
      setPage(currentPage + 1)
    }

    // Only fetch UMKM list once
    if (umkmList.length === 0) {
      const { data: umkms } = await supabase.from('umkms').select('*').order('name')
      if (umkms) setUmkmList(umkms as Umkm[])
    }

    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => { 
    fetchData(true) 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, role, myUmkm])

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_available: true, stock: 0, price: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    setCoverImage(null)
    setExtraImages([null, null, null, null])
    reset({ is_available: true, stock: 0, price: 0, discount_price: null, umkm_id: null, status: 'active', minimum_stock: 5, unit: 'pcs', sku: '', short_description: '' })
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setCoverImage(product.image_url ?? null)
    const extras = [...(product.images ?? []), null, null, null, null].slice(0, 4) as (string | null)[]
    setExtraImages(extras)
    reset({
      name: product.name,
      sku: product.sku ?? '',
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      details: product.details ?? '',
      price: product.price ?? 0,
      discount_price: product.discount_price ?? null,
      stock: product.stock ?? 0,
      minimum_stock: product.minimum_stock ?? 5,
      unit: product.unit ?? 'pcs',
      weight_gram: product.weight_gram ?? null,
      category: product.category ?? '',
      umkm_id: product.umkm_id ?? null,
      status: product.status ?? 'active',
      is_available: product.is_available,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const allImages = extraImages.filter(Boolean) as string[]
    const payload = {
      name: data.name,
      slug: slugify(data.name),
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
      images: allImages,
      category: data.category || null,
      umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : (data.umkm_id || null),
      status: data.status,
      is_available: data.is_available,
    }

    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('products').update(payload as any).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui produk'); return }
      toast.success('Produk berhasil diperbarui')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('products').insert(payload as any)
      if (error) { toast.error('Gagal menambah produk'); return }
      toast.success('Produk berhasil ditambahkan')
    }
    setModalOpen(false)
    await fetchData(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus produk') }
    else { toast.success('Produk berhasil dihapus'); await fetchData(true) }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const updateExtra = (idx: number, val: string | null) => {
    setExtraImages((prev) => prev.map((v, i) => (i === idx ? val : v)))
  }

  const handleStockUpdate = async () => {
    if (!stockTarget) return
    const { error } = await supabase.from('products').update({ stock: quickStock }).eq('id', stockTarget.id)
    if (error) { toast.error('Gagal update stok') }
    else { toast.success('Stok diperbarui'); await fetchData(true) }
    setStockTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola katalog produk madu kelulut.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Tambah Produk</Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Cari produk..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        />
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Belum ada produk.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Produk', 'UMKM', 'Harga', 'Stok', 'Terjual', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {(p.image_url || p.images?.[0]) ? (
                            <img
                              src={p.image_url ?? p.images?.[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImagePlus size={14} className="text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.category ?? '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.umkm ? (
                          <span className="text-sm text-gray-700">{p.umkm.name}</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Official</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#F5A623] whitespace-nowrap">{formatCurrency(p.price ?? 0)}</p>
                        {p.discount_price && <p className="text-xs text-red-500">{formatCurrency(p.discount_price)}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock && p.stock <= (p.minimum_stock || 5) ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {p.stock} {p.unit || 'pcs'}
                          </span>
                          <button 
                            onClick={() => { setStockTarget(p); setQuickStock(p.stock || 0); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#2D6A4F] transition-colors"
                            title="Update Stok Cepat"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{p.sold_count ?? 0}</td>
                      <td className="py-3 px-4">
                        <Badge variant={p.is_available ? 'green' : 'red'}>
                          {p.is_available ? 'Tersedia' : 'Tidak'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="flex justify-center p-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchData(false)}
                    loading={loadingMore}
                  >
                    Muat Lebih Banyak
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Form Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Produk' : 'Tambah Produk'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="product-form" type="submit" loading={isSubmitting}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Cover image + extras */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Foto Produk <span className="text-xs text-gray-400">(cover + hingga 4 foto tambahan)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Cover — 2 col wide */}
              <div className="md:col-span-2">
                <MediaPickerButton
                  label="Cover Produk Utama"
                  value={coverImage ?? undefined}
                  onChange={setCoverImage}
                  folder="Produk"
                  moduleName="Produk"
                />
              </div>
              {/* 4 extras */}
              {extraImages.map((img, idx) => (
                <div key={idx}>
                  <MediaPickerButton
                    label={`Galeri ${idx + 1}`}
                    value={img ?? undefined}
                    onChange={(v) => updateExtra(idx, v)}
                    folder="Produk"
                    moduleName="Produk"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nama Produk *" required error={errors.name?.message} {...register('name')} />
            <Input label="SKU" placeholder="Opsional" {...register('sku')} />
          </div>
          
          <Input label="Deskripsi Singkat" placeholder="Maks 100 karakter" error={errors.short_description?.message} {...register('short_description')} />
          <Textarea label="Deskripsi Lengkap" rows={3} {...register('description')} />
          <Textarea label="Detail Produk" rows={2} placeholder="Komposisi, cara penggunaan, dll." {...register('details')} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Harga Normal (Rp)" type="number" min={0} required error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
            <Input label="Harga Diskon (Rp)" type="number" min={0} placeholder="Kosongkan jika tidak ada" {...register('discount_price', { setValueAs: (v) => v === '' ? null : Number(v) })} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Stok" type="number" min={0} required error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
            <Input label="Min. Stok" type="number" min={0} required error={errors.minimum_stock?.message} {...register('minimum_stock', { valueAsNumber: true })} />
            <Input label="Satuan" placeholder="pcs, botol..." required error={errors.unit?.message} {...register('unit')} />
            <Input label="Berat (gr)" type="number" min={0} placeholder="Opsional" {...register('weight_gram', { setValueAs: (v) => v === '' ? null : Number(v) })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Kategori" placeholder="Madu, Suplemen..." {...register('category')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {role === 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kepemilikan UMKM</label>
              <select
                {...register('umkm_id')}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
              >
                <option value="">-- Official (Kebun Kelulut) --</option>
                {umkmList.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Tentukan apakah produk ini milik UMKM atau Official.</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#2D6A4F]" {...register('is_available')} />
            <span className="text-sm text-gray-700">Produk tersedia untuk dijual</span>
          </label>
        </form>
      </Modal>

      <Modal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        title="Update Stok Cepat"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStockTarget(null)}>Batal</Button>
            <Button onClick={handleStockUpdate}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Update jumlah stok untuk produk <strong>{stockTarget?.name}</strong>.</p>
          <Input 
            label="Jumlah Stok Saat Ini" 
            type="number" 
            min={0}
            value={quickStock}
            onChange={(e) => setQuickStock(Number(e.target.value))}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus produk "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  )
}
