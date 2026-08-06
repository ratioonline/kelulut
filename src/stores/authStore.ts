import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      initialized: false,

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

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              session,
              user: session?.user ?? null,
            })
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
          set({ user: data.user, session: data.session })
          return { error: null }
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        set({ loading: true })
        try {
          await supabase.auth.signOut()
          set({ user: null, session: null })
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'kelulut-auth',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
)
