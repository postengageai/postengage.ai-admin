import { User, Role } from './types'
import { useUserStore } from '@/lib/user/store'

// Role hierarchy for permission checking
const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  SUPPORT: 1,
}

// Role-based permissions
const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'users.view',
    'users.edit',
    'users.suspend',
    'payments.view',
    'payments.refund',
    'orders.view',
    'orders.process',
    'orders.cancel',
    'credits.view',
    'credits.adjust',
    'automations.view',
    'automations.edit',
    'blog.view',
    'blog.edit',
    'blog.publish',
    'system.view',
    'system.logs',
    'settings.view',
    'settings.edit',
  ],
  EDITOR: [
    'users.view',
    'orders.view',
    'credits.view',
    'blog.view',
    'blog.edit',
    'blog.publish',
  ],
  SUPPORT: [
    'users.view',
    'orders.view',
    'orders.process',
    'credits.view',
    'credits.adjust',
  ],
}

// Check if user has required role or higher
export function hasRole(requiredRole: Role, user?: User | null): boolean {
  const storeUser = useUserStore.getState().user
  // Cast to any to handle type mismatch between schema User and type User
  const currentUser = user || (storeUser as any)
  
  if (!currentUser || !currentUser.role) return false
  
  const userRole = (currentUser.role as string).toUpperCase() as Role
  // Safety check for invalid/undefined roles
  if (roleHierarchy[userRole] === undefined) return false
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Check if user has specific permission
export function hasPermission(permission: string, user?: User | null): boolean {
  const storeUser = useUserStore.getState().user
  const currentUser = user || (storeUser as any)
  
  if (!currentUser || !currentUser.role) return false
  
  const userRole = (currentUser.role as string).toUpperCase() as Role
  const permissions = rolePermissions[userRole]
  
  if (!permissions) return false
  
  return permissions.includes(permission) || permissions.includes('*')
}

// Get all permissions for current user
export function getUserPermissions(user?: User | null): string[] {
  const storeUser = useUserStore.getState().user
  const currentUser = user || (storeUser as any)
  
  if (!currentUser || !currentUser.role) return []
  
  const userRole = (currentUser.role as string).toUpperCase() as Role
  const permissions = rolePermissions[userRole]
  
  return permissions || []
}
