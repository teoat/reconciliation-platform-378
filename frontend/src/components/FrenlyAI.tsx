import React from 'react';
import { useFrenly } from './FrenlyProvider';

const FrenlyAI: React.FC = () => {
  const { state, updateProgress, toggleActive } = useFrenly();

  if (!state.isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Frenly AI Assistant</h3>
        <button onClick={toggleActive} className="text-white hover:text-gray-200">
          ×
        </button>
      </div>
      <div className="mb-2">
        <div className="text-sm">Progress: {state.progress}%</div>
        <div className="w-full bg-blue-800 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          ></div>
        </div>
      </div>
      <div className="text-sm">Current Step: {state.currentStep}</div>
    </div>
  );
};

export default FrenlyAI;
