import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Star,
  Users,
  Award,
  Leaf,
  Clock,
  MapPin,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  ChevronDown,
  Coffee,
  Tent,
  BookOpen,
  ShieldAlert,
  Image as ImageIcon,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program, OrganizationProfile, Product, Umkm, Article, GalleryItem } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { Card, CardBody } from '../../components/ui/Card'
import HeroSlider from '../../components/ui/HeroSlider'

// Quick info bar items
const QUICK_INFO = [
  { icon: Clock, label: '09.00 – 16.00 WITA', sub: 'Jam Operasional' },
  { icon: MapPin, label: 'Sangatta, Kutai Timur', sub: 'Lokasi Wisata' },
  { icon: Users, label: 'Kunjungan Edukasi', sub: 'Sekolah & Umum' },
  { icon: Tent, label: 'Area Camping & Outbound', sub: 'Fasilitas Terbuka' },
  { icon: Sparkles, label: 'Edukasi Lebah Kelulut', sub: 'Panen Madu Alami' },
]

// Why visit points
const WHY_VISIT_ITEMS = [
  {
    icon: '🐝',
    title: 'Belajar Lebah Kelulut',
    desc: 'Mengenal anatomi, siklus hidup, dan keunikan lebah tanpa sengat (Trigona/Kelulut) yang ramah anak.',
  },
  {
    icon: '🌿',
    title: 'Belajar Vegetasi & Flora',
    desc: 'Eksplorasi tanaman pakan lebah air mata pengantin, kaliandra, dan ragam flora hutan Kalimantan.',
  },
  {
    icon: '🍯',
    title: 'Seruput Madu Langsung Sarang',
    desc: 'Sensasi memanen dan mencicipi madu kelulut segar bercita rasa manis-asam langsung dari stup lebah.',
  },
  {
    icon: '🏕',
    title: 'Camping & Outbound',
    desc: 'Nikmati suasana asri alam terbuka dengan area perkemahan keluarga, gazebo, dan fasilitas hammock.',
  },
  {
    icon: '🛍',
    title: 'Produk Olahan UMKM Lokal',
    desc: 'Dapatkan madu murni, propolis herbal, sabun madu, dan aneka suvenir karya mitra UMKM lokal.',
  },
  {
    icon: '☕',
    title: 'Cafe Omah Madu',
    desc: 'Tempat bersantai menikmati seduhan kopi madu kelulut dan kudapan lezat di tengah kebun asri.',
  },
]

// Packages experience list
const PACKAGE_EXPERIENCES = [
  {
    title: 'Kunjungan Sekolah (Pelajar & Guru)',
    price: 'Mulai Rp20.000 / orang',
    desc: 'Paket edukasi interaktif untuk murid PAUD/TK, SD, SMP, SMA/SMK dan kampus. Guru pendamping gratis.',
    badge: 'Favorit Pelajar',
    link: '/program',
  },
  {
    title: 'Kunjungan Umum & Keluarga',
    price: 'Mulai Rp25.000 / orang',
    desc: 'Wisata rekreasi dan edukasi keluarga, instansi swasta/pemerintah, atau komunitas rombongan.',
    badge: 'Populer',
    link: '/program',
  },
  {
    title: 'Pelatihan Budidaya Kelulut',
    price: 'Rp2.000.000 / orang (Min 5 orang)',
    desc: 'Pelatihan intensif pembiakan, pemecahan koloni, dan pasca-panen. Mendapatkan 1 bibit kelulut siap panen.',
    badge: 'Bersertifikat',
    link: '/program',
  },
  {
    title: 'Studi Banding & Riset',
    price: 'Rp3.000.000 / kelompok (Maks 15 orang)',
    desc: 'Program benchmarking manajemen penangkaran lebah, konservasi hutan, dan pemberdayaan UMKM.',
    badge: 'Instansi & Kampus',
    link: '/program',
  },
  {
    title: 'Paket Camping Kebun',
    price: 'Rp35.000 / orang',
    desc: 'Bermalam di alam bebas dengan fasilitas aula, gazebo, toilet bersih, dan api unggun.',
    badge: 'Outdoor',
    link: '/program',
  },
]

// Important visitor rules
const VISITOR_RULES = [
  {
    q: 'Wajib melakukan pendaftaran sebelum kunjungan?',
    a: 'Ya, calon pengunjung atau rombongan diharapkan mengisi form reservasi online H-1 sebelum berkunjung agar jadwal pemandu wisata dan sesi seruput madu dapat dipersiapkan dengan optimal.',
  },
  {
    q: 'Berapa usia anak yang mendapatkan tiket gratis?',
    a: 'Anak usia 0–4 tahun mendapatkan tiket masuk gratis (tidak berlaku untuk rombongan resmi lembaga PAUD/TK).',
  },
  {
    q: 'Apakah diperbolehkan membawa makanan dan minuman?',
    a: 'Pengunjung diperbolehkan membawa makanan ringan keluarga. Namun dilarang keras membawa minuman beralkohol, zat terlarang, serta wajib menjaga kebersihan dengan membuang sampah pada tempat yang disediakan.',
  },
  {
    q: 'Apakah fasilitas dapat disewa untuk acara khusus?',
    a: 'Tentu. Kebun Kelulut menyediakan sewa Gazebo, Aula Pertemuan, Ruang Sekretariat, dan Hammock untuk kegiatan gathering, arisan, hingga rapat instansi.',
  },
]

// Facilities
const FACILITIES = [
  { name: 'Aula Pertemuan', icon: '🏛️' },
  { name: 'Gazebo Santai', icon: '🛖' },
  { name: 'Mushola', icon: '🕌' },
  { name: 'Playground Anak', icon: '🎠' },
  { name: 'Toilet & Wastafel', icon: '🚻' },
  { name: 'Sesi Seruput Madu', icon: '🍯' },
  { name: 'Area Hammock', icon: '🏖️' },
  { name: 'Cafe Omah Madu', icon: '☕' },
]

export default function Home() {
  const [org, setOrg] = useState<OrganizationProfile | null>(null)
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [umkms, setUmkms] = useState<Umkm[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(0)

  useEffect(() => {
    // 1. Fetch profil organisasi
    supabase
      .from('organization_profile')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
      .then(({ data }) => data && setOrg(data as OrganizationProfile))

    // 2. Fetch top products (sorted by sold_count desc)
    supabase
      .from('products')
      .select('*, umkm:umkms(name)')
      .eq('status', 'active')
      .order('sold_count', { ascending: false })
      .limit(6)
      .then(({ data }) => data && setTopProducts(data as Product[]))

    // 3. Fetch active UMKMs
    supabase
      .from('umkms')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => data && setUmkms(data as Umkm[]))

    // 4. Fetch curated gallery
    supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => data && setGallery(data as GalleryItem[]))

    // 5. Fetch latest articles
    supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => data && setArticles(data as Article[]))
  }, [])

  return (
    <>
      <Helmet>
        <title>Kebun Kelulut Sangatta - Wisata Edukasi Lebah Kelulut Kalimantan Timur</title>
        <meta
          name="description"
          content="Wisata edukasi lebah kelulut (stingless bee) di Sangatta, Kutai Timur. Nikmati sensasi seruput madu langsung dari sarang, jelajahi produk UMKM lokal, dan camping di alam asri."
        />
        <meta property="og:title" content="Kebun Kelulut Sangatta - Wisata Edukasi Lebah Kelulut" />
        <meta
          property="og:description"
          content="Belajar, bermain, dan mengenal lebah kelulut di Sangatta, Kutai Timur. Reservasi kunjungan Anda sekarang."
        />
      </Helmet>

      {/* ── 1. HERO SECTION WITH SLIDER ── */}
      <HeroSlider />

      {/* ── 2. QUICK INFORMATION STRIP ── */}
      <section className="bg-white border-b border-gray-200/80 shadow-2xs py-4 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {QUICK_INFO.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 ${
                    idx > 0 ? 'pt-2.5 sm:pt-0 sm:pl-3' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 3. MENGAPA BERKUNJUNG? (WHY VISIT) ── */}
      <section className="py-16 bg-[#FAF3E0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Daya Tarik Utama"
            title="Mengapa Berkunjung ke Kebun-Kelulut?"
            subtitle="Destinasi rekreasi edukatif yang menghadirkan interaksi langsung dengan alam dan kearifan lokal Kalimantan Timur."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {WHY_VISIT_ITEMS.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-500/40 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4 group"
              >
                <div className="text-3xl p-2.5 rounded-2xl bg-[#FAF3E0] shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#1B4332] text-sm group-hover:text-[#2D6A4F] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PILIH PENGALAMAN ANDA (PACKAGES) ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Paket Wisata & Edukasi"
            title="Pilih Pengalaman Anda"
            subtitle="Tersedia berbagai pilihan paket kunjungan yang disesuaikan untuk pelajar, keluarga, instansi, dan pecinta alam."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {PACKAGE_EXPERIENCES.map((pkg) => (
              <div
                key={pkg.title}
                className="bg-gray-50/50 rounded-2xl p-5 border border-gray-200/80 hover:bg-white hover:border-emerald-500/40 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {pkg.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-base mt-3">{pkg.title}</h3>
                  <p className="text-xs font-mono font-bold text-[#F5A623] mt-1">{pkg.price}</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{pkg.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <Button as={Link} to={pkg.link} variant="outline" size="sm" className="w-full justify-center">
                    <span>Lihat Detail Program</span>
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button as={Link} to="/program" className="bg-[#2D6A4F] hover:bg-[#1B4332]">
              <span>Lihat Seluruh Informasi Program & Fasilitas</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5. INFORMASI PENTING & ATURAN KUNJUNGAN (ACCORDION) ── */}
      <section className="py-14 bg-[#FAF3E0]/50 border-y border-amber-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldAlert size={18} className="text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Informasi Penting
            </span>
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 mb-6">
            Aturan & Ketentuan Berkunjung
          </h2>

          <div className="space-y-2.5">
            {VISITOR_RULES.map((rule, idx) => {
              const isOpen = openRuleIndex === idx
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenRuleIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span>{rule.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                      {rule.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 6. FASILITAS KEBUN ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kenyamanan Wisata"
            title="Fasilitas yang Tersedia"
            subtitle="Kebun Kelulut dilengkapi berbagai sarana untuk menjamin kenyamanan Anda selama berkunjung."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8">
            {FACILITIES.map((f) => (
              <div
                key={f.name}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center hover:border-emerald-500/40 transition-colors"
              >
                <div className="text-2xl mb-1.5">{f.icon}</div>
                <p className="font-bold text-gray-900 text-xs">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PRODUK PILIHAN UMKM ── */}
      <section className="py-16 bg-[#FAF3E0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block mb-1">
                Karya Mitra Lokal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">
                Produk Pilihan UMKM
              </h2>
            </div>

            <Button as={Link} to="/produk" variant="outline" size="sm">
              <span>Lihat Semua Produk</span>
              <ArrowRight size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {topProducts.length > 0
              ? topProducts.map((p) => {
                  const effectivePrice = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price || 0
                  return (
                    <Link
                      key={p.id}
                      to={`/produk/${p.slug || p.id}`}
                      className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                          <img
                            src={p.image_url || p.images?.[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-2">
                          {(p as any).umkm?.name || 'Kebun Kelulut'}
                        </p>
                        <h3 className="font-bold text-gray-900 text-xs truncate mt-0.5 group-hover:text-[#2D6A4F] transition-colors">
                          {p.name}
                        </h3>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-gray-100">
                        <span className="font-mono font-black text-emerald-800 text-xs block">
                          {formatCurrency(effectivePrice)}
                        </span>
                      </div>
                    </Link>
                  )
                })
              : [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-44 animate-pulse" />
                ))}
          </div>
        </div>
      </section>

      {/* ── 8. MITRA UMKM SHOWCASE ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Pemberdayaan Masyarakat"
            title="Kenali Mitra UMKM Kami"
            subtitle="Kami berkolaborasi bersama pelaku usaha mikro lokal untuk memajukan produk lebah kelulut dan ekonomi kreatif Kutai Timur."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {umkms.length > 0
              ? umkms.map((u) => (
                  <Link
                    key={u.id}
                    to={`/umkm/${u.slug || u.id}`}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:border-emerald-500/40 shadow-2xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden mb-3">
                        {u.logo_url ? (
                          <img src={u.logo_url} alt={u.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Store size={20} className="text-emerald-700" />
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#2D6A4F] transition-colors">
                        {u.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {u.short_description || u.description || 'Mitra UMKM resmi Kebun Kelulut Sangatta.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span>Lihat Profil</span>
                      <ArrowRight size={12} />
                    </div>
                  </Link>
                ))
              : [1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
                ))}
          </div>

          <div className="text-center mt-6">
            <Button as={Link} to="/umkm" variant="outline" size="sm">
              <span>Lihat Seluruh Mitra UMKM</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── 9. DOKUMENTASI GALERI ── */}
      <section className="py-16 bg-[#FAF3E0]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block mb-1">
                Dokumentasi & Kegiatan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">
                Galeri Kebun Kelulut
              </h2>
            </div>

            <Button as={Link} to="/galeri" variant="outline" size="sm">
              <span>Lihat Semua Foto</span>
              <ArrowRight size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {gallery.length > 0
              ? gallery.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-2xs relative group"
                  >
                    <img
                      src={item.image_url}
                      alt={item.title || 'Foto Galeri Kebun Kelulut'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {item.title && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                        <p className="text-white text-[10px] font-bold line-clamp-2">{item.title}</p>
                      </div>
                    )}
                  </div>
                ))
              : [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
                ))}
          </div>
        </div>
      </section>

      {/* ── 10. ARTIKEL TERBARU ── */}
      {articles.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Edukasi & Berita"
              title="Artikel & Cerita Terbaru"
              subtitle="Baca tips budidaya lebah kelulut, khasiat madu murni, dan kabar terkini dari kebun."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to={`/artikel/${a.slug || a.id}`}
                  className="bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-200/80 hover:bg-white hover:border-emerald-500/40 shadow-2xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={a.thumbnail_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#2D6A4F] transition-colors line-clamp-2">
                        {a.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">{a.excerpt}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 11. TEMUKAN KAMI (LOKASI & MAPS) ── */}
      <section className="py-16 bg-[#FAF3E0]/70 border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold text-[#F5A623] uppercase tracking-wider block mb-1">
                Akses Mudah
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B4332]">
                Temukan Lokasi Kami
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Kebun Kelulut Sangatta berlokasi strategis di Sangatta, Kabupaten Kutai Timur, Kalimantan Timur.
                Akses jalan nyaman dilalui kendaraan roda dua, mobil pribadi, hingga bus rombongan sekolah.
              </p>

              <div className="mt-4 space-y-2 text-xs text-gray-700">
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="text-emerald-800 shrink-0 mt-0.5" />
                  <span>{org?.address || 'Sangatta, Kutai Timur, Kalimantan Timur 75611'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={15} className="text-emerald-800 shrink-0" />
                  <span>Buka Setiap Hari: 09.00 – 16.00 WITA</span>
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={org?.maps_url || 'https://maps.google.com/?q=Kebun+Kelulut+Sangatta'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors shadow-2xs"
                >
                  <ExternalLink size={13} />
                  <span>Buka di Google Maps</span>
                </a>
              </div>
            </div>

            {/* Embed Map Lazy Loaded */}
            <div className="aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <iframe
                title="Peta Lokasi Kebun Kelulut Sangatta"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.658784860477!2d117.5388!3d0.4939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMjknMzguMCJOIDExN8KwMzInMTkuNyJF!5e0!3m2!1sid!2sid!4v1600000000000!5m2!1sid!2sid"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. PRE-FOOTER STRONG CONVERSION CTA ── */}
      <section className="py-20 bg-[#2D6A4F] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5A623] block">
            Jadwalkan Kunjungan Anda
          </span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Siap Berkunjung ke Kebun-Kelulut?
          </h2>
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
            Daftarkan kunjungan Anda sebelum hari berkunjung untuk memastikan ketersediaan pemandu wisata dan kesiapan sesi seruput madu langsung di sarang.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              as={Link}
              to="/reservasi"
              size="lg"
              className="bg-[#F5A623] hover:bg-[#d98e18] text-[#1B4332] font-black w-full sm:w-auto shadow-md"
            >
              <span>Reservasi Kunjungan Sekarang</span>
              <ArrowRight size={16} />
            </Button>
            <Button
              as={Link}
              to="/produk"
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#1B4332] w-full sm:w-auto"
            >
              <span>Jelajahi Produk UMKM</span>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
