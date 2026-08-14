import { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import type { Reservation, Program } from '../../types/database'
import Button from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'
import { normalizeWhatsappNumber } from '../../components/admin/umkm/UmkmCardGrid'

// Modular Components
import ReservationTodayStrip, { type ReservationTodayMetrics } from '../../components/admin/reservations/ReservationTodayStrip'
import UpcomingVisitsSection, { extractDepartureTime } from '../../components/admin/reservations/UpcomingVisitsSection'
import ReservationToolbar, { type ReservationFilterState } from '../../components/admin/reservations/ReservationToolbar'
import ReservationTable, { inferVisitorType } from '../../components/admin/reservations/ReservationTable'
import ReservationCalendarView from '../../components/admin/reservations/ReservationCalendarView'
import ReservationFormModal, { type ReservationFormData } from '../../components/admin/reservations/ReservationFormModal'
import ReservationDetailModal from '../../components/admin/reservations/ReservationDetailModal'

export default function AdminReservasi() {
  // State: Data
  const [allReservations, setAllReservations] = useState<Reservation[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  // State: Filters
  const [filters, setFilters] = useState<ReservationFilterState>({
    search: '',
    datePreset: 'all',
    visitorType: 'all',
    status: 'all',
    groupSize: 'all',
    activeTab: 'upcoming',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // State: Modals
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Fetch all reservations & active programs
  const fetchReservationsData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: resData }, { data: progData }] = await Promise.all([
        supabase.from('reservations').select('*').order('visit_date', { ascending: true }),
        supabase.from('programs').select('*').eq('is_active', true).order('title', { ascending: true }),
      ])

      setAllReservations((resData || []) as Reservation[])
      setPrograms((progData || []) as Program[])
    } catch (err) {
      console.error('Error fetching reservations data:', err)
      toast.error('Gagal memuat data reservasi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservationsData()
  }, [fetchReservationsData])

  const todayStr = new Date().toISOString().split('T')[0]

  // Today Realtime Metrics
  const todayMetrics: ReservationTodayMetrics = useMemo(() => {
    const todayRes = allReservations.filter((r) => r.visit_date === todayStr && r.status !== 'cancelled')
    const todayVisitors = todayRes.reduce((sum, r) => sum + (r.num_visitors || 0), 0)

    // Sorted by departure time
    const sortedToday = [...todayRes].sort((a, b) =>
      extractDepartureTime(a).localeCompare(extractDepartureTime(b))
    )
    const nextVisit = sortedToday[0]

    const confirmed = allReservations.filter((r) => r.status === 'confirmed').length
    const pending = allReservations.filter((r) => r.status === 'pending').length

    return {
      todayVisitsCount: todayRes.length,
      todayVisitorsCount: todayVisitors,
      nextVisitTime: nextVisit ? extractDepartureTime(nextVisit) : null,
      nextVisitName: nextVisit ? nextVisit.institution || nextVisit.name : null,
      confirmedCount: confirmed,
      pendingCount: pending,
    }
  }, [allReservations, todayStr])

  // Nearest 5 Upcoming Visits (strictly visit_date >= today and not cancelled)
  const upcomingVisits = useMemo(() => {
    return allReservations
      .filter((r) => r.visit_date >= todayStr && r.status !== 'cancelled')
      .sort((a, b) => {
        if (a.visit_date !== b.visit_date) return a.visit_date.localeCompare(b.visit_date)
        return extractDepartureTime(a).localeCompare(extractDepartureTime(b))
      })
      .slice(0, 5)
  }, [allReservations, todayStr])

  // Filtered Reservations based on Active Tab & Filters
  const displayedReservations = useMemo(() => {
    return allReservations
      .filter((r) => {
        // Tab Filter: Upcoming (>= today) vs History (< today)
        if (filters.activeTab === 'upcoming') {
          if (r.visit_date < todayStr) return false
        } else if (filters.activeTab === 'history') {
          if (r.visit_date >= todayStr) return false
        }

        // Status Filter
        if (filters.status !== 'all' && r.status !== filters.status) return false

        // Visitor Type Filter
        if (filters.visitorType !== 'all') {
          const type = inferVisitorType(r)
          if (type !== filters.visitorType) return false
        }

        // Group Size Filter
        if (filters.groupSize === 'small' && (r.num_visitors > 10 || r.num_visitors < 1)) return false
        if (filters.groupSize === 'medium' && (r.num_visitors < 11 || r.num_visitors > 25)) return false
        if (filters.groupSize === 'large' && r.num_visitors <= 25) return false

        // Date Preset Filter
        if (filters.datePreset === 'today' && r.visit_date !== todayStr) return false
        if (filters.datePreset === 'tomorrow') {
          const tom = new Date()
          tom.setDate(tom.getDate() + 1)
          const tomStr = tom.toISOString().split('T')[0]
          if (r.visit_date !== tomStr) return false
        }

        // Search Filter
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase()
          const matchName = r.name?.toLowerCase().includes(q)
          const matchInst = r.institution?.toLowerCase().includes(q)
          const matchPhone = r.phone?.includes(q)
          const matchNotes = r.notes?.toLowerCase().includes(q)
          if (!matchName && !matchInst && !matchPhone && !matchNotes) return false
        }

        return true
      })
      .sort((a, b) => {
        // Upcoming: Nearest first (asc)
        // History: Latest first (desc)
        if (filters.activeTab === 'history') {
          if (b.visit_date !== a.visit_date) return b.visit_date.localeCompare(a.visit_date)
          return extractDepartureTime(b).localeCompare(extractDepartureTime(a))
        }
        if (a.visit_date !== b.visit_date) return a.visit_date.localeCompare(b.visit_date)
        return extractDepartureTime(a).localeCompare(extractDepartureTime(b))
      })
  }, [allReservations, filters, debouncedSearch, todayStr])

  // Handlers
  const handleFilterChange = (newFilters: Partial<ReservationFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      datePreset: 'all',
      visitorType: 'all',
      status: 'all',
      groupSize: 'all',
      activeTab: 'upcoming',
    })
  }

  // Create / Edit Form Submission
  const handleFormSubmit = async (data: ReservationFormData) => {
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        institution: data.institution || null,
        visit_date: data.visit_date,
        num_visitors: data.num_visitors,
        program_id: data.program_id || null,
        status: data.status,
        notes: `Jam: ${data.departure_time} WITA | Kategori: ${data.visitor_type}${
          data.address ? ` | Alamat: ${data.address}` : ''
        }${data.notes ? ` | Catatan: ${data.notes}` : ''}`,
        updated_at: new Date().toISOString(),
      }

      if (editingReservation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('reservations').update(payload as any).eq('id', editingReservation.id)
        if (error) throw error
        toast.success('Data reservasi berhasil diperbarui')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('reservations').insert(payload as any)
        if (error) throw error
        toast.success('Reservasi kunjungan berhasil ditambahkan')
      }

      setFormModalOpen(false)
      setEditingReservation(null)
      fetchReservationsData()
    } catch (err) {
      console.error('Error saving reservation:', err)
      toast.error('Gagal menyimpan reservasi')
    }
  }

  // Status Quick Update
  const handleUpdateStatus = async (
    reservation: Reservation,
    newStatus: Reservation['status']
  ) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reservation.id)
      if (error) throw error

      toast.success(`Status kunjungan ${reservation.name} diubah menjadi ${newStatus}`)
      if (detailReservation?.id === reservation.id) {
        setDetailReservation({ ...reservation, status: newStatus })
      }
      fetchReservationsData()
    } catch (err) {
      console.error('Error updating reservation status:', err)
      toast.error('Gagal mengubah status reservasi')
    }
  }

  // Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('reservations').delete().eq('id', deleteTarget.id)
      if (error) throw error

      toast.success(`Reservasi "${deleteTarget.name}" berhasil dihapus`)
      setDeleteTarget(null)
      fetchReservationsData()
    } catch (err) {
      console.error('Error deleting reservation:', err)
      toast.error('Gagal menghapus reservasi')
    } finally {
      setDeleting(false)
    }
  }

  // Export CSV Action
  const handleExportCsv = () => {
    if (displayedReservations.length === 0) {
      toast.error('Tidak ada data reservasi untuk diekspor')
      return
    }

    const headers = [
      'Tanggal Kunjungan',
      'Jam Keberangkatan',
      'Koordinator',
      'Nomor WhatsApp',
      'Instansi',
      'Jenis Pengunjung',
      'Jumlah Pengunjung',
      'Status',
      'Catatan',
    ]

    const rows = displayedReservations.map((r) => [
      `"${r.visit_date}"`,
      `"${extractDepartureTime(r)}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${(r.institution || '').replace(/"/g, '""')}"`,
      `"${inferVisitorType(r)}"`,
      r.num_visitors,
      `"${r.status}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reservasi_kebun_kelulut_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Data reservasi berhasil diekspor ke CSV')
  }

  return (
    <div className="space-y-4 pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
            Reservasi & Kunjungan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola jadwal kunjungan, data pengunjung, dan reservasi Kebun-Kelulut.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingReservation(null)
            setFormModalOpen(true)
          }}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] self-start sm:self-auto shadow-2xs"
          size="sm"
        >
          <Plus size={15} />
          <span>Tambah Reservasi</span>
        </Button>
      </div>

      {/* ── TODAY SUMMARY REALTIME STRIP ── */}
      <ReservationTodayStrip
        metrics={todayMetrics}
        loading={loading}
        onFilterPending={() => handleFilterChange({ status: 'pending', activeTab: 'upcoming' })}
      />

      {/* ── UPCOMING VISITS SECTION (TOP 5) ── */}
      {filters.activeTab === 'upcoming' && (
        <UpcomingVisitsSection
          reservations={upcomingVisits}
          loading={loading}
          onQuickView={(r) => setDetailReservation(r)}
        />
      )}

      {/* ── SEARCH & MULTI-FILTER TOOLBAR ── */}
      <ReservationToolbar
        filters={filters}
        onChangeFilters={handleFilterChange}
        onResetFilters={handleResetFilters}
        onExportCsv={handleExportCsv}
        totalCount={displayedReservations.length}
      />

      {/* ── MAIN CONTENT (TABLE / CALENDAR) ── */}
      {filters.activeTab === 'calendar' ? (
        <ReservationCalendarView
          reservations={allReservations}
          onQuickView={(r) => setDetailReservation(r)}
        />
      ) : (
        <ReservationTable
          reservations={displayedReservations}
          loading={loading}
          onQuickView={(r) => setDetailReservation(r)}
          onEdit={(r) => {
            setEditingReservation(r)
            setFormModalOpen(true)
          }}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(r) => setDeleteTarget(r)}
          onOpenCreate={() => {
            setEditingReservation(null)
            setFormModalOpen(true)
          }}
        />
      )}

      {/* ── MODALS ── */}

      {/* 1. Add / Edit Reservation Modal */}
      <ReservationFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingReservation(null)
        }}
        editingReservation={editingReservation}
        existingReservations={allReservations}
        programs={programs}
        onSubmit={handleFormSubmit}
      />

      {/* 2. Detail & Quick WhatsApp Modal */}
      <ReservationDetailModal
        reservation={detailReservation}
        open={Boolean(detailReservation)}
        onClose={() => setDetailReservation(null)}
        onEdit={(r) => {
          setEditingReservation(r)
          setFormModalOpen(true)
        }}
        onUpdateStatus={handleUpdateStatus}
        program={programs.find((p) => p.id === detailReservation?.program_id)}
      />

      {/* 3. Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Reservasi"
        message={`Hapus data reservasi "${deleteTarget?.name}" (${deleteTarget?.institution || ''})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  )
}
