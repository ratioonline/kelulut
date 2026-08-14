import { Printer, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatCurrency } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

export interface ReceiptData {
  transactionNumber: string
  date: Date | string
  cashierName: string
  customerName?: string | null
  items: {
    name: string
    quantity: number
    price: number
    subtotal: number
  }[]
  totalAmount: number
  paymentMethod: string
  cashGiven?: number
  change?: number
}

interface PosReceiptModalProps {
  open: boolean
  onClose: () => void
  data: ReceiptData | null
}

export default function PosReceiptModal({
  open,
  onClose,
  data,
}: PosReceiptModalProps) {
  if (!data) return null

  const handlePrint = () => {
    window.print()
  }

  const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Struk Penjualan Kasir"
      size="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose}>
            Tutup
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Cetak Struk</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Thermal Receipt Box */}
        <div
          id="receipt-print-area"
          className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs text-gray-800 font-mono text-[11px] space-y-3"
        >
          {/* Receipt Brand Header */}
          <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-300">
            <h2 className="font-black text-sm text-gray-900 tracking-wider">
              KEBUN KELULUT SANGATTA
            </h2>
            <p className="text-[10px] text-gray-500">Wisata Edukasi Madu Trigona</p>
            <p className="text-[9px] text-gray-400">Sangatta, Kutai Timur, Kaltim</p>
          </div>

          {/* Metadata */}
          <div className="space-y-0.5 text-[10px] text-gray-600 pb-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span>No. Trx:</span>
              <span className="font-bold text-gray-900">{data.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{format(dateObj, 'd MMM yyyy, HH:mm', { locale: idLocale })}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{data.cashierName}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span>Pembeli:</span>
                <span>{data.customerName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-gray-300">
            {data.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-gray-900">
                  <span className="truncate max-w-[180px]">{item.name}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between">
                  <span>
                    {item.quantity} x {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="space-y-1 text-xs pt-1 pb-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between font-black text-sm text-gray-900">
              <span>TOTAL:</span>
              <span>{formatCurrency(data.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-[11px]">
              <span>Metode:</span>
              <span className="capitalize font-semibold">{data.paymentMethod}</span>
            </div>
            {data.paymentMethod === 'cash' && data.cashGiven !== undefined && (
              <>
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>Tunai:</span>
                  <span>{formatCurrency(data.cashGiven)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                  <span>Kembali:</span>
                  <span>{formatCurrency(data.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-1 text-[10px] text-gray-500 space-y-0.5">
            <p className="font-semibold">Terima Kasih Atas Kunjungan Anda!</p>
            <p className="text-[9px] text-gray-400">www.kebunkelulut.my.id</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
