import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarCheck, Users, Clock, Building, Phone, AlertTriangle } from 'lucide-react'
import type { Reservation, Program } from '../../../types/database'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import { normalizeWhatsappNumber } from '../umkm/UmkmCardGrid'
import { extractDepartureTime } from './UpcomingVisitsSection'
import { inferVisitorType } from './ReservationTable'

const DEPARTURE_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
const VISITOR_TYPES = ['Sekolah', 'Instansi', 'Perusahaan', 'Komunitas', 'Umum']

const schema = z.object({
  name: z.string().min(2, 'Nama koordinator minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor WhatsApp minimal 8 digit'),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  visitor_type: z.string().default('Instansi'),
  institution: z.string().min(2, 'Nama instansi/sekolah minimal 2 karakter'),
  address: z.string().optional().nullable(),
  num_visitors: z
    .number({ invalid_type_error: 'Jumlah pengunjung harus berupa angka' })
    .min(1, 'Minimal 1 pengunjung')
    .max(5000, 'Maksimal 5.000 pengunjung'),
  visit_date: z.string().min(1, 'Tanggal kunjungan wajib diisi'),
  departure_time: z.string().default('09:00'),
  program_id: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'done', 'cancelled']).default('confirmed'),
})

export type ReservationFormData = z.infer<typeof schema>

interface ReservationFormModalProps {
  open: boolean
  onClose: () => void
  editingReservation: Reservation | null
  existingReservations: Reservation[]
  programs: Program[]
  onSubmit: (data: ReservationFormData) => Promise<void>
}

export default function ReservationFormModal({
  open,
  onClose,
  editingReservation,
  existingReservations,
  programs,
  onSubmit,
}: ReservationFormModalProps) {
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      num_visitors: 10,
      visitor_type: 'Instansi',
      departure_time: '09:00',
      status: 'confirmed',
      visit_date: new Date().toISOString().split('T')[0],
    },
  })

  const watchPhone = watch('phone')
  const watchDate = watch('visit_date')
  const watchTime = watch('departure_time')
  const watchVisitorType = watch('visitor_type')

  useEffect(() => {
    if (open) {
      if (editingReservation) {
        const timeVal = extractDepartureTime(editingReservation)
        const typeVal = inferVisitorType(editingReservation)

        reset({
          name: editingReservation.name,
          phone: editingReservation.phone || '',
          email: editingReservation.email?.includes('@offline.kebunkelulut') ? '' : editingReservation.email || '',
          visitor_type: typeVal,
          institution: editingReservation.institution || '',
          address: '',
          num_visitors: editingReservation.num_visitors || 1,
          visit_date: editingReservation.visit_date,
          departure_time: timeVal,
          program_id: editingReservation.program_id || '',
          notes: editingReservation.notes || '',
          status: editingReservation.status,
        })
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          visitor_type: 'Instansi',
          institution: '',
          address: '',
          num_visitors: 10,
          visit_date: new Date().toISOString().split('T')[0],
          departure_time: '09:00',
          program_id: '',
          notes: '',
          status: 'confirmed',
        })
      }
      setDuplicateWarning(null)
    }
  }, [open, editingReservation, reset])

  // Realtime Duplicate Check
  useEffect(() => {
    if (!open || editingReservation) {
      setDuplicateWarning(null)
      return
    }

    if (watchPhone && watchDate) {
      const normPhone = normalizeWhatsappNumber(watchPhone)
      const duplicate = existingReservations.find(
        (r) =>
          normalizeWhatsappNumber(r.phone) === normPhone &&
          r.visit_date === watchDate &&
          r.status !== 'cancelled'
      )

      if (duplicate) {
        setDuplicateWarning(
          `Perhatian: Ditemukan reservasi pada tanggal ${watchDate} untuk nomor WhatsApp yang sama (${duplicate.name} - ${duplicate.institution || ''}).`
        )
      } else {
        setDuplicateWarning(null)
      }
    }
  }, [open, editingReservation, watchPhone, watchDate, existingReservations])

  const handleFormSubmit = async (data: ReservationFormData) => {
    const normalizedPhone = normalizeWhatsappNumber(data.phone)
    const payload = {
      ...data,
      phone: normalizedPhone,
    }
    await onSubmit(payload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingReservation ? 'Edit Data Reservasi' : 'Tambah Reservasi Kunjungan'}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            form="reservation-form-main"
            type="submit"
            loading={isSubmitting}
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
          >
            {editingReservation ? 'Simpan Perubahan' : 'Tambah Reservasi'}
          </Button>
        </div>
      }
    >
      <form id="reservation-form-main" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Duplicate warning banner */}
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 animate-in fade-in duration-100">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Potensi Duplikasi Reservasi</p>
              <p className="text-[11px] mt-0.5">{duplicateWarning}</p>
            </div>
          </div>
        )}

        {/* Section 1: Koordinator Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nama Koordinator Pengunjung *"
            placeholder="Contoh: Budi Santoso, S.Pd."
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Nomor WhatsApp Koordinator *"
            placeholder="081234567890"
            required
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        {/* Section 2: Instansi & Jenis Pengunjung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nama Sekolah / Instansi / Komunitas *"
            placeholder="Contoh: Dinas Kominfo Kutai Timur"
            required
            error={errors.institution?.message}
            {...register('institution')}
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Jenis Pengunjung *
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {VISITOR_TYPES.map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setValue('visitor_type', vt)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    watchVisitorType === vt
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Waktu & Jumlah Pengunjung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Tanggal Kunjungan *"
            type="date"
            required
            error={errors.visit_date?.message}
            {...register('visit_date')}
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Jam Keberangkatan (Sangatta) *
            </label>
            <select
              {...register('departure_time')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium font-mono"
            >
              {DEPARTURE_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t} WITA
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Jumlah Pengunjung (Orang) *"
            type="number"
            min={1}
            required
            error={errors.num_visitors?.message}
            {...register('num_visitors', { valueAsNumber: true })}
          />
        </div>

        {/* Section 4: Program Edukasi & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Paket Program Edukasi (Opsional)
            </label>
            <select
              {...register('program_id')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
            >
              <option value="">-- Kunjungan Wisata Mandiri / Edukasi Umum --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Status Reservasi *
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
            >
              <option value="confirmed">🟢 Dikonfirmasi (Siap berkunjung)</option>
              <option value="pending">🟡 Menunggu (Butuh konfirmasi)</option>
              <option value="done">🔵 Selesai (Sudah berkunjung)</option>
              <option value="cancelled">🔴 Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Section 5: Alamat & Catatan / Kritik & Saran */}
        <Input
          label="Alamat Asal Rombongan (Opsional)"
          placeholder="Contoh: Jl. Poros Sangatta - Bontang Km 5"
          {...register('address')}
        />

        <Textarea
          label="Kritik, Saran & Catatan Khusus"
          rows={2}
          placeholder="Tuliskan permintaan khusus (misal: butuh fasilitas parkir bus, sesi petik madu)..."
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
