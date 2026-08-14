import { create } from 'zustand'
import { supabase, supabaseAdmin } from '../lib/supabase'
import type { Product, Umkm, StockMovement, AuditLog, ProductReview, ReviewReply, Category } from '../types/database'
import { slugify } from '../lib/utils'

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  draftProducts: number
  outOfStock: number
  lowStock: number
  totalCategories: number
}

interface UmkmState {
  umkm: Umkm | null
  products: Product[]
  categories: Category[]
  stats: DashboardStats
  stockMovements: StockMovement[]
  reviews: (ProductReview & { product_name?: string; reply?: ReviewReply | null })[]
  auditLogs: AuditLog[]
  loading: boolean

  // UMKM Profile
  fetchMyUmkm: (userId: string) => Promise<void>
  updateUmkmProfile: (id: string, data: Partial<Umkm>) => Promise<{ error: string | null }>

  // Products
  fetchProducts: (umkmId: string) => Promise<void>
  createProduct: (data: Partial<Product>, umkmId: string, userId: string) => Promise<{ error: string | null; product?: Product }>
  updateProduct: (id: string, data: Partial<Product>, userId: string, umkmId: string) => Promise<{ error: string | null }>
  deleteProduct: (id: string, userId: string, umkmId: string) => Promise<{ error: string | null }>
  toggleProductStatus: (id: string, status: string, userId: string, umkmId: string) => Promise<{ error: string | null }>

  // Stock
  updateStock: (productId: string, quantity: number, movementType: string, reason: string, userId: string, umkmId: string) => Promise<{ error: string | null }>
  fetchStockMovements: (umkmId: string) => Promise<void>

  // Categories
  fetchCategories: () => Promise<void>

  // Reviews
  fetchReviews: (umkmId: string) => Promise<void>
  replyToReview: (reviewId: string, reply: string, umkmId: string, userId: string) => Promise<{ error: string | null }>

  // Stats
  computeStats: () => void

  // Audit
  fetchAuditLogs: (umkmId: string) => Promise<void>
  logAudit: (userId: string, umkmId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => Promise<void>
}

export const useUmkmStore = create<UmkmState>()((set, get) => ({
  umkm: null,
  products: [],
  categories: [],
  stats: {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    draftProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalCategories: 0,
  },
  stockMovements: [],
  reviews: [],
  auditLogs: [],
  loading: false,

  fetchMyUmkm: async (userId: string) => {
    const { data } = await supabase
      .from('umkms')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) set({ umkm: data as Umkm })
  },

  updateUmkmProfile: async (id: string, data: Partial<Umkm>) => {
    const payload = { ...data, updated_at: new Date().toISOString() }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('umkms').update(payload as any).eq('id', id)
    if (error) return { error: error.message }
    // Refresh
    const { data: updated } = await supabase.from('umkms').select('*').eq('id', id).single()
    if (updated) set({ umkm: updated as Umkm })
    return { error: null }
  },

  fetchProducts: async (umkmId: string) => {
    set({ loading: true })
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('umkm_id', umkmId)
      .order('created_at', { ascending: false })
    if (data) {
      set({ products: data as Product[] })
      get().computeStats()
    }
    set({ loading: false })
  },

  createProduct: async (data: Partial<Product>, umkmId: string, userId: string) => {
    const slug = slugify(data.name || '')
    const payload = {
      ...data,
      umkm_id: umkmId,
      slug,
      is_available: data.status === 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product, error } = await supabase.from('products').insert(payload as any).select().single()
    if (error) return { error: error.message }

    await get().logAudit(userId, umkmId, 'create', 'product', (product as Product).id, { name: data.name })
    await get().fetchProducts(umkmId)
    return { error: null, product: product as Product }
  },

  updateProduct: async (id: string, data: Partial<Product>, userId: string, umkmId: string) => {
    const payload = {
      ...data,
      is_available: data.status === 'active',
      updated_at: new Date().toISOString(),
    }
    if (data.name && !data.slug) {
      payload.slug = slugify(data.name)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('products').update(payload as any).eq('id', id).eq('umkm_id', umkmId)
    if (error) return { error: error.message }

    await get().logAudit(userId, umkmId, 'update', 'product', id, { name: data.name })
    await get().fetchProducts(umkmId)
    return { error: null }
  },

  deleteProduct: async (id: string, userId: string, umkmId: string) => {
    const product = get().products.find(p => p.id === id)
    const db = supabaseAdmin || supabase
    
    // Check if there are transaction items
    const { count: txCount } = await supabase
      .from('transaction_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)

    if (txCount && txCount > 0) {
      // Archive instead of hard delete
      const { error: archiveErr } = await db
        .from('products')
        .update({ status: 'inactive', is_available: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('umkm_id', umkmId)
      if (archiveErr) return { error: archiveErr.message }
    } else {
      // Clean up child dependencies
      try {
        await db.from('stock_movements').delete().eq('product_id', id)
        await db.from('product_reviews').delete().eq('product_id', id)
      } catch (e) {
        console.warn('Child cleanup warning:', e)
      }
      
      const { error } = await db.from('products').delete().eq('id', id).eq('umkm_id', umkmId)
      if (error) {
        // Fallback to archive if still constrained
        await db
          .from('products')
          .update({ status: 'inactive', is_available: false, updated_at: new Date().toISOString() })
          .eq('id', id)
      }
    }

    await get().logAudit(userId, umkmId, 'delete', 'product', id, { name: product?.name })
    await get().fetchProducts(umkmId)
    return { error: null }
  },

  toggleProductStatus: async (id: string, status: string, userId: string, umkmId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ status, is_available: status === 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('umkm_id', umkmId)
    if (error) return { error: error.message }

    await get().logAudit(userId, umkmId, 'update_status', 'product', id, { status })
    await get().fetchProducts(umkmId)
    return { error: null }
  },

  updateStock: async (productId: string, quantity: number, movementType: string, reason: string, userId: string, umkmId: string) => {
    // Get current stock
    const product = get().products.find(p => p.id === productId)
    if (!product) return { error: 'Produk tidak ditemukan' }

    const previousStock = product.stock
    let newStock = previousStock
    if (movementType === 'add') newStock = previousStock + quantity
    else if (movementType === 'subtract') newStock = Math.max(0, previousStock - quantity)
    else if (movementType === 'set') newStock = quantity

    // Update product stock
    const { error: prodError } = await supabase
      .from('products')
      .update({
        stock: newStock,
        is_available: newStock > 0 && product.status === 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('umkm_id', umkmId)
    if (prodError) return { error: prodError.message }

    // Record stock movement
    await supabase.from('stock_movements').insert({
      product_id: productId,
      user_id: userId,
      previous_stock: previousStock,
      quantity,
      movement_type: movementType,
      new_stock: newStock,
      reason,
    })

    await get().logAudit(userId, umkmId, 'update_stock', 'product', productId, {
      name: product.name,
      previous_stock: previousStock,
      new_stock: newStock,
      movement_type: movementType,
    })
    await get().fetchProducts(umkmId)
    return { error: null }
  },

  fetchStockMovements: async (umkmId: string) => {
    // Get product IDs for this UMKM
    const products = get().products
    if (products.length === 0) return

    const productIds = products.map(p => p.id)
    const { data } = await supabase
      .from('stock_movements')
      .select('*')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) set({ stockMovements: data as StockMovement[] })
  },

  fetchCategories: async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('name')
    if (data) set({ categories: data as Category[] })
  },

  fetchReviews: async (umkmId: string) => {
    const products = get().products
    if (products.length === 0) return

    const productIds = products.map(p => p.id)
    const { data: reviewsData } = await supabase
      .from('product_reviews')
      .select('*')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    if (!reviewsData) return

    // Fetch replies
    const reviewIds = reviewsData.map(r => r.id)
    const { data: repliesData } = reviewIds.length > 0
      ? await supabase.from('review_replies').select('*').in('review_id', reviewIds)
      : { data: [] }

    const repliesMap = new Map((repliesData ?? []).map(r => [r.review_id, r as ReviewReply]))
    const productMap = new Map(products.map(p => [p.id, p.name]))

    const enriched = reviewsData.map(r => ({
      ...r,
      product_name: productMap.get(r.product_id) || 'Unknown',
      reply: repliesMap.get(r.id) || null,
    }))

    set({ reviews: enriched as typeof enriched })
  },

  replyToReview: async (reviewId: string, reply: string, umkmId: string, userId: string) => {
    const { error } = await supabase.from('review_replies').insert({
      review_id: reviewId,
      umkm_id: umkmId,
      user_id: userId,
      reply,
    })
    if (error) return { error: error.message }

    await get().logAudit(userId, umkmId, 'reply_review', 'review', reviewId, { reply })
    await get().fetchReviews(umkmId)
    return { error: null }
  },

  computeStats: () => {
    const products = get().products
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    set({
      stats: {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
        draftProducts: products.filter(p => p.status === 'draft').length,
        outOfStock: products.filter(p => p.stock === 0).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock ?? 5)).length,
        totalCategories: cats.size,
      },
    })
  },

  fetchAuditLogs: async (umkmId: string) => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('umkm_id', umkmId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) set({ auditLogs: data as AuditLog[] })
  },

  logAudit: async (userId: string, umkmId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) => {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      umkm_id: umkmId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ?? null,
    })
  },
}))
