import { useEffect, useRef, useState } from 'react';

type UploadWidgetProps = {
  onUpload: (info: { public_id: string; secure_url: string }) => void;
};

type CloudinaryWidget = {
  open: () => void;
};

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: {
          cloudName: string;
          uploadPreset: string;
          sources: string[];
          multiple: boolean;
          maxFiles: number;
        },
        callback: (error: any, result: any) => void
      ) => CloudinaryWidget;
    };
  }
}

// Helper function to wait for Cloudinary script to load
function waitForCloudinary(maxAttempts = 50, interval = 100): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkCloudinary = () => {
      if (window.cloudinary && window.cloudinary.createUploadWidget) {
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkCloudinary, interval);
      } else {
        reject(new Error('Cloudinary script failed to load'));
      }
    };
    checkCloudinary();
  });
}

export default function UploadWidget({ onUpload }: UploadWidgetProps) {
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration missing. Please set PUBLIC_CLOUDINARY_CLOUD_NAME and PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file.');
      setIsLoading(false);
      return;
    }

    // Wait for Cloudinary script to load
    waitForCloudinary()
      .then(() => {
        if (!window.cloudinary?.createUploadWidget) {
          throw new Error('Cloudinary createUploadWidget not available');
        }

        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName,
            uploadPreset,
            sources: ['local', 'camera', 'url'],
            multiple: true,
            maxFiles: 5,
          },
          (error, result) => {
            if (error) {
              console.error('Upload error:', error);
              return;
            }

            if (result && result.event === 'success') {
              onUpload({
                public_id: result.info.public_id,
                secure_url: result.info.secure_url,
              });
            }
          }
        );
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to initialize Cloudinary widget:', err);
        setError('Failed to load Cloudinary upload widget. Please refresh the page.');
        setIsLoading(false);
      });
  }, [onUpload]);

  const handleClick = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      if (error) {
        alert(error);
      } else {
        alert('Upload widget is still loading. Please wait a moment and try again.');
      }
    }
  };

  if (error) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleClick}
          disabled
          className="px-6 py-3 bg-gray-400 text-white font-bold rounded-lg cursor-not-allowed"
        >
          Add family photos
        </button>
        <p className="text-sm text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-6 py-3 bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isLoading ? 'Loading...' : '🎄 Add family photos 🎁'}
    </button>
  );
}

