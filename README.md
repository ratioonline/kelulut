# Kebun Kelulut Sangatta 🐝

Website wisata edukasi lebah kelulut di Sangatta, Kutai Timur, Kalimantan Timur.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Database & Auth**: Supabase
- **State**: Zustand
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan isi file `supabase/schema.sql`
3. Copy **Project URL** dan **Anon Key** dari Settings → API

### 3. Konfigurasi Environment
Rename `.env.example` menjadi `.env` lalu isi:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Buat akun admin
Di Supabase → **Authentication** → **Users** → **Add User**:
- Email: `admin@kebunkelulut.id`
- Password: (pilih password aman)

### 5. Jalankan development server
```bash
npm run dev
```

---

## Halaman

### Publik
| Route | Halaman |
|-------|---------|
| `/` | Beranda |
| `/program` | Program Wisata |
| `/produk` | Katalog Produk |
| `/artikel` | Blog/Artikel |
| `/artikel/:slug` | Detail Artikel |
| `/galeri` | Galeri Foto |
| `/kontak` | Kontak & Peta |
| `/reservasi` | Form Reservasi |

### Admin (protected)
| Route | Halaman |
|-------|---------|
| `/admin/login` | Login |
| `/admin/dashboard` | Dashboard |
| `/admin/reservasi` | Kelola Reservasi |
| `/admin/produk` | CRUD Produk |
| `/admin/artikel` | CRUD Artikel |
| `/admin/galeri` | CRUD Galeri |
| `/admin/program` | CRUD Program |

---

## Build Production
```bash
npm run build
```

## Struktur Folder
```
src/
├── components/
│   ├── admin/        # AdminLayout, ProtectedRoute
│   ├── layout/       # Navbar, Footer, Layout, WhatsAppButton
│   └── ui/           # Button, Card, Badge, Input, Modal, dll
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── admin/        # Login, Dashboard, CRUD pages
│   └── client/       # Semua halaman publik
├── stores/
│   └── authStore.ts
├── types/
│   └── database.ts
├── App.tsx
├── main.tsx
└── index.css
```
