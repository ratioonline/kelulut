import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types/database'
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
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Harga harus angka' }).min(0),
  duration: z.string().optional(),
  is_active: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminProgram() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Program | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const fetchData = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setPrograms(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, price: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    setImageBase64(null)
    reset({ is_active: true, price: 0, title: '', description: '', duration: '' })
    setModalOpen(true)
  }

  const openEdit = (program: Program) => {
    setEditing(program)
    setImageBase64(program.image_url ?? null)
    reset({
      title: program.title,
      description: program.description ?? '',
      price: program.price ?? 0,
      duration: program.duration ?? '',
      is_active: program.is_active,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      slug: slugify(data.title),
      description: data.description || null,
      price: data.price,
      duration: data.duration || null,
      image_url: imageBase64 || null,
      is_active: data.is_active,
    }

    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('programs').update(payload as any).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui program'); return }
      toast.success('Program berhasil diperbarui')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('programs').insert(payload as any)
      if (error) { toast.error('Gagal menambah program'); return }
      toast.success('Program berhasil ditambahkan')
    }
    setModalOpen(false)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('programs').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus program') }
    else { toast.success('Program berhasil dihapus'); await fetchData() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const toggleActive = async (program: Program) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('programs').update({ is_active: !program.is_active } as any).eq('id', program.id)
    if (error) { toast.error('Gagal mengubah status') }
    else {
      toast.success(`Program ${program.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      await fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Wisata</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola paket kunjungan.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tambah Program
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : programs.length === 0 ? (
          <p className="col-span-full text-center text-gray-400 py-20">Belum ada program.</p>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              {program.image_url ? (
                <div className="aspect-video overflow-hidden">
                  <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                  Belum ada foto
                </div>
              )}
              <CardBody>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 flex-1">{program.title}</h3>
                  <Badge variant={program.is_active ? 'green' : 'gray'}>
                    {program.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{program.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="font-bold text-[#F5A623]">
                    {program.price ? formatCurrency(program.price) : 'Gratis'}
                  </span>
                  <span className="text-gray-400">{program.duration}</span>
                </div>
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => toggleActive(program)}
                    className={`p-1.5 rounded-lg transition-colors ${program.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={program.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {program.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => openEdit(program)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(program)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Program' : 'Tambah Program'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="program-form" type="submit" loading={isSubmitting}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form id="program-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nama Program" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Deskripsi" rows={3} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga (Rp)"
              type="number"
              min={0}
              required
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
            <Input label="Durasi" placeholder="mis. 2 jam" {...register('duration')} />
          </div>
          <MediaPickerButton
            label="Foto Program"
            value={imageBase64 ?? undefined}
            onChange={setImageBase64}
            folder="Program"
            moduleName="Program"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#2D6A4F]" {...register('is_active')} />
            <span className="text-sm text-gray-700">Program aktif (tampil di website)</span>
          </label>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus program "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  )
}
