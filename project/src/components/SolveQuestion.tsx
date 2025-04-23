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
  const [renderKey, setRenderKey] = useState<number>(0);

  // Ensure MathJax is loaded on component mount
  useEffect(() => {
    const loadMathJax = () => {
      if (window.MathJax) return;
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);
    };
    
    loadMathJax();
  }, []);

  // Add sample forces for testing
  const sampleForces: Force[] = [
    {
      magnitude: 10,
      angle: 30,
      color: "#FF0000",
      label: "Applied Force"
    },
    {
      magnitude: 5,
      angle: 270,
      color: "#000000",
      label: "Weight"
    }
  ];

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      alert("Please enter a physics question!");
      return;
    }

    setStatus('loading');
    setAnswer('Processing...');
    setForces([]);
    
    try {
      const { data } = await axios.post('http://localhost:5000/predict', { question });
      console.log("API response data:", data);
      
      if (data.success) {
        // Generate a new render key to force re-render of components
        setRenderKey(prevKey => prevKey + 1);
        
        // Set the explanation
        setAnswer(data.answer);
        
        // Process forces array
        if (data.forces && Array.isArray(data.forces)) {
          console.log("Forces data received:", data.forces);
          
          // Make sure each force has the required properties
          const validForces = data.forces.filter((force: any) => 
            force && 
            typeof force.magnitude === 'number' && 
            typeof force.angle === 'number' && 
            typeof force.color === 'string' && 
            typeof force.label === 'string'
          );
          
          if (validForces.length > 0) {
            console.log("Valid forces data:", validForces);
            setForces(validForces);
          } else {
            console.warn("No valid forces found in data");
            // For testing, you can use sample forces
            // setForces(sampleForces);
            setForces([]);
          }
        } else {
          console.error('Invalid forces data:', data.forces);
          setForces([]);
        }
        
        setStatus('success');
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
    // Increment render key to ensure fresh rendering
    setRenderKey(prevKey => prevKey + 1);
  }

  // Force re-render of LaTeX content and canvas
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
            {/* Pass renderKey to LaTeXRenderer to force re-rendering */}
            <LaTeXRenderer key={`latex-${renderKey}`} text={answer} renderKey={renderKey} />
          </div>
        </div>
      )}

      {forces.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Force Diagram:</h3>
          <div className="flex justify-center">
            <ForceCanvas key={`canvas-${renderKey}`} forces={forces} width={500} height={500} />
          </div>
        </div>
      )}
      
      {/* Debug section */}
      {status === 'success' && forces.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          <p className="font-medium">No force data available for this problem</p>
          <p className="text-sm mt-1">The solver couldn't extract force information for visualization.</p>
        </div>
      )}
    </div>
  );
}

export default SolveQuestion;