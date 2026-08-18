import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface MediaItem {
  id: string
  fileName: string
  url: string
  fileSize: number // in bytes
  mimeType: string
  width?: number
  height?: number
  checksum: string
  folder: string
  module: string
  createdAt: string
  altText?: string
  umkm_id?: string
}

export interface FolderItem {
  id: string
  name: string
  isDefault?: boolean
}

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'semua', name: 'Semua Media', isDefault: true },
  { id: 'Produk', name: 'Produk', isDefault: true },
  { id: 'Artikel', name: 'Artikel', isDefault: true },
  { id: 'Galeri', name: 'Galeri', isDefault: true },
  { id: 'Banner', name: 'Banner', isDefault: true },
  { id: 'Program', name: 'Program', isDefault: true },
  { id: 'Testimoni', name: 'Testimoni', isDefault: true },
  { id: 'Tim', name: 'Tim', isDefault: true },
  { id: 'Partner', name: 'Partner', isDefault: true },
  { id: 'Logo', name: 'Logo', isDefault: true },
  { id: 'Slider', name: 'Slider', isDefault: true },
  { id: 'Dokumen', name: 'Dokumen', isDefault: true },
  { id: 'Lainnya', name: 'Lainnya', isDefault: true },
]

interface MediaState {
  items: MediaItem[]
  folders: FolderItem[]
  selectedFolder: string
  searchQuery: string
  selectedModule: string
  sortBy: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'
  viewMode: 'grid' | 'list'
  selectedIds: string[]
  isLoading: boolean
  hasMore: boolean
  page: number
  umkmId: string | null // when set, filter media by umkm_id (for umkm_user)

  // Actions
  fetchMedia: (reset?: boolean) => Promise<void>
  setUmkmId: (id: string | null) => void
  addOptimisticMedia: (item: MediaItem) => void
  deleteMediaBatch: (ids: string[]) => Promise<void>
  renameMedia: (id: string, newFileName: string, newAltText?: string) => Promise<void>
  createFolder: (name: string) => void
  setSelectedFolder: (folder: string) => void
  setSearchQuery: (query: string) => void
  setSelectedModule: (mod: string) => void
  setSortBy: (sort: MediaState['sortBy']) => void
  setViewMode: (mode: 'grid' | 'list') => void
  toggleSelectId: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  scanExistingAppImages: () => Promise<void>
}

const ITEMS_PER_PAGE = 24

export const useMediaStore = create<MediaState>()((set, get) => ({
  items: [],
  folders: DEFAULT_FOLDERS,
  selectedFolder: 'semua',
  searchQuery: '',
  selectedModule: 'semua',
  sortBy: 'newest',
  viewMode: 'grid',
  selectedIds: [],
  isLoading: false,
  hasMore: true,
  page: 0,
  umkmId: null,

  setUmkmId: (id) => set({ umkmId: id }),

  fetchMedia: async (reset = false) => {
    const { selectedFolder, searchQuery, selectedModule, sortBy, page, items, isLoading, hasMore, umkmId } = get()
    
    if (isLoading) return
    if (!reset && !hasMore) return

    set({ isLoading: true })
    const currentPage = reset ? 0 : page

    try {
      let query = supabase.from('media_assets').select('*', { count: 'exact' })

      // If umkmId is set (umkm_user), only show that UMKM's media
      if (umkmId) {
        query = query.eq('umkm_id', umkmId)
      }

      if (selectedFolder !== 'semua') query = query.eq('folder', selectedFolder)
      if (selectedModule !== 'semua') query = query.eq('module', selectedModule)
      if (searchQuery.trim()) query = query.ilike('file_name', `%${searchQuery.trim()}%`)

      // Sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'name-asc':
          query = query.order('file_name', { ascending: true })
          break
        case 'name-desc':
          query = query.order('file_name', { ascending: false })
          break
        case 'size-desc':
          query = query.order('file_size', { ascending: false })
          break
        case 'size-asc':
          query = query.order('file_size', { ascending: true })
          break
        default: // newest
          query = query.order('created_at', { ascending: false })
      }

      // Pagination
      const start = currentPage * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1
      query = query.range(start, end)

      const { data, count, error } = await query

      if (error) throw error

      if (data) {
        const mappedData: MediaItem[] = data.map((d) => ({
          id: d.id,
          fileName: d.file_name,
          fileSize: d.file_size,
          url: d.url,
          mimeType: d.mime_type,
          checksum: d.checksum || '',
          folder: d.folder,
          module: d.module,
          createdAt: d.created_at,
          altText: d.alt_text || '',
          umkm_id: d.umkm_id,
        }))

        set({
          items: reset ? mappedData : [...items, ...mappedData],
          hasMore: count ? (start + mappedData.length) < count : false,
          page: currentPage + 1,
        })
      }
    } catch (err) {
      console.error('Error fetching media:', err)
      toast.error('Gagal mengambil data media')
    } finally {
      set({ isLoading: false })
    }
  },

  addOptimisticMedia: (item) => {
    set((state) => ({ items: [item, ...state.items] }))
  },

  deleteMediaBatch: async (ids) => {
    try {
      const { items } = get()
      const toDelete = items.filter(i => ids.includes(i.id))
      
      // 1. Delete from Supabase Storage
      const filePaths = toDelete.map(i => {
        // Parse the URL to get the bucket path
        const urlObj = new URL(i.url)
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/media/')
        if (pathParts.length > 1) {
          return pathParts[1]
        }
        return null
      }).filter(Boolean) as string[]

      if (filePaths.length > 0) {
        await supabase.storage.from('media').remove(filePaths)
      }

      // 2. Delete from Database
      const { error } = await supabase.from('media_assets').delete().in('id', ids)
      if (error) throw error

      set((state) => ({
        items: state.items.filter((i) => !ids.includes(i.id)),
        selectedIds: [],
      }))
      toast.success(`${ids.length} media berhasil dihapus`)
    } catch (err) {
      console.error('Error deleting media:', err)
      toast.error('Gagal menghapus media')
    }
  },

  renameMedia: async (id, newFileName, newAltText) => {
    try {
      const { error } = await supabase
        .from('media_assets')
        .update({ file_name: newFileName, alt_text: newAltText })
        .eq('id', id)
      
      if (error) throw error

      set((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                fileName: newFileName,
                altText: newAltText !== undefined ? newAltText : item.altText,
              }
            : item
        ),
      }))
    } catch (err) {
      console.error('Error renaming media:', err)
      toast.error('Gagal mengubah nama media')
    }
  },

  createFolder: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = get().folders.find((f) => f.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return

    const newFolder: FolderItem = {
      id: trimmed,
      name: trimmed,
      isDefault: false,
    }

    set((state) => ({
      folders: [...state.folders, newFolder],
    }))
  },

  setSelectedFolder: (folder) => {
    set({ selectedFolder: folder, selectedIds: [] })
    get().fetchMedia(true)
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
  
  setSelectedModule: (mod) => {
    set({ selectedModule: mod })
    get().fetchMedia(true)
  },
  
  setSortBy: (sort) => {
    set({ sortBy: sort })
    get().fetchMedia(true)
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSelectId: (id) => {
    set((state) => {
      const exists = state.selectedIds.includes(id)
      return {
        selectedIds: exists
          ? state.selectedIds.filter((i) => i !== id)
          : [...state.selectedIds, id],
      }
    })
  },

  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  scanExistingAppImages: async () => {
    // Fungsi ini dinonaktifkan secara permanen karena menyebabkan MEMORY LEAK yang fatal.
    // Jika perlu memasukkan data existing, jalankan skrip migrasi SQL di server, bukan di browser.
    console.warn('[Performance] scanExistingAppImages dinonaktifkan untuk mencegah Memory Leak.')
  },
}))
