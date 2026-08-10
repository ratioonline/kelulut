import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, MapPin, Globe, Instagram, Facebook } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import MediaPickerButton from '../../components/media/MediaPickerButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Nama UMKM minimal 2 karakter'),
  owner_name: z.string().optional(),
  short_description: z.string().max(200, 'Maksimal 200 karakter').optional(),
  description: z.string().optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email tidak valid').or(z.literal('')).optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  website: z.string().url('URL tidak valid').or(z.literal('')).optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  year_established: z.number().nullable().optional(),
  umkm_category: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TABS = ['Informasi', 'Alamat', 'Media', 'Sosial Media'] as const

export default function UmkmProfile() {
  const { user, myUmkm, fetchMyUmkm: refreshUmkm } = useAuthStore()
  const { updateUmkmProfile, logAudit } = useUmkmStore()
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Informasi')
  const [logo, setLogo] = useState<string | null>(null)
  const [cover, setCover] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (myUmkm) {
      reset({
        name: myUmkm.name,
        owner_name: myUmkm.owner_name ?? '',
        short_description: myUmkm.short_description ?? '',
        description: myUmkm.description ?? '',
        whatsapp: myUmkm.whatsapp ?? '',
        phone: myUmkm.phone ?? '',
        email: myUmkm.email ?? '',
        address: myUmkm.address ?? '',
        province: myUmkm.province ?? '',
        city: myUmkm.city ?? '',
        district: myUmkm.district ?? '',
        village: myUmkm.village ?? '',
        postal_code: myUmkm.postal_code ?? '',
        latitude: myUmkm.latitude ?? null,
        longitude: myUmkm.longitude ?? null,
        website: myUmkm.website ?? '',
        instagram: myUmkm.instagram ?? '',
        facebook: myUmkm.facebook ?? '',
        tiktok: myUmkm.tiktok ?? '',
        youtube: myUmkm.youtube ?? '',
        year_established: myUmkm.year_established ?? null,
        umkm_category: myUmkm.umkm_category ?? '',
      })
      setLogo(myUmkm.logo)
      setCover(myUmkm.cover_image)
    }
  }, [myUmkm, reset])

  if (!myUmkm) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      logo,
      cover_image: cover,
      email: data.email || null,
      website: data.website || null,
    }
    const { error } = await updateUmkmProfile(myUmkm.id, payload)
    if (error) {
      toast.error('Gagal menyimpan profil: ' + error)
    } else {
      toast.success('Profil UMKM berhasil diperbarui')
      if (user) {
        await logAudit(user.id, myUmkm.id, 'update_profile', 'umkm', myUmkm.id, { name: data.name })
        await refreshUmkm()
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil UMKM</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi profil UMKM Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-[#1B4332] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {activeTab === 'Informasi' && (
          <Card>
            <CardBody className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nama UMKM" required error={errors.name?.message} {...register('name')} />
                <Input label="Nama Pemilik" {...register('owner_name')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Email UMKM" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Nomor WhatsApp" placeholder="6281234567890" {...register('whatsapp')} hint="Format: 628xxxxxxxxxx" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nomor Telepon" {...register('phone')} />
                <Input label="Kategori UMKM" placeholder="Madu, Olahan, dll." {...register('umkm_category')} />
              </div>
              <Input label="Tahun Berdiri" type="number" min={1900} max={new Date().getFullYear()} {...register('year_established', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
              <Textarea label="Profil Singkat" rows={2} placeholder="Deskripsi singkat UMKM Anda (maks 200 karakter)" error={errors.short_description?.message} {...register('short_description')} />
              <Textarea label="Deskripsi Lengkap" rows={5} placeholder="Ceritakan lebih lengkap tentang UMKM Anda..." {...register('description')} />
            </CardBody>
          </Card>
        )}

        {activeTab === 'Alamat' && (
          <Card>
            <CardBody className="space-y-5">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <MapPin size={18} className="text-[#2D6A4F]" />
                <h3 className="font-semibold">Lokasi UMKM</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Provinsi" {...register('province')} />
                <Input label="Kabupaten/Kota" {...register('city')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Kecamatan" {...register('district')} />
                <Input label="Desa/Kelurahan" {...register('village')} />
              </div>
              <Textarea label="Alamat Lengkap" rows={2} {...register('address')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Kode Pos" {...register('postal_code')} />
                <Input label="Latitude" type="number" step="any" {...register('latitude', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
                <Input label="Longitude" type="number" step="any" {...register('longitude', { setValueAs: (v) => (v === '' ? null : Number(v)) })} />
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Media' && (
          <Card>
            <CardBody className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MediaPickerButton
                  label="Logo UMKM"
                  value={logo ?? undefined}
                  onChange={setLogo}
                  folder="Logo"
                  moduleName="UMKM"
                />
                <MediaPickerButton
                  label="Foto Cover"
                  value={cover ?? undefined}
                  onChange={setCover}
                  folder="Banner"
                  moduleName="UMKM"
                />
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Sosial Media' && (
          <Card>
            <CardBody className="space-y-5">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Globe size={18} className="text-[#2D6A4F]" />
                <h3 className="font-semibold">Link Sosial Media</h3>
              </div>
              <Input label="Website" placeholder="https://umkm-anda.com" error={errors.website?.message} {...register('website')} />
              <Input label="Instagram" placeholder="@username" {...register('instagram')} />
              <Input label="Facebook" placeholder="https://facebook.com/..." {...register('facebook')} />
              <Input label="TikTok" placeholder="@username" {...register('tiktok')} />
              <Input label="YouTube" placeholder="https://youtube.com/..." {...register('youtube')} />
            </CardBody>
          </Card>
        )}

        {/* Save button */}
        <div className="flex justify-end mt-6">
          <Button type="submit" loading={isSubmitting} size="md">
            <Save size={16} /> Simpan Profil
          </Button>
        </div>
      </form>
    </div>
  )
}
