// Typography Scale System
// Consistent typography scale system for harmonious and accessible text presentation

import React from 'react'

export interface TypographyScale {
  xs: TypographySize
  sm: TypographySize
  md: TypographySize
  lg: TypographySize
  xl: TypographySize
  '2xl': TypographySize
  '3xl': TypographySize
  '4xl': TypographySize
  '5xl': TypographySize
  '6xl': TypographySize
}

export interface TypographySize {
  fontSize: string
  lineHeight: string
  letterSpacing: string
  fontWeight: string
  fontFamily: string
}

export interface TypographyVariant {
  h1: TypographySize
  h2: TypographySize
  h3: TypographySize
  h4: TypographySize
  h5: TypographySize
  h6: TypographySize
  body: TypographySize
  bodyLarge: TypographySize
  bodySmall: TypographySize
  caption: TypographySize
  overline: TypographySize
  button: TypographySize
  link: TypographySize
  code: TypographySize
  pre: TypographySize
}

export interface TypographyConfig {
  fontFamily: {
    sans: string
    serif: string
    mono: string
  }
  fontWeight: {
    thin: string
    light: string
    normal: string
    medium: string
    semibold: string
    bold: string
    extrabold: string
    black: string
  }
  letterSpacing: {
    tighter: string
    tight: string
    normal: string
    wide: string
    wider: string
    widest: string
  }
  lineHeight: {
    none: string
    tight: string
    snug: string
    normal: string
    relaxed: string
    loose: string
  }
  scale: TypographyScale
  variants: TypographyVariant
}

export interface TypographyProps {
  children: React.ReactNode
  variant?: keyof TypographyVariant
  size?: keyof TypographyScale
  weight?: keyof TypographyConfig['fontWeight']
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  className?: string
  as?: keyof JSX.IntrinsicElements
  id?: string
  'data-testid'?: string
}

const defaultConfig: TypographyConfig = {
  fontFamily: {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  },
  fontWeight: {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black'
  },
  letterSpacing: {
    tighter: 'tracking-tighter',
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-widest'
  },
  lineHeight: {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose'
  },
  scale: {
    xs: {
      fontSize: 'text-xs',
      lineHeight: 'leading-4',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    sm: {
      fontSize: 'text-sm',
      lineHeight: 'leading-5',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    md: {
      fontSize: 'text-base',
      lineHeight: 'leading-6',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    lg: {
      fontSize: 'text-lg',
      lineHeight: 'leading-7',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    xl: {
      fontSize: 'text-xl',
      lineHeight: 'leading-8',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    '2xl': {
      fontSize: 'text-2xl',
      lineHeight: 'leading-9',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    '3xl': {
      fontSize: 'text-3xl',
      lineHeight: 'leading-10',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    '4xl': {
      fontSize: 'text-4xl',
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    '5xl': {
      fontSize: 'text-5xl',
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-bold',
      fontFamily: 'font-sans'
    },
    '6xl': {
      fontSize: 'text-6xl',
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-bold',
      fontFamily: 'font-sans'
    }
  },
  variants: {
    h1: {
      fontSize: 'text-4xl',
      lineHeight: 'leading-tight',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-bold',
      fontFamily: 'font-sans'
    },
    h2: {
      fontSize: 'text-3xl',
      lineHeight: 'leading-tight',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    h3: {
      fontSize: 'text-2xl',
      lineHeight: 'leading-snug',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    h4: {
      fontSize: 'text-xl',
      lineHeight: 'leading-snug',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    h5: {
      fontSize: 'text-lg',
      lineHeight: 'leading-snug',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    h6: {
      fontSize: 'text-base',
      lineHeight: 'leading-normal',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    body: {
      fontSize: 'text-base',
      lineHeight: 'leading-6',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    bodyLarge: {
      fontSize: 'text-lg',
      lineHeight: 'leading-7',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    bodySmall: {
      fontSize: 'text-sm',
      lineHeight: 'leading-5',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    caption: {
      fontSize: 'text-xs',
      lineHeight: 'leading-4',
      letterSpacing: 'tracking-wide',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    overline: {
      fontSize: 'text-xs',
      lineHeight: 'leading-4',
      letterSpacing: 'tracking-widest',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    button: {
      fontSize: 'text-sm',
      lineHeight: 'leading-5',
      letterSpacing: 'tracking-wide',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    link: {
      fontSize: 'text-base',
      lineHeight: 'leading-6',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-medium',
      fontFamily: 'font-sans'
    },
    code: {
      fontSize: 'text-sm',
      lineHeight: 'leading-5',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-mono'
    },
    pre: {
      fontSize: 'text-sm',
      lineHeight: 'leading-6',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-mono'
    }
  }
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  size,
  weight,
  color,
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  className = '',
  as: Component = 'p',
  id,
  'data-testid': dataTestId,
  ...props
}) => {
  const variantConfig = defaultConfig.variants[variant]
  const sizeConfig = size ? defaultConfig.scale[size] : null

  const baseClasses = [
    // Use variant or size config
    sizeConfig ? sizeConfig.fontSize : variantConfig.fontSize,
    sizeConfig ? sizeConfig.lineHeight : variantConfig.lineHeight,
    sizeConfig ? sizeConfig.letterSpacing : variantConfig.letterSpacing,
    sizeConfig ? sizeConfig.fontWeight : variantConfig.fontWeight,
    sizeConfig ? sizeConfig.fontFamily : variantConfig.fontFamily,
    
    // Override with custom weight if provided
    weight ? defaultConfig.fontWeight[weight] : '',
    
    // Text alignment
    `text-${align}`,
    
    // Text transform
    transform === 'uppercase' ? 'uppercase' :
    transform === 'lowercase' ? 'lowercase' :
    transform === 'capitalize' ? 'capitalize' : 'normal-case',
    
    // Text decoration
    decoration === 'underline' ? 'underline' :
    decoration === 'line-through' ? 'line-through' : 'no-underline',
    
    // Truncation
    truncate ? 'truncate' : '',
    
    // Custom color
    color ? `text-${color}` : '',
    
    className
  ].filter(Boolean).join(' ')

  return (
    <Component
      className={baseClasses}
      id={id}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </Component>
  )
}

// Heading components
export const H1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" as="h1" {...props} />
)

export const H2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" as="h2" {...props} />
)

export const H3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" as="h3" {...props} />
)

export const H4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" as="h4" {...props} />
)

export const H5: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h5" as="h5" {...props} />
)

export const H6: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h6" as="h6" {...props} />
)

// Body text components
export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" as="p" {...props} />
)

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodyLarge" as="p" {...props} />
)

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodySmall" as="p" {...props} />
)

// Specialized components
export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" as="span" {...props} />
)

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" as="span" {...props} />
)

export const Code: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="code" as="code" {...props} />
)

export const Pre: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="pre" as="pre" {...props} />
)

export const Link: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="link" as="a" {...props} />
)

// Size-specific components
export const TextXS: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="xs" {...props} />
)

export const TextSM: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="sm" {...props} />
)

export const TextMD: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="md" {...props} />
)

export const TextLG: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="lg" {...props} />
)

export const TextXL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="xl" {...props} />
)

export const Text2XL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="2xl" {...props} />
)

export const Text3XL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="3xl" {...props} />
)

export const Text4XL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="4xl" {...props} />
)

export const Text5XL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="5xl" {...props} />
)

export const Text6XL: React.FC<Omit<TypographyProps, 'size'>> = (props) => (
  <Typography size="6xl" {...props} />
)

// Weight-specific components
export const TextThin: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="thin" {...props} />
)

export const TextLight: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="light" {...props} />
)

export const TextNormal: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="normal" {...props} />
)

export const TextMedium: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="medium" {...props} />
)

export const TextSemibold: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="semibold" {...props} />
)

export const TextBold: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="bold" {...props} />
)

export const TextExtrabold: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="extrabold" {...props} />
)

export const TextBlack: React.FC<Omit<TypographyProps, 'weight'>> = (props) => (
  <Typography weight="black" {...props} />
)

// Utility functions
export const getTypographyClasses = (
  variant: keyof TypographyVariant = 'body',
  size?: keyof TypographyScale,
  weight?: keyof TypographyConfig['fontWeight'],
  color?: string,
  align: 'left' | 'center' | 'right' | 'justify' = 'left',
  transform: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case' = 'normal-case',
  decoration: 'underline' | 'line-through' | 'no-underline' = 'no-underline',
  truncate: boolean = false,
  className: string = ''
): string => {
  const variantConfig = defaultConfig.variants[variant]
  const sizeConfig = size ? defaultConfig.scale[size] : null

  const classes = [
    // Use variant or size config
    sizeConfig ? sizeConfig.fontSize : variantConfig.fontSize,
    sizeConfig ? sizeConfig.lineHeight : variantConfig.lineHeight,
    sizeConfig ? sizeConfig.letterSpacing : variantConfig.letterSpacing,
    sizeConfig ? sizeConfig.fontWeight : variantConfig.fontWeight,
    sizeConfig ? sizeConfig.fontFamily : variantConfig.fontFamily,
    
    // Override with custom weight if provided
    weight ? defaultConfig.fontWeight[weight] : '',
    
    // Text alignment
    `text-${align}`,
    
    // Text transform
    transform === 'uppercase' ? 'uppercase' :
    transform === 'lowercase' ? 'lowercase' :
    transform === 'capitalize' ? 'capitalize' : 'normal-case',
    
    // Text decoration
    decoration === 'underline' ? 'underline' :
    decoration === 'line-through' ? 'line-through' : 'no-underline',
    
    // Truncation
    truncate ? 'truncate' : '',
    
    // Custom color
    color ? `text-${color}` : '',
    
    className
  ].filter(Boolean)

  return classes.join(' ')
}

export const createTypographyScale = (baseFontSize: number = 16): TypographyScale => {
  const scale = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5]
  
  return {
    xs: {
      fontSize: `text-xs`,
      lineHeight: 'leading-4',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    sm: {
      fontSize: `text-sm`,
      lineHeight: 'leading-5',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    md: {
      fontSize: `text-base`,
      lineHeight: 'leading-6',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    lg: {
      fontSize: `text-lg`,
      lineHeight: 'leading-7',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    xl: {
      fontSize: `text-xl`,
      lineHeight: 'leading-8',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    '2xl': {
      fontSize: `text-2xl`,
      lineHeight: 'leading-9',
      letterSpacing: 'tracking-normal',
      fontWeight: 'font-normal',
      fontFamily: 'font-sans'
    },
    '3xl': {
      fontSize: `text-3xl`,
      lineHeight: 'leading-10',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    '4xl': {
      fontSize: `text-4xl`,
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-semibold',
      fontFamily: 'font-sans'
    },
    '5xl': {
      fontSize: `text-5xl`,
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-bold',
      fontFamily: 'font-sans'
    },
    '6xl': {
      fontSize: `text-6xl`,
      lineHeight: 'leading-none',
      letterSpacing: 'tracking-tight',
      fontWeight: 'font-bold',
      fontFamily: 'font-sans'
    }
  }
}

export const validateTypographyProps = (props: TypographyProps): string[] => {
  const errors: string[] = []

  if (props.size && props.variant && props.variant !== 'body') {
    errors.push('Cannot specify both size and variant (except for body variant)')
  }

  if (props.truncate && props.as === 'h1') {
    errors.push('H1 elements should not be truncated')
  }

  if (props.color && !props.color.match(/^(text-|text-\[|text-)/)) {
    errors.push('Color should be a valid Tailwind text color class')
  }

  return errors
}

// Export all components and utilities
export default {
  Typography,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  BodyLarge,
  BodySmall,
  Caption,
  Overline,
  Code,
  Pre,
  Link,
  TextXS,
  TextSM,
  TextMD,
  TextLG,
  TextXL,
  Text2XL,
  Text3XL,
  Text4XL,
  Text5XL,
  Text6XL,
  TextThin,
  TextLight,
  TextNormal,
  TextMedium,
  TextSemibold,
  TextBold,
  TextExtrabold,
  TextBlack,
  getTypographyClasses,
  createTypographyScale,
  validateTypographyProps,
  defaultConfig
}