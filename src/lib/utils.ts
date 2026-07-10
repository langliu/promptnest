import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  const errorData = {
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  }
  console.error(JSON.stringify(errorData))
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  const logData = {
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }
  console.warn(JSON.stringify(logData))
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  const logData = {
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }
  console.log(JSON.stringify(logData))
}
