import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save, Building2, Phone, Mail, MapPin, Globe,
  Instagram, Youtube, Facebook, Eye, EyeOff,
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

// ID tetap — satu baris untuk seluruh profil organisasi
const ORG_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

const schema = z.object({
  name:         z.string().min(2, 'Nama minimal 2 karakter'),
  tagline:      z.string().optional(),
  about:        z.string().optional(),
  vision:       z.string().optional(),
  mission:      z.string().optional(),
  address:      z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email('Email tidak valid').optional().or(z.literal('')),
  whatsapp:     z.string().optional(),
  maps_url:     z.string().optional(),
  instagram:    z.string().optional(),
  facebook:     z.string().optional(),
  youtube:      z.string().optional(),
  tiktok:       z.string().optional(),
  year_founded: z.number({ invalid_type_error: 'Harus angka' }).min(1900).max(2100).optional().or(z.literal(0)),
})
type FormData = z.infer<typeof schema>

// ── Tab navigasi ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'umum',   label: 'Informasi Umum' },
  { id: 'visi',   label: 'Visi & Misi' },
  { id: 'kontak', label: 'Kontak' },
  { id: 'sosmed', label: 'Media Sosial' },
  { id: 'media',  label: 'Logo & Cover' },
]

export default function AdminProfilWebsite() {
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('umum')
  const [logoUrl, setLogoUrl]     = useState<string | null>(null)
  const [coverUrl, setCoverUrl]   = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      tagline: '',
      about: '',
      vision: '',
      mission: '',
      address: '',
      phone: '',
      email: '',
      whatsapp: '',
      maps_url: '',
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
      year_founded: 0,
    },
  })

  const watchAll = watch()

  // ── Fetch data profil ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('organization_profile')
        .select('*')
        .eq('id', ORG_PROFILE_ID)
        .single()

      if (data) {
        const p = data as OrganizationProfile
        reset({
          name:         p.name         ?? '',
          tagline:      p.tagline      ?? '',
          about:        p.about        ?? '',
          vision:       p.vision       ?? '',
          mission:      p.mission      ?? '',
          address:      p.address      ?? '',
          phone:        p.phone        ?? '',
          email:        p.email        ?? '',
          whatsapp:     p.whatsapp     ?? '',
          maps_url:     p.maps_url     ?? '',
          instagram:    p.instagram    ?? '',
          facebook:     p.facebook     ?? '',
          youtube:      p.youtube      ?? '',
          tiktok:       p.tiktok       ?? '',
          year_founded: p.year_founded ?? 0,
        })
        setLogoUrl(p.logo_url ?? null)
        setCoverUrl(p.cover_url ?? null)
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 = row not found, wajar untuk data baru
        toast.error('Gagal memuat profil')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [reset])

  // ── Simpan data ────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const payload = {
      id:           ORG_PROFILE_ID,
      name:         data.name,
      tagline:      data.tagline      || null,
      about:        data.about        || null,
      vision:       data.vision       || null,
      mission:      data.mission      || null,
      address:      data.address      || null,
      phone:        data.phone        || null,
      email:        data.email        || null,
      whatsapp:     data.whatsapp     || null,
      maps_url:     data.maps_url     || null,
      instagram:    data.instagram    || null,
      facebook:     data.facebook     || null,
      youtube:      data.youtube      || null,
      tiktok:       data.tiktok       || null,
      logo_url:     logoUrl,
      cover_url:    coverUrl,
      year_founded: data.year_founded || null,
      updated_at:   new Date().toISOString(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('organization_profile').upsert(payload as any)
    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`)
    } else {
      toast.success('Profil organisasi berhasil disimpan!')
      reset(data) // reset dirty state
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-[#2D6A4F]" />
            Profil Organisasi / Website
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola informasi tentang organisasi, kontak, visi & misi, dan tampilan website.
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
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="sm"
          >
            <Save size={15} />
            {isDirty ? 'Simpan Perubahan *' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* ── Preview Banner ── */}
      {previewMode && (
        <Card className="overflow-hidden border-2 border-[#2D6A4F]/20">
          {/* Cover */}
          <div className="relative h-48 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] overflow-hidden">
            {coverUrl && (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 flex items-center px-8 gap-4">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-lg" />
              )}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{watchAll.name || 'Nama Organisasi'}</h2>
                <p className="text-sm text-white/80 mt-0.5">{watchAll.tagline || 'Tagline organisasi...'}</p>
              </div>
            </div>
          </div>
          <CardBody className="grid md:grid-cols-2 gap-6">
            {watchAll.about && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Tentang Kami</h3>
                <div
                  className="prose prose-sm text-gray-600 max-w-none"
                  dangerouslySetInnerHTML={{ __html: watchAll.about }}
                />
              </div>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              {watchAll.phone    && <p className="flex gap-2"><Phone size={14} className="mt-0.5 text-[#2D6A4F]" />{watchAll.phone}</p>}
              {watchAll.email    && <p className="flex gap-2"><Mail size={14} className="mt-0.5 text-[#2D6A4F]" />{watchAll.email}</p>}
              {watchAll.address  && <p className="flex gap-2"><MapPin size={14} className="mt-0.5 text-[#2D6A4F]" />{watchAll.address}</p>}
              {watchAll.instagram && <p className="flex gap-2"><Instagram size={14} className="mt-0.5 text-[#2D6A4F]" />@{watchAll.instagram}</p>}
              {watchAll.youtube  && <p className="flex gap-2"><Youtube size={14} className="mt-0.5 text-[#2D6A4F]" />{watchAll.youtube}</p>}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#2D6A4F] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* TAB: Informasi Umum */}
        {activeTab === 'umum' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
                Informasi Umum Organisasi
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Nama Organisasi *"
                  placeholder="Kebun Kelulut Sangatta"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Tahun Berdiri"
                  type="number"
                  placeholder="2020"
                  error={errors.year_founded?.message}
                  {...register('year_founded', { valueAsNumber: true })}
                />
              </div>
              <Input
                label="Tagline / Slogan"
                placeholder="Wisata Alam Edukatif & Madu Trigona Alami"
                {...register('tagline')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tentang Kami
                  <span className="text-gray-400 font-normal ml-1">(deskripsi lengkap dengan rich text)</span>
                </label>
                <Controller
                  name="about"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Ceritakan tentang organisasi Anda..."
                    />
                  )}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* TAB: Visi & Misi */}
        {activeTab === 'visi' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
                Visi & Misi
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
                <Controller
                  name="vision"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Menjadi pusat wisata edukasi kelulut terbaik di Kalimantan Timur..."
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Misi</label>
                <Controller
                  name="mission"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="1. Melestarikan lebah kelulut...\n2. Memberdayakan masyarakat..."
                    />
                  )}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* TAB: Kontak */}
        {activeTab === 'kontak' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
                Informasi Kontak
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Nomor Telepon"
                    placeholder="+62 812 3456 7890"
                    {...register('phone')}
                  />
                  <Phone size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="info@kebunkelulut.id"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Mail size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="relative">
                <Input
                  label="Nomor WhatsApp"
                  placeholder="628123456789 (tanpa tanda +)"
                  hint="Format: 628xxxxxxxxxx — akan digunakan untuk tombol WhatsApp di website"
                  {...register('whatsapp')}
                />
                <Phone size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
              </div>
              <Textarea
                label="Alamat Lengkap"
                placeholder="Jl. Contoh No. 1, Sangatta, Kutai Timur, Kalimantan Timur 75611"
                rows={3}
                {...register('address')}
              />
              <div className="relative">
                <Input
                  label="Link Google Maps"
                  placeholder="https://maps.google.com/..."
                  hint="URL embed atau share dari Google Maps"
                  {...register('maps_url')}
                />
                <MapPin size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
              </div>
            </CardBody>
          </Card>
        )}

        {/* TAB: Media Sosial */}
        {activeTab === 'sosmed' && (
          <Card>
            <CardBody className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
                Akun Media Sosial
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Instagram"
                    placeholder="kebunkelulut (tanpa @)"
                    hint="Hanya username, tanpa @"
                    {...register('instagram')}
                  />
                  <Instagram size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Input
                    label="Facebook"
                    placeholder="kebunkelulut"
                    hint="Username atau nama halaman"
                    {...register('facebook')}
                  />
                  <Facebook size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="YouTube"
                    placeholder="https://youtube.com/@kebunkelulut"
                    hint="URL channel YouTube"
                    {...register('youtube')}
                  />
                  <Youtube size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Input
                    label="TikTok"
                    placeholder="kebunkelulut (tanpa @)"
                    hint="Hanya username, tanpa @"
                    {...register('tiktok')}
                  />
                  <Globe size={14} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* Preview links */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Preview Link</p>
                <div className="flex flex-wrap gap-2">
                  {watchAll.instagram && (
                    <a href={`https://instagram.com/${watchAll.instagram}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs font-medium hover:bg-pink-100 transition-colors">
                      <Instagram size={12} /> @{watchAll.instagram}
                    </a>
                  )}
                  {watchAll.facebook && (
                    <a href={`https://facebook.com/${watchAll.facebook}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      <Facebook size={12} /> {watchAll.facebook}
                    </a>
                  )}
                  {watchAll.youtube && (
                    <a href={watchAll.youtube} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                      <Youtube size={12} /> YouTube
                    </a>
                  )}
                  {watchAll.tiktok && (
                    <a href={`https://tiktok.com/@${watchAll.tiktok}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                      <Globe size={12} /> @{watchAll.tiktok}
                    </a>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* TAB: Logo & Cover */}
        {activeTab === 'media' && (
          <Card>
            <CardBody className="space-y-6">
              <h2 className="font-semibold text-gray-800 text-base border-b border-gray-100 pb-3">
                Logo & Foto Cover
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <MediaPickerButton
                  label="Logo Organisasi"
                  value={logoUrl ?? undefined}
                  onChange={(url) => setLogoUrl(url)}
                  folder="Profil"
                  moduleName="Profil Website"
                />
                <MediaPickerButton
                  label="Foto Cover / Banner"
                  value={coverUrl ?? undefined}
                  onChange={(url) => setCoverUrl(url)}
                  folder="Profil"
                  moduleName="Profil Website"
                />
              </div>
              <p className="text-xs text-gray-400">
                💡 Logo ditampilkan di navbar, footer, dan halaman tentang kami.
                Cover ditampilkan sebagai banner di halaman tentang kami.
              </p>
            </CardBody>
          </Card>
        )}

        {/* ── Tombol Simpan bawah ── */}
        <div className="flex items-center justify-between pt-2 pb-6">
          {isDirty && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              ⚠️ Ada perubahan yang belum disimpan
            </p>
          )}
          <Button
            type="submit"
            loading={isSubmitting}
            className="ml-auto"
          >
            <Save size={15} />
            Simpan Semua Perubahan
          </Button>
        </div>
      </form>
    </div>
  )
}
