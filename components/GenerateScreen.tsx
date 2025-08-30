/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { generateImageFromPrompt } from '../services/geminiService';
import Spinner from './Spinner';
import { SparklesIcon, DownloadIcon, MagicWandIcon, UploadIcon } from './icons';
import { dataURLtoFile } from '../App';

interface GenerateScreenProps {
  onImageGenerated: (file: File) => void;
  onStartOver: () => void;
}

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const GenerateScreen: React.FC<GenerateScreenProps> = ({ onImageGenerated, onStartOver }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('1:1');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const imageUrl = await generateImageFromPrompt(prompt, activeAspect);
      setGeneratedImageUrl(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
    if (generatedImageUrl) {
      const newImageFile = dataURLtoFile(generatedImageUrl, `generated-${Date.now()}.png`);
      onImageGenerated(newImageFile);
    }
  };
  
  const handleDownload = () => {
    if (generatedImageUrl) {
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `generated-${prompt.slice(0, 20).replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleGenerateAnother = () => {
    setGeneratedImageUrl(null);
    setError(null);
  };
  
  const aspects: { name: AspectRatio }[] = [
    { name: '1:1' }, { name: '16:9' }, { name: '9:16' }, { name: '4:3' }, { name: '3:4' },
  ];

  if (error) {
    return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
        <Spinner />
        <p className="text-gray-300 text-lg">Conjuring your creation...</p>
        <p className="text-gray-400 max-w-md text-center">This can take a moment, especially for complex prompts. Thanks for your patience!</p>
      </div>
    );
  }

  if (generatedImageUrl) {
    return (
        <div className="w-full h-full max-w-screen-2xl flex flex-col items-center justify-center gap-6 animate-fade-in">
             <div className="relative w-full flex-1 flex items-center justify-center min-h-0 bg-black/20 rounded-xl shadow-2xl p-4">
                <img src={generatedImageUrl} alt="Generated image" className="max-w-full max-h-full object-contain rounded-lg"/>
             </div>
             <div className="w-full flex-shrink-0 max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleGenerateAnother} className="w-full bg-white/10 text-gray-200 font-semibold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base flex items-center justify-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Generate Another
                </button>
                <button onClick={handleDownload} className="w-full bg-white/10 text-gray-200 font-semibold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Download
                </button>
                <button onClick={handleEdit} className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base flex items-center justify-center gap-2">
                    <MagicWandIcon className="w-5 h-5" />
                    Edit this Image
                </button>
             </div>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-100">
          Image Generation
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400">
          Describe anything you can imagine, and let the AI bring it to life. Be as descriptive as you like.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex flex-col items-center gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A majestic lion wearing a crown, cinematic lighting, hyperdetailed, epic fantasy art"
          className="w-full bg-gray-900/50 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition h-32 resize-none"
        />
        
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Aspect Ratio:</span>
            {aspects.map(({ name }) => (
                <button
                    type="button"
                    key={name}
                    onClick={() => setActiveAspect(name)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    activeAspect === name 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/20' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-200'
                    }`}
                >
                    {name}
                </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-10 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner flex items-center justify-center gap-3"
            disabled={isLoading || !prompt.trim()}
          >
            <SparklesIcon className="w-6 h-6" />
            Generate
          </button>
        </div>
      </form>

      <button onClick={onStartOver} className="mt-8 flex items-center gap-2 text-gray-400 hover:text-white transition">
        <UploadIcon className="w-5 h-5"/>
        <span>Back to Main Menu</span>
      </button>

    </div>
  );
};

export default GenerateScreen;
