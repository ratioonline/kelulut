import { Link } from 'react-router-dom'
import { Leaf, MapPin, Phone, Mail, Instagram, Facebook, Youtube } from 'lucide-react'

const quickLinks = [
  { to: '/program', label: 'Program Wisata' },
  { to: '/produk', label: 'Produk Madu' },
  { to: '/artikel', label: 'Artikel Edukasi' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/kontak', label: 'Kontak' },
  { to: '/reservasi', label: 'Reservasi' },
]

export default function Footer() {
  return (
    <footer className="bg-[#1B4332] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/logo.png"
                alt="Trigona Reborn Logo"
                className="w-10 h-10 object-contain rounded-full ring-1 ring-[#F5A623]/40 shadow-sm"
              />
              <div className="leading-tight">
                <p className="text-base font-bold">Kebun Kelulut</p>
                <p className="text-xs text-[#F5A623]">Sangatta</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Wisata edukasi lebah kelulut (stingless bee) di Kutai Timur, Kalimantan Timur. Belajar
              dan nikmati keajaiban alam bersama kami.
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-5">
              {[
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Youtube, href: '#', label: 'Youtube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-white/10 hover:bg-[#F5A623] rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623] mb-4">
              Tautan Cepat
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-flex transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623] mb-4">
              Kontak
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <MapPin size={16} className="text-[#F5A623] mt-0.5 shrink-0" />
                <a
                  href="https://maps.app.goo.gl/TP2Z1tvJb4iJrxMQ7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Jl. PERTAMINA KM.4, Sangatta Selatan - Kutai Timur, Kalimantan Timur
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-300">
                <Phone size={16} className="text-[#F5A623] mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {[
                    { name: 'Sabil', phone: '082272611515', display: '0822-7261-1515' },
                    { name: 'Triyono', phone: '081347245985', display: '0813-4724-5985' },
                    { name: 'Fuad', phone: '081348500517', display: '0813-4850-0517' },
                  ].map(({ name, phone, display }) => (
                    <a
                      key={name}
                      href={`https://wa.me/62${phone.substring(1)}?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20Kebun%20Kelulut%20Sangatta.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-white transition-colors"
                    >
                      {display} <span className="text-gray-500">({name})</span>
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Mail size={16} className="text-[#F5A623] shrink-0" />
                <a
                  href="mailto:kebunkelulutsangatta@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  kebunkelulutsangatta@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623] mb-4">
              Jam Buka
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <span>Senin – Jumat</span>
                <span>08.00 – 17.00</span>
              </li>
              <li className="flex justify-between">
                <span>Sabtu – Minggu</span>
                <span>07.00 – 18.00</span>
              </li>
              <li className="flex justify-between text-red-300">
                <span>Hari Besar</span>
                <span>Tutup</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="text-center sm:text-left space-y-1">
            <p>© {new Date().getFullYear()} Kebun-Kelulut · All Rights Reserved</p>
            <p className="text-[11px] text-gray-400">Designed &amp; Developed by Rahmad Safi'i</p>
          </div>
          <Link to="/admin" className="hover:text-white transition-colors">
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  )
}
