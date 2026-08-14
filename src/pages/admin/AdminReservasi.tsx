import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  MessageCircle,
  Sparkles,
  Building,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import type { Reservation, Program } from '../../types/database'
import { formatDate, formatCurrency } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

const STATUS_OPTIONS = ['Semua', 'pending', 'confirmed', 'done', 'cancelled'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

const STATUS_LABELS: Record<string, string> = {
  Semua: 'Semua',
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}

const formSchema = z.object({
  name: z.string().min(2, 'Nama pengunjung/PIC minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor telepon/WhatsApp minimal 8 digit'),
  email: z.string().optional(),
  institution: z.string().optional(),
  visit_date: z.string().min(1, 'Tanggal kunjungan wajib dipilih'),
  num_visitors: z
    .number({ invalid_type_error: 'Jumlah pengunjung harus berupa angka' })
    .min(1, 'Minimal 1 pengunjung')
    .max(2000, 'Maksimal 2.000 pengunjung'),
  program_id: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'done', 'cancelled']),
  notes: z.string().optional(),
})

type ReservationFormData = z.infer<typeof formSchema>

export default function AdminReservasi() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [filtered, setFiltered] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('Semua')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [updating, setUpdating] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { role } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      num_visitors: 1,
      status: 'confirmed',
      visit_date: new Date().toISOString().split('T')[0],
      notes: 'Kunjungan Manual / Offline',
    },
  })

  const fetchData = async () => {
    setLoading(true)
    const [resResult, progResult] = await Promise.all([
      supabase.from('reservations').select('*').order('visit_date', { ascending: false }),
      supabase.from('programs').select('*').eq('is_active', true).order('title', { ascending: true }),
    ])

    if (resResult.data) setReservations(resResult.data)
    if (progResult.data) setPrograms(progResult.data as Program[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let result = reservations
    if (status !== 'Semua') result = result.filter((r) => r.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.phone?.includes(q) ||
          (r.institution && r.institution.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      )
    }
    setFiltered(result)
  }, [reservations, status, search])

  // Open modal for new manual visit
  const handleOpenAddModal = () => {
    setEditingReservation(null)
    reset({
      name: '',
      phone: '',
      email: '',
      institution: '',
      visit_date: new Date().toISOString().split('T')[0],
      num_visitors: 1,
      program_id: '',
      status: 'confirmed',
      notes: 'Kunjungan Manual / Offline',
    })
    setFormModalOpen(true)
  }

  // Open modal for editing existing reservation
  const handleOpenEditModal = (r: Reservation) => {
    setEditingReservation(r)
    reset({
      name: r.name,
      phone: r.phone,
      email: r.email?.includes('@offline.kebunkelulut') ? '' : r.email,
      institution: r.institution || '',
      visit_date: r.visit_date,
      num_visitors: r.num_visitors,
      program_id: r.program_id || '',
      status: r.status,
      notes: r.notes || '',
    })
    setFormModalOpen(true)
  }

  // Save manual visit (insert or update)
  const onSubmit = async (formData: ReservationFormData) => {
    try {
      const emailValue = formData.email && formData.email.trim() !== ''
        ? formData.email.trim()
        : `offline-${Date.now()}@offline.kebunkelulut.id`

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: emailValue,
        institution: formData.institution?.trim() || null,
        visit_date: formData.visit_date,
        num_visitors: formData.num_visitors,
        program_id: formData.program_id || null,
        status: formData.status,
        notes: formData.notes?.trim() || null,
      }

      if (editingReservation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from('reservations')
          .update(payload as any)
          .eq('id', editingReservation.id)

        if (error) throw error
        toast.success('Data kunjungan berhasil diperbarui!')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('reservations').insert(payload as any)

        if (error) throw error
        toast.success('Kunjungan manual berhasil ditambahkan!')
      }

      setFormModalOpen(false)
      await fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data kunjungan')
    }
  }

  // Update status directly
  const updateStatus = async (id: string, newStatus: Reservation['status']) => {
    setUpdating(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('reservations').update({ status: newStatus } as any).eq('id', id)

    if (error) {
      toast.error('Gagal memperbarui status')
    } else {
      toast.success('Status berhasil diperbarui')
      await fetchData()
      setSelected((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev))
    }
    setUpdating(false)
  }

  // Delete reservation
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('reservations').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Gagal menghapus data reservasi')
    } else {
      toast.success('Reservasi berhasil dihapus')
      if (selected?.id === deleteTarget.id) setSelected(null)
      await fetchData()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  // Helpers
  const getProgramTitle = (programId: string | null) => {
    if (!programId) return 'Kunjungan Umum'
    const found = programs.find((p) => p.id === programId)
    return found ? found.title : 'Program Khusus'
  }

  const formatWhatsAppLink = (phone: string, name: string, date: string) => {
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }
    const message = encodeURIComponent(
      `Halo ${name}, kami dari Kebun Kelulut Sangatta mengonfirmasi terkait agenda kunjungan Anda pada tanggal ${formatDate(
        date
      )}. Ada yang bisa kami bantu?`
    )
    return `https://wa.me/${cleanPhone}?text=${message}`
  }

  // Summary Metrics
  const totalReservations = reservations.length
  const totalVisitors = reservations.reduce((sum, r) => sum + (r.num_visitors || 0), 0)
  const pendingCount = reservations.filter((r) => r.status === 'pending').length
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length
  const doneCount = reservations.filter((r) => r.status === 'done').length

  return (
    <div className="space-y-6">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Reservasi & Kunjungan</h1>
            <span className="bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {reservations.length} Jadwal
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Kelola semua pemesanan online dan input agenda kunjungan manual / offline (walk-in).
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm flex items-center gap-2 px-4 py-2.5 rounded-xl self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Input Kunjungan Manual</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Pengunjung</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalVisitors.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-400">orang</span></p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Menunggu Konfirmasi</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{pendingCount} <span className="text-xs font-normal text-gray-400">agenda</span></p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Dikonfirmasi / Siap</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">{confirmedCount} <span className="text-xs font-normal text-gray-400">agenda</span></p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Kunjungan Selesai</p>
              <p className="text-xl font-bold text-green-600 mt-0.5">{doneCount} <span className="text-xs font-normal text-gray-400">agenda</span></p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, instansi, HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={15} className="text-gray-400 mr-1" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                status === s
                  ? 'bg-[#2D6A4F] text-white shadow-sm font-semibold'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[s]}
              {s !== 'Semua' && (
                <span className="ml-1.5 opacity-80 text-[11px]">
                  ({reservations.filter((r) => r.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Tidak ada data reservasi.</p>
              <p className="text-gray-400 text-xs mt-1">
                {search || status !== 'Semua'
                  ? 'Coba ubah kata kunci pencarian atau filter status.'
                  : 'Klik tombol "Input Kunjungan Manual" di atas untuk menambahkan agenda baru.'}
              </p>
              <Button
                variant="outline"
                onClick={handleOpenAddModal}
                className="mt-4 text-xs"
              >
                <Plus size={14} className="mr-1" /> Tambah Kunjungan Manual
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {['Pengunjung / Kontak', 'Instansi', 'Tanggal Kunjungan', 'Peserta', 'Paket / Program', 'Tipe', 'Status', 'Aksi'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => {
                    const isManual =
                      r.email?.includes('@offline.kebunkelulut') ||
                      r.notes?.toLowerCase().includes('manual') ||
                      r.notes?.toLowerCase().includes('walk-in')

                    return (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-900">{r.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{r.phone}</span>
                            {r.phone && (
                              <a
                                href={formatWhatsAppLink(r.phone, r.name, r.visit_date)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-green-600 hover:text-green-700 text-xs"
                                title="Hubungi via WhatsApp"
                              >
                                <MessageCircle size={13} className="mr-0.5" />
                                <span className="text-[11px]">Chat WA</span>
                              </a>
                            )}
                          </div>
                          {r.email && !r.email.includes('@offline.kebunkelulut') && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{r.email}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {r.institution ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                              <Building size={12} className="text-gray-500" />
                              {r.institution}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap font-medium text-xs">
                          {formatDate(r.visit_date)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-800 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{r.num_visitors}</span>{' '}
                          <span className="text-xs text-gray-500">orang</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-gray-700 font-medium">
                            {getProgramTitle(r.program_id)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isManual ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles size={11} /> Manual / Offline
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Online
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelected(r)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#2D6A4F] transition-colors"
                              title="Lihat Detail"
                              aria-label="Detail"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(r)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                              title="Edit Kunjungan"
                              aria-label="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            {(role === 'super_admin' || role === 'proktor' || role === 'umkm_user') && (
                              <button
                                onClick={() => setDeleteTarget(r)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Hapus Reservasi"
                                aria-label="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal: Input / Edit Kunjungan Manual */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingReservation ? 'Edit Data Kunjungan' : 'Input Kunjungan Manual / Offline'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
            <Sparkles size={16} className="text-[#2D6A4F] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1B4332]">Form Kunjungan Luar Pendaftaran Online</p>
              <p className="text-gray-600 mt-0.5">
                Dapat diisi oleh Admin maupun UMKM untuk kunjungan rombongan, tamu langsung (walk-in), atau pemesanan lewat telepon/WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Pengunjung / Penanggung Jawab (PIC)"
              placeholder="Contoh: Bpk. Hendra Gunawan"
              required
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Nomor Telepon / WhatsApp"
              placeholder="Contoh: 08123456789"
              required
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Input
              label="Instansi / Lembaga / Sekolah (Opsional)"
              placeholder="Contoh: SD Negeri 001 Sangatta Utara"
              {...register('institution')}
              error={errors.institution?.message}
            />

            <Input
              label="Email (Opsional)"
              type="email"
              placeholder="pengunjung@email.com (bisa dikosongkan)"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Tanggal Kunjungan"
              type="date"
              required
              {...register('visit_date')}
              error={errors.visit_date?.message}
            />

            <Input
              label="Jumlah Pengunjung (Orang)"
              type="number"
              min={1}
              required
              {...register('num_visitors', { valueAsNumber: true })}
              error={errors.num_visitors?.message}
            />

            <Select
              label="Paket / Program Edukasi"
              {...register('program_id')}
              error={errors.program_id?.message}
              options={[
                { value: '', label: 'Kunjungan Umum (Tanpa Paket Program)' },
                ...programs.map((p) => ({
                  value: p.id,
                  label: `${p.title}${p.price ? ` - ${formatCurrency(p.price)}/org` : ''}`,
                })),
              ]}
            />

            <Select
              label="Status Kunjungan"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'confirmed', label: 'Dikonfirmasi (Terjadwal)' },
                { value: 'done', label: 'Selesai (Langsung Hadir / Lunas)' },
                { value: 'pending', label: 'Menunggu Konfirmasi' },
                { value: 'cancelled', label: 'Dibatalkan' },
              ]}
            />
          </div>

          <Textarea
            label="Catatan / Keterangan Kunjungan"
            rows={3}
            placeholder="Contoh: Kunjungan walk-in rombongan 15 orang, request sesi petik madu langsung."
            {...register('notes')}
            error={errors.notes?.message}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            >
              {isSubmitting ? 'Menyimpan...' : editingReservation ? 'Simpan Perubahan' : 'Simpan Kunjungan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detail Reservasi & Kunjungan"
        size="md"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium">Nama PIC / Kontak</p>
                <p className="text-gray-900 font-semibold mt-0.5">{selected.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Telepon / WhatsApp</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-900 font-medium">{selected.phone}</span>
                  {selected.phone && (
                    <a
                      href={formatWhatsAppLink(selected.phone, selected.name, selected.visit_date)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 hover:text-green-700 inline-flex items-center text-xs bg-green-50 px-2 py-0.5 rounded-md"
                    >
                      <MessageCircle size={12} className="mr-1" />
                      Chat
                    </a>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="text-gray-700 mt-0.5">
                  {selected.email && !selected.email.includes('@offline.kebunkelulut')
                    ? selected.email
                    : '- (Manual Offline)'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Instansi / Rombongan</p>
                <p className="text-gray-900 font-medium mt-0.5">{selected.institution || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Tanggal Kunjungan</p>
                <p className="text-gray-900 font-semibold mt-0.5">{formatDate(selected.visit_date)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Jumlah Pengunjung</p>
                <p className="text-gray-900 font-semibold mt-0.5">{selected.num_visitors} Orang</p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-medium">Paket / Program</p>
                <p className="text-gray-900 font-semibold mt-0.5">{getProgramTitle(selected.program_id)}</p>
              </div>
            </div>

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Catatan Kunjungan</p>
                <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-xs leading-relaxed border border-gray-100">
                  {selected.notes}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Status Kunjungan Saat Ini</p>
              <StatusBadge status={selected.status} />
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-2.5">Ubah Status Kunjungan</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'confirmed', label: 'Dikonfirmasi', color: 'bg-blue-600 hover:bg-blue-700' },
                    { value: 'done', label: 'Selesai / Hadir', color: 'bg-green-600 hover:bg-green-700' },
                    { value: 'pending', label: 'Menunggu', color: 'bg-amber-600 hover:bg-amber-700' },
                    { value: 'cancelled', label: 'Batalkan', color: 'bg-red-600 hover:bg-red-700' },
                  ] as const
                )
                  .filter((opt) => opt.value !== selected.status)
                  .map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(selected.id, opt.value)}
                      disabled={updating}
                      className={`${opt.color} text-white text-xs font-semibold px-3.5 py-2 rounded-xl disabled:opacity-60 transition-all shadow-sm`}
                    >
                      {updating ? '...' : opt.label}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const toEdit = selected
                  setSelected(null)
                  handleOpenEditModal(toEdit)
                }}
              >
                <Pencil size={14} className="mr-1" /> Edit Data
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Reservasi / Kunjungan"
        message={`Apakah Anda yakin ingin menghapus data kunjungan atas nama "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Data"
        loading={deleting}
      />
    </div>
  )
}

