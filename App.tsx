/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateErasedImage } from './services/geminiService';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import TransformPanel from './components/TransformPanel';
import ErasePanel from './components/ErasePanel';
import { UndoIcon, RedoIcon, EyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'erase' | 'adjust' | 'filters' | 'crop' | 'transform';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [erasePath, setErasePath] = useState<Array<{x: number, y: number}>>([]);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const eraseCanvasRef = useRef<HTMLCanvasElement>(null);
  const erasePathRef = useRef<Array<{x: number, y: number}>>([]);


  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const handleClearErase = useCallback(() => {
    erasePathRef.current = [];
    setErasePath([]);
    const canvas = eraseCanvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Effect to handle resizing of the erase canvas
  useEffect(() => {
    const canvas = eraseCanvasRef.current;
    const image = imgRef.current;

    if (canvas && image && activeTab === 'erase') {
        const setCanvasSize = () => {
            const rect = image.getBoundingClientRect();
            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width;
                canvas.height = rect.height;
                 // Resizing clears the path. A more complex solution could rescale it.
                handleClearErase();
            }
        };
        
        setCanvasSize(); // Set initial size
        
        const resizeObserver = new ResizeObserver(setCanvasSize);
        resizeObserver.observe(image);
        
        return () => resizeObserver.unobserve(image);
    }
  }, [activeTab, currentImageUrl, handleClearErase]);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    handleClearErase();
  }, [history, historyIndex, handleClearErase]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    handleClearErase();
  }, [handleClearErase]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);

  const handleApplyErase = useCallback(async () => {
    if (!currentImage || erasePathRef.current.length < 2 || !imgRef.current || !eraseCanvasRef.current) {
        setError('Please draw on the image to select an area to erase.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const image = imgRef.current;
        const displayCanvas = eraseCanvasRef.current;
        const { naturalWidth, naturalHeight } = image;
        
        // Create mask canvas with original image dimensions
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = naturalWidth;
        maskCanvas.height = naturalHeight;
        const ctx = maskCanvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not create mask canvas context.');
        }

        // Black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, naturalWidth, naturalHeight);

        // Calculate scaling factors
        const scaleX = naturalWidth / displayCanvas.width;
        const scaleY = naturalHeight / displayCanvas.height;

        // Draw the path on the mask canvas
        const path = erasePathRef.current;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 30 * scaleX; // Scale line width for a thick mask
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
        }
        ctx.stroke();

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');

        const erasedImageUrl = await generateErasedImage(currentImage, maskFile);
        const newImageFile = dataURLtoFile(erasedImageUrl, `erased-${Date.now()}.png`);
        
        addImageToHistory(newImageFile);
        // handleClearErase is called inside addImageToHistory

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the erase. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleTransform = useCallback(async (transformation: 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical') => {
    if (!currentImage) {
      setError('No image loaded to transform.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const transformedImageUrl = await new Promise<string>((resolve, reject) => {
            const image = new Image();
            const objectUrl = URL.createObjectURL(currentImage);
            image.src = objectUrl;

            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Could not get canvas context.'));
                    return;
                }

                const { naturalWidth: w, naturalHeight: h } = image;
                
                switch (transformation) {
                    case 'rotate-left':
                    case 'rotate-right':
                        canvas.width = h;
                        canvas.height = w;
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate((transformation === 'rotate-left' ? -90 : 90) * Math.PI / 180);
                        ctx.drawImage(image, -w / 2, -h / 2, w, h);
                        break;
                    case 'flip-horizontal':
                        canvas.width = w;
                        canvas.height = h;
                        ctx.translate(w, 0);
                        ctx.scale(-1, 1);
                        ctx.drawImage(image, 0, 0, w, h);
                        break;
                    case 'flip-vertical':
                        canvas.width = w;
                        canvas.height = h;
                        ctx.translate(0, h);
                        ctx.scale(1, -1);
                        ctx.drawImage(image, 0, 0, w, h);
                        break;
                }
                
                URL.revokeObjectURL(objectUrl);
                resolve(canvas.toDataURL('image/png'));
            };
            
            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image for transformation.'));
            };
        });

        const newImageFile = dataURLtoFile(transformedImageUrl, `transformed-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the transformation. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      handleClearErase();
    }
  }, [canUndo, historyIndex, handleClearErase]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
      handleClearErase();
    }
  }, [canRedo, historyIndex, handleClearErase]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
      handleClearErase();
    }
  }, [history, handleClearErase]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
      handleClearErase();
  }, [handleClearErase]);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };
  
  const handleEraseMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'erase' || isLoading) return;
    setIsDrawing(true);
    const canvas = eraseCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    erasePathRef.current = [{ x, y }];
  };

  const handleEraseMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || activeTab !== 'erase' || isLoading) return;
      const canvas = eraseCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const lastPoint = erasePathRef.current[erasePathRef.current.length - 1];
      
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(74, 144, 226, 0.8)';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      erasePathRef.current.push({ x, y });
  };

  const handleEraseMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      setErasePath(erasePathRef.current);
  };


  const renderContent = () => {
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
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const imageDisplay = (
      <div className="relative">
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
        )}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'retouch' ? 'cursor-crosshair' : ''} ${activeTab === 'erase' ? 'pointer-events-none' : ''}`}
        />
        {activeTab === 'erase' && !isLoading && (
            <canvas
                ref={eraseCanvasRef}
                onMouseDown={handleEraseMouseDown}
                onMouseMove={handleEraseMouseMove}
                onMouseUp={handleEraseMouseUp}
                onMouseLeave={handleEraseMouseUp}
                className="absolute top-0 left-0 cursor-crosshair z-20"
            />
        )}
      </div>
    );
    
    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="Crop this image"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );


    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300">AI is working its magic...</p>
                </div>
            )}
            
            {activeTab === 'crop' ? (
              <ReactCrop 
                crop={crop} 
                onChange={c => setCrop(c)} 
                onComplete={c => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[60vh]"
              >
                {cropImageElement}
              </ReactCrop>
            ) : imageDisplay }

            {displayHotspot && !isLoading && activeTab === 'retouch' && (
                <div 
                    className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                >
                    <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-blue-400"></div>
                </div>
            )}
        </div>
        
        <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm">
            {(['retouch', 'erase', 'adjust', 'filters', 'crop', 'transform'] as Tab[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full capitalize font-semibold py-3 px-5 rounded-md transition-all duration-200 text-base ${
                        activeTab === tab 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
        
        <div className="w-full">
            {activeTab === 'retouch' && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-md text-gray-400">
                        {editHotspot ? 'Great! Now describe your localized edit below.' : 'Click an area on the image to make a precise edit.'}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex items-center gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? "e.g., 'change my shirt color to blue'" : "First click a point on the image"}
                            className="flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            type="submit"
                            className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            Generate
                        </button>
                    </form>
                </div>
            )}
            {activeTab === 'erase' && <ErasePanel onApplyErase={handleApplyErase} onClearErase={handleClearErase} isLoading={isLoading} canErase={erasePath.length > 0} />}
            {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
            {activeTab === 'transform' && <TransformPanel onTransform={handleTransform} isLoading={isLoading} />}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="Undo last action"
            >
                <UndoIcon className="w-5 h-5 mr-2" />
                Undo
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/5"
                aria-label="Redo last action"
            >
                <RedoIcon className="w-5 h-5 mr-2" />
                Redo
            </button>
            
            <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block"></div>

            {canUndo && (
              <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                  aria-label="Press and hold to see original image"
              >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Compare
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/10 hover:border-white/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent"
              >
                Reset
            </button>
            <button 
                onClick={handleUploadNew}
                className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
            >
                Upload New
            </button>

            <button 
                onClick={handleDownload}
                className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
            >
                Download Image
            </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;