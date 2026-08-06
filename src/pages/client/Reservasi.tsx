import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, CalendarCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types/database'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(9, 'Nomor telepon tidak valid').max(15, 'Nomor telepon terlalu panjang'),
  institution: z.string().optional(),
  visit_date: z.string().min(1, 'Tanggal kunjungan wajib diisi'),
  num_visitors: z
    .number({ invalid_type_error: 'Jumlah pengunjung harus angka' })
    .min(1, 'Minimal 1 pengunjung')
    .max(500, 'Maksimal 500 pengunjung'),
  program_id: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const benefits = [
  'Konfirmasi reservasi via WhatsApp/Email',
  'Fleksibel jadwal kunjungan',
  'Tersedia untuk grup dan rombongan sekolah',
  'Pemandu wisata berpengalaman',
]

export default function ReservasiPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase
      .from('programs')
      .select('id, title, price')
      .eq('is_active', true)
      .then(({ data }) => data && setPrograms(data as Program[]))
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { num_visitors: 1 },
  })

  const onSubmit = async (data: FormData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('reservations').insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      institution: data.institution || null,
      visit_date: data.visit_date,
      num_visitors: data.num_visitors,
      program_id: data.program_id || null,
      notes: data.notes || null,
    } as any)

    if (error) {
      toast.error('Gagal mengirim reservasi. Coba lagi.')
      return
    }

    setSubmitted(true)
    reset()
    toast.success('Reservasi berhasil dikirim!')
  }

  // Minimum date = tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF3E0] pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Reservasi Terkirim!</h2>
          <p className="text-gray-600 mb-6">
            Terima kasih telah melakukan reservasi. Tim kami akan menghubungi Anda dalam 1×24 jam
            untuk konfirmasi kunjungan.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Buat Reservasi Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Reservasi Kunjungan - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Reservasi kunjungan wisata edukasi ke Kebun Kelulut Sangatta secara online."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-[#F5A623] text-sm font-semibold uppercase tracking-widest">
            Pemesanan Online
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold">Reservasi Kunjungan</h1>
          <p className="mt-4 text-gray-200 text-lg">
            Isi form di bawah untuk memesan kunjungan Anda. Tim kami akan menghubungi Anda segera.
          </p>
        </div>
      </section>

      <section className="py-16 bg-[#FAF3E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardBody>
                  <h2 className="text-xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
                    <CalendarCheck size={22} className="text-[#2D6A4F]" />
                    Form Reservasi
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Nama Lengkap"
                        placeholder="Nama Anda"
                        required
                        error={errors.name?.message}
                        {...register('name')}
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="email@example.com"
                        required
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Nomor WhatsApp / Telepon"
                        placeholder="08xxxxxxxxxx"
                        required
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                      <Input
                        label="Instansi / Sekolah"
                        placeholder="Opsional"
                        error={errors.institution?.message}
                        {...register('institution')}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Tanggal Kunjungan"
                        type="date"
                        required
                        min={minDateStr}
                        error={errors.visit_date?.message}
                        {...register('visit_date')}
                      />
                      <Input
                        label="Jumlah Pengunjung"
                        type="number"
                        min={1}
                        max={500}
                        required
                        error={errors.num_visitors?.message}
                        {...register('num_visitors', { valueAsNumber: true })}
                      />
                    </div>
                    <Select
                      label="Paket Program"
                      placeholder="Pilih program (opsional)"
                      options={programs.map((p) => ({
                        value: p.id,
                        label: `${p.title}${p.price ? ` – Rp${p.price.toLocaleString('id-ID')}` : ''}`,
                      }))}
                      error={errors.program_id?.message}
                      {...register('program_id')}
                    />
                    <Textarea
                      label="Catatan Tambahan"
                      placeholder="Informasi tambahan, permintaan khusus, dll."
                      rows={3}
                      {...register('notes')}
                    />
                    <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                      {isSubmitting ? 'Mengirim...' : 'Kirim Reservasi'}
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#2D6A4F] text-white border-0">
                <CardBody>
                  <h3 className="font-bold text-lg mb-4">Keuntungan Reservasi Online</h3>
                  <ul className="space-y-3">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-gray-200">
                        <CheckCircle size={16} className="text-[#F5A623] mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h3 className="font-bold text-[#1B4332] mb-3">Butuh Bantuan?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Hubungi kami langsung via WhatsApp untuk mendiskusikan kebutuhan kunjungan Anda.
                  </p>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Chat WhatsApp
                  </a>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
