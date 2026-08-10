import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Lock, LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function UmkmSettings() {
  const { signOut, user } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const onChangePassword = async (data: PasswordForm) => {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) {
      toast.error('Gagal mengubah password: ' + error.message)
    } else {
      toast.success('Password berhasil diubah')
      reset()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/umkm/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan akun Anda.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Settings size={16} className="text-[#2D6A4F]" /> Informasi Akun
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">User ID</span>
              <span className="text-xs font-mono text-gray-400">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Lock size={16} className="text-[#2D6A4F]" /> Ubah Password
          </h3>
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            <Input
              label="Password Baru"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Konfirmasi Password Baru"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" loading={isSubmitting} size="sm">
              Ubah Password
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Notifications placeholder */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Bell size={16} className="text-[#2D6A4F]" /> Notifikasi
          </h3>
          <p className="text-sm text-gray-500">Pengaturan notifikasi akan tersedia segera.</p>
        </CardBody>
      </Card>

      {/* Logout */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <LogOut size={16} className="text-red-500" /> Keluar
          </h3>
          <p className="text-sm text-gray-500 mb-4">Keluar dari dashboard UMKM Anda.</p>
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            <LogOut size={14} /> Keluar dari Akun
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
