import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Eye, Search, Store, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Umkm } from '../../types/database'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { slugify } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminUmkmManagement() {
  const [umkms, setUmkms] = useState<(Umkm & { product_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Umkm | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create form
  const [formName, setFormName] = useState('')
  const [formOwner, setFormOwner] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchUmkms = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('umkms')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      // Count products per UMKM
      const enriched = await Promise.all(
        (data as Umkm[]).map(async (u) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('umkm_id', u.id)
          return { ...u, product_count: count ?? 0 }
        })
      )
      setUmkms(enriched)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUmkms() }, [])

  const filtered = umkms.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || (u.owner_name?.toLowerCase().includes(q))
    }
    return true
  })

  const handleCreate = async () => {
    if (!formName || !formEmail || !formPassword) {
      toast.error('Nama, email, dan password wajib diisi')
      return
    }
    setCreating(true)

    try {
      // 1. Create user account via Supabase Auth (admin)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // 2. Create user_profile
      await supabase.from('user_profiles').insert({
        id: authData.user.id,
        role: 'umkm_user',
        full_name: formOwner || formName,
      })

      // 3. Create UMKM
      const { error: umkmError } = await supabase.from('umkms').insert({
        user_id: authData.user.id,
        name: formName,
        slug: slugify(formName),
        owner_name: formOwner,
        whatsapp: formWhatsapp,
        short_description: formDesc,
        status: 'active',
      })
      if (umkmError) throw umkmError

      toast.success('UMKM berhasil dibuat')
      setCreateOpen(false)
      setFormName(''); setFormOwner(''); setFormEmail(''); setFormPassword(''); setFormWhatsapp(''); setFormDesc('')
      await fetchUmkms()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal membuat UMKM: ' + message)
    }
    setCreating(false)
  }

  const handleToggleStatus = async (umkm: Umkm) => {
    const newStatus = umkm.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('umkms').update({ status: newStatus }).eq('id', umkm.id)
    if (error) toast.error('Gagal mengubah status')
    else { toast.success('Status berhasil diubah'); await fetchUmkms() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('umkms').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Gagal menghapus UMKM')
    else { toast.success('UMKM berhasil dihapus'); await fetchUmkms() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen UMKM</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola seluruh UMKM yang terdaftar.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm"><Plus size={16} /> Tambah UMKM</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari UMKM..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Store size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Belum ada UMKM.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['UMKM', 'Owner', 'Produk', 'WhatsApp', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.logo ? (
                            <img src={u.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white text-sm font-bold">
                              {u.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.city ?? u.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{u.owner_name ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{u.product_count ?? 0}</td>
                      <td className="py-3 px-4 text-gray-600">{u.whatsapp ?? '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.status === 'active' ? 'green' : u.status === 'pending' ? 'yellow' : 'red'}>
                          {u.status === 'active' ? 'Aktif' : u.status === 'pending' ? 'Pending' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/admin/umkm-management/${u.id}`} className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Eye size={15} />
                          </Link>
                          <button onClick={() => handleToggleStatus(u)} className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors" title={u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                            {u.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
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

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah UMKM Baru"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} loading={creating}>Tambah UMKM</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-xl p-3">
            Ini akan membuat akun user baru (email + password) dan UMKM yang terhubung.
          </p>
          <Input label="Nama UMKM" required value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Nama Pemilik" value={formOwner} onChange={(e) => setFormOwner(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Login" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            <Input label="Password" type="password" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
          </div>
          <Input label="WhatsApp" placeholder="6281234567890" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} />
          <Textarea label="Deskripsi Singkat" rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Hapus UMKM "${deleteTarget?.name}"? Semua data terkait akan terpengaruh.`}
        loading={deleting}
      />
    </div>
  )
}
