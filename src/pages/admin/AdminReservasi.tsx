import { useEffect, useState } from 'react'
import { Search, Filter, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Reservation } from '../../types/database'
import { formatDate } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['Semua', 'pending', 'confirmed', 'done', 'cancelled'] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

const STATUS_LABELS: Record<string, string> = {
  Semua: 'Semua',
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
}

export default function AdminReservasi() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filtered, setFiltered] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('Semua')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReservations(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let result = reservations
    if (status !== 'Semua') result = result.filter((r) => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q)
      )
    }
    setFiltered(result)
  }, [reservations, status, search])

  const updateStatus = async (id: string, newStatus: Reservation['status']) => {
    setUpdating(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('reservations').update({ status: newStatus } as any).eq('id', id)

    if (error) {
      toast.error('Gagal memperbarui status')
    } else {
      toast.success('Status berhasil diperbarui')
      await fetchData()
      setSelected((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev))
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservasi</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola semua pemesanan kunjungan.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-gray-400" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Tidak ada reservasi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Nama / Kontak', 'Tanggal Kunjungan', 'Pengunjung', 'Program', 'Status', 'Aksi'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {formatDate(r.visit_date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{r.num_visitors}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {r.program_id ? 'Ada' : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(r)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#2D6A4F] transition-colors"
                          aria-label="Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detail Reservasi"
        size="md"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Nama', selected.name],
                ['Email', selected.email],
                ['Telepon', selected.phone],
                ['Instansi', selected.institution ?? '-'],
                ['Tanggal Kunjungan', formatDate(selected.visit_date)],
                ['Jumlah Pengunjung', `${selected.num_visitors} orang`],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-900 font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Catatan</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Status Saat Ini</p>
              <StatusBadge status={selected.status} />
            </div>

            {selected.status !== 'done' && selected.status !== 'cancelled' && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">Ubah Status</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'confirmed', label: 'Konfirmasi', color: 'bg-blue-600' },
                      { value: 'done', label: 'Selesai', color: 'bg-green-600' },
                      { value: 'cancelled', label: 'Batalkan', color: 'bg-red-600' },
                    ] as const
                  )
                    .filter((opt) => opt.value !== selected.status)
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatus(selected.id, opt.value)}
                        disabled={updating}
                        className={`${opt.color} text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity`}
                      >
                        {updating ? '...' : opt.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
