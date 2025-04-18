import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload } from 'lucide-react';
import axios from 'axios';

function GenerateMindmap() {
  const [loading, setLoading] = useState(false);
  const [mindmap, setMindmap] = useState(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post('/api/mindmap', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMindmap(data.mindmap);
    } catch (error) {
      console.error('Error generating mindmap:', error);
      alert('Failed to generate mindmap. Please try again.');
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
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Physics Mindmap</h2>
      <p className="text-gray-600 mb-6">Upload a PDF file to generate a mindmap of the physics concepts:</p>

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
          <p className="mt-2 text-gray-600">Generating mindmap...</p>
        </div>
      )}

      {mindmap && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Generated Mindmap:</h3>
          {/* Mindmap visualization will go here */}
        </div>
      )}
    </div>
  );
}

export default GenerateMindmap;