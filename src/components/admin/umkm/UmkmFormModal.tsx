import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Store, User, Phone, MapPin, Globe, Instagram, Facebook, Image as ImageIcon } from 'lucide-react'
import type { Umkm } from '../../../types/database'
import { slugify } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Textarea from '../../ui/Textarea'
import MediaPickerButton from '../../media/MediaPickerButton'
import { normalizeWhatsappNumber } from './UmkmCardGrid'

const schema = z.object({
  name: z.string().min(2, 'Nama UMKM minimal 2 karakter'),
  owner_name: z.string().min(2, 'Nama pemilik minimal 2 karakter').optional().nullable(),
  whatsapp: z.string().min(6, 'Nomor WhatsApp minimal 6 digit').optional().nullable().or(z.literal('')),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  short_description: z.string().max(160, 'Maksimal 160 karakter').optional().nullable(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  website: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  // Optional credentials for new user account
  create_account: z.boolean().default(false),
  account_email: z.string().email('Format email login tidak valid').optional().nullable().or(z.literal('')),
  account_password: z.string().min(6, 'Password minimal 6 karakter').optional().nullable().or(z.literal('')),
})

export type UmkmFormData = z.infer<typeof schema>

interface UmkmFormModalProps {
  open: boolean
  onClose: () => void
  editingUmkm: Umkm | null
  onSubmit: (data: UmkmFormData, logo: string | null, coverImage: string | null) => Promise<void>
}

export default function UmkmFormModal({
  open,
  onClose,
  editingUmkm,
  onSubmit,
}: UmkmFormModalProps) {
  const [logo, setLogo] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'media' | 'social'>('info')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UmkmFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'active',
      create_account: false,
    },
  })

  const watchCreateAccount = watch('create_account')

  useEffect(() => {
    if (open) {
      if (editingUmkm) {
        setLogo(editingUmkm.logo || null)
        setCoverImage(editingUmkm.cover_image || null)
        reset({
          name: editingUmkm.name || '',
          owner_name: editingUmkm.owner_name || '',
          whatsapp: editingUmkm.whatsapp || '',
          email: editingUmkm.email || '',
          short_description: editingUmkm.short_description || '',
          description: editingUmkm.description || '',
          address: editingUmkm.address || '',
          city: editingUmkm.city || '',
          province: editingUmkm.province || '',
          postal_code: editingUmkm.postal_code || '',
          instagram: editingUmkm.instagram || '',
          facebook: editingUmkm.facebook || '',
          website: editingUmkm.website || '',
          status: (editingUmkm.status as any) || 'active',
          create_account: false,
        })
      } else {
        setLogo(null)
        setCoverImage(null)
        reset({
          name: '',
          owner_name: '',
          whatsapp: '',
          email: '',
          short_description: '',
          description: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          instagram: '',
          facebook: '',
          website: '',
          status: 'active',
          create_account: false,
          account_email: '',
          account_password: '',
        })
      }
      setActiveTab('info')
    }
  }, [open, editingUmkm, reset])

  const handleFormSubmit = async (data: UmkmFormData) => {
    const normalizedWa = normalizeWhatsappNumber(data.whatsapp)
    const payload = {
      ...data,
      whatsapp: normalizedWa || null,
    }
    await onSubmit(payload, logo, coverImage)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingUmkm ? 'Edit Profil Mitra UMKM' : 'Tambah Mitra UMKM Baru'}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            form="umkm-form-main"
            type="submit"
            loading={isSubmitting}
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
          >
            {editingUmkm ? 'Simpan Perubahan' : 'Tambah UMKM'}
          </Button>
        </div>
      }
    >
      <form id="umkm-form-main" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'info', label: '1. Informasi Utama' },
            { id: 'address', label: '2. Alamat & Lokasi' },
            { id: 'media', label: '3. Logo & Cover' },
            { id: 'social', label: '4. Kontak & Medsos' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: INFORMASI UTAMA ── */}
        {activeTab === 'info' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nama UMKM *"
                placeholder="Contoh: Madu Kelulut Berkah"
                required
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Nama Pemilik (Owner) *"
                placeholder="Contoh: Budi Santoso"
                error={errors.owner_name?.message}
                {...register('owner_name')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Nomor WhatsApp *"
                placeholder="081234567890 (Otomatis dinormalisasi ke 62...)"
                error={errors.whatsapp?.message}
                {...register('whatsapp')}
              />
              <Input
                label="Email Resmi UMKM"
                type="email"
                placeholder="kontak@umkm.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <Input
              label="Profil / Tagline Singkat (Maks 160 Karakter)"
              placeholder="Produsen madu kelulut murni & produk turunan lebah tanpa sengat..."
              error={errors.short_description?.message}
              {...register('short_description')}
            />

            <Textarea
              label="Deskripsi Lengkap UMKM"
              rows={3}
              placeholder="Ceritakan latar belakang, sejarah berdirinya UMKM, legalitas usaha, dan visi..."
              {...register('description')}
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Status Mitra
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
              >
                <option value="active">Aktif (Bisa berjualan & tampil publik)</option>
                <option value="inactive">Nonaktif (Ditangguhkan)</option>
                <option value="pending">Pending (Menunggu verifikasi)</option>
              </select>
            </div>

            {/* Optional Account Creation for new UMKM */}
            {!editingUmkm && (
              <div className="pt-2 border-t border-gray-100 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#2D6A4F]"
                    {...register('create_account')}
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    Buat akun login portal admin sekaligus untuk pemilik UMKM ini
                  </span>
                </label>

                {watchCreateAccount && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 animate-in fade-in duration-100">
                    <Input
                      label="Email Login User"
                      type="email"
                      required
                      placeholder="owner@gmail.com"
                      error={errors.account_email?.message}
                      {...register('account_email')}
                    />
                    <Input
                      label="Password Awal"
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      error={errors.account_password?.message}
                      {...register('account_password')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ALAMAT & LOKASI ── */}
        {activeTab === 'address' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <Textarea
              label="Alamat Lengkap Tempat Usaha / Kebun"
              rows={2}
              placeholder="Jl. Raya Kelulut No. 12, RT 01 / RW 02..."
              {...register('address')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Kota / Kabupaten"
                placeholder="Contoh: Balikpapan"
                {...register('city')}
              />
              <Input
                label="Provinsi"
                placeholder="Contoh: Kalimantan Timur"
                {...register('province')}
              />
              <Input
                label="Kode Pos"
                placeholder="Contoh: 76115"
                {...register('postal_code')}
              />
            </div>
          </div>
        )}

        {/* ── TAB 3: MEDIA & BRAND ── */}
        {activeTab === 'media' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <p className="text-xs text-gray-600">
              Pilih logo profil dan foto cover banner menggunakan <strong>Media Library</strong> Kebun-Kelulut.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <MediaPickerButton
                  label="Logo UMKM (Rasio 1:1)"
                  value={logo ?? undefined}
                  onChange={setLogo}
                  folder="UMKM"
                  moduleName="UMKM"
                />
              </div>

              <div>
                <MediaPickerButton
                  label="Cover / Banner UMKM (Rasio 16:9)"
                  value={coverImage ?? undefined}
                  onChange={setCoverImage}
                  folder="UMKM"
                  moduleName="UMKM"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: KONTAK & MEDSOS ── */}
        {activeTab === 'social' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <Input
              label="Website Resmi (URL)"
              placeholder="https://www.umkmku.com"
              error={errors.website?.message}
              {...register('website')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Instagram"
                placeholder="@kebunkelulut atau link profil"
                {...register('instagram')}
              />
              <Input
                label="Facebook"
                placeholder="Nama halaman Facebook atau link"
                {...register('facebook')}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
