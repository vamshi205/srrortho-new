import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
}

export function InstrumentImageModal({
  isOpen,
  onClose,
  instrumentName,
  imageUrl,
  fallbackUrls,
}: InstrumentImageModalProps) {
  const [currentImageError, setCurrentImageError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(imageUrl || '');

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {instrumentName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
          {currentImageError && fallbackUrls && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Trying alternative URL format...
            </div>
          )}
          <img
            key={currentUrl}
            src={currentUrl}
            alt={instrumentName}
            className="max-w-full max-h-[70vh] object-contain rounded border border-border"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <div className="mt-4 text-xs text-muted-foreground text-center break-all max-w-full">
            <div className="mb-2">URL: {currentUrl}</div>
            {fallbackUrls && (
              <a
                href={fallbackUrls.original}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Open in new tab
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

