import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, MapPin, Globe, Phone, Save } from 'lucide-react'
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
  owner_name: z.string().min(2, 'Nama pemilik minimal 2 karakter').optional().nullable(),
  short_description: z.string().max(150, 'Maksimal 150 karakter').optional().nullable(),
  description: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  website: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

export default function AdminProfile() {
  const { user, role } = useAuthStore()
  const { umkm, fetchMyUmkm, updateUmkmProfile, loading: storeLoading } = useUmkmStore()
  const [logo, setLogo] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    if (user?.id && (role === 'umkm_user' || role === 'proktor')) {
      fetchMyUmkm(user.id)
    }
  }, [user, role, fetchMyUmkm])

  useEffect(() => {
    if (umkm) {
      reset({
        name: umkm.name || '',
        owner_name: umkm.owner_name || '',
        short_description: umkm.short_description || '',
        description: umkm.description || '',
        whatsapp: umkm.whatsapp || '',
        email: umkm.email || '',
        address: umkm.address || '',
        province: umkm.province || '',
        city: umkm.city || '',
        postal_code: umkm.postal_code || '',
        website: umkm.website || '',
        instagram: umkm.instagram || '',
        facebook: umkm.facebook || '',
      })
      setLogo(umkm.logo || null)
      setCoverImage(umkm.cover_image || null)
    }
  }, [umkm, reset])

  const onSubmit = async (data: FormData) => {
    if (!umkm) return
    const { error } = await updateUmkmProfile(umkm.id, {
      ...data,
      logo,
      cover_image: coverImage
    })

    if (error) {
      toast.error('Gagal menyimpan profil: ' + error)
    } else {
      toast.success('Profil berhasil disimpan')
    }
  }

  if (role !== 'umkm_user' && role !== 'proktor') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Store size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Bukan Akun Pemilik UMKM</h2>
        <p className="text-gray-500 mt-2">Halaman ini khusus untuk pengelola UMKM.</p>
      </div>
    )
  }

  if (!umkm && storeLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  if (!umkm) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Store size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Profil Tidak Ditemukan</h2>
        <p className="text-gray-500 mt-2">Silakan hubungi administrator untuk menghubungkan akun ini dengan data UMKM.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil UMKM</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi publik, kontak, dan tampilan halaman UMKM Anda.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cover & Logo Section */}
        <Card>
          <CardBody className="p-0 overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-400">
                  Belum ada foto cover
                </div>
              )}
              <div className="absolute top-4 right-4">
                <MediaPickerButton
                  value={coverImage}
                  onChange={setCoverImage}
                  buttonText={coverImage ? "Ganti Cover" : "Upload Cover"}
                />
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-6 -mt-12 sm:-mt-16 items-start sm:items-end">
                <div className="relative group">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center text-gray-400">
                      <Store size={40} />
                    </div>
                  )}
                  <div className="mt-2 text-center">
                    <MediaPickerButton
                      value={logo}
                      onChange={setLogo}
                      buttonText={logo ? "Ganti Logo" : "Upload Logo"}
                      size="sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 pb-2">
                  <h2 className="text-xl font-bold text-gray-900">{umkm.name}</h2>
                  <p className="text-sm text-[#2D6A4F] font-medium">@{umkm.slug}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Info Utama */}
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Informasi Utama</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nama UMKM *"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Nama Pemilik"
                    {...register('owner_name')}
                    error={errors.owner_name?.message}
                  />
                </div>

                <Textarea
                  label="Deskripsi Singkat (Maks 150 kar)"
                  rows={2}
                  {...register('short_description')}
                  error={errors.short_description?.message}
                />

                <Textarea
                  label="Deskripsi Lengkap"
                  rows={5}
                  {...register('description')}
                  error={errors.description?.message}
                />
              </CardBody>
            </Card>

            {/* Lokasi */}
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-gray-400" /> Lokasi
                </h3>
                
                <Textarea
                  label="Alamat Lengkap"
                  rows={3}
                  {...register('address')}
                  error={errors.address?.message}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Kota/Kabupaten" {...register('city')} error={errors.city?.message} />
                  <Input label="Provinsi" {...register('province')} error={errors.province?.message} />
                  <Input label="Kode Pos" {...register('postal_code')} error={errors.postal_code?.message} />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Kontak */}
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" /> Kontak
                </h3>
                
                <Input
                  label="WhatsApp (Mis: 081234...)"
                  {...register('whatsapp')}
                  error={errors.whatsapp?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </CardBody>
            </Card>

            {/* Social Media */}
            <Card>
              <CardBody className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Globe size={18} className="text-gray-400" /> Web & Sosial Media
                </h3>
                
                <Input
                  label="Website URL"
                  {...register('website')}
                  error={errors.website?.message}
                />
                <Input
                  label="Instagram (username)"
                  {...register('instagram')}
                  error={errors.instagram?.message}
                />
                <Input
                  label="Facebook (URL/Nama)"
                  {...register('facebook')}
                  error={errors.facebook?.message}
                />
              </CardBody>
            </Card>
            
            <Button
              type="submit"
              className="w-full py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <Save size={18} /> Simpan Perubahan Profil
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
