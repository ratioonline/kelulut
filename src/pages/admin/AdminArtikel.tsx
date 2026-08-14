import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Store, ShieldCheck } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Article } from '../../types/database'
import { formatDate, slugify } from '../../lib/utils'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import RichTextEditor from '../../components/ui/RichTextEditor'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Konten terlalu pendek'),
  published: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminArtikel() {
  const [articles, setArticles] = useState<(Article & { umkm?: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const { role, myUmkm } = useAuthStore()

  const fetchData = async () => {
    let query = supabase
      .from('articles')
      .select('*, umkm:umkms(name)')
      .order('created_at', { ascending: false })
      
    if (role === 'umkm_user') {
      if (myUmkm) query = query.eq('umkm_id', myUmkm.id)
      else query = query.eq('umkm_id', '00000000-0000-0000-0000-000000000000')
    }

    const { data } = await query
    if (data) setArticles(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [role, myUmkm])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { published: false } })

  const openCreate = () => {
    setEditing(null)
    setImageBase64(null)
    reset({ published: false, title: '', content: '', excerpt: '' })
    setModalOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditing(article)
    setImageBase64(article.thumbnail_url ?? null)
    reset({
      title: article.title,
      excerpt: article.excerpt ?? '',
      content: article.content,
      published: article.published,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      slug: slugify(data.title),
      excerpt: data.excerpt || null,
      content: data.content,
      thumbnail_url: imageBase64 || null,
      published: data.published,
      umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : (editing ? undefined : null),
    }
    if (editing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('articles').update(payload as any).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui artikel'); return }
      toast.success('Artikel berhasil diperbarui')
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('articles').insert(payload as any)
      if (error) { toast.error('Gagal menambah artikel'); return }
      toast.success('Artikel berhasil ditambahkan')
    }
    setModalOpen(false)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('articles').delete().eq('id', deleteTarget.id)
    if (error) { toast.error('Gagal menghapus artikel') }
    else { toast.success('Artikel berhasil dihapus'); await fetchData() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const togglePublish = async (article: Article) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('articles').update({ published: !article.published } as any).eq('id', article.id)
    if (error) { toast.error('Gagal mengubah status') }
    else {
      toast.success(article.published ? 'Artikel disembunyikan' : 'Artikel dipublikasikan')
      await fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikel</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola konten blog edukasi.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tulis Artikel
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : articles.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Belum ada artikel.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Judul', 'Penulis', 'Tanggal', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {a.thumbnail_url && (
                            <img src={a.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{a.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">{a.excerpt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs font-medium">
                        {a.umkm ? (
                          <span className="flex items-center gap-1.5"><Store size={14} className="text-[#F5A623]" /> {a.umkm.name}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#2D6A4F]" /> Official</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">{formatDate(a.created_at)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={a.published ? 'green' : 'gray'}>{a.published ? 'Publik' : 'Draft'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => togglePublish(a)} className={`p-1.5 rounded-lg transition-colors ${a.published ? 'text-gray-400 hover:bg-orange-50 hover:text-orange-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`} title={a.published ? 'Sembunyikan' : 'Publikasikan'}>
                            {a.published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Artikel' : 'Tulis Artikel Baru'} size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="article-form" type="submit" loading={isSubmitting}>{editing ? 'Simpan' : 'Publikasikan'}</Button>
          </>
        }
      >
        <form id="article-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Judul Artikel" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Ringkasan (Excerpt)" rows={2} placeholder="Ringkasan singkat artikel..." {...register('excerpt')} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konten <span className="text-red-500">*</span>
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.content?.message}
                />
              )}
            />
          </div>

          <MediaPickerButton
            label="Thumbnail Artikel"
            value={imageBase64 ?? undefined}
            onChange={setImageBase64}
            folder="Artikel"
            moduleName="Artikel"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-[#2D6A4F]" {...register('published')} />
            <span className="text-sm text-gray-700">Langsung publikasikan</span>
          </label>
        </form>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message={`Hapus artikel "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`} loading={deleting} />
    </div>
  )
}

