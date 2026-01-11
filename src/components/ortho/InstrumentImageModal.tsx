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
  const [triedUrls, setTriedUrls] = useState<Set<string>>(new Set());
  const [allFormatsFailed, setAllFormatsFailed] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setCurrentUrl(imageUrl);
      setRotation(0);
      setZoom(1);
      setCurrentImageError(false);
      setTriedUrls(new Set([imageUrl]));
      setAllFormatsFailed(false);
    }
  }, [imageUrl]);

  const handleImageError = () => {
    if (!fallbackUrls) {
      setAllFormatsFailed(true);
      return;
    }

    // Track that we tried this URL
    const updatedTriedUrls = new Set([...triedUrls, currentUrl]);
    setTriedUrls(updatedTriedUrls);
    
    // Try alternative formats in order: thumbnail -> preview -> uc -> original
    // Check which format we're currently on and try the next one
    if (currentUrl === fallbackUrls.thumbnail && !updatedTriedUrls.has(fallbackUrls.preview)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.preview);
      return;
    }
    if (currentUrl === fallbackUrls.preview && !updatedTriedUrls.has(fallbackUrls.uc)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.uc);
      return;
    }
    if (currentUrl === fallbackUrls.uc && fallbackUrls.original && !updatedTriedUrls.has(fallbackUrls.original)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.original);
      return;
    }
    
    // Also try formats we haven't tried yet, regardless of current URL
    if (!updatedTriedUrls.has(fallbackUrls.preview)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.preview);
      return;
    }
    if (!updatedTriedUrls.has(fallbackUrls.uc)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.uc);
      return;
    }
    if (fallbackUrls.original && !updatedTriedUrls.has(fallbackUrls.original)) {
      setCurrentImageError(true);
      setCurrentUrl(fallbackUrls.original);
      return;
    }
    
    // If we've tried all formats, show error
    setAllFormatsFailed(true);
    setCurrentImageError(false);
  };

  const handleImageLoad = () => {
    setCurrentImageError(false);
    setAllFormatsFailed(false);
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
          {currentImageError && fallbackUrls && !allFormatsFailed && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Trying alternative URL format...
            </div>
          )}
          
          {allFormatsFailed && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <p className="font-semibold">Unable to load image</p>
              <p className="mt-1 text-xs">All image formats failed to load. Please check the image URL.</p>
              {fallbackUrls?.original && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="mt-2"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Try opening in new tab
                </Button>
              )}
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
              {!allFormatsFailed ? (
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
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <p className="text-lg font-semibold mb-2">Image not available</p>
                  <p className="text-sm">Unable to load image from the provided URL</p>
                </div>
              )}
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

