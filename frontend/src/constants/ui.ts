/**
 * UI Configuration Constants
 * 
 * UI-related constants including layout, colors, typography, and chart configuration
 */

export const UI_CONFIG = {
  // Layout
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  FOOTER_HEIGHT: 48,
  CONTENT_PADDING: 24,
  CARD_PADDING: 16,
  BORDER_RADIUS: 8,
  SHADOW: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  SHADOW_HOVER: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',

  // Breakpoints
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400,
  },

  // Z-Index
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },

  // Animation
  TRANSITION_DURATION: 300,
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Colors
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
    LIGHT: '#F8FAFC',
    DARK: '#1E293B',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },

  // Typography
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    '2XL': '1.5rem',
    '3XL': '1.875rem',
    '4XL': '2.25rem',
    '5XL': '3rem',
    '6XL': '3.75rem',
  },

  FONT_WEIGHTS: {
    THIN: 100,
    EXTRALIGHT: 200,
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800,
    BLACK: 900,
  },

  LINE_HEIGHTS: {
    NONE: 1,
    TIGHT: 1.25,
    SNUG: 1.375,
    NORMAL: 1.5,
    RELAXED: 1.625,
    LOOSE: 2,
  },

  // Spacing
  SPACING: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
} as const;

export const CHART_CONFIG = {
  // Chart Types
  TYPES: {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie',
    AREA: 'area',
    SCATTER: 'scatter',
    HEATMAP: 'heatmap',
    SANKEY: 'sankey',
    TREEMAP: 'treemap',
    GAUGE: 'gauge',
    FUNNEL: 'funnel',
  },

  // Default Colors
  COLORS: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
  ],

  // Animation
  ANIMATION: {
    DURATION: 1000,
    EASING: 'easeInOutQuart',
    DELAY: 0,
  },

  // Responsive
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false,

  // Plugins
  PLUGINS: {
    LEGEND: {
      DISPLAY: true,
      POSITION: 'top',
    },
    TOOLTIP: {
      ENABLED: true,
      MODE: 'index',
      INTERSECT: false,
    },
    TITLE: {
      DISPLAY: true,
      FONT_SIZE: 16,
      FONT_WEIGHT: 'bold',
    },
  },

  // Scales
  SCALES: {
    X: {
      DISPLAY: true,
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)',
      },
      TICKS: {
        COLOR: '#6B7280',
        FONT_SIZE: 12,
      },
    },
    Y: {
      DISPLAY: true,
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)',
      },
      TICKS: {
        COLOR: '#6B7280',
        FONT_SIZE: 12,
      },
    },
  },
} as const;

