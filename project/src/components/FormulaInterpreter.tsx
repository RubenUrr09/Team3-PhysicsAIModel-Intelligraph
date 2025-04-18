import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload } from 'lucide-react';
import axios from 'axios';

interface Formula {
  equation: string;
  variables: {
    symbol: string;
    name: string;
    units: string;
    description: string;
  }[];
  usage: string;
}

function FormulaInterpreter() {
  const [loading, setLoading] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post('/api/interpret-formulas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormulas(data.formulas);
    } catch (error) {
      console.error('Error interpreting formulas:', error);
      alert('Failed to interpret formulas. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Formula Sheet Interpreter</h2>
      <p className="text-gray-600 mb-6">Upload a PDF of your formula sheet to get detailed explanations:</p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-500">Drop the PDF here...</p>
        ) : (
          <p className="text-gray-500">
            Drag and drop a PDF file here, or click to select
          </p>
        )}
      </div>

      {loading && (
        <div className="mt-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-2 text-gray-600">Interpreting formulas...</p>
        </div>
      )}

      {formulas.length > 0 && (
        <div className="mt-8 space-y-6">
          {formulas.map((formula, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Formula {index + 1}</h3>
              <div className="mb-4">
                <p className="text-lg font-mono bg-gray-50 p-3 rounded">
                  {formula.equation}
                </p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Variables:</h4>
                <ul className="space-y-2">
                  {formula.variables.map((variable, vIndex) => (
                    <li key={vIndex} className="flex items-start">
                      <span className="font-mono mr-2">{variable.symbol}:</span>
                      <div>
                        <p className="font-medium">{variable.name}</p>
                        <p className="text-sm text-gray-600">
                          Units: {variable.units}
                        </p>
                        <p className="text-sm text-gray-600">
                          {variable.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage:</h4>
                <p className="text-gray-700">{formula.usage}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormulaInterpreter;