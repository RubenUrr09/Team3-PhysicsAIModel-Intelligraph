import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, FileText, AlertCircle, RefreshCw, Send } from 'lucide-react';
import axios from 'axios';
import LaTeXRenderer from './LaTeXRenderer';

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

type InputMode = 'upload' | 'text';

function FormulaInterpreter() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [loading, setLoading] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [renderKey, setRenderKey] = useState<number>(0);

  const resetState = () => {
    setError(null);
    setFormulas([]);
    setProcessingStatus('');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Reset states
    resetState();
    setLoading(true);
    setFileName(file.name);
    setProcessingStatus('Extracting text from PDF...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Set a longer timeout for the request (2 minutes)
      const { data } = await axios.post('http://localhost:5000/interpret-formulas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes
      });
      
      setProcessingStatus('');
      
      // Handle the response
      if (data.formulas && Array.isArray(data.formulas)) {
        if (data.formulas.length === 0) {
          setError('No formulas were found in the document. Please try a different PDF with clearer formula text.');
        } else {
          setFormulas(data.formulas);
          
          // Force re-render of LaTeX content
          setRenderKey(prev => prev + 1);
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Invalid response format');
      }
      
      // If there's a note in the response, show it
      if (data.note) {
        console.log("Server note:", data.note);
      }
    } catch (error) {
      console.error("Error processing formula sheet:", error);
      
      let errorMessage = 'Failed to process the formula sheet';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. The PDF may be too large or complex to process.';
        } else if (error.response) {
          errorMessage = `Server error: ${error.response.status}`;
          if (error.response.data?.error) {
            errorMessage += ` - ${error.response.data.error}`;
          }
        } else if (error.request) {
          errorMessage = 'No response received from server. Please check your connection.';
        } else {
          errorMessage = `Request error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  }, []);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) {
      setError('Please enter formula text to process');
      return;
    }

    // Reset states
    resetState();
    setLoading(true);
    setProcessingStatus('Processing formula text...');

    try {
      const { data } = await axios.post('http://localhost:5000/interpret-formula-text', {
        text: textInput
      }, {
        timeout: 60000 // 1 minute
      });
      
      setProcessingStatus('');
      
      // Handle the response
      if (data.formulas && Array.isArray(data.formulas)) {
        if (data.formulas.length === 0) {
          setError('No formulas were recognized in the text. Please try a different input.');
        } else {
          setFormulas(data.formulas);
          
          // Force re-render of LaTeX content
          setRenderKey(prev => prev + 1);
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error processing formula text:", error);
      
      let errorMessage = 'Failed to process the formula text';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server error: ${error.response.status}`;
          if (error.response.data?.error) {
            errorMessage += ` - ${error.response.data.error}`;
          }
        } else if (error.request) {
          errorMessage = 'No response received from server. Please check your connection.';
        } else {
          errorMessage = `Request error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB max file size
    disabled: loading || inputMode !== 'upload'
  });

  const toggleInputMode = () => {
    resetState();
    setInputMode(prev => prev === 'upload' ? 'text' : 'upload');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Physics Formula Interpreter</h2>
      <p className="text-gray-600 mb-6">
        Upload a PDF formula sheet or directly enter formula text to get detailed explanations of physics formulas.
      </p>

      {/* Input Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              inputMode === 'upload'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
            onClick={() => inputMode !== 'upload' && toggleInputMode()}
            disabled={loading}
          >
            Upload PDF
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              inputMode === 'text'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
            onClick={() => inputMode !== 'text' && toggleInputMode()}
            disabled={loading}
          >
            Enter Text
          </button>
        </div>
      </div>

      {/* PDF Upload Area */}
      {inputMode === 'upload' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-500">Drop the PDF here...</p>
          ) : (
            <div>
              <p className="text-gray-500 mb-2">
                Drag and drop a PDF file here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                PDF files only (Max 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Input Area */}
      {inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="mb-6">
          <div className="flex flex-col">
            <label htmlFor="formula-text" className="mb-2 text-sm font-medium text-gray-700">
              Enter formula text (e.g., "F = ma", "E = mc²", or multiple formulas)
            </label>
            <textarea
              id="formula-text"
              rows={5}
              className="p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter physics formulas and equations here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={loading || !textInput.trim()}
                className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none ${
                  loading || !textInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-4 h-4 mr-2" />
                Process Formulas
              </button>
            </div>
          </div>
        </form>
      )}

      {/* File Processing Status */}
      {inputMode === 'upload' && fileName && !loading && !error && formulas.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center">
          <FileText className="w-5 h-5 text-blue-500 mr-2" />
          <p className="text-blue-700 text-sm">Ready to process: <span className="font-medium">{fileName}</span></p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-600 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              {inputMode === 'upload' 
                ? 'Try again with a clearer PDF or one with more recognizable formula text.' 
                : 'Try again with clearer formula text.'}
            </p>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {loading && (
        <div className="mt-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-2 text-gray-600">
            {processingStatus || (inputMode === 'upload' ? 'Interpreting formulas from PDF...' : 'Processing formula text...')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {inputMode === 'upload' 
              ? 'This may take up to 1-2 minutes for large documents' 
              : 'This should only take a few seconds'}
          </p>
        </div>
      )}

      {/* Results */}
      {formulas.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">
              Found {formulas.length} Formula{formulas.length !== 1 ? 's' : ''}
              {fileName ? ` in ${fileName}` : ''}
            </h3>
            <button 
              onClick={resetState}
              className="text-sm flex items-center text-blue-500 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Clear Results
            </button>
          </div>
          
          {formulas.map((formula, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Formula {index + 1}</h3>
              <div className="mb-4">
                <div className="text-lg font-mono bg-gray-50 p-4 rounded">
                  <LaTeXRenderer text={formula.equation} renderKey={renderKey} />
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-gray-700">Variables:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formula.variables?.map((variable, vIndex) => (
                    <div key={vIndex} className="flex items-start bg-gray-50 p-3 rounded">
                      <span className="font-mono font-medium mr-2 text-blue-600">{variable.symbol}:</span>
                      <div>
                        <p className="font-medium">{variable.name}</p>
                        {variable.units && (
                          <p className="text-sm text-gray-600">
                            Units: <span className="font-mono">{variable.units}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {variable.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">Usage:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{formula.usage}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormulaInterpreter;