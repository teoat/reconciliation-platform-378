import React from 'react';

interface GenericPageProps {
  title: string;
  description?: string;
}

const GenericPage: React.FC<GenericPageProps> = ({ title, description }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div className="text-center">
          <p className="text-sm text-gray-500">This page is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default GenericPage;
