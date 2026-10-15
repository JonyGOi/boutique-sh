import { LOGIN_LOCKOUT_MS, LOGIN_MAX_ATTEMPTS } from '../config/store'

const KEY = 'sh-boutique-login-guard'

type GuardState = { failures: number; lockedUntil: number }

function read(): GuardState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return { failures: 0, lockedUntil: 0 }
    const parsed = JSON.parse(raw) as GuardState
    return {
      failures: Number(parsed.failures) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    }
  } catch {
    return { failures: 0, lockedUntil: 0 }
  }
}

function write(state: GuardState) {
  sessionStorage.setItem(KEY, JSON.stringify(state))
}

export function loginLockRemainingMs(): number {
  const state = read()
  return Math.max(0, state.lockedUntil - Date.now())
}

export function registerLoginFailure(): number {
  const state = read()
  const failures = state.failures + 1
  const lockedUntil = failures >= LOGIN_MAX_ATTEMPTS ? Date.now() + LOGIN_LOCKOUT_MS : 0
  write({ failures, lockedUntil })
  return loginLockRemainingMs()
}

export function clearLoginFailures() {
  sessionStorage.removeItem(KEY)
}
