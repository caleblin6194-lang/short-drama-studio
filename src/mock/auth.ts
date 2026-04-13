import type { User } from '@/types'
import { delay } from './delays'

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'demo@example.com',
    name: '张创作',
    role: 'user',
    createdAt: '2025-11-15T08:00:00Z',
    lastLoginAt: '2026-04-12T09:30:00Z',
    isBanned: false,
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    name: '李管理',
    role: 'admin',
    createdAt: '2025-08-01T08:00:00Z',
    lastLoginAt: '2026-04-12T08:00:00Z',
    isBanned: false,
  },
]

const MOCK_PASSWORD = '123456'

export async function mockLogin(email: string, password: string): Promise<User | null> {
  await delay(800)
  if (password !== MOCK_PASSWORD) return null
  return MOCK_USERS.find(u => u.email === email) ?? null
}

export async function mockRegister(email: string, name: string): Promise<User> {
  await delay(1000)
  return {
    id: `user-${Date.now()}`,
    email,
    name,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isBanned: false,
  }
}
