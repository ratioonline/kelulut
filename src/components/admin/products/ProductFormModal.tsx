import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Image as ImageIcon, Sparkles, Store, Package } from 'lucide-react'
import type { Product, Umkm } from '../../../types/database'
import { slugify } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import RichTextEditor from '../../ui/RichTextEditor'
import MediaPickerButton from '../../media/MediaPickerButton'

const schema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  sku: z.string().optional().nullable(),
  short_description: z.string().max(160, 'Maksimal 160 karakter').optional().nullable(),
  description: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  price: z.number({ invalid_type_error: 'Harga harus berupa angka' }).min(0, 'Harga tidak boleh negatif'),
  discount_price: z.number().min(0).nullable().optional(),
  stock: z.number({ invalid_type_error: 'Stok harus berupa angka' }).min(0, 'Stok tidak boleh negatif'),
  minimum_stock: z.number().min(0).optional().default(5),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pcs'),
  weight_gram: z.number().min(0).nullable().optional(),
  category: z.string().optional().nullable(),
  umkm_id: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'inactive']).default('active'),
  is_available: z.boolean().default(true),
})

export type ProductFormData = z.infer<typeof schema>

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  editingProduct: (Product & { umkm?: Umkm | null }) | null
  onSubmit: (data: ProductFormData, coverImage: string | null, extraImages: string[]) => Promise<void>
  umkmList: Umkm[]
  categories: string[]
  role: string | null
  myUmkm: Umkm | null
}

const CATEGORY_PRESETS = ['Madu Murni', 'Propolis', 'Sabun & Perawatan', 'Suplemen', 'Edukasi & Bibit', 'Olahan Madu']
const UNIT_PRESETS = ['pcs', 'botol', 'jar', 'gram', 'box', 'paket']

export default function ProductFormModal({
  open,
  onClose,
  editingProduct,
  onSubmit,
  umkmList,
  categories,
  role,
  myUmkm,
}: ProductFormModalProps) {
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [extraImages, setExtraImages] = useState<(string | null)[]>([null, null, null, null])
  const [richDescription, setRichDescription] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'description' | 'media'>('info')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_available: true,
      stock: 0,
      price: 0,
      minimum_stock: 5,
      unit: 'pcs',
      status: 'active',
    },
  })

  const currentCategory = watch('category')
  const currentUnit = watch('unit')

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setCoverImage(editingProduct.image_url ?? null)
        const extras = [...(editingProduct.images ?? []), null, null, null, null].slice(0, 4) as (string | null)[]
        setExtraImages(extras)
        setRichDescription(editingProduct.description ?? '')
        reset({
          name: editingProduct.name,
          sku: editingProduct.sku ?? '',
          short_description: editingProduct.short_description ?? '',
          description: editingProduct.description ?? '',
          details: editingProduct.details ?? '',
          price: editingProduct.price ?? 0,
          discount_price: editingProduct.discount_price ?? null,
          stock: editingProduct.stock ?? 0,
          minimum_stock: editingProduct.minimum_stock ?? 5,
          unit: editingProduct.unit ?? 'pcs',
          weight_gram: editingProduct.weight_gram ?? null,
          category: editingProduct.category ?? '',
          umkm_id: editingProduct.umkm_id ?? null,
          status: editingProduct.status ?? 'active',
          is_available: editingProduct.is_available,
        })
      } else {
        setCoverImage(null)
        setExtraImages([null, null, null, null])
        setRichDescription('')
        reset({
          name: '',
          sku: '',
          short_description: '',
          description: '',
          details: '',
          price: 0,
          discount_price: null,
          stock: 0,
          minimum_stock: 5,
          unit: 'pcs',
          weight_gram: null,
          category: '',
          umkm_id: role === 'umkm_user' ? myUmkm?.id || null : null,
          status: 'active',
          is_available: true,
        })
      }
      setActiveTab('info')
    }
  }, [open, editingProduct, reset, role, myUmkm])

  const handleFormSubmit = async (data: ProductFormData) => {
    const validExtras = extraImages.filter(Boolean) as string[]
    const payload = {
      ...data,
      description: richDescription || null,
    }
    await onSubmit(payload, coverImage, validExtras)
  }

  const updateExtraImage = (idx: number, val: string | null) => {
    setExtraImages((prev) => prev.map((v, i) => (i === idx ? val : v)))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProduct ? 'Edit Produk UMKM' : 'Tambah Produk Baru'}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <div className="flex items-center gap-2">
            <Button
              form="product-form-main"
              type="submit"
              loading={isSubmitting}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="product-form-main" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'info', label: '1. Informasi Utama' },
            { id: 'pricing', label: '2. Harga & Stok' },
            { id: 'description', label: '3. Deskripsi & Detail' },
            { id: 'media', label: '4. Foto & Galeri' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: INFORMASI UTAMA ── */}
        {activeTab === 'info' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nama Produk *"
                placeholder="Contoh: Madu Kelulut Premium 250ml"
                required
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="SKU / Kode Produk"
                placeholder="Contoh: MDU-KLL-250"
                {...register('sku')}
              />
            </div>

            {/* UMKM Selection */}
            {role !== 'umkm_user' ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Kepemilikan UMKM *
                </label>
                <select
                  {...register('umkm_id')}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
                >
                  <option value="">-- Official Kebun Kelulut Pusat --</option>
                  {umkmList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.owner_name ? `(${u.owner_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Tentukan apakah produk milik mitra UMKM atau Official Kebun Kelulut.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs flex items-center gap-2">
                <Store size={14} className="text-emerald-700 shrink-0" />
                <span>
                  Produk ini akan didaftarkan di bawah UMKM Anda: <strong>{myUmkm?.name}</strong>
                </span>
              </div>
            )}

            {/* Category with Quick Presets */}
            <div>
              <Input
                label="Kategori Produk"
                placeholder="Madu, Sabun, Suplemen..."
                {...register('category')}
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-gray-400">Pilihan Cepat:</span>
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                      currentCategory === cat
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Status & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Status Publikasi
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
                >
                  <option value="active">Aktif (Tampil di Katalog)</option>
                  <option value="draft">Draft (Disembunyikan)</option>
                  <option value="inactive">Nonaktif (Arsip)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#2D6A4F]"
                    {...register('is_available')}
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    Produk tersedia untuk dibeli
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: HARGA & STOK ── */}
        {activeTab === 'pricing' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Harga Normal (Rp) *"
                type="number"
                min={0}
                required
                placeholder="50000"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <Input
                label="Harga Diskon / Promo (Rp)"
                type="number"
                min={0}
                placeholder="Kosongkan jika tidak ada promo"
                {...register('discount_price', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Stok *"
                type="number"
                min={0}
                required
                error={errors.stock?.message}
                {...register('stock', { valueAsNumber: true })}
              />
              <Input
                label="Batas Min. Stok"
                type="number"
                min={0}
                placeholder="5"
                {...register('minimum_stock', { valueAsNumber: true })}
              />
              <Input
                label="Satuan *"
                placeholder="pcs, botol..."
                required
                error={errors.unit?.message}
                {...register('unit')}
              />
              <Input
                label="Berat (gram)"
                type="number"
                min={0}
                placeholder="250"
                {...register('weight_gram', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-gray-400">Pilihan Satuan:</span>
              {UNIT_PRESETS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setValue('unit', u)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                    currentUnit === u
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: DESKRIPSI & DETAIL ── */}
        {activeTab === 'description' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <Input
              label="Deskripsi Singkat (Maks 160 Karakter)"
              placeholder="Ringkasan singkat keunggulan produk untuk kartu dan preview..."
              error={errors.short_description?.message}
              {...register('short_description')}
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Deskripsi Lengkap Produk
              </label>
              <RichTextEditor
                value={richDescription}
                onChange={setRichDescription}
                placeholder="Tuliskan deskripsi lengkap manfaat, profil produk, sertifikasi P-IRT/Halal..."
              />
            </div>

            <Textarea
              label="Detail Tambahan & Komposisi"
              rows={2}
              placeholder="Contoh: 100% Madu Murni Trigona/Kelulut. Simpan di tempat sejuk."
              {...register('details')}
            />
          </div>
        )}

        {/* ── TAB 4: FOTO & GALERI ── */}
        {activeTab === 'media' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <p className="text-xs text-gray-600">
              Gunakan <strong>Media Library</strong> yang sudah tersedia untuk memilih atau mengunggah gambar produk dengan kompresi otomatis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Cover Image */}
              <div className="md:col-span-2">
                <MediaPickerButton
                  label="Foto Utama (Cover) *"
                  value={coverImage ?? undefined}
                  onChange={setCoverImage}
                  folder="Produk"
                  moduleName="Produk"
                />
              </div>

              {/* 4 Extra Gallery Images */}
              {extraImages.map((img, idx) => (
                <div key={idx}>
                  <MediaPickerButton
                    label={`Foto ${idx + 1}`}
                    value={img ?? undefined}
                    onChange={(v) => updateExtraImage(idx, v)}
                    folder="Produk"
                    moduleName="Produk"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
