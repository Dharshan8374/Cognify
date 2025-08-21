import React, { useCallback, useState, DragEvent } from 'react';
import { Upload, Music, AlertCircle } from 'lucide-react';

interface AudioUploadProps {
  onFileUpload: (file: File) => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      setError('Please upload an MP3, WAV, or OGG audio file');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-500/20 scale-102' 
            : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('audio-upload')?.click()}
      >
        <input
          id="audio-upload"
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all
            ${isDragging ? 'bg-blue-500 scale-110' : 'bg-white/20'}
          `}>
            {isDragging ? (
              <Music className="w-8 h-8 text-white" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragging ? 'Drop your audio file here' : 'Upload Audio File'}
            </h3>
            <p className="text-gray-300 mb-4">
              Drag and drop or click to select MP3, WAV, or OGG files
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
              <span>Max 50MB</span>
              <span>•</span>
              <span>MP3, WAV, OGG</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};