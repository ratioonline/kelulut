import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem } from '../types/database'
import toast from 'react-hot-toast'

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Computed (getters)
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, qty = 1) => {
        const { items } = get()
        const existing = items.find((i) => i.product.id === product.id)

        if (existing) {
          const newQty = Math.min(existing.quantity + qty, product.stock)
          if (existing.quantity >= product.stock) {
            toast.error('Stok tidak mencukupi')
            return
          }
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })
        } else {
          set({ items: [...items, { product, quantity: Math.min(qty, product.stock) }] })
        }

        toast.success(`${product.name} ditambahkan ke keranjang`, {
          icon: '🛒',
          duration: 2000,
        })
        set({ isOpen: true })
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) })
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity: Math.min(qty, i.product.stock) }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => {
          const price = i.product.discount_price ?? i.product.price ?? 0
          return sum + price * i.quantity
        }, 0),
    }),
    {
      name: 'kelulut-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
