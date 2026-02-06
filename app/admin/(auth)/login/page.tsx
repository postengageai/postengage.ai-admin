'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore, initActivityTracking } from '@/lib/auth/store'
import { useUserStore } from '@/lib/user/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Eye, EyeOff, Zap, Instagram, MessageSquare, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Stores
  const { setIsAuthenticated } = useAuthStore(state => state.actions)
  const { setUser } = useUserStore(state => state.actions)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.login({ email, password })
      
      if (response.success && response.data) {
        setIsAuthenticated(true)
        setUser(response.data.user)
        initActivityTracking()
        router.push('/admin')
      } else {
        setError('Login failed')
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card border-r border-border p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-semibold text-foreground tracking-tight">PostEngage</span>
              <span className="text-xl text-muted-foreground">.ai</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-semibold text-foreground tracking-tight leading-tight text-balance">
              Turn Instagram engagement into conversions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              AI-powered automation that responds to comments, manages DMs, and captures leads while you sleep.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Instagram className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Multi-Account Management</p>
                <p className="text-sm text-muted-foreground mt-0.5">Connect and manage all your Instagram accounts from one dashboard</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Smart DM Workflows</p>
                <p className="text-sm text-muted-foreground mt-0.5">Automate conversations that feel human and convert</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Lead Capture</p>
                <p className="text-sm text-muted-foreground mt-0.5">Turn every interaction into actionable lead data</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Trusted by 2,000+ creators and agencies worldwide
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-semibold text-foreground">PostEngage</span>
                <span className="text-lg text-muted-foreground">.ai</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="bg-card border-border">
            <form onSubmit={handleSubmit}>
              <CardContent className="pt-6 space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-secondary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-10 pr-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-secondary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
                
                <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Demo: <span className="font-medium text-foreground">admin@company.com</span> / any password
                  </p>
                </div>
              </CardFooter>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
