import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface InstrumentImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentName: string;
  imageUrl: string | null;
  fallbackUrls?: {
    thumbnail: string;
    preview: string;
    uc: string;
    original: string;
  } | null;
  allInstruments?: Array<{ name: string; url: string; fallbackUrls?: any }>;
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function InstrumentImageModal({
  isOpen,
  onClose,
  instrumentName,
  imageUrl,
  fallbackUrls,
  allInstruments = [],
  currentIndex = 0,
  onNavigate,
}: InstrumentImageModalProps) {
  const [currentImageError, setCurrentImageError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(imageUrl || '');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (imageUrl) {
      setCurrentUrl(imageUrl);
      setRotation(0);
      setZoom(1);
      setCurrentImageError(false);
    }
  }, [imageUrl]);

  const handleImageError = () => {
    if (!currentImageError && fallbackUrls) {
      setCurrentImageError(true);
      // Try preview format
      if (currentUrl === fallbackUrls.thumbnail) {
        setCurrentUrl(fallbackUrls.preview);
        return;
      }
      // Try uc format
      if (currentUrl === fallbackUrls.preview) {
        setCurrentUrl(fallbackUrls.uc);
        return;
      }
    }
  };

  const handleImageLoad = () => {
    setCurrentImageError(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleNext = () => {
    if (allInstruments.length > 0 && onNavigate) {
      const nextIndex = (currentIndex + 1) % allInstruments.length;
      onNavigate(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (allInstruments.length > 0 && onNavigate) {
      const prevIndex = (currentIndex - 1 + allInstruments.length) % allInstruments.length;
      onNavigate(prevIndex);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fallbackUrls?.original) {
      window.open(fallbackUrls.original, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {instrumentName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4 relative">
          {currentImageError && fallbackUrls && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Trying alternative URL format...
            </div>
          )}
          
          {/* Image Container */}
          <div className="relative w-full flex items-center justify-center">
            {/* Navigation Buttons */}
            {allInstruments.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-2 z-10 bg-background/80 backdrop-blur-sm"
                  disabled={allInstruments.length <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 z-10 bg-background/80 backdrop-blur-sm"
                  disabled={allInstruments.length <= 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Image */}
            <div className="overflow-auto max-h-[70vh] w-full flex items-center justify-center">
              <img
                key={currentUrl}
                src={currentUrl}
                alt={instrumentName}
                className="rounded border border-border transition-transform"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Rotate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="flex items-center gap-2"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="hidden sm:inline">Zoom In</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="flex items-center gap-2"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="hidden sm:inline">Zoom Out</span>
              </Button>
              {fallbackUrls?.original && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </Button>
              )}
            </div>
            {/* Image Counter at Bottom */}
            {allInstruments.length > 1 && (
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} / {allInstruments.length}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

