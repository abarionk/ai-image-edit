/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ErasePanelProps {
  onApplyErase: () => void;
  onClearErase: () => void;
  isLoading: boolean;
  canErase: boolean;
}

const ErasePanel: React.FC<ErasePanelProps> = ({ onApplyErase, onClearErase, isLoading, canErase }) => {
  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">Magic Eraser</h3>
      <p className="text-md text-center text-gray-400 -mt-2">Draw over an object or blemish to remove it from the image.</p>
      
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button
          onClick={onClearErase}
          disabled={isLoading || !canErase}
          className="w-full bg-white/10 text-gray-200 font-semibold py-4 px-6 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={onApplyErase}
          disabled={isLoading || !canErase}
          className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          Erase Object
        </button>
      </div>
    </div>
  );
};

export default ErasePanel;