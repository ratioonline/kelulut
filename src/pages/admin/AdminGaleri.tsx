import { useEffect, useState } from 'react'
import { Plus, Trash2, Image, Store } from 'lucide-react'
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

export default function AdminGaleri() {
  const [items, setItems] = useState<(GalleryItem & { umkm?: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const { role, myUmkm } = useAuthStore()

  const fetchData = async () => {
    let query = supabase
      .from('gallery')
      .select('*, umkm:umkms(name)')
      .order('created_at', { ascending: false })
      
    if (role === 'umkm_user') {
      if (myUmkm) query = query.eq('umkm_id', myUmkm.id)
      else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
    }

    const { data } = await query
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setImageBase64(null)
    setImageError('')
    reset({ title: '', description: '', category: '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!imageBase64) {
      setImageError('Gambar wajib diupload')
      return
    }
    setImageError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('gallery').insert({
      title: data.title || null,
      description: data.description || null,
      image_url: imageBase64,
      category: data.category || null,
      umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null,
    } as any)
    if (error) { toast.error('Gagal menambah foto'); return }
    toast.success('Foto berhasil ditambahkan')
    setModalOpen(false)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('gallery').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus foto') }
    else { toast.success('Foto berhasil dihapus'); await fetchData() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeri</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola foto kegiatan dan fasilitas.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tambah Foto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Image size={48} className="mx-auto mb-4 opacity-30" />
          <p>Belum ada foto di galeri.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 shadow-sm">
              <img
                src={item.image_url}
                alt={item.title ?? ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-2">
                {item.umkm && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-[#F5A623] px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 z-10 shadow-sm border border-[#F5A623]/30">
                    <Store size={10} /> {item.umkm.name}
                  </div>
                )}
                {item.title && (
                  <p className="text-white text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                    {item.title}
                  </p>
                )}
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  aria-label="Hapus foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Foto Galeri"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="gallery-form" type="submit" loading={isSubmitting}>Tambah</Button>
          </>
        }
      >
        <form id="gallery-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <MediaPickerButton
            label="Foto Galeri"
            value={imageBase64 ?? undefined}
            onChange={(v) => { setImageBase64(v); if (v) setImageError('') }}
            error={imageError}
            folder="Galeri"
            moduleName="Galeri"
          />
          <Input label="Judul (opsional)" placeholder="Nama foto" {...register('title')} />
          <Input label="Kategori (opsional)" placeholder="Kegiatan, Fasilitas, Produk..." {...register('category')} />
          <Textarea label="Deskripsi (opsional)" rows={2} {...register('description')} />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus foto "${deleteTarget?.title ?? 'ini'}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  )
}
