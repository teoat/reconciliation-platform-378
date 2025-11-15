'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, User, MessageSquare } from 'lucide-react'

interface AdjudicationPageProps {
  project: any
  onProgressUpdate?: (step: string) => void
}

const AdjudicationPage = ({ project, onProgressUpdate }: AdjudicationPageProps) => {
  const [discrepancies] = useState([
    {
      id: '1',
      priority: 'high',
      status: 'pending',
      amount: 1500.00,
      description: 'Missing transaction in system A',
      date: '2024-01-15'
    },
    {
      id: '2',
      priority: 'medium',
      status: 'in_review',
      amount: 250.00,
      description: 'Amount mismatch between systems',
      date: '2024-01-14'
    }
  ])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_review': return <AlertTriangle className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      default: return <XCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Adjudication</h1>
          <p className="text-gray-600">Review and resolve discrepancies found during reconciliation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Discrepancies List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Discrepancies</h2>
                <p className="text-gray-600 mt-1">Review and resolve identified discrepancies</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {discrepancies.map((discrepancy) => (
                    <div key={discrepancy.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(discrepancy.priority)}`}>
                              {discrepancy.priority.toUpperCase()}
                            </span>
                            <div className="flex items-center space-x-1 text-gray-500">
                              {getStatusIcon(discrepancy.status)}
                              <span className="text-sm capitalize">{discrepancy.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 mb-1">
                            ${discrepancy.amount.toFixed(2)}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-2">
                            {discrepancy.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{discrepancy.date}</span>
                            <span>ID: {discrepancy.id}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Discrepancies</span>
                  <span className="font-semibold">{discrepancies.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">High Priority</span>
                  <span className="font-semibold text-red-600">
                    {discrepancies.filter(d => d.priority === 'high').length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Review</span>
                  <span className="font-semibold text-yellow-600">
                    {discrepancies.filter(d => d.status === 'pending').length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold">
                    ${discrepancies.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Resolve All Low Priority
                </button>
                
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Approve Selected
                </button>
                
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdjudicationPage