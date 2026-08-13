import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save, Building2, Phone, Mail, MapPin, Globe,
  Instagram, Youtube, Facebook, Eye, EyeOff,
  Award, Leaf, Users, Star,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import RichTextEditor from '../../components/ui/RichTextEditor'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { OrganizationProfile } from '../../types/database'

const ORG_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

const schema = z.object({
  // Umum
  name:              z.string().min(2, 'Nama minimal 2 karakter'),
  tagline:           z.string().optional(),
  year_founded:      z.number().optional().or(z.literal(0)),
  // Tentang Kami
  about_short:       z.string().optional(),
  about:             z.string().optional(),
  experience_years:  z.number().optional().or(z.literal(0)),
  experience_label:  z.string().optional(),
  badge1_title:      z.string().optional(),
  badge1_subtitle:   z.string().optional(),
  badge2_title:      z.string().optional(),
  badge2_subtitle:   z.string().optional(),
  // Stats bar
  stat1_value:       z.string().optional(),
  stat1_label:       z.string().optional(),
  stat2_value:       z.string().optional(),
  stat2_label:       z.string().optional(),
  stat3_value:       z.string().optional(),
  stat3_label:       z.string().optional(),
  stat4_value:       z.string().optional(),
  stat4_label:       z.string().optional(),
  // Visi Misi
  vision:            z.string().optional(),
  mission:           z.string().optional(),
  // Kontak
  address:           z.string().optional(),
  phone:             z.string().optional(),
  email:             z.string().email('Email tidak valid').optional().or(z.literal('')),
  whatsapp:          z.string().optional(),
  maps_url:          z.string().optional(),
  // Sosmed
  instagram:         z.string().optional(),
  facebook:          z.string().optional(),
  youtube:           z.string().optional(),
  tiktok:            z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TABS = [
  { id: 'umum',      label: 'Informasi Umum' },
  { id: 'tentang',   label: 'Tentang Kami' },
  { id: 'stats',     label: 'Statistik' },
  { id: 'visi',      label: 'Visi & Misi' },
  { id: 'kontak',    label: 'Kontak' },
  { id: 'sosmed',    label: 'Media Sosial' },
  { id: 'media',     label: 'Logo & Gambar' },
]

export default function AdminProfilWebsite() {
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState('umum')
  const [logoUrl, setLogoUrl]         = useState<string | null>(null)
  const [coverUrl, setCoverUrl]       = useState<string | null>(null)
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', tagline: '', year_founded: 0,
      about_short: '', about: '',
      experience_years: 5, experience_label: 'Tahun Pengalaman Budidaya',
      badge1_title: '100% Organik', badge1_subtitle: 'Tanpa pestisida',
      badge2_title: 'Tersertifikasi', badge2_subtitle: 'Produk berkualitas',
      stat1_value: '2000+', stat1_label: 'Pengunjung',
      stat2_value: '4+',    stat2_label: 'Program Wisata',
      stat3_value: '4.9',   stat3_label: 'Rating',
      stat4_value: '100%',  stat4_label: 'Alami',
      vision: '', mission: '',
      address: '', phone: '', email: '', whatsapp: '', maps_url: '',
      instagram: '', facebook: '', youtube: '', tiktok: '',
    },
  })

  const w = watch()

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('organization_profile')
        .select('*')
        .eq('id', ORG_PROFILE_ID)
        .single()

      if (data) {
        const p = data as OrganizationProfile
        reset({
          name:             p.name             ?? '',
          tagline:          p.tagline          ?? '',
          year_founded:     p.year_founded     ?? 0,
          about_short:      p.about_short      ?? '',
          about:            p.about            ?? '',
          experience_years: p.experience_years ?? 5,
          experience_label: p.experience_label ?? 'Tahun Pengalaman Budidaya',
          badge1_title:     p.badge1_title     ?? '100% Organik',
          badge1_subtitle:  p.badge1_subtitle  ?? 'Tanpa pestisida',
          badge2_title:     p.badge2_title     ?? 'Tersertifikasi',
          badge2_subtitle:  p.badge2_subtitle  ?? 'Produk berkualitas',
          stat1_value:      p.stat1_value      ?? '2000+',
          stat1_label:      p.stat1_label      ?? 'Pengunjung',
          stat2_value:      p.stat2_value      ?? '4+',
          stat2_label:      p.stat2_label      ?? 'Program Wisata',
          stat3_value:      p.stat3_value      ?? '4.9',
          stat3_label:      p.stat3_label      ?? 'Rating',
          stat4_value:      p.stat4_value      ?? '100%',
          stat4_label:      p.stat4_label      ?? 'Alami',
          vision:           p.vision           ?? '',
          mission:          p.mission          ?? '',
          address:          p.address          ?? '',
          phone:            p.phone            ?? '',
          email:            p.email            ?? '',
          whatsapp:         p.whatsapp         ?? '',
          maps_url:         p.maps_url         ?? '',
          instagram:        p.instagram        ?? '',
          facebook:         p.facebook         ?? '',
          youtube:          p.youtube          ?? '',
          tiktok:           p.tiktok           ?? '',
        })
        setLogoUrl(p.logo_url ?? null)
        setCoverUrl(p.cover_url ?? null)
        setAboutImageUrl(p.about_image_url ?? null)
      }
      setLoading(false)
    }
    fetch()
  }, [reset])

  // ── Save ───────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const payload = {
      id: ORG_PROFILE_ID,
      ...data,
      about:       data.about       || null,
      about_short: data.about_short || null,
      vision:      data.vision      || null,
      mission:     data.mission     || null,
      logo_url:     logoUrl,
      cover_url:    coverUrl,
      about_image_url: aboutImageUrl,
      updated_at:  new Date().toISOString(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('organization_profile').upsert(payload as any)
    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`)
    } else {
      toast.success('Profil berhasil disimpan!')
      reset(data)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center py-32"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-[#2D6A4F]" />
            Profil Organisasi / Website
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola konten halaman beranda — section Tentang Kami, statistik, visi & misi, kontak, dan media sosial.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
            {previewMode ? 'Tutup Preview' : 'Preview'}
          </button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} size="sm">
            <Save size={15} />
            {isDirty ? 'Simpan *' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card className="overflow-hidden border-2 border-[#2D6A4F]/20">
          <div className="relative h-40 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] overflow-hidden">
            {coverUrl && <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-50" />}
            <div className="absolute inset-0 flex items-center px-8 gap-4">
              {logoUrl && <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow" />}
              <div className="text-white">
                <h2 className="text-xl font-bold">{w.name || 'Nama Organisasi'}</h2>
                <p className="text-sm text-white/80">{w.tagline}</p>
              </div>
            </div>
          </div>
          <CardBody className="bg-[#FAF3E0]">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <span className="text-xs font-bold text-[#F5A623] uppercase tracking-widest">Tentang Kami</span>
                <h3 className="mt-1 text-xl font-bold text-[#1B4332]">{w.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{w.about_short || '(Deskripsi singkat belum diisi)'}</p>
                <div className="mt-4 flex gap-3 flex-wrap">
                  {w.badge1_title && (
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm text-sm">
                      <Leaf size={16} className="text-[#2D6A4F]" />
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{w.badge1_title}</p>
                        <p className="text-xs text-gray-500">{w.badge1_subtitle}</p>
                      </div>
                    </div>
                  )}
                  {w.badge2_title && (
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm text-sm">
                      <Award size={16} className="text-[#F5A623]" />
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{w.badge2_title}</p>
                        <p className="text-xs text-gray-500">{w.badge2_subtitle}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-xl overflow-hidden bg-gray-200 aspect-[4/3] flex items-center justify-center text-gray-400 text-sm">
                  {aboutImageUrl ? <img src={aboutImageUrl} className="w-full h-full object-cover" alt="About" /> : 'Foto Tentang Kami'}
                </div>
                {w.experience_years ? (
                  <div className="absolute -bottom-3 -left-3 bg-[#F5A623] text-white rounded-xl px-4 py-2 shadow text-sm">
                    <p className="font-bold">{w.experience_years}+ Tahun</p>
                    <p className="text-xs opacity-90">{w.experience_label}</p>
                  </div>
                ) : null}
              </div>
            </div>
            {/* Stats preview */}
            <div className="mt-6 grid grid-cols-4 gap-3 bg-[#2D6A4F] rounded-xl p-4">
              {[
                { v: w.stat1_value, l: w.stat1_label },
                { v: w.stat2_value, l: w.stat2_label },
                { v: w.stat3_value, l: w.stat3_label },
                { v: w.stat4_value, l: w.stat4_label },
              ].map((s, i) => (
                <div key={i} className="text-center text-white">
                  <p className="text-lg font-bold text-[#F5A623]">{s.v}</p>
                  <p className="text-xs text-gray-200">{s.l}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-[#2D6A4F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── TAB: Informasi Umum ── */}
        {activeTab === 'umum' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Informasi Umum</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Nama Organisasi *" required error={errors.name?.message} placeholder="Kebun Kelulut Sangatta" {...register('name')} />
                <Input label="Tahun Berdiri" type="number" placeholder="2019" {...register('year_founded', { valueAsNumber: true })} />
              </div>
              <Input label="Tagline / Slogan" placeholder="Wisata Alam Edukatif & Madu Trigona Alami" {...register('tagline')} />
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Tentang Kami ── */}
        {activeTab === 'tentang' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
                Konten Section "Tentang Kami" di Beranda
              </h2>

              <Textarea
                label="Deskripsi Singkat (paragraf di beranda)"
                rows={4}
                placeholder="Kebun Kelulut Sangatta adalah destinasi wisata edukasi yang berfokus pada pelestarian..."
                hint="Teks ini tampil langsung di section Tentang Kami pada halaman beranda"
                {...register('about_short')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Lengkap (halaman Tentang Kami)
                  <span className="text-gray-400 font-normal ml-1">— rich text editor</span>
                </label>
                <Controller
                  name="about"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Ceritakan tentang organisasi secara lengkap..." />
                  )}
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Badge / Keunggulan (tampil di bawah deskripsi)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Badge 1</p>
                    <Input label="Judul" placeholder="100% Organik" {...register('badge1_title')} />
                    <Input label="Subjudul" placeholder="Tanpa pestisida" {...register('badge1_subtitle')} />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Badge 2</p>
                    <Input label="Judul" placeholder="Tersertifikasi" {...register('badge2_title')} />
                    <Input label="Subjudul" placeholder="Produk berkualitas" {...register('badge2_subtitle')} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Badge Pengalaman (pojok kiri bawah foto)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Angka Tahun" type="number" placeholder="5" {...register('experience_years', { valueAsNumber: true })} />
                  <Input label="Label" placeholder="Pengalaman Budidaya" {...register('experience_label')} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Tampil sebagai: <strong>{w.experience_years || 5}+ Tahun</strong> · {w.experience_label || 'Pengalaman Budidaya'}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Statistik ── */}
        {activeTab === 'stats' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">
                Statistik (Bar Hijau di Beranda)
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { v: 'stat1_value', l: 'stat1_label', icon: <Users size={16} />, ex: '2000+', exl: 'Pengunjung' },
                  { v: 'stat2_value', l: 'stat2_label', icon: <Award size={16} />, ex: '4+', exl: 'Program Wisata' },
                  { v: 'stat3_value', l: 'stat3_label', icon: <Star size={16} />, ex: '4.9', exl: 'Rating' },
                  { v: 'stat4_value', l: 'stat4_label', icon: <Leaf size={16} />, ex: '100%', exl: 'Alami' },
                ].map((s, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-[#2D6A4F] font-semibold text-sm">
                      {s.icon} Statistik {i + 1}
                    </div>
                    <Input label="Nilai" placeholder={s.ex} {...register(s.v as keyof FormData)} />
                    <Input label="Label" placeholder={s.exl} {...register(s.l as keyof FormData)} />
                  </div>
                ))}
              </div>
              {/* Preview bar */}
              <div className="bg-[#2D6A4F] rounded-xl p-4 grid grid-cols-4 gap-2">
                {[
                  { v: w.stat1_value, l: w.stat1_label },
                  { v: w.stat2_value, l: w.stat2_label },
                  { v: w.stat3_value, l: w.stat3_label },
                  { v: w.stat4_value, l: w.stat4_label },
                ].map((s, i) => (
                  <div key={i} className="text-center text-white">
                    <p className="text-lg font-bold text-[#F5A623]">{s.v || '-'}</p>
                    <p className="text-xs text-gray-300">{s.l || '-'}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Visi & Misi ── */}
        {activeTab === 'visi' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Visi & Misi</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
                <Controller name="vision" control={control} render={({ field }) => (
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Menjadi pusat wisata edukasi kelulut terbaik..." />
                )} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Misi</label>
                <Controller name="mission" control={control} render={({ field }) => (
                  <RichTextEditor value={field.value ?? ''} onChange={field.onChange} placeholder="1. Melestarikan lebah kelulut...\n2. Memberdayakan masyarakat..." />
                )} />
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Kontak ── */}
        {activeTab === 'kontak' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Informasi Kontak</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Telepon" placeholder="+62 812 3456 7890" {...register('phone')} />
                <Input label="Email" type="email" placeholder="info@kebunkelulut.id" error={errors.email?.message} {...register('email')} />
              </div>
              <Input
                label="Nomor WhatsApp"
                placeholder="628123456789"
                hint="Format: 628xxxxxxxxxx tanpa tanda + — untuk tombol WhatsApp di website"
                {...register('whatsapp')}
              />
              <Textarea label="Alamat Lengkap" rows={3} placeholder="Jl. Contoh No. 1, Sangatta..." {...register('address')} />
              <Input label="Link Google Maps" placeholder="https://maps.google.com/..." hint="URL share dari Google Maps" {...register('maps_url')} />
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Media Sosial ── */}
        {activeTab === 'sosmed' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Akun Media Sosial</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Instagram" placeholder="kebunkelulut (tanpa @)" hint="Hanya username" {...register('instagram')} />
                <Input label="Facebook" placeholder="kebunkelulut" {...register('facebook')} />
                <Input label="YouTube" placeholder="https://youtube.com/@kebunkelulut" hint="URL channel" {...register('youtube')} />
                <Input label="TikTok" placeholder="kebunkelulut (tanpa @)" {...register('tiktok')} />
              </div>
              <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                {w.instagram && (
                  <a href={`https://instagram.com/${w.instagram}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs font-medium">
                    <Instagram size={12} /> @{w.instagram}
                  </a>
                )}
                {w.facebook && (
                  <a href={`https://facebook.com/${w.facebook}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                    <Facebook size={12} /> {w.facebook}
                  </a>
                )}
                {w.youtube && (
                  <a href={w.youtube} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                    <Youtube size={12} /> YouTube
                  </a>
                )}
                {w.tiktok && (
                  <a href={`https://tiktok.com/@${w.tiktok}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                    <Globe size={12} /> @{w.tiktok}
                  </a>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ── TAB: Logo & Gambar ── */}
        {activeTab === 'media' && (
          <Card>
            <CardBody className="space-y-6">
              <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Logo & Gambar</h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <MediaPickerButton
                  label="Logo Organisasi"
                  value={logoUrl ?? undefined}
                  onChange={(url) => setLogoUrl(url)}
                  folder="Profil" moduleName="Profil Website"
                />
                <MediaPickerButton
                  label="Foto Cover / Banner"
                  value={coverUrl ?? undefined}
                  onChange={(url) => setCoverUrl(url)}
                  folder="Profil" moduleName="Profil Website"
                />
                <MediaPickerButton
                  label='Foto "Tentang Kami"'
                  value={aboutImageUrl ?? undefined}
                  onChange={(url) => setAboutImageUrl(url)}
                  folder="Profil" moduleName="Profil Website"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
                <p><strong>Logo</strong> — tampil di navbar, footer, dan halaman login.</p>
                <p><strong>Cover</strong> — banner background di halaman profil.</p>
                <p><strong>Foto Tentang Kami</strong> — gambar di sebelah kanan section Tentang Kami pada beranda.</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tombol simpan bawah */}
        <div className="flex items-center justify-between pt-2 pb-6">
          {isDirty && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              ⚠️ Ada perubahan yang belum disimpan
            </p>
          )}
          <Button type="submit" loading={isSubmitting} className="ml-auto">
            <Save size={15} /> Simpan Semua Perubahan
          </Button>
        </div>
      </form>
    </div>
  )
}
