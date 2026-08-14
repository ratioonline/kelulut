import { useEffect, useState } from 'react'
import { Plus, Trash2, KeyRound, Pencil, Lock } from 'lucide-react'
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
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role:     z.enum(['super_admin', 'proktor', 'umkm_user', 'guest']),
  umkmName: z.string().optional(),
})
type CreateFormData = z.infer<typeof createSchema>

// ── Skema Form Edit Pengguna ────────────────────────────────────────────────
const editSchema = z.object({
  email:       z.string().email('Email tidak valid'),
  full_name:   z.string().optional(),
  role:        z.enum(['super_admin', 'proktor', 'umkm_user', 'guest']),
  newPassword: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

type UserWithUmkm = UserProfile & { umkm_name?: string; umkm_id?: string }

// ── Helper: cek apakah proktor boleh edit user ini ──────────────────────────
// Proktor hanya boleh edit umkm_user dan guest — TIDAK proktor lain / admin
const proktorCanEdit = (targetRole: string) =>
  targetRole === 'umkm_user' || targetRole === 'guest'

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

  const isProktor      = myRole === 'proktor'
  const isSuperAdmin   = myRole === 'super_admin'

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
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Proktor: sembunyikan akun super_admin
    if (isProktor) {
      query = query.neq('role', 'super_admin')
    }

    const { data: profiles, error: profileErr } = await query

    if (profileErr) {
      toast.error('Gagal mengambil data pengguna')
      setLoading(false)
      return
    }

    const { data: umkms } = await supabase.from('umkms').select('id, user_id, name')

    const combined = (profiles ?? []).map(p => {
      const umkm = umkms?.find(u => u.user_id === p.id)
      return { ...p, umkm_name: umkm?.name, umkm_id: umkm?.id }
    })

    setUsers(combined)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Buka modal buat pengguna ────────────────────────────────────────────
  const openCreate = () => {
    resetCreate({ role: 'umkm_user' })
    setModalOpen(true)
  }

  // ── Buka modal edit pengguna ────────────────────────────────────────────
  const openEdit = (u: UserWithUmkm) => {
    // Proktor hanya boleh edit umkm_user / guest
    if (isProktor && !proktorCanEdit(u.role)) {
      toast.error('Proktor tidak memiliki izin untuk mengedit akun ini.')
      return
    }
    setEditTarget(u)
    resetEdit({
      email:       u.email ?? '',
      full_name:   u.full_name ?? '',
      role:        (u.role as EditFormData['role']) ?? 'guest',
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

    // Jika role UMKM User dipilih atau nama UMKM diisi, otomatis jadikan role 'proktor'
    const finalRole = (data.role === 'umkm_user' || (data.umkmName && data.umkmName.trim() !== ''))
      ? 'proktor'
      : data.role

    // Proktor hanya boleh membuat akun UMKM / Proktor dan Guest
    if (isProktor && (data.role === 'super_admin')) {
      toast.error('Proktor tidak dapat membuat akun Administrator.')
      return
    }
    if (data.role === 'umkm_user' && !data.umkmName) {
      toast.error('Nama UMKM wajib diisi untuk akun UMKM')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      })
      if (authError) throw new Error(authError.message)

      const userId = authData.user.id

      const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
        id: userId,
        email: data.email,
        role: finalRole,
      })
      if (profileError) throw new Error(profileError.message)

      if (data.umkmName && data.umkmName.trim() !== '') {
        await supabaseAdmin.from('umkms').insert({
          user_id: userId,
          name: data.umkmName.trim(),
          slug: slugify(data.umkmName.trim()),
          status: 'active',
        })
      }

      toast.success('Pengguna berhasil dibuat (Otomatis role Proktor)')
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

    // Guard: proktor tidak boleh edit proktor/admin
    if (isProktor && !proktorCanEdit(editTarget.role)) {
      toast.error('Proktor tidak memiliki izin untuk mengedit akun ini.')
      return
    }
    // Guard: proktor tidak boleh mengubah role ke admin/proktor
    if (isProktor && (data.role === 'super_admin' || data.role === 'proktor')) {
      toast.error('Proktor tidak dapat mengatur role Admin atau Proktor.')
      return
    }

    setIsSubmitting(true)
    try {
      const authUpdate: Record<string, string> = {}
      if (data.email !== editTarget.email) authUpdate.email = data.email
      if (data.newPassword && data.newPassword.length >= 6) authUpdate.password = data.newPassword

      if (Object.keys(authUpdate).length > 0) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(editTarget.id, authUpdate)
        if (authErr) throw new Error(authErr.message)
      }

      const { error: profileErr } = await supabaseAdmin.from('user_profiles').update({
        email: data.email,
        full_name: data.full_name || null,
        role: data.role,
      }).eq('id', editTarget.id)
      if (profileErr) throw new Error(profileErr.message)

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

    // Guard: proktor tidak boleh reset password proktor/admin
    if (isProktor && !proktorCanEdit(resetTarget.role)) {
      toast.error('Proktor tidak memiliki izin untuk mereset password akun ini.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get('new_password') as string
    if (newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return }

    setIsSubmitting(true)
    const { error } = await supabaseAdmin.auth.admin.updateUserById(resetTarget.id, { password: newPassword })
    if (error) {
      toast.error(`Gagal reset password: ${error.message}`)
    } else {
      toast.success('Password berhasil direset')
      setResetModalOpen(false)
      setResetTarget(null)
    }
    setIsSubmitting(false)
  }

  // ── Hapus pengguna ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return

    if (!supabaseAdmin) {
      toast.error('Service Role Key tidak dikonfigurasi. Hubungi developer.')
      return
    }

    // Guard: proktor tidak boleh hapus proktor/admin
    if (isProktor && !proktorCanEdit(deleteTarget.role)) {
      toast.error('Proktor tidak memiliki izin untuk menghapus akun ini.')
      setDeleteTarget(null)
      return
    }

    const targetId     = deleteTarget.id
    const targetEmail  = deleteTarget.email
    const targetUmkmId = deleteTarget.umkm_id

    setIsSubmitting(true)
    try {
      if (targetUmkmId) {
        const { error: unlinkErr } = await supabaseAdmin
          .from('umkms').update({ user_id: null }).eq('id', targetUmkmId)
        if (unlinkErr) throw new Error(`Gagal unlink UMKM: ${unlinkErr.message}`)
      }

      const { error: profileErr } = await supabaseAdmin
        .from('user_profiles').delete().eq('id', targetId)
      if (profileErr) throw new Error(`Gagal hapus profil: ${profileErr.message}`)

      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(targetId)
      if (authErr) throw new Error(authErr.message)

      toast.success(`Akun ${targetEmail} berhasil dihapus.`)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Helper: warna badge role ────────────────────────────────────────────
  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-50 text-red-700'
      case 'proktor':     return 'bg-blue-50 text-blue-700'
      case 'umkm_user':   return 'bg-green-50 text-green-700'
      default:            return 'bg-gray-100 text-gray-600'
    }
  }

  // ── Cek apakah tombol aksi boleh ditampilkan untuk baris ini ────────────
  // Proktor: akun proktor lain → readonly (tidak ada tombol aksi)
  // Proktor: akun umkm/guest  → boleh semua aksi
  const canAct = (u: UserWithUmkm) => {
    if (isSuperAdmin) return true
    if (isProktor)    return proktorCanEdit(u.role)
    return false
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isProktor
              ? 'Anda dapat mengelola akun UMKM. Akun Administrator tidak ditampilkan.'
              : 'Kelola akun Admin, Proktor, dan UMKM.'}
          </p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Tambah Pengguna</Button>
      </div>

      {/* Info banner untuk proktor */}
      {isProktor && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <Lock size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Akses terbatas sebagai Proktor</p>
            <p className="text-xs mt-0.5 text-blue-600">
              Anda dapat menambah dan mengelola akun <strong>UMKM User</strong> dan <strong>Guest</strong>.
              Akun Proktor lain ditampilkan sebagai referensi namun tidak dapat diedit.
              Akun Administrator tidak ditampilkan.
            </p>
          </div>
        </div>
      )}

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
                    <tr
                      key={u.id}
                      className={`transition-colors ${canAct(u) ? 'hover:bg-gray-50' : 'opacity-60 bg-gray-50/50'}`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{u.email}</p>
                        {u.full_name && <p className="text-xs text-gray-500">{u.full_name}</p>}
                        {u.umkm_name && <p className="text-xs text-gray-400">Toko: {u.umkm_name}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${roleBadgeClass(u.role)}`}>
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                          {/* Label readonly untuk proktor melihat proktor lain */}
                          {isProktor && u.role === 'proktor' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-400 bg-gray-100">
                              <Lock size={10} /> Hanya Lihat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {canAct(u) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit Pengguna"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => { setResetTarget(u); setResetModalOpen(true) }}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
                              title="Reset Password"
                            >
                              <KeyRound size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                              title="Hapus Pengguna"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          // Proktor melihat baris proktor lain → tampilkan icon kunci
                          <span className="flex items-center gap-1 text-xs text-gray-400 px-1.5">
                            <Lock size={13} /> Tidak dapat diedit
                          </span>
                        )}
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
              <option value="umkm_user">UMKM (Otomatis Role Proktor)</option>
              <option value="guest">Guest</option>
              {isSuperAdmin && (
                <>
                  <option value="proktor">Proktor</option>
                  <option value="super_admin">Administrator</option>
                </>
              )}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Akun pengguna UMKM otomatis mendapatkan peran Proktor.
            </p>
          </div>

          {selectedCreateRole === 'umkm_user' && (
            <div className="pt-2 border-t border-gray-100">
              <Input
                label="Nama Toko UMKM *"
                required
                error={errCreate.umkmName?.message}
                {...regCreate('umkmName')}
              />
              <p className="text-xs text-gray-500 mt-1">Sistem akan otomatis membuatkan profil UMKM dan mengatur peran akun sebagai Proktor.</p>
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
          <Input label="Email *" type="email" required error={errEdit.email?.message} {...regEdit('email')} />
          <Input label="Nama Lengkap" type="text" error={errEdit.full_name?.message} {...regEdit('full_name')} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role) *</label>
            <select
              {...regEdit('role')}
              disabled={isProktor} // proktor tidak bisa ubah role
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="umkm_user">UMKM User</option>
              <option value="guest">Guest</option>
              {isSuperAdmin && (
                <>
                  <option value="proktor">Proktor</option>
                  <option value="super_admin">Administrator</option>
                </>
              )}
            </select>
            {isProktor && (
              <p className="text-xs text-gray-400 mt-1">
                <Lock size={10} className="inline mr-1" />
                Proktor tidak dapat mengubah role pengguna.
              </p>
            )}
          </div>

          {/* Info jika mengubah role dari umkm_user */}
          {isSuperAdmin && editTarget?.role === 'umkm_user' && selectedEditRole !== 'umkm_user' && (
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
        onClose={() => { if (!isSubmitting) setDeleteTarget(null) }}
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
