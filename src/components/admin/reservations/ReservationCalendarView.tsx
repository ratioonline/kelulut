import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Users, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import type { Reservation } from '../../../types/database'
import { extractDepartureTime } from './UpcomingVisitsSection'
import { getStatusBadge } from './ReservationTable'

interface ReservationCalendarViewProps {
  reservations: Reservation[]
  onQuickView: (reservation: Reservation) => void
}

export default function ReservationCalendarView({
  reservations,
  onQuickView,
}: ReservationCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Map reservations by date string YYYY-MM-DD
  const dateMap = useMemo(() => {
    const map: Record<string, Reservation[]> = {}
    reservations.forEach((r) => {
      if (r.status === 'cancelled') return
      const key = r.visit_date
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [reservations])

  // Calendar Days Computation
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayVisits = dateMap[selectedDateKey] || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Calendar Grid (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
        {/* Month Header Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-gray-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(new Date())
                setSelectedDate(new Date())
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              title="Bulan berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1 border-b border-gray-100">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayVisits = dateMap[dateKey] || []
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isTodayDate = isToday(day)
            const totalVisitors = dayVisits.reduce((sum, r) => sum + (r.num_visitors || 0), 0)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-[#2D6A4F] bg-emerald-50/50 ring-1 ring-[#2D6A4F]'
                    : isTodayDate
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isCurrentMonth
                    ? 'border-gray-100 hover:border-gray-300 bg-white'
                    : 'border-transparent text-gray-300 bg-gray-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isTodayDate
                        ? 'w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-[11px]'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayVisits.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </div>

                {dayVisits.length > 0 && (
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.2 rounded block truncate">
                      {dayVisits.length} sesi • {totalVisitors} org
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Agenda Drawer (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="pb-2.5 border-b border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Agenda Tanggal Terpilih
            </span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
            </h3>
          </div>

          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {selectedDayVisits.length > 0 ? (
              selectedDayVisits.map((r) => {
                const timeStr = extractDepartureTime(r)
                return (
                  <div
                    key={r.id}
                    onClick={() => onQuickView(r)}
                    className="p-2.5 rounded-xl border border-gray-200/70 hover:border-emerald-500/40 bg-gray-50/50 hover:bg-white transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-gray-700 flex items-center gap-1">
                        <Clock size={11} className="text-gray-400" />
                        {timeStr} WITA
                      </span>
                      {getStatusBadge(r.status)}
                    </div>

                    <p className="font-bold text-gray-900 text-xs truncate">
                      {r.institution || r.name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>PIC: {r.name}</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {r.num_visitors} orang
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                <Calendar size={28} className="mx-auto text-gray-300 mb-2" />
                <span>Tidak ada jadwal kunjungan pada tanggal ini.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
