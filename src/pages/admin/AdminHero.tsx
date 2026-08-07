import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown, Eye, GripVertical, Monitor,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../types/database'
import { Card, CardBody } from '../../components/ui/Card'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ImageUpload from '../../components/ui/ImageUpload'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Badge } from '../../components/ui/Badge'
import toast from 'react-hot-toast'

const schema = z.object({
  title:                z.string().min(3, 'Judul minimal 3 karakter'),
  subtitle:             z.string().optional(),
  badge_text:           z.string().optional(),
  cta_primary_label:    z.string().optional(),
  cta_primary_url:      z.string().optional(),
  cta_secondary_label:  z.string().optional(),
  cta_secondary_url:    z.string().optional(),
  sort_order:           z.number().min(0),
  is_active:            z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminHero() {
  const [slides, setSlides]         = useState<HeroSlide[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null)
  const [editing, setEditing]       = useState<HeroSlide | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')

  const fetchData = async () => {
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setSlides(data as HeroSlide[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, sort_order: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    setImageBase64(null)
    setImageError('')
    reset({
      title: '',
      subtitle: '',
      badge_text: '🐝 Wisata Edukasi Kelulut',
      cta_primary_label: 'Reservasi Sekarang',
      cta_primary_url: '/reservasi',
      cta_secondary_label: 'Lihat Program',
      cta_secondary_url: '/program',
      sort_order: slides.length + 1,
      is_active: true,
    })
    setModalOpen(true)
  }

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide)
    setImageBase64(slide.image_url)
    setImageError('')
    reset({
      title:               slide.title,
      subtitle:            slide.subtitle ?? '',
      badge_text:          slide.badge_text ?? '',
      cta_primary_label:   slide.cta_primary_label ?? '',
      cta_primary_url:     slide.cta_primary_url ?? '',
      cta_secondary_label: slide.cta_secondary_label ?? '',
      cta_secondary_url:   slide.cta_secondary_url ?? '',
      sort_order:          slide.sort_order,
      is_active:           slide.is_active,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!imageBase64) {
      setImageError('Foto background wajib diupload')
      return
    }
    setImageError('')

    const payload = {
      title:               data.title,
      subtitle:            data.subtitle || null,
      image_url:           imageBase64,
      badge_text:          data.badge_text || null,
      cta_primary_label:   data.cta_primary_label || null,
      cta_primary_url:     data.cta_primary_url || null,
      cta_secondary_label: data.cta_secondary_label || null,
      cta_secondary_url:   data.cta_secondary_url || null,
      sort_order:          data.sort_order,
      is_active:           data.is_active,
    }

    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('hero_slides').update(payload as any).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui slide'); return }
      toast.success('Slide berhasil diperbarui')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('hero_slides').insert(payload as any)
      if (error) { toast.error('Gagal menambah slide'); return }
      toast.success('Slide berhasil ditambahkan')
    }
    setModalOpen(false)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('hero_slides').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus slide') }
    else { toast.success('Slide berhasil dihapus'); await fetchData() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const toggleActive = async (slide: HeroSlide) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('hero_slides').update({ is_active: !slide.is_active } as any).eq('id', slide.id)
    if (error) toast.error('Gagal mengubah status')
    else {
      toast.success(slide.is_active ? 'Slide dinonaktifkan' : 'Slide diaktifkan')
      await fetchData()
    }
  }

  const moveOrder = async (slide: HeroSlide, direction: 'up' | 'down') => {
    const sorted = [...slides].sort((a, b) => a.sort_order - b.sort_order)
    const idx    = sorted.findIndex((s) => s.id === slide.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const a = sorted[idx]
    const b = sorted[swapIdx]
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('hero_slides').update({ sort_order: b.sort_order } as any).eq('id', a.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('hero_slides').update({ sort_order: a.sort_order } as any).eq('id', b.id),
    ])
    await fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slider</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola slide background pada halaman beranda.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tambah Slide
        </Button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Monitor size={16} className="shrink-0 mt-0.5" />
        <span>
          Slide yang aktif akan tampil berganti-ganti otomatis di halaman beranda. Urutan bisa diatur dengan tombol ↑↓.
          Gunakan foto beresolusi tinggi minimal <strong>1280 × 720px</strong> agar tampilannya optimal.
        </span>
      </div>

      {/* Slide cards */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">Belum ada slide. Tambah slide pertama!</p>
          <Button onClick={openCreate} variant="outline"><Plus size={16} /> Tambah Slide</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {[...slides].sort((a, b) => a.sort_order - b.sort_order).map((slide, idx, arr) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative sm:w-64 h-40 sm:h-auto shrink-0 overflow-hidden bg-gray-100">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Order badge */}
                  <div className="absolute top-2 left-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
                    {idx + 1}
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={slide.is_active ? 'green' : 'gray'}>
                      {slide.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  {/* Title overlay */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-tight">
                      {slide.title.replace('\n', ' ')}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <CardBody className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    {slide.badge_text && (
                      <span className="text-xs text-[#F5A623] font-semibold">{slide.badge_text}</span>
                    )}
                    <h3 className="font-bold text-gray-900 leading-snug">
                      {slide.title.replace('\n', ' · ')}
                    </h3>
                    {slide.subtitle && (
                      <p className="text-sm text-gray-500 line-clamp-2">{slide.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {slide.cta_primary_label && (
                        <span className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] px-2 py-0.5 rounded-md font-medium">
                          CTA 1: {slide.cta_primary_label}
                        </span>
                      )}
                      {slide.cta_secondary_label && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                          CTA 2: {slide.cta_secondary_label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-wrap border-t border-gray-100 pt-3">
                    {/* Order controls */}
                    <button
                      onClick={() => moveOrder(slide, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 transition-colors"
                      title="Pindah ke atas"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => moveOrder(slide, 'down')}
                      disabled={idx === arr.length - 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 transition-colors"
                      title="Pindah ke bawah"
                    >
                      <ArrowDown size={15} />
                    </button>

                    <span className="w-px h-5 bg-gray-200 mx-1" />

                    {/* Preview */}
                    <button
                      onClick={() => setPreviewSlide(slide)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Preview slide"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(slide)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        slide.is_active
                          ? 'text-green-500 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={slide.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {slide.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(slide)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Edit slide"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(slide)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Hapus slide"
                    >
                      <Trash2 size={15} />
                    </button>

                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <GripVertical size={13} /> Urutan: {slide.sort_order}
                    </span>
                  </div>
                </CardBody>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Form Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Slide Hero' : 'Tambah Slide Hero'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="hero-form" type="submit" loading={isSubmitting}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="hero-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Background image */}
          <ImageUpload
            label="Foto Background"
            value={imageBase64 ?? undefined}
            onChange={(v) => { setImageBase64(v); if (v) setImageError('') }}
            error={imageError}
            maxInputMB={10}
            maxDimension={1600}
            quality={0.85}
          />

          {/* Title */}
          <div>
            <Input
              label="Judul Slide"
              required
              placeholder="Baris 1"
              error={errors.title?.message}
              {...register('title')}
            />
            <p className="text-xs text-gray-400 mt-1">
              Gunakan <code className="bg-gray-100 px-1 rounded">\n</code> di tengah judul untuk membuat baris kedua berwarna emas.
              Contoh: <code className="bg-gray-100 px-1 rounded">Temukan Keajaiban\nLebah Kelulut</code>
            </p>
          </div>

          {/* Subtitle */}
          <Textarea
            label="Deskripsi / Subtitle"
            rows={3}
            placeholder="Deskripsi singkat yang muncul di bawah judul"
            {...register('subtitle')}
          />

          {/* Badge */}
          <Input
            label="Teks Badge"
            placeholder="🐝 Wisata Edukasi Kelulut"
            {...register('badge_text')}
          />

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Label Tombol Utama"
              placeholder="Reservasi Sekarang"
              {...register('cta_primary_label')}
            />
            <Input
              label="URL Tombol Utama"
              placeholder="/reservasi"
              {...register('cta_primary_url')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Label Tombol Kedua"
              placeholder="Lihat Program"
              {...register('cta_secondary_label')}
            />
            <Input
              label="URL Tombol Kedua"
              placeholder="/program"
              {...register('cta_secondary_url')}
            />
          </div>

          {/* Sort order + active */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <Input
              label="Urutan Tampil"
              type="number"
              min={0}
              {...register('sort_order', { valueAsNumber: true })}
            />
            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
              <input type="checkbox" className="w-4 h-4 rounded accent-[#2D6A4F]" {...register('is_active')} />
              <span className="text-sm text-gray-700">Slide aktif (tampil di beranda)</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* ── Preview Modal ── */}
      <Modal
        open={!!previewSlide}
        onClose={() => setPreviewSlide(null)}
        title="Preview Slide"
        size="xl"
      >
        {previewSlide && (
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img
              src={previewSlide.image_url}
              alt={previewSlide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/75 via-[#1B4332]/55 to-[#1B4332]/80" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
              {previewSlide.badge_text && (
                <span className="inline-block bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {previewSlide.badge_text}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-3">
                {previewSlide.title.split('\n').map((part, i) => (
                  <span key={i}>
                    {i === 1 ? <span className="text-[#F5A623]">{part}</span> : part}
                    {i === 0 && previewSlide.title.includes('\n') && <br />}
                  </span>
                ))}
              </h2>
              {previewSlide.subtitle && (
                <p className="text-gray-200 text-sm max-w-lg">{previewSlide.subtitle}</p>
              )}
              <div className="flex gap-3 mt-5 flex-wrap justify-center">
                {previewSlide.cta_primary_label && (
                  <span className="bg-[#F5A623] text-white text-sm font-bold px-5 py-2 rounded-xl">
                    {previewSlide.cta_primary_label}
                  </span>
                )}
                {previewSlide.cta_secondary_label && (
                  <span className="border-2 border-white/70 text-white text-sm font-bold px-5 py-2 rounded-xl">
                    {previewSlide.cta_secondary_label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus slide "${deleteTarget?.title.replace('\n', ' ')}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  )
}
