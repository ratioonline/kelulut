import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Camera, Store, AlertCircle, Upload, Images } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { GalleryItem } from '../../types/database'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const CATEGORIES = ['Produk', 'Kegiatan', 'Fasilitas', 'Proses Produksi', 'Event', 'Lainnya']

export default function AdminUmkmGaleri() {
  const [items, setItems] = useState<(GalleryItem & { umkm?: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [filterCat, setFilterCat] = useState<string>('Semua')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const { role, myUmkm } = useAuthStore()

  const ITEMS_PER_PAGE = 24

  const fetchData = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    const currentPage = isReset ? 0 : page

    let query = supabase
      .from('gallery')
      .select('*, umkm:umkms(name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // umkm_user only sees their own photos
    if (role === 'umkm_user') {
      if (myUmkm) query = query.eq('umkm_id', myUmkm.id)
      else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
    } else {
      // super_admin / proktor sees only UMKM photos (not null umkm_id)
      query = query.not('umkm_id', 'is', null)
    }

    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    query = query.range(start, end)

    const { data, count, error } = await query

    if (!error && data) {
      const typed = data as (GalleryItem & { umkm?: { name: string } | null })[]
      setItems(prev => isReset ? typed : [...prev, ...typed])
      setHasMore(count ? (start + data.length) < count : false)
      setTotalCount(count ?? 0)
      setPage(currentPage + 1)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [role, myUmkm, page])

  useEffect(() => { fetchData(true) }, [role, myUmkm])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchCategory = watch('category')

  const openCreate = () => {
    setImageBase64(null)
    setImageError('')
    reset({ title: '', description: '', category: '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!imageBase64) {
      setImageError('Foto wajib dipilih atau diupload')
      return
    }
    setImageError('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('gallery').insert({
      title: data.title || null,
      description: data.description || null,
      image_url: imageBase64,
      category: data.category || null,
      umkm_id: myUmkm?.id ?? null,
    } as any)

    if (error) {
      toast.error('Gagal menambahkan foto')
      return
    }
    toast.success('Foto berhasil ditambahkan! 🎉')
    setModalOpen(false)
    await fetchData(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('gallery').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Gagal menghapus foto')
    } else {
      toast.success('Foto berhasil dihapus')
      await fetchData(true)
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  // Filter locally by category
  const displayItems = filterCat === 'Semua'
    ? items
    : items.filter(i => i.category === filterCat)

  const availableCats = ['Semua', ...Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[]]

  // Determine heading based on role
  const heading = role === 'umkm_user'
    ? `Foto Toko – ${myUmkm?.name ?? 'UMKM Anda'}`
    : 'Foto Galeri UMKM'
  const subheading = role === 'umkm_user'
    ? 'Upload foto produk, kegiatan, dan fasilitas toko Anda untuk ditampilkan di profil publik.'
    : 'Kelola foto galeri dari seluruh mitra UMKM.'

  if (role === 'umkm_user' && !myUmkm) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Belum Terhubung ke UMKM</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Akun Anda belum dihubungkan ke profil UMKM. Hubungi admin untuk pengaturan lebih lanjut.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{heading}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subheading}</p>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="bg-[#2D6A4F] hover:bg-[#1B4332] self-start sm:self-auto shadow-2xs"
          id="umkm-galeri-tambah-btn"
        >
          <Upload size={15} /> Upload Foto
        </Button>
      </div>

      {/* ── KPI RIBBON ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Images size={18} className="text-[#2D6A4F]" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500">Total Foto</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Camera size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{availableCats.length - 1}</p>
              <p className="text-xs text-gray-500">Kategori</p>
            </div>
          </div>
          {role !== 'umkm_user' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Store size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {Array.from(new Set(items.map(i => (i.umkm as any)?.name).filter(Boolean))).length}
                </p>
                <p className="text-xs text-gray-500">UMKM</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORY FILTER ── */}
      {!loading && availableCats.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableCats.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filterCat === cat
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── GRID ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Camera size={36} className="text-gray-300" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-700">Belum ada foto</p>
            <p className="text-sm text-gray-400 mt-1">
              {role === 'umkm_user'
                ? 'Mulai upload foto produk atau kegiatan toko Anda!'
                : 'Belum ada foto dari mitra UMKM.'}
            </p>
          </div>
          <Button onClick={openCreate} size="sm" className="bg-[#2D6A4F] hover:bg-[#1B4332]">
            <Plus size={14} /> Upload Foto Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm border border-gray-100 cursor-pointer"
              onClick={() => setLightboxSrc(item.image_url)}
            >
              <img
                src={item.image_url}
                alt={item.title ?? ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-2">
                {/* UMKM badge (admin only) */}
                {role !== 'umkm_user' && item.umkm && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-[#F5A623] px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 z-10 border border-[#F5A623]/20">
                    <Store size={9} /> {(item.umkm as any).name}
                  </div>
                )}
                {/* Category badge */}
                {item.category && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.category}
                  </div>
                )}
                {/* Title on hover */}
                {item.title && (
                  <p className="text-white text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2 px-2">
                    {item.title}
                  </p>
                )}
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-2 rounded-xl shadow-lg"
                  aria-label="Hapus foto"
                  id={`delete-photo-${item.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && items.length > 0 && (
        <div className="flex justify-center mt-4">
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

      {/* ── UPLOAD MODAL ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Foto Toko"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button
              form="umkm-galeri-form"
              type="submit"
              loading={isSubmitting}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              Upload Foto
            </Button>
          </>
        }
      >
        <form id="umkm-galeri-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <MediaPickerButton
            label="Foto Toko *"
            value={imageBase64 ?? undefined}
            onChange={(v) => { setImageBase64(v); if (v) setImageError('') }}
            error={imageError}
            folder="UMKM"
            moduleName="UMKM"
          />

          <Input
            label="Judul Foto (opsional)"
            placeholder="Contoh: Produk Madu Kelulut 250ml"
            {...register('title')}
          />

          {/* Quick Category Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori (opsional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValue('category', watchCategory === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    watchCategory === cat
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#2D6A4F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Input
              placeholder="Atau ketik kategori sendiri..."
              {...register('category')}
            />
          </div>

          <Textarea
            label="Deskripsi (opsional)"
            rows={2}
            placeholder="Deskripsi singkat tentang foto ini..."
            {...register('description')}
          />

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <AlertCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              Foto yang diupload akan tampil di <strong>profil publik toko</strong> Anda pada tab "Foto".
            </p>
          </div>
        </form>
      </Modal>

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus foto "${deleteTarget?.title ?? 'ini'}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />

      {/* ── LIGHTBOX ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Preview"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg transition-colors"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
