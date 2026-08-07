import { Helmet } from 'react-helmet-async'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { Card, CardBody } from '../../components/ui/Card'

const contactInfo = [
  {
    icon: MapPin,
    label: 'Alamat',
    value: 'Jl. Kebun Kelulut No. 1, Sangatta Utara, Kutai Timur, Kalimantan Timur 75611',
    href: 'https://maps.google.com/?q=Sangatta+Kutai+Timur',
  },
  {
    icon: Phone,
    label: 'Telepon / WhatsApp',
    value: '+62 812-3456-7890',
    href: 'tel:+6281234567890',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@kebunkelulut.id',
    href: 'mailto:info@kebunkelulut.id',
  },
  {
    icon: Clock,
    label: 'Jam Operasional',
    value: 'Senin–Jumat 08.00–17.00 | Sabtu–Minggu 07.00–18.00',
    href: null,
  },
]

export default function KontakPage() {
  return (
    <>
      <Helmet>
        <title>Kontak - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Hubungi kami untuk informasi reservasi dan kunjungan ke Kebun Kelulut Sangatta."
        />
      </Helmet>

      <section className="pt-24 pb-16 bg-[#FAF3E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <h2 className="text-2xl font-bold text-[#1B4332] mb-6">Informasi Kontak</h2>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <Card key={label}>
                    <CardBody className="flex items-start gap-4 py-4">
                      <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-[#2D6A4F]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {label}
                        </p>
                        {href ? (
                          <a
                            href={href}
                            className="text-sm text-gray-800 hover:text-[#2D6A4F] transition-colors"
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-800">{value}</p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20Kebun%20Kelulut%20Sangatta."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <MessageCircle size={20} />
                Chat via WhatsApp
              </a>
            </div>

            {/* Map */}
            <div>
              <h2 className="text-2xl font-bold text-[#1B4332] mb-6">Lokasi Kami</h2>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
                <iframe
                  title="Peta Lokasi Kebun Kelulut Sangatta"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127762.84803456!2d117.4693!3d0.4814!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x320fa49b48a0b1e9%3A0x3f6f52d5e3a8c62a!2sSangatta%2C%20Kutai%20Timur!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="mt-3 text-xs text-gray-400 text-center">
                Klik peta untuk petunjuk arah lebih detail
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
