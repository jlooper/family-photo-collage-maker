import { useState, useRef, useEffect } from 'react';
import UploadWidget from './UploadWidget';
import { buildCollageUrl } from '../lib/collage';
import { uploadToCloudinary } from '../lib/upload';

type Photo = {
  publicId: string;
  url: string;
};

type Position = 'position1' | 'position2' | 'position3' | 'position4' | 'position5';

type CollageLayout = {
  position1: Photo | null; // Top Left
  position2: Photo | null; // Top Center
  position3: Photo | null; // Top Right
  position4: Photo | null; // Bottom Left
  position5: Photo | null; // Bottom Right
};

export default function FamilyCollageApp() {
  const [familyName, setFamilyName] = useState('Looper Family');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [collageLayout, setCollageLayout] = useState<CollageLayout>({
    position1: null,
    position2: null,
    position3: null,
    position4: null,
    position5: null,
  });
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedPhoto, setDraggedPhoto] = useState<Photo | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);
  const [editedCollageUrl, setEditedCollageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  const handleUpload = (info: { public_id: string; secure_url: string }) => {
    const newPhoto = { publicId: info.public_id, url: info.secure_url };
    setPhotos((prev) => {
      // Limit to 5 photos maximum
      if (prev.length >= 5) return prev;
      return [...prev, newPhoto];
    });
    
    // Auto-assign to first available position
    setCollageLayout((prev) => {
      if (!prev.position1) return { ...prev, position1: newPhoto };
      if (!prev.position2) return { ...prev, position2: newPhoto };
      if (!prev.position3) return { ...prev, position3: newPhoto };
      if (!prev.position4) return { ...prev, position4: newPhoto };
      if (!prev.position5) return { ...prev, position5: newPhoto };
      return prev;
    });
  };

  const [draggedFromPosition, setDraggedFromPosition] = useState<Position | null>(null);

  const handlePhotoDragStart = (photo: Photo, fromPosition?: Position) => {
    setDraggedPhoto(photo);
    setDraggedFromPosition(fromPosition || null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedPhoto(null);
    setDraggedFromPosition(null);
    setHoveredPosition(null);
  };

  const handlePositionDrop = (position: Position) => {
    if (draggedPhoto) {
      setCollageLayout((prev) => {
        const newLayout = { ...prev };
        
        // If dragging from another position, clear that position
        if (draggedFromPosition && draggedFromPosition !== position) {
          newLayout[draggedFromPosition] = null;
        }
        
        // If target position has a photo, swap them
        if (draggedFromPosition && prev[position]) {
          newLayout[draggedFromPosition] = prev[position];
        }
        
        // Place dragged photo in new position
        newLayout[position] = draggedPhoto;
        return newLayout;
      });
      setDraggedPhoto(null);
      setDraggedFromPosition(null);
      setHoveredPosition(null);
    }
  };

  const handlePositionDragOver = (e: React.DragEvent, position: Position) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredPosition(position);
  };

  const handlePositionDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setHoveredPosition(null);
    }
  };

  const removeFromPosition = (position: Position) => {
    setCollageLayout((prev) => ({
      ...prev,
      [position]: null,
    }));
  };

  const getPhotosInLayout = (): Photo[] => {
    // Return photos in order: position1, position2, position3, position4, position5
    const photosInLayout: Photo[] = [];
    if (collageLayout.position1) photosInLayout.push(collageLayout.position1);
    if (collageLayout.position2) photosInLayout.push(collageLayout.position2);
    if (collageLayout.position3) photosInLayout.push(collageLayout.position3);
    if (collageLayout.position4) photosInLayout.push(collageLayout.position4);
    if (collageLayout.position5) photosInLayout.push(collageLayout.position5);
    return photosInLayout;
  };

  const renderPositionSlot = (position: Position, index: number) => {
    const photo = collageLayout[position];
    const isHovered = hoveredPosition === position;
    const positionLabels = {
      position1: 'Position 1',
      position2: 'Position 2',
      position3: 'Position 3',
      position4: 'Position 4',
      position5: 'Position 5',
    };

    if (photo) {
      return (
        <div 
          className="w-full h-full relative group cursor-move"
          draggable
          onDragStart={(e) => {
            handlePhotoDragStart(photo, position);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={handlePhotoDragEnd}
        >
          <img
            src={photo.url}
            alt={`${positionLabels[position]} position`}
            className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl" />
          
          {/* Drag handle indicator */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-90 rounded-lg p-1.5 shadow-md">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
          
          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFromPosition(position);
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg z-10"
            title="Remove from collage"
          >
            ×
          </button>
          
          {/* Position label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent text-white text-xs font-semibold py-2 px-3 rounded-b-xl">
            <div className="flex items-center justify-between">
              <span>{positionLabels[position]}</span>
              <span className="text-xs opacity-75">Drag to move</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 border-2 border-dashed border-gray-300 rounded-xl">
          <svg
            className="w-16 h-16 mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium text-center">
            {isHovered ? (
              <span className="text-blue-600 font-semibold">Drop here to add photo</span>
            ) : (
              positionLabels[position]
            )}
          </span>
        </div>
      );
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary configuration missing. Please check your environment variables.');
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please drop only image files.');
      return;
    }

    // Check total photo count (limit to 5)
    const currentCount = photos.length;
    const maxAllowed = 5 - currentCount;
    
    if (maxAllowed <= 0) {
      alert('You have already uploaded 5 photos. Remove some photos before uploading more.');
      return;
    }

    const filesToUpload = imageFiles.slice(0, maxAllowed);
    if (filesToUpload.length < imageFiles.length) {
      alert(`Only ${maxAllowed} more photo${maxAllowed !== 1 ? 's' : ''} can be uploaded. The first ${maxAllowed} will be uploaded.`);
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map((file) =>
        uploadToCloudinary(file, cloudName, uploadPreset)
      );

      const results = await Promise.all(uploadPromises);
      
      results.forEach((result) => {
        handleUpload(result);
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleCopyUrl = async () => {
    if (!cloudName || photosForCollage.length !== 5) {
      alert('Please fill all 5 photo slots to generate the collage URL.');
      return;
    }

    const collageUrl = buildCollageUrl(cloudName, photosForCollage, familyName);

    try {
      await navigator.clipboard.writeText(collageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy URL. Please copy it manually.');
    }
  };

  const photosForCollage = getPhotosInLayout();
  const collageUrl = cloudName && photosForCollage.length === 5
    ? buildCollageUrl(cloudName, photosForCollage, familyName)
    : '';

  // Update edited URL when the generated collage URL changes (when photos/family name changes)
  // This allows the user to edit the URL while still getting updates when the collage regenerates
  useEffect(() => {
    if (collageUrl) {
      setEditedCollageUrl(collageUrl);
    } else {
      setEditedCollageUrl('');
    }
  }, [collageUrl]);

  // Use edited URL if available, otherwise use generated URL
  const displayUrl = editedCollageUrl || collageUrl;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Family Holiday Collage Maker
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Invite your family to upload photos, then generate a shareable holiday collage powered by Cloudinary.
        </p>
      </header>

      {/* Controls */}
      <section className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="family-name" className="block text-sm font-medium text-gray-700">
            Family Name
          </label>
          <input
            id="family-name"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your family name"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isUploading ? (
                <span className="font-medium">Uploading photos...</span>
              ) : isDragging ? (
                <span className="font-medium text-blue-600">Drop photos here</span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">Click to upload</span>
                  {' or drag and drop'}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each • Upload exactly 5 photos</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div>
          <UploadWidget onUpload={handleUpload} />
        </div>
      </section>

      {/* Collage Layout Arrangement - Masonry Grid */}
      <section className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Arrange Your Collage (5 Photos Required)
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Drag photos between positions to reorder them. Drag from gallery below to add photos.
        </p>
        
        {/* 3-Column Masonry Grid Layout */}
        {/* Column 1: spans 2 rows | Column 2: top 2/3, bottom 1/3 | Column 3: top 1/3, bottom 2/3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Spans 2 rows */}
          <div className="row-span-2">
            <div
              onDragOver={(e) => handlePositionDragOver(e, 'position1')}
              onDragLeave={handlePositionDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePositionDrop('position1');
              }}
              className={`
                relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                shadow-md hover:shadow-lg h-full min-h-[600px]
                ${collageLayout.position1 
                  ? 'border-gray-300 bg-white' 
                  : hoveredPosition === 'position1'
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-gray-50'
                }
                ${draggedFromPosition === 'position1' ? 'opacity-50 border-blue-300' : ''}
                ${draggedPhoto && !collageLayout.position1 ? 'cursor-pointer' : ''}
              `}
            >
              {renderPositionSlot('position1', 0)}
            </div>
          </div>

          {/* Column 2: Top 2/3, Bottom 1/3 */}
          <div className="flex flex-col gap-6">
            {/* Position 2 - Top, spans 2/3 */}
            <div
              onDragOver={(e) => handlePositionDragOver(e, 'position2')}
              onDragLeave={handlePositionDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePositionDrop('position2');
              }}
              className={`
                relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                shadow-md hover:shadow-lg h-[400px]
                ${collageLayout.position2 
                  ? 'border-gray-300 bg-white' 
                  : hoveredPosition === 'position2'
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-gray-50'
                }
                ${draggedFromPosition === 'position2' ? 'opacity-50 border-blue-300' : ''}
                ${draggedPhoto && !collageLayout.position2 ? 'cursor-pointer' : ''}
              `}
            >
              {renderPositionSlot('position2', 1)}
            </div>
            
            {/* Position 3 - Bottom, spans 1/3 */}
            <div
              onDragOver={(e) => handlePositionDragOver(e, 'position3')}
              onDragLeave={handlePositionDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePositionDrop('position3');
              }}
              className={`
                relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                shadow-md hover:shadow-lg h-[200px]
                ${collageLayout.position3 
                  ? 'border-gray-300 bg-white' 
                  : hoveredPosition === 'position3'
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-gray-50'
                }
                ${draggedFromPosition === 'position3' ? 'opacity-50 border-blue-300' : ''}
                ${draggedPhoto && !collageLayout.position3 ? 'cursor-pointer' : ''}
              `}
            >
              {renderPositionSlot('position3', 2)}
            </div>
          </div>

          {/* Column 3: Top 1/3, Bottom 2/3 */}
          <div className="flex flex-col gap-6">
            {/* Position 4 - Top, spans 1/3 */}
            <div
              onDragOver={(e) => handlePositionDragOver(e, 'position4')}
              onDragLeave={handlePositionDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePositionDrop('position4');
              }}
              className={`
                relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                shadow-md hover:shadow-lg h-[200px]
                ${collageLayout.position4 
                  ? 'border-gray-300 bg-white' 
                  : hoveredPosition === 'position4'
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-gray-50'
                }
                ${draggedFromPosition === 'position4' ? 'opacity-50 border-blue-300' : ''}
                ${draggedPhoto && !collageLayout.position4 ? 'cursor-pointer' : ''}
              `}
            >
              {renderPositionSlot('position4', 3)}
            </div>
            
            {/* Position 5 - Bottom, spans 2/3 */}
            <div
              onDragOver={(e) => handlePositionDragOver(e, 'position5')}
              onDragLeave={handlePositionDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePositionDrop('position5');
              }}
              className={`
                relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                shadow-md hover:shadow-lg h-[400px]
                ${collageLayout.position5 
                  ? 'border-gray-300 bg-white' 
                  : hoveredPosition === 'position5'
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-105' 
                    : 'border-gray-200 bg-gray-50'
                }
                ${draggedFromPosition === 'position5' ? 'opacity-50 border-blue-300' : ''}
                ${draggedPhoto && !collageLayout.position5 ? 'cursor-pointer' : ''}
              `}
            >
              {renderPositionSlot('position5', 4)}
            </div>
          </div>
        </div>

        {photosForCollage.length < 5 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Incomplete collage:</strong> You need {5 - photosForCollage.length} more photo{5 - photosForCollage.length !== 1 ? 's' : ''} to complete your collage.
            </p>
          </div>
        )}
      </section>

      {/* Uploads Gallery */}
      {photos.length > 0 && (
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your Photos ({photos.length} / 5)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Drag photos from here into the collage positions above
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {photos.map((photo, index) => {
              const isInLayout = 
                collageLayout.position1?.publicId === photo.publicId ||
                collageLayout.position2?.publicId === photo.publicId ||
                collageLayout.position3?.publicId === photo.publicId ||
                collageLayout.position4?.publicId === photo.publicId ||
                collageLayout.position5?.publicId === photo.publicId;
              
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handlePhotoDragStart(photo)}
                  onDragEnd={handlePhotoDragEnd}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-move
                    transition-opacity duration-200
                    ${isInLayout ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'}
                  `}
                >
                  <img
                    src={photo.url}
                    alt={`Family photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isInLayout && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                      In collage
                    </div>
                  )}
                </div>
              );
            })}
            {/* Show empty slots if less than 5 */}
            {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Generated Collage */}
      <section className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Your Holiday Collage
        </h2>

        {photosForCollage.length < 5 ? (
          <p className="text-gray-500 italic">
            {photos.length === 0 
              ? 'Upload 5 photos to create your collage.' 
              : `Add ${5 - photosForCollage.length} more photo${5 - photosForCollage.length !== 1 ? 's' : ''} to the position slots above to see your collage.`}
          </p>
        ) : (
          <>
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={displayUrl}
                  alt="Family holiday collage"
                  className="w-full h-auto"
                />
              </div>

            <div className="space-y-2">
              <label htmlFor="collage-url" className="block text-sm font-medium text-gray-700">
                Collage URL
              </label>
              <div className="flex gap-2">
                <input
                  id="collage-url"
                  type="text"
                  value={displayUrl}
                  onChange={(e) => setEditedCollageUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Edit the collage URL here"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(displayUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

