import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Tent,
  BookOpen,
  Coffee,
  ShieldCheck,
  Building,
  CalendarCheck,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

// Core Packages Detailed Breakdown
const OFFICIAL_PACKAGES = [
  {
    title: 'Kunjungan Sekolah (Murid & Guru)',
    tag: 'Edukasi Pelajar',
    pribadi: 'Rp20.000 / orang',
    kelompok: 'Rp300.000 / kelompok (Maks. 20 anak)',
    note: 'Guru pendamping gratis (tidak terhitung biaya). Termasuk sesi seruput madu & pemandu.',
    highlight: true,
  },
  {
    title: 'Kunjungan Sekolah (Wali Murid)',
    tag: 'Rombongan Wali',
    pribadi: 'Rp25.000 / orang',
    kelompok: 'Rp500.000 / kelompok (Maks. 25 orang)',
    note: 'Untuk pendamping orang tua/wali murid yang ikut serta dalam kunjungan sekolah.',
  },
  {
    title: 'Kunjungan Umum & Komunitas',
    tag: 'Umum & Keluarga',
    pribadi: 'Rp25.000 / orang',
    kelompok: 'Rp500.000 / kelompok (Maks. 25 orang)',
    note: 'Wisata rekreasi keluarga, komunitas arisan, klub hobi, dan gathering santai.',
    highlight: true,
  },
  {
    title: 'Pelatihan Budidaya Kelulut',
    tag: 'Pelatihan Profesional',
    pribadi: 'Rp2.000.000 / orang (Min. 5 orang)',
    kelompok: 'Termasuk 1 Bibit Stup Kelulut / Peserta',
    note: 'Pelatihan intensif pembiakan, pemecahan koloni lebah, dan teknik panen higienis.',
  },
  {
    title: 'Studi Banding & Riset',
    tag: 'Instansi & Kampus',
    pribadi: '-',
    kelompok: 'Rp3.000.000 / kelompok (Maks. 15 orang)',
    note: 'Benchmarking konservasi, tata kelola penangkaran lebah, dan transfer ilmu budidaya.',
  },
]

// Camping and Facility Rentals
const FACILITY_RENTALS = [
  { name: 'Tiket Camping Kebun', price: 'Rp35.000 / orang', desc: 'Akses bermalam di area kebun alam' },
  { name: 'Sewa Gazebo Kecil', price: 'Rp50.000', desc: 'Kapasitas 4–6 orang santai' },
  { name: 'Sewa Gazebo Besar', price: 'Rp75.000', desc: 'Kapasitas 10–15 orang kumpul keluarga' },
  { name: 'Sewa Aula Pertemuan', price: 'Rp150.000', desc: 'Fasilitas serbaguna untuk acara bersama' },
  { name: 'Sewa Ruang Sekretariat', price: 'Rp250.000', desc: 'Ruangan khusus pertemuan semi-tertutup' },
  { name: 'Sewa Hammock Santai', price: 'Rp20.000', desc: 'Hammock nyaman di bawah rimbun pepohonan' },
]

// Garden Activities
const GARDEN_ACTIVITIES = [
  { title: 'Belajar tentang Lebah Kelulut', desc: 'Memahami anatomi, kasta ratu/pekerja, dan sifat lebah tanpa sengat.' },
  { title: 'Belajar Vegetasi Pakan Lebah', desc: 'Mengenal bunga air mata pengantin, kaliandra, santos, dan pohon resin.' },
  { title: 'Mencoba Madu Langsung di Sarang', desc: 'Pengalaman seruput madu manis-asam segar langsung menggunakan sedotan.' },
  { title: 'Belanja Produk Madu & Olahan UMKM', desc: 'Membawa pulang madu murni, propolis herbal, dan sabun madu asli.' },
  { title: 'Ngopi Santai di Cafe Omah Madu', desc: 'Menikmati aneka racikan kopi madu dan minuman segar di kebun.' },
  { title: 'Bermalam & Camping Kebun', desc: 'Menikmati malam tenang di bawah bintang bersama keluarga atau sahabat.' },
]

export default function ProgramPage() {
  const [dbPrograms, setDbPrograms] = useState<Program[]>([])

  useEffect(() => {
    supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setDbPrograms(data as Program[])
      })
  }, [])

  return (
    <>
      <Helmet>
        <title>Paket Kunjungan & Program Edukasi - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Informasi lengkap paket kunjungan sekolah, kunjungan umum, pelatihan budidaya kelulut, studi banding, dan camping di Kebun Kelulut Sangatta."
        />
      </Helmet>

      {/* ── HEADER ── */}
      <section className="pt-28 pb-14 bg-[#FAF3E0] border-b border-amber-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block mb-1.5">
            Pilihan Wisata Edukasi
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1B4332] tracking-tight">
            Paket Kunjungan & Program Kebun
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
            Dapatkan pengalaman berwisata sambil belajar budidaya lebah kelulut, mencicipi madu murni langsung dari sarang, serta menikmati fasilitas alam di Sangatta, Kutai Timur.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button as={Link} to="/reservasi" className="bg-[#2D6A4F] hover:bg-[#1B4332] shadow-md">
              <CalendarCheck size={16} />
              <span>Daftar / Reservasi Sekarang</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 1. PAKET KUNJUNGAN RESMI ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Biaya & Paket"
            title="Daftar Paket Kunjungan Resmi"
            subtitle="Pilihan tarif transparan yang disesuaikan untuk rombongan sekolah, keluarga, hingga pelatihan instansi."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {OFFICIAL_PACKAGES.map((pkg) => (
              <div
                key={pkg.title}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                  pkg.highlight
                    ? 'border-[#2D6A4F] bg-emerald-50/30 ring-1 ring-[#2D6A4F] shadow-sm'
                    : 'border-gray-200/80 bg-gray-50/40 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {pkg.tag}
                    </span>
                    {pkg.highlight && (
                      <span className="text-[10px] font-bold text-[#F5A623]">★ Rekomendasi</span>
                    )}
                  </div>

                  <h3 className="font-black text-[#1B4332] text-base mt-3">{pkg.title}</h3>

                  <div className="mt-4 space-y-2 text-xs border-y border-gray-200/60 py-3">
                    {pkg.pribadi !== '-' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tarif Pribadi:</span>
                        <strong className="font-mono font-bold text-gray-900">{pkg.pribadi}</strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Tarif Rombongan:</span>
                      <strong className="font-mono font-bold text-[#F5A623]">{pkg.kelompok}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">{pkg.note}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-200/60">
                  <Button
                    as={Link}
                    to="/reservasi"
                    variant={pkg.highlight ? 'primary' : 'outline'}
                    size="sm"
                    className="w-full justify-center"
                  >
                    <span>Pilih Paket Ini</span>
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. SEWA FASILITAS & CAMPING ── */}
      <section className="py-16 bg-[#FAF3E0]/70 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Fasilitas Tambahan"
            title="Sewa Fasilitas & Paket Camping"
            subtitle="Fasilitas pendukung yang dapat disewa untuk kegiatan gathering, pertemuan rombongan, atau bermalam di kebun."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {FACILITY_RENTALS.map((f) => (
              <div
                key={f.name}
                className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-start justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{f.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-xs text-[#2D6A4F] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 block">
                    {f.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. AKTIVITAS EDUKASI KEBUN ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Rangkaian Kegiatan"
            title="Aktivitas Seru di Kebun-Kelulut"
            subtitle="Beragam kegiatan edukatif dan rekreatif yang siap menyambut kehadiran Anda dan rombongan."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {GARDEN_ACTIVITIES.map((act, i) => (
              <div
                key={act.title}
                className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:bg-white transition-colors flex items-start gap-3"
              >
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{act.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-6">
            *Catatan: Sesi belajar lebah, vegetasi pakan, dan mencicipi madu langsung di sarang berlaku untuk seluruh kunjungan wisata edukasi selain camping murni.
          </p>
        </div>
      </section>

      {/* ── 4. STRONG BOTTOM CTA ── */}
      <section className="py-20 bg-[#2D6A4F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <h2 className="text-3xl font-black">Tertarik Berkunjung ke Kebun-Kelulut?</h2>
          <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
            Daftarkan rombongan Anda secara online sekarang. Tim kami akan segera menghubungi Anda untuk konfirmasi jadwal kunjungan.
          </p>
          <div className="pt-2">
            <Button
              as={Link}
              to="/reservasi"
              size="lg"
              className="bg-[#F5A623] hover:bg-[#d98e18] text-[#1B4332] font-black shadow-lg"
            >
              <CalendarCheck size={18} />
              <span>Isi Formulir Reservasi</span>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
