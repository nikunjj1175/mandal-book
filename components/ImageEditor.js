import { useState, useRef, useEffect } from 'react';

export default function ImageEditor({ image, onSave, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleSave = () => {
    // Get the canvas and crop the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to 300x300 (standard QR code size)
      canvas.width = 300;
      canvas.height = 300;
      
      // Get container dimensions (h-96 = 384px)
      const containerSize = 384;
      
      // Calculate how the image fits in the container (object-contain behavior)
      const imgAspect = img.width / img.height;
      let displayedWidth, displayedHeight;
      
      if (imgAspect >= 1) {
        // Image is square or wider
        displayedWidth = Math.min(containerSize, img.width);
        displayedHeight = displayedWidth / imgAspect;
      } else {
        // Image is taller
        displayedHeight = Math.min(containerSize, img.height);
        displayedWidth = displayedHeight * imgAspect;
      }
      
      // Scale factor from displayed size to original image
      const scaleX = img.width / displayedWidth;
      const scaleY = img.height / displayedHeight;
      
      // Calculate the center point of the visible area
      const containerCenter = containerSize / 2;
      const imageCenterX = containerCenter + position.x;
      const imageCenterY = containerCenter + position.y;
      
      // Calculate what part of the original image is visible
      // The visible area is containerSize/zoom
      const visibleSize = containerSize / zoom;
      const cropSize = Math.min(visibleSize, Math.min(img.width, img.height));
      
      // Calculate source position (center the crop on the image center)
      const sourceX = Math.max(0, Math.min(
        img.width - cropSize,
        (imageCenterX - containerCenter) * scaleX + (img.width / 2) - (cropSize / 2)
      ));
      const sourceY = Math.max(0, Math.min(
        img.height - cropSize,
        (imageCenterY - containerCenter) * scaleY + (img.height / 2) - (cropSize / 2)
      ));
      
      // Draw cropped and scaled image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        300,
        300
      );
      
      // Convert to base64
      const croppedImage = canvas.toDataURL('image/png', 0.95);
      onSave(croppedImage);
    };
    
    img.src = image;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit QR Code Image
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Editor Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div
              ref={containerRef}
              className="relative w-full h-96 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-300 dark:border-slate-600 overflow-hidden cursor-move shadow-inner"
              onMouseDown={handleMouseDown}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  transformOrigin: 'center center',
                }}
              >
                <img
                  ref={imageRef}
                  src={image}
                  alt="QR Code"
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
              
              {/* Grid Overlay */}
              {zoom > 1 && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20" 
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }} 
                />
              )}
              
              {/* Center Guide Lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 opacity-50 transform -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 opacity-50 transform -translate-x-1/2"></div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-4">
            {/* Zoom Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Tip:</strong> Use zoom controls to adjust size. Drag the image when zoomed in to position it. The image will be cropped to 300x300px when saved.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md"
          >
            Save & Use
          </button>
        </div>
      </div>
    </div>
  );
}

