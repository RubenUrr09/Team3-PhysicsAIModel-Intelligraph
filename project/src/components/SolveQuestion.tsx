import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
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

  const handleSubmit = async () => {
    if (!question.trim()) {
      alert("Please enter a physics question!");
      return;
    }

    setStatus('loading');
    setAnswer('Processing...');
    setForces([]);

    try {
      const { data } = await axios.post('/api/solve', { question });
      setAnswer(data.answer);
      setForces(data.forces || []);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setAnswer('Failed to get response. Please try again.');
      setForces([]);
    }
  };

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

      <button
        onClick={handleSubmit}
        disabled={status === 'loading'}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
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

      {answer && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Solution:</h3>
            <LaTeXRenderer text={answer} />
          </div>
        </div>
      )}

      {forces.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Force Diagram:</h3>
          <ForceCanvas forces={forces} width={400} height={400} />
        </div>
      )}
    </div>
  );
}

export default SolveQuestion;