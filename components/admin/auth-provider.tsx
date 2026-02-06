'use client'

import React, { createContext, useContext, useEffect, useRef } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore, initActivityTracking, cleanupActivityTracking } from '@/lib/auth/store'
import { useUserStore } from '@/lib/user/store'
import { Spinner } from '@/components/ui/spinner'
import { User } from '@/lib/schemas/auth'
import { setUnauthorizedHandler } from '@/lib/http/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Use stores
  const { isAuthenticated, isLoading } = useAuthStore()
  const { setIsAuthenticated, setLoading, clearAuth } = useAuthStore(state => state.actions)
  const { user } = useUserStore()
  const { setUser } = useUserStore(state => state.actions)

  // Use ref to track initialization to prevent double execution
  const isInitializedRef = useRef(false)

  // Setup unauthorized handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth()
      setUser(null)
      router.push('/admin/login')
    })
  }, [clearAuth, setUser, router])

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (isInitializedRef.current) return

      // If already authenticated in store, don't block UI but still verify in background
      if (!isAuthenticated) {
        setLoading(true)
      }

      try {
        const user = await authApi.checkAuth()
        
        if (user) {
          setIsAuthenticated(true)
          setUser(user)
          initActivityTracking()

          // Redirect to dashboard if on public route (like login)
          if (PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
            router.push('/admin')
          }
        } else {
          // Only redirect if we were previously authenticated or are on a protected route
          // If we are already on login page, do nothing (checkAuth failed naturally)
          
          if (isAuthenticated) {
            setIsAuthenticated(false)
            setUser(null)
          }

          // Redirect to login if on protected route
          if (!PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
            router.push('/admin/login')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        
        if (isAuthenticated) {
          setIsAuthenticated(false)
          setUser(null)
        }
        
        if (!PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
          router.push('/admin/login')
        }
      } finally {
        setLoading(false)
        isInitializedRef.current = true
      }
    }

    initAuth()
    
    return () => {
      cleanupActivityTracking()
    }
  }, [pathname, router, setIsAuthenticated, setUser, setLoading]) // Dependencies

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      clearAuth()
      setUser(null)
      cleanupActivityTracking()
      router.push('/admin/login')
    }
  }

  // Show spinner while loading
  // This prevents the "flash" of protected content or redirect loop
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
