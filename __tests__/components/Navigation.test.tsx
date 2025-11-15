
import { render, screen } from '../test-utils'
import Navigation from '../../components/Navigation'

describe('Navigation', () => {
  it('should render the navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Data Ingestion')).toBeInTheDocument()
    expect(screen.getByText('Reconciliation')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
