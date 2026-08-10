import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile, Umkm } from '../types/database'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  userProfile: UserProfile | null
  myUmkm: Umkm | null
  role: 'super_admin' | 'umkm_user' | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  fetchUserProfile: () => Promise<void>
  fetchMyUmkm: () => Promise<void>
  isSuperAdmin: () => boolean
  isUmkmUser: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      initialized: false,
      userProfile: null,
      myUmkm: null,
      role: null,

      isSuperAdmin: () => get().role === 'super_admin',
      isUmkmUser: () => get().role === 'umkm_user',

      fetchUserProfile: async () => {
        const user = get().user
        if (!user) return

        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          set({
            userProfile: data as UserProfile,
            role: (data as UserProfile).role,
          })
        } else {
          // Auto-create profile for existing users (backward compat)
          // Existing admin users become super_admin
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({ id: user.id, role: 'super_admin', full_name: user.email?.split('@')[0] ?? '' })
            .select()
            .single()

          if (newProfile) {
            set({
              userProfile: newProfile as UserProfile,
              role: (newProfile as UserProfile).role,
            })
          }
        }
      },

      fetchMyUmkm: async () => {
        const user = get().user
        if (!user) return

        const { data } = await supabase
          .from('umkms')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          set({ myUmkm: data as Umkm })
        }
      },

      initialize: async () => {
        if (get().initialized) return
        set({ loading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          set({
            session,
            user: session?.user ?? null,
            initialized: true,
          })

          if (session?.user) {
            await get().fetchUserProfile()
            await get().fetchMyUmkm()
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({
              session,
              user: session?.user ?? null,
            })
            if (session?.user) {
              await get().fetchUserProfile()
              await get().fetchMyUmkm()
            } else {
              set({ userProfile: null, myUmkm: null, role: null })
            }
          })
        } finally {
          set({ loading: false })
        }
      },

      signIn: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) return { error: error.message }
          set({ user: data.user, session: data.session, initialized: true })
          await get().fetchUserProfile()
          await get().fetchMyUmkm()
          return { error: null }
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        set({ loading: true })
        try {
          await supabase.auth.signOut()
          set({ user: null, session: null, userProfile: null, myUmkm: null, role: null })
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'kelulut-auth',
      partialize: (state) => ({ user: state.user, session: state.session, role: state.role }),
    }
  )
)
