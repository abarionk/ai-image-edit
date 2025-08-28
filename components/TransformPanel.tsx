/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { RotateLeftIcon, RotateRightIcon, FlipHorizontalIcon, FlipVerticalIcon } from './icons';

type Transformation = 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical';

interface TransformPanelProps {
  onTransform: (transformation: Transformation) => void;
  isLoading: boolean;
}

const TransformPanel: React.FC<TransformPanelProps> = ({ onTransform, isLoading }) => {
  const transformations = [
    { name: 'Rotate Left', type: 'rotate-left' as Transformation, icon: RotateLeftIcon },
    { name: 'Rotate Right', type: 'rotate-right' as Transformation, icon: RotateRightIcon },
    { name: 'Flip Horizontal', type: 'flip-horizontal' as Transformation, icon: FlipHorizontalIcon },
    { name: 'Flip Vertical', type: 'flip-vertical' as Transformation, icon: FlipVerticalIcon },
  ];

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Transform Image</h3>
      <p className="text-sm text-center text-gray-400 -mt-2">Apply rotations or flips to the image.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {transformations.map(t => (
          <button
            key={t.name}
            onClick={() => onTransform(t.type)}
            disabled={isLoading}
            className="w-full flex flex-col items-center justify-center gap-2 text-center bg-white/10 text-gray-200 font-semibold py-4 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <t.icon className="w-8 h-8" />
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransformPanel;