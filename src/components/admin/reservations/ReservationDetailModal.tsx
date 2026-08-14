import {
  CalendarCheck,
  Clock,
  User,
  Users,
  Building,
  Phone,
  MessageCircle,
  Pencil,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  XCircle,
  Printer,
  Sparkles,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Reservation, Program } from '../../../types/database'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { normalizeWhatsappNumber } from '../umkm/UmkmCardGrid'
import { extractDepartureTime, getRelativeDateBadge } from './UpcomingVisitsSection'
import { inferVisitorType, getStatusBadge } from './ReservationTable'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  open: boolean
  onClose: () => void
  onEdit: (reservation: Reservation) => void
  onUpdateStatus: (reservation: Reservation, newStatus: Reservation['status']) => Promise<void>
  program?: Program | null
}

export default function ReservationDetailModal({
  reservation,
  open,
  onClose,
  onEdit,
  onUpdateStatus,
  program,
}: ReservationDetailModalProps) {
  if (!reservation) return null

  const badge = getRelativeDateBadge(reservation.visit_date)
  const timeStr = extractDepartureTime(reservation)
  const visitorType = inferVisitorType(reservation)
  const waNum = normalizeWhatsappNumber(reservation.phone)

  // Generate personalized WhatsApp greeting message
  const waMessage = encodeURIComponent(
    `Halo Bapak/Ibu ${reservation.name}, kami dari Kebun Kelulut Sangatta ingin mengonfirmasi jadwal kunjungan rombongan ${
      reservation.institution || ''
    } pada tanggal ${format(parseISO(reservation.visit_date), 'd MMMM yyyy', {
      locale: idLocale,
    })} pukul ${timeStr} WITA (${reservation.num_visitors} orang). Apakah ada informasi tambahan yang ingin disampaikan?`
  )
  const waLink = waNum ? `https://wa.me/${waNum}?text=${waMessage}` : null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Reservasi Kunjungan"
      size="md"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-gray-700 hover:bg-gray-100"
            >
              <Printer size={13} />
              <span>Cetak Jadwal</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                onClose()
                onEdit(reservation)
              }}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              <Pencil size={13} />
              <span>Edit Reservasi</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Header Hero Banner */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="font-mono text-gray-700 font-bold flex items-center gap-1 text-xs">
                <Clock size={12} className="text-gray-400" />
                {timeStr} WITA
              </span>
            </div>
            {getStatusBadge(reservation.status)}
          </div>

          <div>
            <h2 className="text-base font-black text-gray-900">
              {reservation.institution || reservation.name}
            </h2>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Tanggal:{' '}
              <strong className="text-gray-800">
                {format(parseISO(reservation.visit_date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
              </strong>
            </p>
          </div>
        </div>

        {/* Quick Status Workflow Action Buttons */}
        <div className="p-2.5 rounded-xl border border-gray-200/70 bg-white flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-gray-700 text-[11px]">Ubah Status Reservasi:</span>
          <div className="flex items-center gap-1">
            {reservation.status !== 'confirmed' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(reservation, 'confirmed')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
              >
                ✓ Konfirmasi
              </button>
            )}
            {reservation.status !== 'done' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(reservation, 'done')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                ✓ Selesai
              </button>
            )}
            {reservation.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(reservation, 'cancelled')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
              >
                ✕ Batalkan
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Koordinator Card */}
          <div className="p-3 rounded-xl border border-gray-200/70 bg-white space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Koordinator / PIC
            </span>
            <div>
              <p className="font-bold text-gray-900 text-sm">{reservation.name}</p>
              <p className="text-gray-500 font-mono text-xs mt-0.5">{reservation.phone}</p>
            </div>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs w-full justify-center"
              >
                <MessageCircle size={13} />
                <span>Kirim Pesan WhatsApp</span>
              </a>
            )}
          </div>

          {/* Rombongan & Program Card */}
          <div className="p-3 rounded-xl border border-gray-200/70 bg-white space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Detail Rombongan
            </span>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Jumlah Pengunjung:</span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                {reservation.num_visitors} Orang
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Kategori / Jenis:</span>
              <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.2 rounded">
                {visitorType}
              </span>
            </div>
            {program && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-gray-500">Paket Edukasi:</span>
                <span className="font-bold text-[#2D6A4F]">{program.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Feedback */}
        {reservation.notes && (
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
            <span className="font-bold text-gray-900 text-xs block">
              Kritik, Saran & Permintaan Khusus:
            </span>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reservation.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
