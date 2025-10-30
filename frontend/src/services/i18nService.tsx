// Internationalization Service
// Implements comprehensive i18n support with multiple languages, RTL support, and localization

import React from 'react'
import { APP_CONFIG } from '../config/AppConfig'

// Internationalization configuration
interface I18nConfig {
  defaultLanguage: string
  supportedLanguages: string[]
  fallbackLanguage: string
  enableRTL: boolean
  enablePluralization: boolean
  enableDateLocalization: boolean
  enableNumberLocalization: boolean
  enableCurrencyLocalization: boolean
  namespaceSeparator: string
  keySeparator: string
}

// Translation interface
interface Translation {
  [key: string]: string | Translation
}

// Language resource
interface LanguageResource {
  language: string
  namespace: string
  translations: Translation
  lastUpdated: Date
  version: string
}

// Pluralization rules
interface PluralRule {
  language: string
  rule: (n: number) => number
}

// Locale information
interface LocaleInfo {
  language: string
  region?: string
  script?: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  timeFormat: string
  numberFormat: Intl.NumberFormatOptions
  currencyFormat: Intl.NumberFormatOptions
  pluralRule: (n: number) => number
}

class I18nService {
  private static instance: I18nService
  private config: I18nConfig
  private currentLanguage: string
  private resources: Map<string, LanguageResource> = new Map()
  private listeners: Map<string, Function[]> = new Map()
  private pluralRules: Map<string, PluralRule> = new Map()

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  constructor() {
    this.config = {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'he'],
      fallbackLanguage: 'en',
      enableRTL: true,
      enablePluralization: true,
      enableDateLocalization: true,
      enableNumberLocalization: true,
      enableCurrencyLocalization: true,
      namespaceSeparator: ':',
      keySeparator: '.',
    }

    this.currentLanguage = this.config.defaultLanguage
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Load user's preferred language
      await this.loadUserLanguage()
      
      // Initialize pluralization rules
      this.initializePluralRules()
      
      // Load default translations
      await this.loadTranslations(this.currentLanguage)
      
      // Setup language change detection
      this.setupLanguageDetection()
      
    } catch (error) {
      console.error('Failed to initialize I18n Service:', error)
    }
  }

  private async loadUserLanguage(): Promise<void> {
    try {
      // Try to get language from localStorage
      const savedLanguage = localStorage.getItem('preferred_language')
      if (savedLanguage && this.config.supportedLanguages.includes(savedLanguage)) {
        this.currentLanguage = savedLanguage
        return
      }

      // Try to detect browser language
      const browserLanguage = navigator.language.split('-')[0]
      if (this.config.supportedLanguages.includes(browserLanguage)) {
        this.currentLanguage = browserLanguage
        return
      }

      // Fall back to default language
      this.currentLanguage = this.config.defaultLanguage
    } catch (error) {
      console.error('Failed to load user language:', error)
      this.currentLanguage = this.config.defaultLanguage
    }
  }

  private initializePluralRules(): void {
    // English pluralization rule
    this.pluralRules.set('en', {
      language: 'en',
      rule: (n: number) => n === 1 ? 0 : 1
    })

    // Spanish pluralization rule
    this.pluralRules.set('es', {
      language: 'es',
      rule: (n: number) => n === 1 ? 0 : 1
    })

    // French pluralization rule
    this.pluralRules.set('fr', {
      language: 'fr',
      rule: (n: number) => n <= 1 ? 0 : 1
    })

    // German pluralization rule
    this.pluralRules.set('de', {
      language: 'de',
      rule: (n: number) => n === 1 ? 0 : 1
    })

    // Russian pluralization rule
    this.pluralRules.set('ru', {
      language: 'ru',
      rule: (n: number) => {
        if (n % 10 === 1 && n % 100 !== 11) return 0
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 1
        return 2
      }
    })

    // Arabic pluralization rule
    this.pluralRules.set('ar', {
      language: 'ar',
      rule: (n: number) => {
        if (n === 0) return 0
        if (n === 1) return 1
        if (n === 2) return 2
        if (n % 100 >= 3 && n % 100 <= 10) return 3
        if (n % 100 >= 11) return 4
        return 5
      }
    })
  }

  private setupLanguageDetection(): void {
    // Listen for language changes
    window.addEventListener('languagechange', () => {
      this.detectLanguageChange()
    })
  }

  private async detectLanguageChange(): Promise<void> {
    const newLanguage = navigator.language.split('-')[0]
    if (this.config.supportedLanguages.includes(newLanguage) && newLanguage !== this.currentLanguage) {
      await this.changeLanguage(newLanguage)
    }
  }

  // Public methods
  public async changeLanguage(language: string): Promise<void> {
    if (!this.config.supportedLanguages.includes(language)) {
      console.warn(`Language ${language} is not supported`)
      return
    }

    try {
      // Load translations for the new language
      await this.loadTranslations(language)
      
      // Update current language
      this.currentLanguage = language
      
      // Save preference
      localStorage.setItem('preferred_language', language)
      
      // Update document language and direction
      document.documentElement.lang = language
      document.documentElement.dir = this.getLocaleInfo(language).direction
      
      // Notify listeners
      this.emit('languageChanged', language)
      
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  public t(key: string, options?: any): string {
    try {
      const translation = this.getTranslation(key)
      
      if (typeof translation === 'string') {
        return this.interpolate(translation, options)
      }
      
      return key // Fallback to key if translation not found
    } catch (error) {
      console.error('Translation error:', error)
      return key
    }
  }

  public tPlural(key: string, count: number, options?: any): string {
    try {
      const pluralKey = this.getPluralKey(key, count)
      const translation = this.getTranslation(pluralKey)
      
      if (typeof translation === 'string') {
        return this.interpolate(translation, { ...options, count })
      }
      
      return key
    } catch (error) {
      console.error('Plural translation error:', error)
      return key
    }
  }

  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    if (!this.config.enableDateLocalization) {
      return date.toLocaleDateString()
    }

    const localeInfo = this.getLocaleInfo(this.currentLanguage)
    const locale = this.getLocaleString(this.currentLanguage)
    
    return new Intl.DateTimeFormat(locale, {
      ...options,
    }).format(date)
  }

  public formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    if (!this.config.enableDateLocalization) {
      return date.toLocaleTimeString()
    }

    const localeInfo = this.getLocaleInfo(this.currentLanguage)
    const locale = this.getLocaleString(this.currentLanguage)
    
    return new Intl.DateTimeFormat(locale, {
      ...options,
    }).format(date)
  }

  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    if (!this.config.enableNumberLocalization) {
      return number.toString()
    }

    const localeInfo = this.getLocaleInfo(this.currentLanguage)
    const locale = this.getLocaleString(this.currentLanguage)
    
    return new Intl.NumberFormat(locale, {
      ...localeInfo.numberFormat,
      ...options,
    }).format(number)
  }

  public formatCurrency(amount: number, currency: string = 'USD', options?: Intl.NumberFormatOptions): string {
    if (!this.config.enableCurrencyLocalization) {
      return `${currency} ${amount.toFixed(2)}`
    }

    const localeInfo = this.getLocaleInfo(this.currentLanguage)
    const locale = this.getLocaleString(this.currentLanguage)
    
    return new Intl.NumberFormat(locale, {
      ...localeInfo.currencyFormat,
      style: 'currency',
      currency,
      ...options,
    }).format(amount)
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage
  }

  public getSupportedLanguages(): string[] {
    return [...this.config.supportedLanguages]
  }

  public getLocaleInfo(language: string): LocaleInfo {
    const localeMap: Record<string, LocaleInfo> = {
      en: {
        language: 'en',
        direction: 'ltr',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'h:mm:ss a',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => n === 1 ? 0 : 1,
      },
      es: {
        language: 'es',
        direction: 'ltr',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'H:mm:ss',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => n === 1 ? 0 : 1,
      },
      fr: {
        language: 'fr',
        direction: 'ltr',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm:ss',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => n <= 1 ? 0 : 1,
      },
      de: {
        language: 'de',
        direction: 'ltr',
        dateFormat: 'dd.MM.yyyy',
        timeFormat: 'HH:mm:ss',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => n === 1 ? 0 : 1,
      },
      ar: {
        language: 'ar',
        direction: 'rtl',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'h:mm:ss a',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => {
          if (n === 0) return 0
          if (n === 1) return 1
          if (n === 2) return 2
          if (n % 100 >= 3 && n % 100 <= 10) return 3
          if (n % 100 >= 11) return 4
          return 5
        },
      },
      he: {
        language: 'he',
        direction: 'rtl',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm:ss',
        numberFormat: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currencyFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        pluralRule: (n: number) => n === 1 ? 0 : 1,
      },
    }

    return localeMap[language] || localeMap.en
  }

  public getLocaleString(language: string): string {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      ar: 'ar-SA',
      he: 'he-IL',
    }

    return localeMap[language] || 'en-US'
  }

  // Translation management
  public async loadTranslations(language: string): Promise<void> {
    try {
      // Load translations from API or local files
      const translations = await this.fetchTranslations(language)
      
      // Store translations
      const resource: LanguageResource = {
        language,
        namespace: 'common',
        translations,
        lastUpdated: new Date(),
        version: '1.0.0',
      }
      
      this.resources.set(`${language}:common`, resource)
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error)
      
      // Fallback to default language
      if (language !== this.config.fallbackLanguage) {
        await this.loadTranslations(this.config.fallbackLanguage)
      }
    }
  }

  public async addTranslations(language: string, namespace: string, translations: Translation): Promise<void> {
    const resource: LanguageResource = {
      language,
      namespace,
      translations,
      lastUpdated: new Date(),
      version: '1.0.0',
    }
    
    this.resources.set(`${language}:${namespace}`, resource)
  }

  // Private methods
  private getTranslation(key: string): string | Translation {
    const [namespace, ...keyParts] = key.split(this.config.namespaceSeparator)
    const fullKey = keyParts.join(this.config.keySeparator)
    
    const resource = this.resources.get(`${this.currentLanguage}:${namespace}`) ||
                    this.resources.get(`${this.config.fallbackLanguage}:${namespace}`)
    
    if (!resource) {
      return key
    }
    
    return this.getNestedValue(resource.translations, fullKey) || key
  }

  private getNestedValue(obj: Translation, path: string): string | Translation | undefined {
    return path.split(this.config.keySeparator).reduce((current: string | Translation | undefined, key: string) => {
      return current && typeof current === 'object' ? current[key] : undefined
    }, obj)
  }

  private getPluralKey(key: string, count: number): string {
    const pluralRule = this.pluralRules.get(this.currentLanguage)
    if (!pluralRule) {
      return key
    }
    
    const pluralIndex = pluralRule.rule(count)
    return `${key}_${pluralIndex}`
  }

  private interpolate(template: string, options: any): string {
    if (!options) return template
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return options[key] !== undefined ? options[key] : match
    })
  }

  private async fetchTranslations(language: string): Promise<Translation> {
    // This would typically fetch from an API or local files
    // For now, return sample translations
    const sampleTranslations: Record<string, Translation> = {
      en: {
        common: {
          welcome: 'Welcome',
          login: 'Login',
          logout: 'Logout',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          create: 'Create',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          export: 'Export',
          import: 'Import',
          loading: 'Loading...',
          error: 'An error occurred',
          success: 'Operation completed successfully',
          confirm: 'Are you sure?',
          yes: 'Yes',
          no: 'No',
        },
        navigation: {
          projects: 'Projects',
          ingestion: 'Ingestion',
          reconciliation: 'Reconciliation',
          cashflow: 'Cashflow Evaluation',
          adjudication: 'Adjudication',
          visualization: 'Visualization',
          presummary: 'Pre-Summary',
          summary: 'Summary & Export',
        },
        forms: {
          required: 'This field is required',
          invalidEmail: 'Please enter a valid email address',
          passwordTooShort: 'Password must be at least 8 characters',
          passwordsDoNotMatch: 'Passwords do not match',
        },
        messages: {
          projectCreated: 'Project created successfully',
          projectUpdated: 'Project updated successfully',
          projectDeleted: 'Project deleted successfully',
          dataUploaded: 'Data uploaded successfully',
          reconciliationCompleted: 'Reconciliation completed',
        },
      },
      es: {
        common: {
          welcome: 'Bienvenido',
          login: 'Iniciar sesión',
          logout: 'Cerrar sesión',
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          create: 'Crear',
          search: 'Buscar',
          filter: 'Filtrar',
          sort: 'Ordenar',
          export: 'Exportar',
          import: 'Importar',
          loading: 'Cargando...',
          error: 'Ocurrió un error',
          success: 'Operación completada exitosamente',
          confirm: '¿Estás seguro?',
          yes: 'Sí',
          no: 'No',
        },
        navigation: {
          projects: 'Proyectos',
          ingestion: 'Ingesta',
          reconciliation: 'Reconciliación',
          cashflow: 'Evaluación de Flujo de Efectivo',
          adjudication: 'Adjudicación',
          visualization: 'Visualización',
          presummary: 'Pre-Resumen',
          summary: 'Resumen y Exportación',
        },
      },
      fr: {
        common: {
          welcome: 'Bienvenue',
          login: 'Connexion',
          logout: 'Déconnexion',
          save: 'Enregistrer',
          cancel: 'Annuler',
          delete: 'Supprimer',
          edit: 'Modifier',
          create: 'Créer',
          search: 'Rechercher',
          filter: 'Filtrer',
          sort: 'Trier',
          export: 'Exporter',
          import: 'Importer',
          loading: 'Chargement...',
          error: 'Une erreur s\'est produite',
          success: 'Opération terminée avec succès',
          confirm: 'Êtes-vous sûr?',
          yes: 'Oui',
          no: 'Non',
        },
      },
    }

    return sampleTranslations[language] || sampleTranslations.en
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

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }
}

// React hook for internationalization
export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState<string>(() => {
    const i18n = I18nService.getInstance()
    return i18n.getCurrentLanguage()
  })

  React.useEffect(() => {
    const i18n = I18nService.getInstance()
    
    const handleLanguageChange = (language: string) => {
      setCurrentLanguage(language)
    }

    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  const i18n = I18nService.getInstance()

  return {
    currentLanguage,
    supportedLanguages: i18n.getSupportedLanguages(),
    t: i18n.t.bind(i18n),
    tPlural: i18n.tPlural.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatTime: i18n.formatTime.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    changeLanguage: i18n.changeLanguage.bind(i18n),
    getLocaleInfo: i18n.getLocaleInfo.bind(i18n),
  }
}

// Higher-order component for internationalization
export const withI18n = <P extends object,>(Component: React.ComponentType<P>) => {
  const WithI18nComponent = (props: P) => {
    const i18n = useI18n()
    return <Component {...props} i18n={i18n} />
  }
  WithI18nComponent.displayName = `withI18n(${Component.displayName || Component.name || 'Component'})`
  return WithI18nComponent
}

// Export singleton instance
export const i18nService = I18nService.getInstance()

export default i18nService
