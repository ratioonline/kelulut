import { useEffect, useState } from 'react'
import { Plus, Trash2, KeyRound, Pencil } from 'lucide-react'
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
import type { UserProfile } from '../../types/database'
import { slugify } from '../../lib/utils'

// ── Skema Form Buat Pengguna ────────────────────────────────────────────────
const createSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['super_admin', 'proktor', 'umkm_user', 'guest']),
  umkmName: z.string().optional(),
})
type CreateFormData = z.infer<typeof createSchema>

// ── Skema Form Edit Pengguna ────────────────────────────────────────────────
const editSchema = z.object({
  email: z.string().email('Email tidak valid'),
  full_name: z.string().optional(),
  role: z.enum(['super_admin', 'proktor', 'umkm_user', 'guest']),
  newPassword: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

type UserWithUmkm = UserProfile & { umkm_name?: string; umkm_id?: string }

export default function AdminPengguna() {
  const [users, setUsers]               = useState<UserWithUmkm[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserWithUmkm | null>(null)
  const [resetTarget, setResetTarget]   = useState<UserProfile | null>(null)
  const [editTarget, setEditTarget]     = useState<UserWithUmkm | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { role: myRole } = useAuthStore()

  // ── Form: Buat pengguna baru ──
  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    watch: watchCreate,
    formState: { errors: errCreate },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'umkm_user' },
  })
  const selectedCreateRole = watchCreate('role')

  // ── Form: Edit pengguna ──
  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: errEdit },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })
  const selectedEditRole = watchEdit('role')

  // ── Fetch data ──────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true)
    const { data: profiles, error: profileErr } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profileErr) {
      toast.error('Gagal mengambil data pengguna')
      setLoading(false)
      return
    }

    const { data: umkms } = await supabase.from('umkms').select('id, user_id, name')

    const combined = profiles.map(p => {
      const umkm = umkms?.find(u => u.user_id === p.id)
      return { ...p, umkm_name: umkm?.name, umkm_id: umkm?.id }
    })

    setUsers(combined)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Buka modal buat pengguna ────────────────────────────────────────────
  const openCreate = () => {
    resetCreate()
    setModalOpen(true)
  }

  // ── Buka modal edit pengguna ────────────────────────────────────────────
  const openEdit = (u: UserWithUmkm) => {
    setEditTarget(u)
    resetEdit({
      email: u.email ?? '',
      full_name: u.full_name ?? '',
      role: (u.role as EditFormData['role']) ?? 'guest',
      newPassword: '',
    })
    setEditModalOpen(true)
  }

  // ── Submit: Buat pengguna baru ──────────────────────────────────────────
  const onCreateSubmit = async (data: CreateFormData) => {
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
      // 1. Buat auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      })
      if (authError) throw new Error(authError.message)

      const userId = authData.user.id

      // 2. Simpan ke user_profiles
      const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
        id: userId,
        email: data.email,
        role: data.role,
      })
      if (profileError) throw new Error(profileError.message)

      // 3. Jika UMKM, buat profil UMKM
      if (data.role === 'umkm_user' && data.umkmName) {
        await supabaseAdmin.from('umkms').insert({
          user_id: userId,
          name: data.umkmName,
          slug: slugify(data.umkmName),
          status: 'active',
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

  // ── Submit: Edit pengguna ───────────────────────────────────────────────
  const onEditSubmit = async (data: EditFormData) => {
    if (!supabaseAdmin || !editTarget) return
    if (myRole === 'proktor' && data.role === 'super_admin') {
      toast.error('Proktor tidak dapat mengatur role Super Admin')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Update email & password di Supabase Auth (jika ada perubahan)
      const authUpdate: Record<string, string> = {}
      if (data.email !== editTarget.email) authUpdate.email = data.email
      if (data.newPassword && data.newPassword.length >= 6) authUpdate.password = data.newPassword

      if (Object.keys(authUpdate).length > 0) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
          editTarget.id,
          authUpdate
        )
        if (authErr) throw new Error(authErr.message)
      }

      // 2. Update user_profiles
      const { error: profileErr } = await supabaseAdmin.from('user_profiles').update({
        email: data.email,
        full_name: data.full_name || null,
        role: data.role,
      }).eq('id', editTarget.id)
      if (profileErr) throw new Error(profileErr.message)

      // 3. Jika role berubah dari umkm_user ke lain → unlink UMKM (tidak hapus)
      if (editTarget.role === 'umkm_user' && data.role !== 'umkm_user' && editTarget.umkm_id) {
        await supabaseAdmin.from('umkms').update({ user_id: null }).eq('id', editTarget.umkm_id)
      }

      toast.success('Pengguna berhasil diperbarui')
      setEditModalOpen(false)
      setEditTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(`Gagal memperbarui: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Reset password ──────────────────────────────────────────────────────
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
      password: newPassword,
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

  // ── Hapus pengguna (TIDAK menghapus data UMKM) ─────────────────────────
  const handleDelete = async () => {
    if (!supabaseAdmin || !deleteTarget) return

    setIsSubmitting(true)
    try {
      // 1. Unlink user dari UMKM terlebih dahulu (data UMKM tetap aman)
      if (deleteTarget.umkm_id) {
        const { error: unlinkErr } = await supabaseAdmin
          .from('umkms')
          .update({ user_id: null })
          .eq('id', deleteTarget.umkm_id)
        if (unlinkErr) throw new Error(`Gagal unlink UMKM: ${unlinkErr.message}`)
      }

      // 2. Hapus user_profiles
      await supabaseAdmin.from('user_profiles').delete().eq('id', deleteTarget.id)

      // 3. Hapus auth user
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(deleteTarget.id)
      if (authErr) throw new Error(authErr.message)

      toast.success('Pengguna berhasil dihapus. Data UMKM tetap tersimpan.')
      fetchUsers()
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`)
    } finally {
      setIsSubmitting(false)
      setDeleteTarget(null)
    }
  }

  // ── Helper: warna badge role ────────────────────────────────────────────
  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':  return 'bg-red-50 text-red-700'
      case 'proktor':      return 'bg-blue-50 text-blue-700'
      case 'umkm_user':    return 'bg-green-50 text-green-700'
      default:             return 'bg-gray-100 text-gray-600'
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
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
                        {u.full_name && <p className="text-xs text-gray-500">{u.full_name}</p>}
                        {u.umkm_name && <p className="text-xs text-gray-400">Toko: {u.umkm_name}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${roleBadgeClass(u.role)}`}>
                          {u.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit Pengguna"
                          >
                            <Pencil size={15} />
                          </button>
                          {/* Reset Password */}
                          <button
                            onClick={() => { setResetTarget(u); setResetModalOpen(true) }}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
                            title="Reset Password"
                          >
                            <KeyRound size={15} />
                          </button>
                          {/* Hapus */}
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Hapus Pengguna"
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

      {/* ── Modal: Tambah Pengguna Baru ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Pengguna Baru"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button form="create-user-form" type="submit" loading={isSubmitting}>Buat Akun</Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate(onCreateSubmit)} className="space-y-4">
          <Input label="Email Login *" type="email" required error={errCreate.email?.message} {...regCreate('email')} />
          <Input label="Password *" type="password" required error={errCreate.password?.message} {...regCreate('password')} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role) *</label>
            <select
              {...regCreate('role')}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
            >
              <option value="umkm_user">UMKM User</option>
              <option value="guest">Guest</option>
              {myRole === 'super_admin' && (
                <>
                  <option value="proktor">Proktor</option>
                  <option value="super_admin">Administrator</option>
                </>
              )}
            </select>
          </div>

          {selectedCreateRole === 'umkm_user' && (
            <div className="pt-2 border-t border-gray-100">
              <Input
                label="Nama Toko UMKM *"
                required
                error={errCreate.umkmName?.message}
                {...regCreate('umkmName')}
              />
              <p className="text-xs text-gray-500 mt-1">Sistem akan otomatis membuatkan profil UMKM untuk pengguna ini.</p>
            </div>
          )}
        </form>
      </Modal>

      {/* ── Modal: Edit Pengguna ── */}
      <Modal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditTarget(null) }}
        title={`Edit Pengguna — ${editTarget?.email}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditModalOpen(false); setEditTarget(null) }}>Batal</Button>
            <Button form="edit-user-form" type="submit" loading={isSubmitting}>Simpan Perubahan</Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <Input
            label="Email *"
            type="email"
            required
            error={errEdit.email?.message}
            {...regEdit('email')}
          />
          <Input
            label="Nama Lengkap"
            type="text"
            error={errEdit.full_name?.message}
            {...regEdit('full_name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role) *</label>
            <select
              {...regEdit('role')}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm"
            >
              <option value="umkm_user">UMKM User</option>
              <option value="guest">Guest</option>
              {myRole === 'super_admin' && (
                <>
                  <option value="proktor">Proktor</option>
                  <option value="super_admin">Administrator</option>
                </>
              )}
            </select>
          </div>

          {/* Info jika mengubah role dari umkm_user */}
          {editTarget?.role === 'umkm_user' && selectedEditRole !== 'umkm_user' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              ⚠️ Mengubah role dari UMKM User akan melepas tautan ke toko <strong>{editTarget.umkm_name}</strong>, namun data toko tetap tersimpan.
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <Input
              label="Password Baru (opsional)"
              type="password"
              placeholder="Kosongkan jika tidak ingin mengubah"
              error={errEdit.newPassword?.message}
              {...regEdit('newPassword')}
            />
            <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter. Kosongkan jika tidak ingin mengubah password.</p>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Reset Password ── */}
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
          <p className="text-sm text-gray-600">
            Masukkan password baru untuk akun <strong>{resetTarget?.email}</strong>
          </p>
          <Input name="new_password" label="Password Baru" type="password" required minLength={6} />
        </form>
      </Modal>

      {/* ── Konfirmasi Hapus ── */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={
          deleteTarget?.umkm_name
            ? `Hapus akun "${deleteTarget?.email}"? Akun akan dihapus permanen, namun data toko UMKM "${deleteTarget.umkm_name}" tetap tersimpan dan tidak akan terhapus.`
            : `Hapus akun "${deleteTarget?.email}" secara permanen?`
        }
        loading={isSubmitting}
      />
    </div>
  )
}
