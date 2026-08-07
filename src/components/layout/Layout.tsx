import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from '../ui/CartDrawer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF3E0]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  )
}
