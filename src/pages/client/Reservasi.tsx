import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle,
  CalendarCheck,
  User,
  Users,
  Clock,
  Building,
  Phone,
  MessageCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types/database'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { normalizeWhatsappNumber } from '../../components/admin/umkm/UmkmCardGrid'
import toast from 'react-hot-toast'

const DEPARTURE_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
const VISITOR_TYPES = ['Sekolah', 'Instansi', 'Perusahaan', 'Komunitas', 'Umum']

const schema = z.object({
  name: z.string().min(2, 'Nama koordinator minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor WhatsApp minimal 8 digit'),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  visitor_type: z.string().default('Sekolah'),
  institution: z.string().min(2, 'Nama instansi/sekolah minimal 2 karakter'),
  address: z.string().optional().nullable(),
  num_visitors: z
    .number({ invalid_type_error: 'Jumlah pengunjung harus berupa angka' })
    .min(1, 'Minimal 1 pengunjung')
    .max(5000, 'Maksimal 5.000 pengunjung'),
  visit_date: z.string().min(1, 'Tanggal kunjungan wajib dipilih'),
  departure_time: z.string().default('09:00'),
  program_id: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
})

type ReservationFormData = z.infer<typeof schema>

export default function ReservasiPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [submittedData, setSubmittedData] = useState<ReservationFormData | null>(null)

  useEffect(() => {
    supabase
      .from('programs')
      .select('id, title, price')
      .eq('is_active', true)
      .order('title', { ascending: true })
      .then(({ data }) => data && setPrograms(data as Program[]))
  }, [])

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
      visitor_type: 'Sekolah',
      departure_time: '09:00',
    },
  })

  const watchVisitorType = watch('visitor_type')

  const onSubmit = async (data: ReservationFormData) => {
    try {
      const normalizedPhone = normalizeWhatsappNumber(data.phone)
      const formattedNotes = `Jam: ${data.departure_time} WITA | Kategori: ${data.visitor_type}${
        data.address ? ` | Alamat: ${data.address}` : ''
      }${data.notes ? ` | Catatan: ${data.notes}` : ''}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('reservations').insert({
        name: data.name,
        email: data.email || null,
        phone: normalizedPhone,
        institution: data.institution,
        visit_date: data.visit_date,
        num_visitors: data.num_visitors,
        program_id: data.program_id || null,
        notes: formattedNotes,
        status: 'pending',
      } as any)

      if (error) throw error

      setSubmittedData({ ...data, phone: normalizedPhone })
      toast.success('Pendaftaran reservasi berhasil dikirim!')
      reset()
    } catch (err: any) {
      console.error('Reservation error:', err)
      toast.error('Gagal mengirim pendaftaran reservasi. Silakan periksa kembali formulir.')
    }
  }

  // Minimum date = tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  if (submittedData) {
    const waGreeting = encodeURIComponent(
      `Halo Admin Kebun Kelulut Sangatta, saya telah mendaftarkan reservasi kunjungan atas nama ${
        submittedData.name
      } (${submittedData.institution}) untuk tanggal ${submittedData.visit_date} pukul ${
        submittedData.departure_time
      } WITA (${submittedData.num_visitors} orang). Mohon konfirmasi jadwal kami. Terima kasih!`
    )

    return (
      <div className="min-h-screen bg-[#FAF3E0] pt-28 pb-16 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle size={36} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#1B4332]">Pendaftaran Kunjungan Berhasil!</h2>
            <p className="text-xs text-gray-500 mt-1">
              Data reservasi Anda telah berhasil tercatat di sistem Kebun Kelulut Sangatta.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
              <span className="text-gray-500 font-sans">Koordinator:</span>
              <strong className="text-gray-900">{submittedData.name}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
              <span className="text-gray-500 font-sans">Rombongan:</span>
              <strong className="text-gray-900">{submittedData.institution}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
              <span className="text-gray-500 font-sans">Tanggal Kunjungan:</span>
              <strong className="text-emerald-800">{submittedData.visit_date}</strong>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
              <span className="text-gray-500 font-sans">Jam Keberangkatan:</span>
              <strong className="text-gray-900">{submittedData.departure_time} WITA</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-sans">Jumlah Pengunjung:</span>
              <strong className="text-emerald-800">{submittedData.num_visitors} Orang</strong>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`https://wa.me/6282272611515?text=${waGreeting}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle size={15} />
              <span>Konfirmasi Instan via WhatsApp</span>
            </a>

            <Button onClick={() => setSubmittedData(null)} variant="outline" size="sm" className="w-full">
              Buat Reservasi Lainnya
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Formulir Reservasi Kunjungan - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Formulir pendaftaran calon pengunjung Kebun Kelulut Sangatta. Daftarkan rombongan sekolah, instansi, atau keluarga Anda sekarang."
        />
      </Helmet>

      <section className="pt-28 pb-16 bg-[#FAF3E0] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block mb-1">
              Pendaftaran Online
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1B4332] tracking-tight">
              Formulir Pendaftaran Calon Pengunjung
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-xl mx-auto">
              Silakan lengkapi formulir di bawah ini. Tim pengelola Kebun-Kelulut akan memverifikasi dan menyiapkan jadwal kunjungan terbaik untuk Anda.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* GROUP 1: DATA KOORDINATOR */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User size={16} className="text-[#2D6A4F]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    1. Data Koordinator / Penanggung Jawab
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nama Lengkap Koordinator *"
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    required
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Nomor WhatsApp / HP *"
                    placeholder="081234567890"
                    required
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <Input
                  label="Alamat Email (Opsional)"
                  placeholder="email@sekolah.sch.id"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* GROUP 2: INFORMASI KUNJUNGAN */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building size={16} className="text-[#2D6A4F]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    2. Informasi Rombongan & Instansi
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Jenis Pengunjung *
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {VISITOR_TYPES.map((vt) => (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setValue('visitor_type', vt)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                          watchVisitorType === vt
                            ? 'bg-[#2D6A4F] text-white border-transparent font-bold shadow-2xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {vt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nama Sekolah / Instansi / Komunitas *"
                    placeholder="Contoh: SD Negeri 001 Sangatta Utara"
                    required
                    error={errors.institution?.message}
                    {...register('institution')}
                  />
                  <Input
                    label="Alamat Asal Rombongan (Opsional)"
                    placeholder="Contoh: Jl. Yos Sudarso II, Sangatta"
                    {...register('address')}
                  />
                </div>
              </div>

              {/* GROUP 3: WAKTU & PESERTA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Clock size={16} className="text-[#2D6A4F]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    3. Waktu & Rencana Kunjungan
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Jumlah Pengunjung (Orang) *"
                    type="number"
                    min={1}
                    required
                    error={errors.num_visitors?.message}
                    {...register('num_visitors', { valueAsNumber: true })}
                  />

                  <Input
                    label="Tanggal Kunjungan *"
                    type="date"
                    min={minDateStr}
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pilihan Paket Edukasi (Opsional)
                  </label>
                  <select
                    {...register('program_id')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
                  >
                    <option value="">-- Kunjungan Mandiri / Edukasi Umum --</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GROUP 4: TAMBAHAN */}
              <div className="space-y-3 pt-2">
                <Textarea
                  label="Kritik, Saran & Permintaan Khusus (Opsional)"
                  rows={2}
                  placeholder="Misal: Mohon disediakan area parkir 2 unit bus, paket makan siang..."
                  {...register('notes')}
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] justify-center shadow-md font-bold text-sm"
                >
                  <CalendarCheck size={18} />
                  <span>Daftar Kunjungan Sekarang</span>
                </Button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  *Konfirmasi jadwal dan instruksi rute akan dikirimkan oleh pengelola via WhatsApp.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
