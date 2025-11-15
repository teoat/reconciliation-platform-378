// Reconciliation Streak Protector (Loss Aversion Pattern)
import { logger } from '@/services/logger'
// Gamification with streak protection to reduce user drop-off

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../hooks/useToast'

interface StreakData {
  currentStreak: number
  longestStreak: number
  protectedStreaks: number
        lastReconciliationDate: string | null
  streakProtected: boolean
}

const STREAK_KEY = 'reconciliation_streak'
const PROTECTION_DAYS = 3

/**
 * Hook for managing reconciliation streaks with loss aversion
 * 
 * Features:
 * - Track daily reconciliation streaks
 * - Streak freeze protection (3-day grace period)
 * - Visual encouragement and warnings
 * - Loss aversion: "Don't break your streak!" messaging
 */
export function useReconciliationStreak(userId: string) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    protectedStreaks: 0,
    lastReconciliationDate: null,
    streakProtected: false
  })

  const { showToast } = useToast()

  // Load streak from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`${STREAK_KEY}_${userId}`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setStreak(data)
        
        // Check if streak should be extended or protected
        checkStreakStatus(data)
      } catch (error) {
        logger.error('Failed to load streak data:', error)
      }
    }
  }, [userId])

  /**
   * Check if streak can be extended or needs protection
   */
  const checkStreakStatus = (currentStreak: StreakData) => {
    const now = new Date()
    const lastDate = currentStreak.lastReconciliationDate ? new Date(currentStreak.lastReconciliationDate) : null

    if (!lastDate) return

    const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    // Streak still valid (within same day)
    if (daysSince === 0) {
      return
    }

    // Streak continues (next day)
    if (daysSince === 1) {
      // Continue streak silently
      return
    }

    // Streak at risk (2-4 days)
    if (daysSince >= 2 && daysSince <= PROTECTION_DAYS) {
      if (currentStreak.protectedStreaks < 2) {
        // Offer protection
        showToast({
          title: '🔥 Streak at Risk!',
          description: `Your ${currentStreak.currentStreak}-day streak will be lost soon. Use a Streak Freeze?`,
          variant: 'warning',
          action: {
            label: 'Protect Streak',
            onClick: () => protectStreak()
          }
        })
      }
    }

    // Streak lost (5+ days)
    if (daysSince > PROTECTION_DAYS && currentStreak.currentStreak > 0) {
      showToast({
        title: '💔 Streak Lost',
        description: `You had a ${currentStreak.currentStreak}-day streak! Start a new one today?`,
        variant: 'error'
      })
      
      resetStreak()
    }
  }

  /**
   * Update streak when reconciliation is completed
   */
  const updateStreakOnReconciliation = useCallback(() => {
    const now = new Date()
    
    setStreak(prev => {
      const lastDate = prev.lastReconciliationDate ? new Date(prev.lastReconciliationDate) : null
      const daysSince = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 999

      let newStreak = { ...prev }

      if (!lastDate || daysSince === 0) {
        // Same day - no change
        newStreak.lastReconciliationDate = now.toISOString()
      } else if (daysSince === 1) {
        // Continue streak
        newStreak.currentStreak += 1
        newStreak.longestStreak = Math.max(newStreak.longestStreak, newStreak.currentStreak)
        newStreak.lastReconciliationDate = now.toISOString()

        // Show encouragement
        showToast({
          title: `🔥 ${newStreak.currentStreak}-Day Streak!`,
          description: 'Keep it going! Your daily reconciliation helps maintain data integrity.',
          variant: 'success'
        })
      } else if (daysSince > 1 && prev.streakProtected) {
        // Streak protected, continue
        newStreak.currentStreak += 1
        newStreak.streakProtected = false
        newStreak.lastReconciliationDate = now.toISOString()
      } else if (daysSince > 1) {
        // Streak broken, start new
        newStreak.currentStreak = 1
        newStreak.lastReconciliationDate = now.toISOString()

        showToast({
          title: 'New Streak Started!',
          description: 'Complete another reconciliation tomorrow to maintain your streak!',
          variant: 'info'
        })
      }

      // Save to localStorage
      localStorage.setItem(`${STREAK_KEY}_${userId}`, JSON.stringify(newStreak))
      
      return newStreak
    })
  }, [userId, showToast])

  /**
   * Protect current streak from being lost
   */
  const protectStreak = useCallback(() => {
    setStreak(prev => {
      const newStreak = {
        ...prev,
        protectedStreaks: prev.protectedStreaks + 1,
        streakProtected: true
      }
      localStorage.setItem(`${STREAK_KEY}_${userId}`, JSON.stringify(newStreak))
      
      showToast({
        title: '🛡️ Streak Protected!',
        description: `Your ${prev.currentStreak}-day streak is now protected for ${PROTECTION_DAYS} more days.`,
        variant: 'success'
      })

      return newStreak
    })
  }, [userId, showToast])

  /**
   * Reset streak (after break)
   */
  const resetStreak = useCallback(() => {
    const reset = {
      currentStreak: 0,
      longestStreak: streak.longestStreak,
      protectedStreaks: streak.protectedStreaks,
      lastReconciliationDate: null,
      streakProtected: false
    }
    setStreak(reset)
    localStorage.setItem(`${STREAK_KEY}_${userId}`, JSON.stringify(reset))
  }, [userId, streak.longestStreak, streak.protectedStreaks])

  /**
   * Get streak status for display
   */
  const getStreakStatus = () => {
    if (streak.currentStreak === 0) {
      return {
        message: 'Start your streak today!',
        variant: 'info' as const,
        showWarning: false
      }
    }

    if (streak.streakProtected) {
      return {
        message: `🔥 ${streak.currentStreak}-day streak (Protected)`,
        variant: 'success' as const,
        showWarning: false
      }
    }

    if (streak.protectedStreaks >= 2) {
      return {
        message: `🔥 ${streak.currentStreak}-day streak!`,
        variant: 'success' as const,
        showWarning: false
      }
    }

    return {
      message: `🔥 ${streak.currentStreak}-day streak!`,
      variant: 'success' as const,
      showWarning: true
    }
  }

  return {
    streak,
    updateStreakOnReconciliation,
    protectStreak,
    resetStreak,
    getStreakStatus
  }
}

