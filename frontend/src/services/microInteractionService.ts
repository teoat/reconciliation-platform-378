// Micro-Interactions & Delightful Feedback Service
import { logger } from '@/services/logger'
// Implements success animations, haptic feedback, and sound effects

export interface MicroInteraction {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'hover' | 'click' | 'focus'
  trigger: 'button_click' | 'form_submit' | 'data_save' | 'navigation' | 'hover' | 'focus' | 'custom'
  animation: AnimationConfig
  haptic?: HapticConfig
  sound?: SoundConfig
  duration: number
  delay?: number
  conditions?: InteractionCondition[]
}

export interface AnimationConfig {
  type: 'bounce' | 'fade' | 'slide' | 'scale' | 'rotate' | 'pulse' | 'shake' | 'glow' | 'custom'
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out'
  intensity: 'subtle' | 'moderate' | 'strong'
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'bounce' | 'elastic'
  duration: number
  delay?: number
  iterations?: number
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none'
}

export interface HapticConfig {
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'
  intensity: number // 0-1
  duration: number
  pattern?: number[] // Vibration pattern for custom haptics
}

export interface SoundConfig {
  type: 'success' | 'error' | 'warning' | 'info' | 'click' | 'hover' | 'notification' | 'custom'
  volume: number // 0-1
  pitch?: number
  duration?: number
  file?: string // Custom sound file
}

export interface InteractionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value: any
}

export interface InteractionContext {
  component: string
  action: string
  data?: any
  userRole?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  preferences?: UserPreferences
}

export interface UserPreferences {
  enableAnimations: boolean
  enableHaptics: boolean
  enableSounds: boolean
  animationIntensity: 'subtle' | 'moderate' | 'strong'
  hapticIntensity: number
  soundVolume: number
  reducedMotion: boolean
}

class MicroInteractionService {
  private static instance: MicroInteractionService
  private interactions: Map<string, MicroInteraction> = new Map()
  private activeAnimations: Map<string, AnimationConfig> = new Map()
  private audioContext: AudioContext | null = null
  private userPreferences: UserPreferences
  private listeners: Map<string, Function[]> = new Map()

  public   static getInstance(): MicroInteractionService {
    if (!MicroInteractionService.instance) {
      MicroInteractionService.instance = new MicroInteractionService()
    }
    return MicroInteractionService.instance
  }

  constructor() {
    this.userPreferences = {
      enableAnimations: true,
      enableHaptics: true,
      enableSounds: true,
      animationIntensity: 'moderate',
      hapticIntensity: 0.7,
      soundVolume: 0.5,
      reducedMotion: false
    }

    this.initializeDefaultInteractions()
    this.loadUserPreferences()
    this.initializeAudioContext()
  }

  private initializeDefaultInteractions(): void {
    // Success interactions
    this.createInteraction({
      id: 'success_button_click',
      type: 'success',
      trigger: 'button_click',
      animation: {
        type: 'scale',
        intensity: 'moderate',
        easing: 'ease-out',
        duration: 300,
        iterations: 1,
        fillMode: 'forwards'
      },
      haptic: {
        type: 'success',
        intensity: 0.8,
        duration: 100
      },
      sound: {
        type: 'success',
        volume: 0.6,
        pitch: 1.2
      },
      duration: 300
    })

    // Error interactions
    this.createInteraction({
      id: 'error_form_submit',
      type: 'error',
      trigger: 'form_submit',
      animation: {
        type: 'shake',
        intensity: 'moderate',
        easing: 'ease-in-out',
        duration: 500,
        iterations: 2,
        fillMode: 'forwards'
      },
      haptic: {
        type: 'error',
        intensity: 0.9,
        duration: 200
      },
      sound: {
        type: 'error',
        volume: 0.7,
        pitch: 0.8
      },
      duration: 500
    })

    // Loading interactions
    this.createInteraction({
      id: 'loading_data_save',
      type: 'loading',
      trigger: 'data_save',
      animation: {
        type: 'pulse',
        intensity: 'subtle',
        easing: 'ease-in-out',
        duration: 1000,
        iterations: Infinity,
        fillMode: 'both'
      },
      duration: 1000
    })

    // Hover interactions
    this.createInteraction({
      id: 'hover_button',
      type: 'hover',
      trigger: 'hover',
      animation: {
        type: 'scale',
        intensity: 'subtle',
        easing: 'ease-out',
        duration: 200,
        iterations: 1,
        fillMode: 'forwards'
      },
      sound: {
        type: 'hover',
        volume: 0.3,
        pitch: 1.1
      },
      duration: 200
    })

    // Focus interactions
    this.createInteraction({
      id: 'focus_input',
      type: 'focus',
      trigger: 'focus',
      animation: {
        type: 'glow',
        intensity: 'subtle',
        easing: 'ease-out',
        duration: 300,
        iterations: 1,
        fillMode: 'forwards'
      },
      duration: 300
    })
  }

  private loadUserPreferences(): void {
    try {
      const stored = localStorage.getItem('micro_interaction_preferences')
      if (stored) {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(stored) }
      }
    } catch (error) {
      logger.error('Failed to load user preferences:', error)
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('micro_interaction_preferences', JSON.stringify(this.userPreferences))
    } catch (error) {
      logger.error('Failed to save user preferences:', error)
    }
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      logger.warn('Audio context not supported:', error)
    }
  }

  public createInteraction(interaction: MicroInteraction): MicroInteraction {
    this.interactions.set(interaction.id, interaction)
    this.emit('interactionCreated', interaction)
    return interaction
  }

  public triggerInteraction(
    interactionId: string,
    element: HTMLElement,
    context: Partial<InteractionContext> = {}
  ): boolean {
    const interaction = this.interactions.get(interactionId)
    if (!interaction) return false

    // Check conditions
    if (interaction.conditions && !this.checkConditions(interaction.conditions, context)) {
      return false
    }

    // Check user preferences
    if (!this.shouldTriggerInteraction(interaction, context)) {
      return false
    }

    // Apply delay if specified
    if (interaction.delay) {
      setTimeout(() => {
        this.executeInteraction(interaction, element, context)
      }, interaction.delay)
    } else {
      this.executeInteraction(interaction, element, context)
    }

    return true
  }

  private shouldTriggerInteraction(interaction: MicroInteraction, context: Partial<InteractionContext>): boolean {
    // Check reduced motion preference
    if (this.userPreferences.reducedMotion && interaction.animation) {
      return false
    }

    // Check animation preferences
    if (interaction.animation && !this.userPreferences.enableAnimations) {
      return false
    }

    // Check haptic preferences
    if (interaction.haptic && !this.userPreferences.enableHaptics) {
      return false
    }

    // Check sound preferences
    if (interaction.sound && !this.userPreferences.enableSounds) {
      return false
    }

    return true
  }

  private executeInteraction(
    interaction: MicroInteraction,
    element: HTMLElement,
    context: Partial<InteractionContext>
  ): void {
    // Execute animation
    if (interaction.animation) {
      this.executeAnimation(interaction.animation, element)
    }

    // Execute haptic feedback
    if (interaction.haptic) {
      this.executeHaptic(interaction.haptic)
    }

    // Execute sound
    if (interaction.sound) {
      this.executeSound(interaction.sound)
    }

    this.emit('interactionTriggered', { interaction, element, context })
  }

  private executeAnimation(config: AnimationConfig, element: HTMLElement): void {
    const animationId = `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create keyframes based on animation type
    const keyframes = this.generateKeyframes(config)
    
    // Apply animation
    const animation = element.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      iterations: config.iterations || 1,
      fill: config.fillMode || 'forwards',
      delay: config.delay || 0
    })

    this.activeAnimations.set(animationId, config)

    animation.addEventListener('finish', () => {
      this.activeAnimations.delete(animationId)
    })

    animation.addEventListener('cancel', () => {
      this.activeAnimations.delete(animationId)
    })
  }

  private generateKeyframes(config: AnimationConfig): Keyframe[] {
    const intensity = this.getIntensityMultiplier(config.intensity)
    
    switch (config.type) {
      case 'bounce':
        return [
          { transform: 'translateY(0px)', offset: 0 },
          { transform: `translateY(-${10 * intensity}px)`, offset: 0.5 },
          { transform: 'translateY(0px)', offset: 1 }
        ]
      
      case 'scale':
        return [
          { transform: 'scale(1)', offset: 0 },
          { transform: `scale(${1 + 0.1 * intensity})`, offset: 0.5 },
          { transform: 'scale(1)', offset: 1 }
        ]
      
      case 'fade':
        return [
          { opacity: 1, offset: 0 },
          { opacity: 0.5, offset: 0.5 },
          { opacity: 1, offset: 1 }
        ]
      
      case 'slide':
        const direction = config.direction || 'right'
        const translateX = direction === 'left' ? -20 * intensity : 20 * intensity
        const translateY = direction === 'up' ? -20 * intensity : 20 * intensity
        
        return [
          { transform: 'translate(0px, 0px)', offset: 0 },
          { transform: `translate(${translateX}px, ${translateY}px)`, offset: 0.5 },
          { transform: 'translate(0px, 0px)', offset: 1 }
        ]
      
      case 'rotate':
        return [
          { transform: 'rotate(0deg)', offset: 0 },
          { transform: `rotate(${10 * intensity}deg)`, offset: 0.5 },
          { transform: 'rotate(0deg)', offset: 1 }
        ]
      
      case 'pulse':
        return [
          { transform: 'scale(1)', offset: 0 },
          { transform: `scale(${1 + 0.05 * intensity})`, offset: 0.5 },
          { transform: 'scale(1)', offset: 1 }
        ]
      
      case 'shake':
        return [
          { transform: 'translateX(0px)', offset: 0 },
          { transform: `translateX(-${5 * intensity}px)`, offset: 0.1 },
          { transform: `translateX(${5 * intensity}px)`, offset: 0.2 },
          { transform: `translateX(-${5 * intensity}px)`, offset: 0.3 },
          { transform: `translateX(${5 * intensity}px)`, offset: 0.4 },
          { transform: 'translateX(0px)', offset: 0.5 },
          { transform: `translateX(-${3 * intensity}px)`, offset: 0.6 },
          { transform: `translateX(${3 * intensity}px)`, offset: 0.7 },
          { transform: `translateX(-${3 * intensity}px)`, offset: 0.8 },
          { transform: `translateX(${3 * intensity}px)`, offset: 0.9 },
          { transform: 'translateX(0px)', offset: 1 }
        ]
      
      case 'glow':
        return [
          { boxShadow: '0 0 0px rgba(59, 130, 246, 0)', offset: 0 },
          { boxShadow: `0 0 ${10 * intensity}px rgba(59, 130, 246, 0.5)`, offset: 0.5 },
          { boxShadow: '0 0 0px rgba(59, 130, 246, 0)', offset: 1 }
        ]
      
      default:
        return [
          { transform: 'scale(1)', offset: 0 },
          { transform: 'scale(1)', offset: 1 }
        ]
    }
  }

  private getIntensityMultiplier(intensity: string): number {
    switch (intensity) {
      case 'subtle': return 0.5
      case 'moderate': return 1.0
      case 'strong': return 1.5
      default: return 1.0
    }
  }

  private executeHaptic(config: HapticConfig): void {
    if (!navigator.vibrate) return

    let pattern: number | number[]

    switch (config.type) {
      case 'light':
        pattern = 50
        break
      case 'medium':
        pattern = 100
        break
      case 'heavy':
        pattern = 200
        break
      case 'success':
        pattern = [100, 50, 100]
        break
      case 'warning':
        pattern = [200, 100, 200]
        break
      case 'error':
        pattern = [300, 100, 300, 100, 300]
        break
      case 'selection':
        pattern = 25
        break
      default:
        pattern = config.pattern || 100
    }

    // Apply intensity
    if (Array.isArray(pattern)) {
      pattern = pattern.map(duration => Math.round(duration * config.intensity))
    } else {
      pattern = Math.round(pattern * config.intensity)
    }

    navigator.vibrate(pattern)
  }

  private executeSound(config: SoundConfig): void {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Set frequency based on sound type
    let frequency = 440 // Default A4
    switch (config.type) {
      case 'success':
        frequency = 523.25 // C5
        break
      case 'error':
        frequency = 349.23 // F4
        break
      case 'warning':
        frequency = 392.00 // G4
        break
      case 'info':
        frequency = 440.00 // A4
        break
      case 'click':
        frequency = 800
        break
      case 'hover':
        frequency = 600
        break
      case 'notification':
        frequency = 659.25 // E5
        break
    }

    // Apply pitch
    if (config.pitch) {
      frequency *= config.pitch
    }

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = 'sine'

    // Set volume
    const volume = config.volume * this.userPreferences.soundVolume
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)

    // Set duration
    const duration = config.duration || 0.1
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  private checkConditions(conditions: InteractionCondition[], context: Partial<InteractionContext>): boolean {
    return conditions.every(condition => {
      const value = this.getValueFromContext(condition.field, context)
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'not_equals':
          return value !== condition.value
        case 'greater_than':
          return value > condition.value
        case 'less_than':
          return value < condition.value
        case 'contains':
          return value && value.includes && value.includes(condition.value)
        case 'exists':
          return value !== undefined && value !== null
        default:
          return true
      }
    })
  }

  private getValueFromContext(field: string, context: Partial<InteractionContext>): any {
    const fieldParts = field.split('.')
    let value = context as any
    
    for (const part of fieldParts) {
      value = value?.[part]
    }
    
    return value
  }

  // Predefined interaction triggers
  public triggerSuccess(element: HTMLElement, context?: InteractionContext): void {
    this.triggerInteraction('success_button_click', element, context)
  }

  public triggerError(element: HTMLElement, context?: InteractionContext): void {
    this.triggerInteraction('error_form_submit', element, context)
  }

  public triggerLoading(element: HTMLElement, context?: InteractionContext): void {
    this.triggerInteraction('loading_data_save', element, context)
  }

  public triggerHover(element: HTMLElement, context?: InteractionContext): void {
    this.triggerInteraction('hover_button', element, context)
  }

  public triggerFocus(element: HTMLElement, context?: InteractionContext): void {
    this.triggerInteraction('focus_input', element, context)
  }

  // User preferences management
  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences }
    this.saveUserPreferences()
    this.emit('preferencesUpdated', this.userPreferences)
  }

  public getPreferences(): UserPreferences {
    return { ...this.userPreferences }
  }

  // Animation control
  public stopAllAnimations(): void {
    this.activeAnimations.clear()
    // Stop all running animations
    document.getAnimations().forEach(animation => {
      animation.cancel()
    })
  }

  public pauseAllAnimations(): void {
    document.getAnimations().forEach(animation => {
      animation.pause()
    })
  }

  public resumeAllAnimations(): void {
    document.getAnimations().forEach(animation => {
      animation.play()
    })
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  public destroy(): void {
    this.interactions.clear()
    this.activeAnimations.clear()
    this.listeners.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// React hook for micro-interactions
export const useMicroInteractions = () => {
  const service = MicroInteractionService.getInstance()

  const triggerInteraction = (interactionId: string, element: HTMLElement, context?: InteractionContext) => {
    return service.triggerInteraction(interactionId, element, context)
  }

  const triggerSuccess = (element: HTMLElement, context?: InteractionContext) => {
    service.triggerSuccess(element, context)
  }

  const triggerError = (element: HTMLElement, context?: InteractionContext) => {
    service.triggerError(element, context)
  }

  const triggerLoading = (element: HTMLElement, context?: InteractionContext) => {
    service.triggerLoading(element, context)
  }

  const triggerHover = (element: HTMLElement, context?: InteractionContext) => {
    service.triggerHover(element, context)
  }

  const triggerFocus = (element: HTMLElement, context?: InteractionContext) => {
    service.triggerFocus(element, context)
  }

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    service.updatePreferences(preferences)
  }

  const getPreferences = () => {
    return service.getPreferences()
  }

  const stopAllAnimations = () => {
    service.stopAllAnimations()
  }

  return {
    triggerInteraction,
    triggerSuccess,
    triggerError,
    triggerLoading,
    triggerHover,
    triggerFocus,
    updatePreferences,
    getPreferences,
    stopAllAnimations
  }
}

// Export singleton instance
export const microInteractionService = MicroInteractionService.getInstance()
