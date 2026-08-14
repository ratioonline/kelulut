import { useState, useEffect } from 'react'
import { Banknote, QrCode, CreditCard, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

export type PaymentMethod = 'cash' | 'qris' | 'transfer'

interface PosPaymentModalProps {
  open: boolean
  onClose: () => void
  totalAmount: number
  customerName: string
  onProcessPayment: (method: PaymentMethod, cashGiven: number, change: number) => Promise<void>
  isSubmitting?: boolean
}

export default function PosPaymentModal({
  open,
  onClose,
  totalAmount,
  customerName,
  onProcessPayment,
  isSubmitting,
}: PosPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashGiven, setCashGiven] = useState<number>(totalAmount)

  useEffect(() => {
    if (open) {
      setPaymentMethod('cash')
      setCashGiven(totalAmount)
    }
  }, [open, totalAmount])

  const change = Math.max(0, cashGiven - totalAmount)
  const isCashInsufficient = paymentMethod === 'cash' && cashGiven < totalAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCashInsufficient || isSubmitting) return
    await onProcessPayment(paymentMethod, cashGiven, change)
  }

  // Quick Preset Cash Calculations
  const quickCashPresets = [
    { label: 'Uang Pas', value: totalAmount },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
    { label: 'Rp 500.000', value: 500000 },
  ].filter((p) => p.value >= totalAmount || p.label === 'Uang Pas')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pembayaran Kasir"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            form="payment-form-main"
            type="submit"
            loading={isSubmitting}
            disabled={isCashInsufficient}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] flex items-center gap-1.5"
          >
            <span>Proses Pembayaran</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      }
    >
      <form id="payment-form-main" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Total Tagihan Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800">
              Total Pembayaran
            </span>
            <p className="text-xl font-black text-emerald-900 font-mono mt-0.5">
              {formatCurrency(totalAmount)}
            </p>
            {customerName && (
              <p className="text-[11px] text-emerald-700 mt-0.5">Pembeli: {customerName}</p>
            )}
          </div>

          <div className="p-2.5 rounded-2xl bg-white text-emerald-700 shadow-xs border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Pilih Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', label: 'Tunai (Cash)', icon: Banknote },
              { id: 'qris', label: 'QRIS', icon: QrCode },
              { id: 'transfer', label: 'Transfer Bank', icon: CreditCard },
            ].map((m) => {
              const Icon = m.icon
              const isSelected = paymentMethod === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'border-[#2D6A4F] bg-emerald-50 text-emerald-900 font-bold ring-1 ring-[#2D6A4F]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-[#2D6A4F]' : 'text-gray-400'} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cash Calculation Section */}
        {paymentMethod === 'cash' && (
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3 animate-in fade-in duration-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Jumlah Uang Diterima (Rp) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={cashGiven}
                onChange={(e) => setCashGiven(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-black font-mono bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
              />
            </div>

            {/* Quick Cash Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400">Pilihan Cepat:</span>
              {quickCashPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setCashGiven(p.value)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                    cashGiven === p.value
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Change Result / Warning */}
            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
              <span className="font-bold text-gray-700 text-xs">Uang Kembalian:</span>
              <span
                className={`font-mono font-black text-sm ${
                  isCashInsufficient ? 'text-rose-600' : 'text-emerald-800'
                }`}
              >
                {isCashInsufficient ? 'Uang Kurang' : formatCurrency(change)}
              </span>
            </div>

            {isCashInsufficient && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Uang yang diterima kurang dari total tagihan.</span>
              </p>
            )}
          </div>
        )}

        {/* QRIS / Transfer Info */}
        {paymentMethod !== 'cash' && (
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 space-y-1 animate-in fade-in duration-100">
            <p className="font-bold text-xs">
              Pembayaran Non-Tunai ({paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank'})
            </p>
            <p className="text-[11px] text-blue-700">
              Pastikan dana dari pembeli telah berhasil masuk ke rekening/QRIS Kebun-Kelulut sebelum memproses transaksi.
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}
