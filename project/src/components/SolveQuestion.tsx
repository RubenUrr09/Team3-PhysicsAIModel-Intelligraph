
// Updated SolveQuestion.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ForceCanvas from './ForceCanvas';
import LaTeXRenderer from './LaTeXRenderer';

interface Force {
  magnitude: number;
  angle: number;
  color: string;
  label: string;
}

function SolveQuestion() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [forces, setForces] = useState<Force[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  // Add a unique key for both components to ensure proper re-rendering
  const [renderKey, setRenderKey] = useState<number>(0);

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      alert("Please enter a physics question!");
      return;
    }

    setStatus('loading');
    setAnswer('Processing...');
    setForces([]);
    
    try {
      // Using the correct endpoint to match server.js
      const { data } = await axios.post('http://localhost:5000/predict', { question });
      
      if (data.success) {
        // Important: Force a re-render by updating the key BEFORE setting the answer content
        setRenderKey(prevKey => prevKey + 1);
        
        // Wait a tick before updating content to ensure clean re-render
        setTimeout(() => {
          setAnswer(data.answer);
          setForces(Array.isArray(data.forces) ? data.forces : []);
          setStatus('success');
        }, 10);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setStatus('error');
      setAnswer('Failed to get response. Please try again.');
      setStatusMessage(error instanceof Error ? error.message : 'Connection error');
      setForces([]);
    }
  }, [question]);

  // Clear all states for a fresh question
  const handleNewQuestion = () => {
    setQuestion('');
    setAnswer('');
    setForces([]);
    setStatus('idle');
    setStatusMessage('');
    setRenderKey(prevKey => prevKey + 1);
  }

  // Debugging helper
  const handleForceRefresh = () => {
    setRenderKey(prevKey => prevKey + 1);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Physics Problem Solver</h2>
      <p className="text-gray-600 mb-6">Enter your physics question below:</p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="Example: A 15N force is applied at 30 degrees to the horizontal on a 2kg block. Calculate the resulting forces."
      />

      <div className="flex space-x-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center flex-1"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Solve'
          )}
        </button>
        
        <button
          onClick={handleNewQuestion}
          className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
        
        {status === 'success' && (
          <button
            onClick={handleForceRefresh}
            title="Refresh rendering"
            className="px-3 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error processing your question</p>
            {statusMessage && <p className="text-sm mt-1">{statusMessage}</p>}
          </div>
        </div>
      )}

      {answer && status !== 'loading' && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              {status === 'success' && <Check className="w-5 h-5 text-green-500 mr-2" />}
              <h3 className="text-xl font-semibold">Solution:</h3>
            </div>
            {/* Key is crucial for proper re-rendering */}
            <LaTeXRenderer key={`latex-${renderKey}`} text={answer} />
          </div>
        </div>
      )}

      {Array.isArray(forces) && forces.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Force Diagram:</h3>
          <div className="flex justify-center">
            {/* Key is crucial for proper re-rendering */}
            <ForceCanvas key={`canvas-${renderKey}`} forces={forces} width={500} height={500} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SolveQuestion;