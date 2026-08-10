import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Store, Eye, MapPin, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Umkm, Product } from '../../types/database'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function AdminUmkmDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [umkm, setUmkm] = useState<Umkm | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('umkms').select('*').eq('id', id).single(),
      supabase.from('products').select('*').eq('umkm_id', id).order('created_at', { ascending: false }),
    ]).then(([{ data: u }, { data: p }]) => {
      if (!u) { navigate('/admin/umkm-management'); return }
      setUmkm(u as Umkm)
      setProducts((p ?? []) as Product[])
      setLoading(false)
    })
  }, [id, navigate])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!umkm) return null

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    outOfStock: products.filter(p => p.stock === 0).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/umkm-management')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{umkm.name}</h1>
          <p className="text-sm text-gray-500">{umkm.owner_name ?? 'Pemilik tidak diset'}</p>
        </div>
        <Badge variant={umkm.status === 'active' ? 'green' : 'red'}>
          {umkm.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Produk', value: stats.total, color: 'bg-blue-500' },
          { label: 'Produk Aktif', value: stats.active, color: 'bg-green-500' },
          { label: 'Nonaktif', value: stats.inactive, color: 'bg-gray-500' },
          { label: 'Stok Habis', value: stats.outOfStock, color: 'bg-red-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Store size={16} className="text-[#2D6A4F]" /> Profil UMKM
            </h3>
            {umkm.logo && <img src={umkm.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />}
            {umkm.short_description && <p className="text-sm text-gray-600">{umkm.short_description}</p>}
            {umkm.city && (
              <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> {umkm.city}{umkm.province ? `, ${umkm.province}` : ''}</p>
            )}
            {umkm.whatsapp && (
              <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={14} /> {umkm.whatsapp}</p>
            )}
            <p className="text-xs text-gray-400">Dibuat: {formatDate(umkm.created_at)}</p>
            {umkm.slug && (
              <Link to={`/umkm/${umkm.slug}`} target="_blank" className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-1">
                <Eye size={12} /> Lihat halaman publik
              </Link>
            )}
          </CardBody>
        </Card>

        {/* Products */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <ShoppingBag size={16} className="text-[#2D6A4F]" /> Produk ({products.length})
              </h3>
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Belum ada produk.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category} · Stok: {p.stock}</p>
                      </div>
                      <span className="text-sm font-medium text-[#F5A623]">{formatCurrency(p.price ?? 0)}</span>
                      <Badge variant={p.status === 'active' ? 'green' : 'red'}>
                        {p.status === 'active' ? 'Aktif' : p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
