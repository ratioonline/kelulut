import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { supabase } from '../../lib/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { slugify } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Product } from '../../types/database'

const schema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  price: z.number({ invalid_type_error: 'Harga harus angka' }).min(0, 'Harga tidak boleh negatif'),
  discount_price: z.number().min(0).nullable().optional(),
  stock: z.number({ invalid_type_error: 'Stok harus angka' }).min(0, 'Stok tidak boleh negatif'),
  minimum_stock: z.number().min(0).nullable().optional(),
  unit: z.string().optional(),
  weight_gram: z.number().min(0).nullable().optional(),
  minimum_order: z.number().min(1).nullable().optional(),
  status: z.enum(['draft', 'active', 'inactive']),
})
type FormData = z.infer<typeof schema>

export default function UmkmProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { user, myUmkm } = useAuthStore()
  const { createProduct, updateProduct, categories, fetchCategories } = useUmkmStore()

  const [loading, setLoading] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [extraImages, setExtraImages] = useState<(string | null)[]>([null, null, null, null])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'active',
      stock: 0,
      price: 0,
      minimum_stock: 5,
      unit: 'pcs',
      minimum_order: 1,
    },
  })

  const nameValue = watch('name')

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, isEditing, setValue])

  // Load existing product for editing
  useEffect(() => {
    if (!isEditing || !myUmkm) return
    setLoading(true)

    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('umkm_id', myUmkm.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          toast.error('Produk tidak ditemukan atau bukan milik Anda')
          navigate('/umkm/products')
          return
        }
        const p = data as Product
        reset({
          name: p.name,
          slug: p.slug,
          sku: p.sku ?? '',
          category: p.category ?? '',
          short_description: p.short_description ?? '',
          description: p.description ?? '',
          details: p.details ?? '',
          price: p.price ?? 0,
          discount_price: p.discount_price ?? null,
          stock: p.stock,
          minimum_stock: p.minimum_stock ?? 5,
          unit: p.unit ?? 'pcs',
          weight_gram: p.weight_gram ?? null,
          minimum_order: p.minimum_order ?? 1,
          status: p.status ?? 'active',
        })
        setCoverImage(p.image_url)
        const extras = [...(p.images ?? []), null, null, null, null].slice(0, 4) as (string | null)[]
        setExtraImages(extras)
        setLoading(false)
      })
  }, [isEditing, id, myUmkm, navigate, reset])

  const updateExtra = (idx: number, val: string | null) => {
    setExtraImages(prev => prev.map((v, i) => (i === idx ? val : v)))
  }

  const onSubmit = async (data: FormData) => {
    if (!user || !myUmkm) return

    const allImages = extraImages.filter(Boolean) as string[]
    const payload: Partial<Product> = {
      name: data.name,
      slug: data.slug || slugify(data.name),
      sku: data.sku || null,
      category: data.category || null,
      short_description: data.short_description || null,
      description: data.description || null,
      details: data.details || null,
      price: data.price,
      discount_price: data.discount_price || null,
      stock: data.stock,
      minimum_stock: data.minimum_stock ?? 5,
      unit: data.unit || 'pcs',
      weight_gram: data.weight_gram || null,
      minimum_order: data.minimum_order ?? 1,
      status: data.status,
      image_url: coverImage || null,
      images: allImages,
      is_available: data.status === 'active' && data.stock > 0,
    }

    if (isEditing) {
      const { error } = await updateProduct(id!, payload, user.id, myUmkm.id)
      if (error) {
        toast.error('Gagal memperbarui produk: ' + error)
        return
      }
      toast.success('Produk berhasil diperbarui')
    } else {
      const { error } = await createProduct(payload, myUmkm.id, user.id)
      if (error) {
        toast.error('Gagal menambah produk: ' + error)
        return
      }
      toast.success('Produk berhasil ditambahkan')
    }
    navigate('/umkm/products')
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/umkm/products')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Produk' : 'Tambah Produk'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? 'Perbarui informasi produk Anda.' : 'Tambahkan produk baru ke katalog UMKM Anda.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photos */}
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Foto Produk</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <MediaPickerButton
                  label="Cover Utama"
                  value={coverImage ?? undefined}
                  onChange={setCoverImage}
                  folder="Produk"
                  moduleName="Produk"
                />
              </div>
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
          </CardBody>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Informasi Produk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Produk" required error={errors.name?.message} {...register('name')} />
              <Input label="Slug URL" hint="Otomatis dari nama" {...register('slug')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="SKU / Kode Produk" placeholder="KKS-001" {...register('sku')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Kategori</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  {...register('category')}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea label="Deskripsi Singkat" rows={2} placeholder="Ringkasan singkat produk" {...register('short_description')} />
            <Textarea label="Deskripsi Lengkap" rows={5} placeholder="Deskripsi detail produk Anda..." {...register('description')} />
            <Textarea label="Detail Tambahan" rows={2} placeholder="Komposisi, cara penggunaan, dll." {...register('details')} />
          </CardBody>
        </Card>

        {/* Price & Stock */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Harga & Stok</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Harga Normal (Rp)" type="number" min={0} required error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
              <Input label="Harga Diskon (Rp)" type="number" min={0} placeholder="Kosongkan jika tidak ada" {...register('discount_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Stok" type="number" min={0} required error={errors.stock?.message} {...register('stock', { valueAsNumber: true })} />
              <Input label="Stok Minimum" type="number" min={0} hint="Alert stok menipis" {...register('minimum_stock', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
              <Input label="Satuan" placeholder="pcs, botol, kg" {...register('unit')} />
              <Input label="Berat (gram)" type="number" min={0} {...register('weight_gram', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
            </div>
            <Input label="Minimal Pembelian" type="number" min={1} {...register('minimum_order', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
          </CardBody>
        </Card>

        {/* Status */}
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Status Produk</h3>
            <div className="flex gap-4">
              {[
                { value: 'active', label: 'Aktif', desc: 'Tampil di katalog publik' },
                { value: 'draft', label: 'Draft', desc: 'Belum ditampilkan' },
                { value: 'inactive', label: 'Nonaktif', desc: 'Disembunyikan dari katalog' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer p-3 border rounded-xl hover:border-[#2D6A4F] transition-colors flex-1">
                  <input
                    type="radio"
                    value={opt.value}
                    className="w-4 h-4 mt-0.5 accent-[#2D6A4F]"
                    {...register('status')}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/umkm/products')}>Batal</Button>
          <Button type="submit" loading={isSubmitting}>
            <Save size={16} /> {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </div>
  )
}
