import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export interface MediaItem {
  id: string
  fileName: string
  url: string
  fileSize: number // in bytes
  mimeType: string
  width?: number
  height?: number
  checksum: string
  folder: string // 'Produk' | 'Artikel' | 'Galeri' | 'Banner' | 'Program' | 'Testimoni' | 'Tim' | 'Partner' | 'Logo' | 'Slider' | 'Dokumen' | 'Lainnya'
  module: string
  createdAt: string
  altText?: string
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
  isScanning: boolean

  // Actions
  addMedia: (item: Omit<MediaItem, 'id' | 'createdAt'>) => MediaItem
  addMediaBatch: (items: Array<Omit<MediaItem, 'id' | 'createdAt'>>) => MediaItem[]
  deleteMedia: (id: string) => void
  deleteMediaBatch: (ids: string[]) => void
  renameMedia: (id: string, newFileName: string, newAltText?: string) => void
  moveMediaBatch: (ids: string[], targetFolder: string) => void
  createFolder: (name: string) => void
  deleteFolder: (folderId: string) => void
  setSelectedFolder: (folder: string) => void
  setSearchQuery: (query: string) => void
  setSelectedModule: (mod: string) => void
  setSortBy: (sort: MediaState['sortBy']) => void
  setViewMode: (mode: 'grid' | 'list') => void
  toggleSelectId: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  findByChecksum: (checksum: string) => MediaItem | undefined
  scanExistingAppImages: () => Promise<void>
}

export const useMediaStore = create<MediaState>()(
  persist(
    (set, get) => ({
      items: [],
      folders: DEFAULT_FOLDERS,
      selectedFolder: 'semua',
      searchQuery: '',
      selectedModule: 'semua',
      sortBy: 'newest',
      viewMode: 'grid',
      selectedIds: [],
      isScanning: false,

      addMedia: (itemData) => {
        const existing = get().findByChecksum(itemData.checksum)
        if (existing) return existing

        const newItem: MediaItem = {
          ...itemData,
          id: 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          items: [newItem, ...state.items],
        }))
        return newItem
      },

      addMediaBatch: (itemsData) => {
        const addedItems: MediaItem[] = []
        const currentItems = get().items

        const newItemsToPush: MediaItem[] = []
        itemsData.forEach((itemData) => {
          const existing = currentItems.find((i) => i.checksum === itemData.checksum)
          if (existing) {
            addedItems.push(existing)
          } else {
            const newItem: MediaItem = {
              ...itemData,
              id: 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              createdAt: new Date().toISOString(),
            }
            newItemsToPush.push(newItem)
            addedItems.push(newItem)
          }
        })

        if (newItemsToPush.length > 0) {
          set((state) => ({
            items: [...newItemsToPush, ...state.items],
          }))
        }

        return addedItems
      },

      deleteMedia: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        }))
      },

      deleteMediaBatch: (ids) => {
        const idSet = new Set(ids)
        set((state) => ({
          items: state.items.filter((i) => !idSet.has(i.id)),
          selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
        }))
      },

      renameMedia: (id, newFileName, newAltText) => {
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
      },

      moveMediaBatch: (ids, targetFolder) => {
        const idSet = new Set(ids)
        set((state) => ({
          items: state.items.map((item) =>
            idSet.has(item.id) ? { ...item, folder: targetFolder } : item
          ),
        }))
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

      deleteFolder: (folderId) => {
        const folder = get().folders.find((f) => f.id === folderId)
        if (!folder || folder.isDefault) return

        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          items: state.items.map((i) => (i.folder === folderId ? { ...i, folder: 'Lainnya' } : i)),
          selectedFolder: state.selectedFolder === folderId ? 'semua' : state.selectedFolder,
        }))
      },

      setSelectedFolder: (folder) => set({ selectedFolder: folder, selectedIds: [] }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedModule: (mod) => set({ selectedModule: mod }),
      setSortBy: (sort) => set({ sortBy: sort }),
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

      findByChecksum: (checksum) => {
        return get().items.find((i) => i.checksum === checksum)
      },

      scanExistingAppImages: async () => {
        if (get().isScanning) return
        set({ isScanning: true })

        try {
          const newScannedItems: MediaItem[] = []
          const existingUrls = new Set(get().items.map((i) => i.url))

          // 1. Scan products
          const { data: products } = await supabase.from('products').select('id, name, image_url, images')
          if (products) {
            products.forEach((p) => {
              const urls = [p.image_url, ...(p.images || [])].filter(Boolean) as string[]
              urls.forEach((url, idx) => {
                if (!existingUrls.has(url)) {
                  existingUrls.add(url)
                  newScannedItems.push({
                    id: 'scan_prod_' + p.id + '_' + idx,
                    fileName: `produk_${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx + 1}.webp`,
                    url,
                    fileSize: Math.round(url.length * 0.75) || 50000,
                    mimeType: url.startsWith('data:image/png') ? 'image/png' : 'image/webp',
                    checksum: 'chk_prod_' + p.id + '_' + idx,
                    folder: 'Produk',
                    module: 'Produk',
                    createdAt: new Date().toISOString(),
                    altText: p.name,
                  })
                }
              })
            })
          }

          // 2. Scan articles
          const { data: articles } = await supabase.from('articles').select('id, title, thumbnail_url')
          if (articles) {
            articles.forEach((a) => {
              if (a.thumbnail_url && !existingUrls.has(a.thumbnail_url)) {
                existingUrls.add(a.thumbnail_url)
                newScannedItems.push({
                  id: 'scan_art_' + a.id,
                  fileName: `artikel_${a.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.webp`,
                  url: a.thumbnail_url,
                  fileSize: Math.round(a.thumbnail_url.length * 0.75) || 60000,
                  mimeType: 'image/webp',
                  checksum: 'chk_art_' + a.id,
                  folder: 'Artikel',
                  module: 'Artikel',
                  createdAt: new Date().toISOString(),
                  altText: a.title,
                })
              }
            })
          }

          // 3. Scan gallery
          const { data: gallery } = await supabase.from('gallery').select('id, title, image_url')
          if (gallery) {
            gallery.forEach((g) => {
              if (g.image_url && !existingUrls.has(g.image_url)) {
                existingUrls.add(g.image_url)
                newScannedItems.push({
                  id: 'scan_gal_' + g.id,
                  fileName: `galeri_${(g.title || 'foto').toLowerCase().replace(/[^a-z0-9]/g, '_')}.webp`,
                  url: g.image_url,
                  fileSize: Math.round(g.image_url.length * 0.75) || 80000,
                  mimeType: 'image/webp',
                  checksum: 'chk_gal_' + g.id,
                  folder: 'Galeri',
                  module: 'Galeri',
                  createdAt: new Date().toISOString(),
                  altText: g.title || 'Foto Galeri',
                })
              }
            })
          }

          // 4. Scan hero_slides
          const { data: slides } = await supabase.from('hero_slides').select('id, title, image_url')
          if (slides) {
            slides.forEach((s) => {
              if (s.image_url && !existingUrls.has(s.image_url)) {
                existingUrls.add(s.image_url)
                newScannedItems.push({
                  id: 'scan_hero_' + s.id,
                  fileName: `banner_${s.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.webp`,
                  url: s.image_url,
                  fileSize: Math.round(s.image_url.length * 0.75) || 120000,
                  mimeType: 'image/webp',
                  checksum: 'chk_hero_' + s.id,
                  folder: 'Banner',
                  module: 'Hero Slider',
                  createdAt: new Date().toISOString(),
                  altText: s.title,
                })
              }
            })
          }

          if (newScannedItems.length > 0) {
            set((state) => ({
              items: [...newScannedItems, ...state.items],
            }))
          }
        } catch (err) {
          console.error('[mediaStore] Error scanning app images:', err)
        } finally {
          set({ isScanning: false })
        }
      },
    }),
    {
      name: 'kelulut_media_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        folders: state.folders,
        viewMode: state.viewMode,
      }),
    }
  )
)
