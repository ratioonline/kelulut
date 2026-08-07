import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Clock, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Program } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import { Card, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const benefits = [
  'Pemandu berpengalaman dan informatif',
  'Peralatan keselamatan disediakan',
  'Cocok untuk semua usia',
  'Sesi foto dokumentasi',
  'Tersedia paket grup & sekolah',
  'Area parkir luas & gratis',
]

export default function ProgramPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setPrograms(data)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Helmet>
        <title>Program Wisata - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Pilih paket wisata edukasi lebah kelulut yang sesuai untuk keluarga, sekolah, dan rombongan Anda."
        />
      </Helmet>

      {/* Programs */}
      <section className="pt-24 pb-16 bg-[#FAF3E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Program belum tersedia saat ini.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {programs.map((program, idx) => (
                <Card key={program.id} className="overflow-hidden flex flex-col">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={
                        program.image_url ||
                        `https://images.unsplash.com/photo-${idx % 2 === 0 ? '1558618666-fcd25c85cd64' : '1587049352846-4a222e784d38'}?w=700`
                      }
                      alt={program.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-[#F5A623] text-white text-sm font-bold px-3 py-1 rounded-full">
                      {program.price ? formatCurrency(program.price) : 'Gratis'}
                    </div>
                  </div>
                  <CardBody className="flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-[#1B4332] mb-2">{program.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed flex-1">
                      {program.description}
                    </p>
                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock size={15} className="text-[#2D6A4F]" />
                        {program.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={15} className="text-[#2D6A4F]" />
                        Min. 5 orang
                      </span>
                    </div>
                    <Button as={Link} to="/reservasi" className="mt-5 w-full" variant="primary">
                      Pesan Sekarang
                      <ArrowRight size={16} />
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Mengapa Kami"
            title="Yang Anda Dapatkan"
            subtitle="Setiap kunjungan ke Kebun Kelulut Sangatta dirancang untuk memberikan pengalaman terbaik."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 bg-[#FAF3E0] rounded-xl px-4 py-3"
              >
                <CheckCircle size={18} className="text-[#2D6A4F] shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2D6A4F] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-3">Tertarik? Reservasi Sekarang!</h2>
          <p className="text-gray-200 mb-8">
            Hubungi kami atau langsung isi form reservasi untuk memesan kunjungan Anda.
          </p>
          <Button as={Link} to="/reservasi" size="lg" variant="secondary">
            Form Reservasi <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </>
  )
}
