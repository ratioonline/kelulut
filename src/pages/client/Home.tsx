import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Star, Users, Award, Leaf, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program, OrganizationProfile } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody } from '../../components/ui/Card'
import HeroSlider from '../../components/ui/HeroSlider'

// Fallback default jika DB belum diisi
const DEFAULT_STATS = [
  { icon: Users, value: '2000+', label: 'Pengunjung' },
  { icon: Award, value: '4+',    label: 'Program Wisata' },
  { icon: Star,  value: '4.9',   label: 'Rating' },
  { icon: Leaf,  value: '100%',  label: 'Alami' },
]

const STAT_ICONS = [Users, Award, Star, Leaf]

const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Guru SD Negeri 1 Sangatta',
    content:
      'Pengalaman luar biasa untuk siswa kami. Anak-anak sangat antusias belajar tentang lebah kelulut dan proses pembuatan madu.',
    rating: 5,
  },
  {
    name: 'Siti Rahayu',
    role: 'Ibu Rumah Tangga',
    content:
      'Tempatnya bersih, pemandu sangat informatif. Kami membeli beberapa botol madu dan rasanya benar-benar autentik!',
    rating: 5,
  },
  {
    name: 'Andi Pratama',
    role: 'Mahasiswa Biologi Unmul',
    content:
      'Sangat membantu untuk penelitian saya. Pengelola sangat kooperatif dan tempat ini benar-benar terjaga kelestariannya.',
    rating: 5,
  },
]

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [org, setOrg] = useState<OrganizationProfile | null>(null)

  useEffect(() => {
    // Fetch programs
    supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .limit(4)
      .then(({ data }) => data && setPrograms(data))

    // Fetch profil organisasi
    supabase
      .from('organization_profile')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
      .then(({ data }) => data && setOrg(data as OrganizationProfile))
  }, [])

  // Bangun stats dari DB atau fallback default
  const stats = org
    ? [
        { icon: STAT_ICONS[0], value: org.stat1_value ?? '2000+', label: org.stat1_label ?? 'Pengunjung' },
        { icon: STAT_ICONS[1], value: org.stat2_value ?? '4+',    label: org.stat2_label ?? 'Program Wisata' },
        { icon: STAT_ICONS[2], value: org.stat3_value ?? '4.9',   label: org.stat3_label ?? 'Rating' },
        { icon: STAT_ICONS[3], value: org.stat4_value ?? '100%',  label: org.stat4_label ?? 'Alami' },
      ]
    : DEFAULT_STATS

  return (
    <>
      <Helmet>
        <title>Kebun Kelulut Sangatta - Wisata Edukasi Lebah Kelulut</title>
        <meta
          name="description"
          content="Wisata edukasi lebah kelulut (stingless bee) di Sangatta, Kutai Timur. Belajar, panen madu, dan nikmati pengalaman alam yang menyenangkan."
        />
      </Helmet>

      {/* ── HERO ── */}
      <HeroSlider />

      {/* ── STATS ── */}
      <section className="bg-[#2D6A4F] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center text-white">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={24} />
                </div>
                <p className="text-3xl font-bold text-[#F5A623]">{value}</p>
                <p className="text-sm text-gray-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TENTANG KAMI ── */}
      <section className="py-20 bg-[#FAF3E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-[#F5A623] uppercase tracking-widest">
                Tentang Kami
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-[#1B4332] leading-tight">
                {org?.name
                  ? <>Mengenal Lebih Dekat <br />{org.name}</>
                  : <>Mengenal Lebih Dekat <br />Kebun Kelulut Sangatta</>
                }
              </h2>
              {org?.about_short ? (
                <p className="mt-4 text-gray-600 leading-relaxed">{org.about_short}</p>
              ) : (
                <>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Kebun Kelulut Sangatta adalah destinasi wisata edukasi yang berfokus pada
                    pelestarian dan pengembangan lebah kelulut (<em>stingless bee</em>) di Kalimantan
                    Timur. Kami berkomitmen untuk mengedukasi masyarakat tentang pentingnya lebah
                    kelulut bagi ekosistem.
                  </p>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    Didirikan dengan semangat konservasi, kami menawarkan pengalaman langsung yang
                    menggabungkan edukasi, wisata alam, dan produk madu berkualitas tinggi dari lebah
                    kelulut lokal Kalimantan.
                  </p>
                </>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                  <Leaf className="text-[#2D6A4F]" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {org?.badge1_title ?? '100% Organik'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org?.badge1_subtitle ?? 'Tanpa pestisida'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
                  <Award className="text-[#F5A623]" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {org?.badge2_title ?? 'Tersertifikasi'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org?.badge2_subtitle ?? 'Produk berkualitas'}
                    </p>
                  </div>
                </div>
              </div>
              <Button as={Link} to="/program" className="mt-8">
                Lihat Program Wisata
                <ArrowRight size={18} />
              </Button>
            </div>
            <div className="relative">
              <img
                src={org?.about_image_url ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80'}
                alt={org?.name ?? 'Kebun Kelulut Sangatta'}
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-5 -left-5 bg-[#F5A623] text-white rounded-2xl px-5 py-3 shadow-lg">
                <p className="text-2xl font-bold">{org?.experience_years ?? 5}+ Tahun</p>
                <p className="text-xs">{org?.experience_label ?? 'Pengalaman Budidaya'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM HIGHLIGHTS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Program Wisata"
            title="Pilih Pengalaman Yang Sesuai"
            subtitle="Kami menyediakan berbagai paket kunjungan yang dirancang untuk semua kalangan, dari pelajar hingga wisatawan umum."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.length > 0
              ? programs.map((program) => (
                  <Card key={program.id} hover>
                    <div className="aspect-video overflow-hidden rounded-t-2xl">
                      <img
                        src={
                          program.image_url ||
                          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
                        }
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardBody>
                      <h3 className="font-bold text-[#1B4332] text-base mb-1">{program.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {program.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock size={14} />
                        <span>{program.duration}</span>
                      </div>
                      <p className="text-[#F5A623] font-bold text-lg">
                        {program.price ? formatCurrency(program.price) : 'Gratis'}
                        <span className="text-xs text-gray-400 font-normal">/orang</span>
                      </p>
                    </CardBody>
                  </Card>
                ))
              : /* skeleton */
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                ))}
          </div>
          <div className="text-center mt-10">
            <Button as={Link} to="/program" variant="outline">
              Lihat Semua Program
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-[#FAF3E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Testimoni"
            title="Kata Mereka Tentang Kami"
            subtitle="Ribuan pengunjung telah merasakan pengalaman seru di Kebun Kelulut Sangatta."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-white">
                <CardBody>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} className="text-[#F5A623] fill-[#F5A623]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2D6A4F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#2D6A4F]">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Untuk Berpetualang?
          </h2>
          <p className="text-gray-200 text-lg mb-8">
            Reservasi sekarang dan nikmati pengalaman wisata edukasi lebah kelulut yang tak
            terlupakan bersama keluarga atau rombongan Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button as={Link} to="/reservasi" size="lg" variant="secondary">
              Reservasi Sekarang
              <ArrowRight size={20} />
            </Button>
            <Button
              as={Link}
              to="/kontak"
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#1B4332]"
            >
              Hubungi Kami
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
