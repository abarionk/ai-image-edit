/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, SparklesIcon } from './icons';

interface StartScreenProps {
  onSelectEdit: (file: File) => void;
  onSelectGenerate: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelectEdit, onSelectGenerate }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectEdit(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectEdit(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          Your AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Creative Suite</span>
        </h1>
        <p className="max-w-3xl text-lg text-gray-400 md:text-xl">
          Create entirely new images from text descriptions or use powerful AI tools to edit your existing photos to perfection.
        </p>
        
        <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Edit a Photo Card */}
            <div className="bg-black/20 p-8 rounded-lg border border-gray-700/50 flex flex-col items-center text-center transition hover:border-blue-400/50 hover:bg-blue-900/10">
                <MagicWandIcon className="w-12 h-12 text-blue-400 mb-4" />
                <h2 className="text-3xl font-bold text-gray-100">Photo Editor</h2>
                <p className="mt-2 text-gray-400 mb-6">Upload a photo to retouch, apply filters, make adjustments, and more.</p>
                <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors">
                    <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:-translate-y-0.5" />
                    Upload an Image
                </label>
                <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <p className="text-sm text-gray-500 mt-3">or drag and drop a file</p>
            </div>
            
            {/* Create an Image Card */}
            <div className="bg-black/20 p-8 rounded-lg border border-gray-700/50 flex flex-col items-center text-center transition hover:border-purple-400/50 hover:bg-purple-900/10">
                <SparklesIcon className="w-12 h-12 text-purple-400 mb-4" />
                <h2 className="text-3xl font-bold text-gray-100">Image Generator</h2>
                <p className="mt-2 text-gray-400 mb-6">Describe any scene or idea, and let AI bring your vision to life in seconds.</p>
                <button 
                  onClick={onSelectGenerate}
                  className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-purple-600 rounded-full cursor-pointer group hover:bg-purple-500 transition-colors"
                >
                    <SparklesIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:scale-110" />
                    Start Creating
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;