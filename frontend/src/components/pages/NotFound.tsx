import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { Search } from 'lucide-react'
import { Button } from '../ui/Button'
import { PageMeta } from '../seo/PageMeta'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <>
      <PageMeta
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        robots="noindex, follow"
      />
      <main id="main-content" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Common pages:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => navigate('/projects/new')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Create Project
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/upload')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Upload File
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/analytics')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Analytics
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/users')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}

export default NotFound

