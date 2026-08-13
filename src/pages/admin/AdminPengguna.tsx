import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardBody } from '../../components/ui/Card'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { UserProfile, Umkm } from '../../types/database'
import { slugify } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['super_admin', 'proktor', 'umkm_user']),
  umkmName: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type UserWithUmkm = UserProfile & { umkm_name?: string }

export default function AdminPengguna() {
  const [users, setUsers] = useState<UserWithUmkm[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)
  const [resetTarget, setResetTarget] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { role: myRole } = useAuthStore()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'umkm_user' }
  })
  
  const selectedRole = watch('role')

  const fetchUsers = async () => {
    setLoading(true)
    const { data: profiles, error: profileErr } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    
    if (profileErr) {
      toast.error('Gagal mengambil data pengguna')
      setLoading(false)
      return
    }

    const { data: umkms } = await supabase.from('umkms').select('user_id, name')
    
    const combined = profiles.map(p => {
      const umkm = umkms?.find(u => u.user_id === p.id)
      return { ...p, umkm_name: umkm?.name }
    })

    setUsers(combined)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreate = () => {
    reset()
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!supabaseAdmin) {
      toast.error('Service Role Key tidak dikonfigurasi. Hubungi developer.')
      return
    }

    if (myRole === 'proktor' && data.role === 'super_admin') {
      toast.error('Proktor tidak dapat membuat Super Admin')
      return
    }

    if (data.role === 'umkm_user' && !data.umkmName) {
      toast.error('Nama UMKM wajib diisi untuk akun UMKM')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      })

      if (authError) throw new Error(authError.message)

      const userId = authData.user.id

      // 2. Insert into user_profiles (upsert to handle auto-triggers)
      const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
        id: userId,
        email: data.email,
        role: data.role,
      })

      if (profileError) throw new Error(profileError.message)

      // 3. If UMKM, insert into umkms
      if (data.role === 'umkm_user' && data.umkmName) {
        await supabaseAdmin.from('umkms').insert({
          user_id: userId,
          name: data.umkmName,
          slug: slugify(data.umkmName),
          status: 'active'
        })
      }

      toast.success('Pengguna berhasil dibuat')
      setModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabaseAdmin || !resetTarget) return
    
    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get('new_password') as string
    
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabaseAdmin.auth.admin.updateUserById(resetTarget.id, {
      password: newPassword
    })

    if (error) {
      toast.error(`Gagal reset password: ${error.message}`)
    } else {
      toast.success('Password berhasil direset')
      setResetModalOpen(false)
      setResetTarget(null)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!supabaseAdmin || !deleteTarget) return
    
    setIsSubmitting(true)
    // Delete auth user (cascades to user_profiles)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(deleteTarget.id)
    
    if (error) {
      toast.error(`Gagal menghapus: ${error.message}`)
    } else {
      toast.success('Pengguna dihapus')
      fetchUsers()
    }
    setIsSubmitting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola akun Admin, Proktor, dan UMKM.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Tambah Pengguna</Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Belum ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email / Akun</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{u.email}</p>
                        {u.umkm_name && <p className="text-xs text-gray-500">Toko: {u.umkm_name}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          u.role === 'super_admin' ? 'bg-red-50 text-red-700' :
                          u.role === 'proktor' ? 'bg-blue-50 text-blue-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {u.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setResetTarget(u); setResetModalOpen(true); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
                            title="Reset Password"
                          >
                            <KeyRound size={15} />
                          </button>
                          {/* Only allow deleting if it's not the last super admin or current user */}
                          <button 
                            onClick={() => setDeleteTarget(u)} 
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Form Modal Create ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Pengguna Baru"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="user-form" type="submit" loading={isSubmitting}>Buat Akun</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email Login *" type="email" required error={errors.email?.message} {...register('email')} />
          <Input label="Password *" type="password" required error={errors.password?.message} {...register('password')} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role) *</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
            >
              <option value="umkm_user">UMKM User</option>
              {myRole === 'super_admin' && (
                <>
                  <option value="proktor">Proktor</option>
                  <option value="super_admin">Administrator</option>
                </>
              )}
            </select>
          </div>

          {selectedRole === 'umkm_user' && (
            <div className="pt-2 border-t border-gray-100">
              <Input label="Nama Toko UMKM *" required={selectedRole === 'umkm_user'} error={errors.umkmName?.message} {...register('umkmName')} />
              <p className="text-xs text-gray-500 mt-1">Sistem akan otomatis membuatkan profil UMKM untuk pengguna ini.</p>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Password"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>Batal</Button>
            <Button form="reset-form" type="submit" loading={isSubmitting}>Simpan</Button>
          </>
        }
      >
        <form id="reset-form" onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-gray-600">Masukkan password baru untuk akun <strong>{resetTarget?.email}</strong></p>
          <Input name="new_password" label="Password Baru" type="password" required minLength={6} />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus akun "${deleteTarget?.email}" secara permanen? Semua data yang berelasi (termasuk toko UMKM) mungkin akan terhapus.`}
        loading={isSubmitting}
      />
    </div>
  )
}
