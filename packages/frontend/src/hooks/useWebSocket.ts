import { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketMessage } from '../types/backend-aligned'

interface WebSocketHook {
  isConnected: boolean
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export const useWebSocket = (url: string): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting')
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          console.log('WebSocket message received:', message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`)
          
          reconnectTimeout.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [url])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }))
        console.log('WebSocket message sent:', message)
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting')
      }
    }
  }, [connect])

  return {
    isConnected,
    sendMessage,
    lastMessage,
    connectionStatus
  }
}

// Real-time collaboration hook
export const useRealtimeCollaboration = (page: string) => {
  const { isConnected, sendMessage, lastMessage } = useWebSocket('ws://localhost:2000/collaboration')
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; page: string; lastSeen: string }>>([])
  const [liveComments, setLiveComments] = useState<Array<{ id: string; userId: string; userName: string; message: string; timestamp: string; page: string }>>([])

  // Send user presence updates
  const updatePresence = useCallback((userId: string, userName: string) => {
    sendMessage({
      type: 'presence_update',
      payload: {
        userId,
        userName,
        page,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })
  }, [sendMessage, page])

  // Send live comments
  const sendComment = useCallback((userId: string, userName: string, message: string) => {
    const comment = {
      id: `comment-${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
      page
    }
    
    sendMessage({
      type: 'live_comment',
      payload: comment,
      timestamp: new Date().toISOString()
    })
    
    setLiveComments(prev => [...prev, comment])
  }, [sendMessage, page])

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'presence_update':
          setActiveUsers(prev => {
            const existing = prev.find(u => u.id === lastMessage.payload.userId)
            if (existing) {
              return prev.map(u =>
                u.id === lastMessage.payload.userId
                  ? { ...u, lastSeen: lastMessage.payload.timestamp }
                  : u
              )
            } else {
              return [...prev, {
                id: lastMessage.payload.userId,
                name: lastMessage.payload.userName,
                page: lastMessage.payload.page,
                lastSeen: lastMessage.payload.timestamp
              }]
            }
          })
          break

        case 'live_comment':
          if (lastMessage.payload.page === page) {
            setLiveComments(prev => {
              const exists = prev.find(c => c.id === lastMessage.payload.id)
              if (!exists) {
                return [...prev, lastMessage.payload]
              }
              return prev
            })
          }
          break

        case 'user_left':
          setActiveUsers(prev => prev.filter(u => u.id !== lastMessage.payload.userId))
          break
      }
    }
  }, [lastMessage, page])

  // Send periodic presence updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        updatePresence('current-user', 'Current User')
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isConnected, updatePresence])

  return {
    isConnected,
    activeUsers: activeUsers.filter(u => u.page === page),
    liveComments: liveComments.filter(c => c.page === page),
    sendComment,
    updatePresence
  }
}

// Real-time data sync hook
export const useRealtimeDataSync = () => {
  const { isConnected, sendMessage, lastMessage } = useWebSocket('ws://localhost:2000/data-sync')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')

  const syncData = useCallback((fromPage: string, toPage: string, data: any) => {
    if (isConnected) {
      setSyncStatus('syncing')
      sendMessage({
        type: 'data_sync',
        payload: {
          fromPage,
          toPage,
          data,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      })
    }
  }, [isConnected, sendMessage])

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'data_sync_response':
          setSyncStatus('synced')
          setTimeout(() => setSyncStatus('idle'), 2000)
          break
          
        case 'data_sync_error':
          setSyncStatus('error')
          setTimeout(() => setSyncStatus('idle'), 5000)
          break
      }
    }
  }, [lastMessage])

  return {
    isConnected,
    syncStatus,
    syncData
  }
}
