import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, Store } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})
type FormData = z.infer<typeof schema>

export default function UmkmLogin() {
  const { signIn, user, initialize, role } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user && (role === 'umkm_user' || role === 'super_admin')) {
      navigate('/umkm/dashboard', { replace: true })
    }
  }, [user, role, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error(error === 'Invalid login credentials' ? 'Email atau password salah.' : error)
    } else {
      toast.success('Berhasil masuk!')
      navigate('/umkm/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20">
            <Store size={36} className="text-[#F5A623]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard UMKM</h1>
          <p className="text-gray-300 mt-1 text-sm">Kebun Kelulut Sangatta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Masuk UMKM</h2>
          <p className="text-sm text-gray-500 mb-6">Masukkan email dan password akun UMKM Anda</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="umkm@example.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Mail size={16} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                error={errors.password?.message}
                {...register('password')}
              />
              <Lock size={16} className="absolute right-3 top-9 text-gray-400 pointer-events-none" />
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Kebun Kelulut Sangatta
        </p>
      </div>
    </div>
  )
}
