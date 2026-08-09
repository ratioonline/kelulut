import { Helmet } from 'react-helmet-async'
import { MapPin, Phone, Mail, Clock, MessageCircle, Instagram } from 'lucide-react'
import { Card, CardBody } from '../../components/ui/Card'

const contactInfo = [
  {
    icon: MapPin,
    label: 'Alamat',
    value: 'JL. Pertamina, KM.04, RT.02, Sangatta Selatan',
    href: 'https://maps.app.goo.gl/TP2Z1tvJb4iJrxMQ7',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'kebunkelulutsangatta@gmail.com',
    href: 'mailto:kebunkelulutsangatta@gmail.com',
  },
  {
    icon: Clock,
    label: 'Jam Operasional',
    value: 'Senin–Jumat 08.00–17.00 | Sabtu–Minggu 07.00–18.00',
    href: null,
  },
]

const contactPersons = [
  { name: 'Sabil', phone: '082272611515', display: '0822-7261-1515' },
  { name: 'Triyono', phone: '081347245985', display: '0813-4724-5985' },
  { name: 'Fuad', phone: '081348500517', display: '0813-4850-0517' },
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

              {/* Contact Person - 3 individual cards */}
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Contact Person</p>
                {contactPersons.map(({ name, phone, display }) => (
                  <Card key={name}>
                    <CardBody className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center shrink-0">
                          <Phone size={16} className="text-[#2D6A4F]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{name}</p>
                          <p className="text-sm font-semibold text-gray-800">{display}</p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/62${phone.substring(1)}?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20Kebun%20Kelulut%20Sangatta.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      >
                        <MessageCircle size={13} />
                        WhatsApp
                      </a>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Instagram */}
              <Card className="mt-4">
                <CardBody className="flex items-start gap-4 py-4">
                  <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Instagram size={18} className="text-[#2D6A4F]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Instagram</p>
                    <a
                      href="https://www.instagram.com/kebunkelulut.sgt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-800 hover:text-[#2D6A4F] transition-colors"
                    >
                      @kebunkelulut.sgt
                    </a>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Map */}
            <div>
              <h2 className="text-2xl font-bold text-[#1B4332] mb-6">Lokasi Kami</h2>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
                <iframe
                  title="Peta Lokasi Kebun Kelulut Sangatta"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15956.702951717387!2d117.5186!3d0.4619!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x320fa49b48a0b1e9%3A0x3f6f52d5e3a8c62a!2sSangatta%2C%20Kutai%20Timur!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  width="100%"
                  height="340"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://maps.app.goo.gl/TP2Z1tvJb4iJrxMQ7"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-sm"
              >
                <MapPin size={18} />
                Buka di Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
