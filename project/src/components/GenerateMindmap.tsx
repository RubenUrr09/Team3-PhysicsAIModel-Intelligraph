import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Search, X } from 'lucide-react';
import axios from 'axios';
import PhysicsMindmap from './PhysicsMindmap';


interface MindmapNode {
  id: string;
  label: string;
  description: string;
  type: string;
  color: string;
}

interface MindmapLink {
  source: string;
  target: string;
}

interface MindmapData {
  nodes: MindmapNode[];
  links: MindmapLink[];
}

function GenerateMindmap() {
  const [loading, setLoading] = useState(false);
  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [concept, setConcept] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState('');

  // Handle text input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      setError('Please enter a physics concept');
      return;
    }

    setError('');
    setLoading(true);
    setMindmap(null);

    try {
      const { data } = await axios.post('http://localhost:5000/mindmap', { concept });
      if (data.success && data.mindmap) {
        setMindmap(data.mindmap);
      } else {
        throw new Error(data.error || 'Failed to generate mindmap');
      }
    } catch (err: any) {
      console.error('Error generating mindmap:', err);
      setError(err.message || 'Failed to generate mindmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setLoading(true);
    setMindmap(null);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post('/api/mindmap-from-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (data.success && data.mindmap) {
        setMindmap(data.mindmap);
        setConcept(data.concept || '');
      } else {
        throw new Error(data.error || 'Failed to generate mindmap from file');
      }
    } catch (err: any) {
      console.error('Error generating mindmap from file:', err);
      setError(err.message || 'Failed to generate mindmap from file. Please try again.');
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

  const resetForm = () => {
    setMindmap(null);
    setConcept('');
    setUploadedFileName('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Physics Mindmap</h2>
      <p className="text-gray-600 mb-6">
        Enter a physics concept or upload a PDF to generate a mindmap of related physics concepts:
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Text input form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Enter a physics concept (e.g., Quantum Mechanics)"
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
          <button
            type="submit"
            disabled={loading || !concept.trim()}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg disabled:bg-blue-300"
          >
            {loading ? 'Generating...' : 'Generate Mindmap'}
          </button>
        </form>

        {/* Vertical divider */}
        <div className="hidden md:block border-r border-gray-200"></div>

        {/* File upload area */}
        <div
          {...getRootProps()}
          className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} disabled={loading} />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-500">Drop the PDF here...</p>
          ) : uploadedFileName ? (
            <div>
              <p className="text-gray-700 font-medium">{uploadedFileName}</p>
              <p className="text-gray-500 text-sm mt-1">PDF uploaded successfully</p>
            </div>
          ) : (
            <p className="text-gray-500">
              Drag and drop a PDF file here, or click to select
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-center p-8 border border-gray-200 rounded-lg bg-gray-50">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600 font-medium">Generating mindmap...</p>
          <p className="text-gray-500 text-sm">This may take a minute. We're analyzing the physics concepts.</p>
        </div>
      )}

      {mindmap && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Mindmap for: <span className="text-blue-600">{concept}</span>
            </h3>
            <button
              onClick={resetForm}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <X size={16} className="mr-1" /> Clear
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200" style={{ height: '600px' }}>
            <PhysicsMindmap data={mindmap} />
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateMindmap;