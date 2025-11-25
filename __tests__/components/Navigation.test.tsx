
import { render, screen } from '@testing-library/react'
import UnifiedNavigation from '../../frontend/src/components/layout/UnifiedNavigation'

describe('UnifiedNavigation', () => {
  it('should render the navigation links', () => {
    render(<UnifiedNavigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Data Ingestion')).toBeInTheDocument()
    expect(screen.getByText('Reconciliation')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
