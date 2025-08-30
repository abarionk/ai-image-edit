/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { MagicWandIcon, RemoveBgIcon, BeautifyIcon, UpscaleIcon } from './icons';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  onApplyUpscale: () => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, onApplyUpscale, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showBeautifyOptions, setShowBeautifyOptions] = useState(false);

  const presets = [
    { name: 'Blur Background', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmer Lighting', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
    setShowBeautifyOptions(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
    setShowBeautifyOptions(false);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt);
    }
  };
  
  const handleAutoAdjust = () => {
    setShowBeautifyOptions(false);
    onApplyAdjustment("Automatically enhance the image's lighting, color balance, and contrast for a professional, natural look. Do not crop or change the composition.");
  };

  const handleRemoveBackground = () => {
    setShowBeautifyOptions(false);
    onApplyAdjustment("Remove the background from the image, keeping only the main subject. The new background must be transparent.");
  };

  const handleUpscale = () => {
    setShowBeautifyOptions(false);
    onApplyUpscale();
  };

  const handleBeautifyFemale = () => {
    onApplyAdjustment("Subtly beautify the female subject in the photo. Smooth skin while retaining natural texture, slightly brighten the eyes and teeth, add a touch of color to the lips and cheeks, and enhance the hair's shine. The overall effect should be natural and flattering, not artificial.");
    setShowBeautifyOptions(false);
  };

  const handleBeautifyMale = () => {
      onApplyAdjustment("Subtly enhance the male subject in the photo. Even out skin tone while preserving texture like stubble, slightly sharpen the jawline and eyes, and reduce minor blemishes. The result should look healthy and rested, completely natural and not retouched.");
      setShowBeautifyOptions(false);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Adjustments</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleAutoAdjust}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          <MagicWandIcon className="w-5 h-5" />
          Auto Adjust
        </button>
        <button
          onClick={handleRemoveBackground}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-pink-600 to-rose-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-rose-800 disabled:to-rose-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          <RemoveBgIcon className="w-5 h-5" />
          Remove BG
        </button>
         <button
          onClick={() => setShowBeautifyOptions(!showBeautifyOptions)}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-cyan-800 disabled:to-cyan-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ${showBeautifyOptions ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-cyan-300' : ''}`}
        >
          <BeautifyIcon className="w-5 h-5" />
          Beautify
        </button>
        <button
          onClick={handleUpscale}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-br from-green-500 to-teal-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-teal-800 disabled:to-teal-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          <UpscaleIcon className="w-5 h-5" />
          AI Upscale
        </button>
      </div>

      {showBeautifyOptions && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in p-2 bg-gray-900/30 rounded-lg">
          <button onClick={handleBeautifyFemale} disabled={isLoading} className="w-full text-center bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            For Female
          </button>
          <button onClick={handleBeautifyMale} disabled={isLoading} className="w-full text-center bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            For Male
          </button>
        </div>
      )}

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>
      
      <p className="text-md text-center text-gray-400">Apply a preset or describe your own adjustment below.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-white/10 text-gray-200 font-semibold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500' : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe an adjustment (e.g., 'change background to a forest')"
        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || !activePrompt.trim()}
            >
                Apply Adjustment
            </button>
        </div>
      )}
    </div>
  );
};

export default AdjustmentPanel;