import { useEffect, useState } from 'react'
import { Star, MessageCircle, Send } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StarRating from '../../components/ui/StarRating'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function UmkmReviews() {
  const { user, myUmkm } = useAuthStore()
  const { reviews, loading, fetchProducts, fetchReviews, replyToReview } = useUmkmStore()
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState<string | null>(null)
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)

  useEffect(() => {
    if (myUmkm?.id) {
      fetchProducts(myUmkm.id).then(() => fetchReviews(myUmkm.id))
    }
  }, [myUmkm?.id, fetchProducts, fetchReviews])

  const handleReply = async (reviewId: string) => {
    if (!user || !myUmkm) return
    const text = replyText[reviewId]?.trim()
    if (!text) { toast.error('Tanggapan tidak boleh kosong'); return }

    setReplying(reviewId)
    const { error } = await replyToReview(reviewId, text, myUmkm.id, user.id)
    if (error) toast.error('Gagal mengirim tanggapan')
    else {
      toast.success('Tanggapan berhasil dikirim')
      setReplyText(prev => ({ ...prev, [reviewId]: '' }))
      setOpenReplyId(null)
    }
    setReplying(null)
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ulasan Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola ulasan dan tanggapan produk UMKM Anda.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-sm text-gray-500">Total Ulasan</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0'}
            </p>
            <p className="text-sm text-gray-500">Rata-rata Rating</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.reply).length}</p>
            <p className="text-sm text-gray-500">Sudah Ditanggapi</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{reviews.filter(r => !r.reply).length}</p>
            <p className="text-sm text-gray-500">Belum Ditanggapi</p>
          </CardBody>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Star size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">Belum ada ulasan</p>
              <p className="text-sm text-gray-400 mt-1">Ulasan dari pelanggan akan muncul di sini.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#2D6A4F] text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {review.buyer_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{review.buyer_name}</span>
                      <StarRating value={review.rating} showValue={false} size={12} />
                      <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Produk: <span className="font-medium text-gray-700">{review.product_name}</span>
                    </p>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    )}

                    {/* Reply */}
                    {review.reply ? (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                          <MessageCircle size={12} /> Tanggapan UMKM
                        </p>
                        <p className="text-sm text-green-800">{review.reply.reply}</p>
                        <p className="text-xs text-green-500 mt-1">{formatDate(review.reply.created_at)}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        {openReplyId === review.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={replyText[review.id] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                              placeholder="Tulis tanggapan Anda..."
                              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                              onKeyDown={(e) => e.key === 'Enter' && handleReply(review.id)}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleReply(review.id)}
                              loading={replying === review.id}
                            >
                              <Send size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setOpenReplyId(null)}>Batal</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setOpenReplyId(review.id)}
                            className="text-xs font-medium text-[#2D6A4F] hover:underline flex items-center gap-1"
                          >
                            <MessageCircle size={12} /> Tanggapi
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant={review.reply ? 'green' : 'yellow'}>
                    {review.reply ? 'Ditanggapi' : 'Belum'}
                  </Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
