import React, { useState, useRef, useEffect, memo } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useFocusRestore } from '@/hooks/useFocusRestore'

/**
 * Menu Component
 * Accessible menu component with proper ARIA attributes
 * 
 * @param trigger - Element that triggers the menu
 * @param children - Menu items
 * @param position - Menu position relative to trigger
 * @param align - Menu alignment (start, center, end)
 */
export interface MenuProps {
  trigger: React.ReactElement
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  id?: string
}

export const Menu: React.FC<MenuProps> = memo(({
  trigger,
  children,
  position = 'bottom',
  align = 'start',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const menuId = id || `menu-${Math.random().toString(36).substr(2, 9)}`
  const triggerId = `menu-trigger-${menuId}`
  const { saveFocus, restoreFocus } = useFocusRestore(isOpen)

  useFocusTrap(isOpen)

  useEffect(() => {
    if (isOpen) {
      saveFocus()
    } else {
      restoreFocus()
    }
  }, [isOpen, saveFocus, restoreFocus])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div className="relative inline-block">
      {React.cloneElement(trigger, {
        ref: triggerRef,
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': menuId,
        onClick: () => setIsOpen(!isOpen),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        },
      })}

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={`absolute z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 ${positionClasses[position]} ${alignClasses[align]}`}
          aria-labelledby={triggerId}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                role: 'menuitem',
                tabIndex: index === 0 ? 0 : -1,
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (child.props.onClick) {
                      child.props.onClick(e)
                    }
                    setIsOpen(false)
                  }
                },
              } as React.HTMLAttributes<HTMLElement>)
            }
            return child
          })}
        </div>
      )}
    </div>
  )
})

Menu.displayName = 'Menu'

export default Menu

