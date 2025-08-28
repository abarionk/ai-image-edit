/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { PlusIcon, MinusIcon } from './icons';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute bottom-4 right-4 bg-gray-900/60 backdrop-blur-sm rounded-lg p-1 flex items-center gap-1 border border-white/10 shadow-lg z-20">
      <button onClick={onZoomOut} disabled={scale <= 1} className="p-2 text-gray-300 hover:bg-white/20 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed">
        <MinusIcon className="w-5 h-5" />
      </button>
      <button onClick={onReset} className="px-3 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/20 rounded-md transition">
        {Math.round(scale * 100)}%
      </button>
      <button onClick={onZoomIn} disabled={scale >= 10} className="p-2 text-gray-300 hover:bg-white/20 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed">
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ZoomControls;
