// Team Challenge Sharing - Viral Mechanism
// Social sharing to increase user acquisition

import React, { useState } from 'react'
import { Share2, Copy, Check, Users, Trophy, Target } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface ChallengeStats {
  completedReconciliations: number
  streak: number
  accuracy: number
  teamSize: number
}

interface TeamChallengeShareProps {
  userId: string
  stats: ChallengeStats
}

/**
 * Team Challenge Share Component
 * 
 * Viral sharing mechanism:
 * - Share accomplishments on social media
 * - Invite team members
 * - Challenge others to beat score
 */
export const TeamChallengeShare: React.FC<TeamChallengeShareProps> = ({ userId, stats }) => {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const shareUrl = `${window.location.origin}/challenge?ref=${userId}`
  
  const shareText = `🔥 I just completed ${stats.completedReconciliations} reconciliations with ${stats.accuracy}% accuracy! Can you beat my ${stats.streak}-day streak? Join the challenge: ${shareUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Data Reconciliation Challenge',
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to copy
      handleCopy()
    }
    
    setSharing(false)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="text-xl font-bold text-gray-900">Share Your Achievement!</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-lg">
          <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.completedReconciliations}</div>
          <div className="text-sm text-gray-600">Reconciliations</div>
        </div>
        
        <div className="text-center p-4 bg-white rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats.accuracy}%</div>
          <div className="text-sm text-gray-600">Accuracy</div>
        </div>
        
        <div className="text-center p-4 bg-white rounded-lg">
          <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.teamSize}</div>
          <div className="text-sm text-gray-600">Team Members</div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="primary"
          onClick={handleShare}
          disabled={sharing}
          className="w-full"
        >
          <Share2 className="h-5 w-5 mr-2" />
          {sharing ? 'Sharing...' : 'Share Challenge'}
        </Button>

        <Button
          variant="outline"
          onClick={handleCopy}
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-sm text-gray-600 text-center">
          Invite your team and compete for the highest accuracy! 🏆
        </p>
      </div>
    </Card>
  )
}

export default TeamChallengeShare


