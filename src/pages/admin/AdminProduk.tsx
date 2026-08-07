import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, ImagePlus, X as XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/database'
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
  description: z.string().optional(),
  details: z.string().optional(),
  price: z.number({ invalid_type_error: 'Harga harus angka' }).min(0),
  discount_price: z.number().min(0).nullable().optional(),
  stock: z.number({ invalid_type_error: 'Stok harus angka' }).min(0),
  weight_gram: z.number().min(0).nullable().optional(),
  category: z.string().optional(),
  is_available: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminProduk() {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Image state: main cover + up to 4 extra
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [extraImages, setExtraImages] = useState<(string | null)[]>([null, null, null, null])

  const fetchData = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!search) { setFiltered(products); return }
    const q = search.toLowerCase()
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q)))
  }, [search, products])

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
    reset({ is_available: true, stock: 0, price: 0, discount_price: null })
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setCoverImage(product.image_url ?? null)
    const extras = [...(product.images ?? []), null, null, null, null].slice(0, 4) as (string | null)[]
    setExtraImages(extras)
    reset({
      name: product.name,
      description: product.description ?? '',
      details: product.details ?? '',
      price: product.price ?? 0,
      discount_price: product.discount_price ?? null,
      stock: product.stock ?? 0,
      weight_gram: product.weight_gram ?? null,
      category: product.category ?? '',
      is_available: product.is_available,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const allImages = extraImages.filter(Boolean) as string[]
    const payload = {
      name: data.name,
      slug: slugify(data.name),
      description: data.description || null,
      details: data.details || null,
      price: data.price,
      discount_price: data.discount_price || null,
      stock: data.stock,
      weight_gram: data.weight_gram || null,
      image_url: coverImage || null,
      images: allImages,
      category: data.category || null,
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
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus produk') }
    else { toast.success('Produk berhasil dihapus'); await fetchData() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const updateExtra = (idx: number, val: string | null) => {
    setExtraImages((prev) => prev.map((v, i) => (i === idx ? val : v)))
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
                    {['Produk', 'Harga', 'Diskon', 'Stok', 'Terjual', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
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
                      <td className="py-3 px-4 font-medium text-[#F5A623] whitespace-nowrap">
                        {formatCurrency(p.price ?? 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.discount_price ? (
                          <span className="text-red-500 font-medium">{formatCurrency(p.discount_price)}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{p.stock}</td>
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

          <Input label="Nama Produk" required error={errors.name?.message} {...register('name')} />
          <Textarea label="Deskripsi" rows={3} {...register('description')} />
          <Textarea label="Detail Produk" rows={2} placeholder="Komposisi, cara penggunaan, dll." {...register('details')} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Harga Normal (Rp)" type="number" min={0} required error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
            <Input label="Harga Diskon (Rp)" type="number" min={0} placeholder="Kosongkan jika tidak ada" {...register('discount_price', { setValueAs: (v) => v === '' ? null : Number(v) })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Stok" type="number" min={0} required error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
            <Input label="Berat (gram)" type="number" min={0} placeholder="mis. 250" {...register('weight_gram', { setValueAs: (v) => v === '' ? null : Number(v) })} />
            <Input label="Kategori" placeholder="Madu, Suplemen..." {...register('category')} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#2D6A4F]" {...register('is_available')} />
            <span className="text-sm text-gray-700">Produk tersedia untuk dijual</span>
          </label>
        </form>
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
