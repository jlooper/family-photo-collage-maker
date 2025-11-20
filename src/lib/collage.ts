type Photo = {
  publicId: string;
};

/**
 * Builds a Cloudinary collage URL from uploaded photos and family name
 * @param cloudName - Cloudinary cloud name
 * @param photos - Array of photo objects with publicId
 * @param familyName - Family name to display in text overlay
 * @returns Complete Cloudinary transformation URL
 */
export function buildCollageUrl(
  cloudName: string,
  photos: Photo[],
  familyName: string
): string {
  if (!cloudName) {
    return '';
  }
  
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Base transformation: set dimensions and quality
  const baseTransform = 'w_1600,h_900,c_fill,q_auto,f_auto';

  // Require exactly 5 photos
  if (photos.length !== 5) {
    // Return empty string if not exactly 5 photos
    return '';
  }
  const photosToUse = photos;

  // Photo overlay positions: 5 photos arranged in a 3-column masonry layout
  // Canvas: 1600x900, leaving ~120px for text at bottom (usable ~780px)
  // Equal margins on all sides and equal gaps between images
  
  const canvasWidth = 1600;
  const canvasHeight = 900;
  const textSpace = 120; // Space reserved for text at bottom
  const usableHeight = canvasHeight - textSpace; // ~780px
  
  // Calculate equal margins and gaps
  // Total width: canvasWidth = 2*margin + 3*columnWidth + 2*gap
  // Total usable height: usableHeight = 2*margin + row1Height + gap + row2Height
  // We want equal margin (M) and equal gap (G) for consistency
  
  const margin = 50; // Equal margin on all sides
  const gap = 40; // Equal gap between images (both horizontal and vertical)
  
  // Calculate column width based on available space
  // Available width = canvasWidth - 2*margin - 2*gap (gaps between 3 columns)
  const availableWidth = canvasWidth - (2 * margin) - (2 * gap);
  const columnWidth = Math.floor(availableWidth / 3); // Equal width for all columns
  
  // Calculate row heights
  // Row 1 height (2/3) and Row 2 height (1/3) need to fit with gaps
  // Available height = usableHeight - 2*margin - gap (one gap between rows)
  const availableHeight = usableHeight - (2 * margin) - gap;
  const row1Height = Math.floor(availableHeight * 2 / 3); // ~520px for 2/3 proportion
  const row2Height = availableHeight - row1Height; // Remaining height (ensures exact fit)
  
  // Column 1 spans both rows (full height)
  const col1Height = row1Height + gap + row2Height;
  
  // Column 2: top (2/3), bottom (1/3)
  const col2TopHeight = row1Height;
  const col2BottomHeight = row2Height;
  
  // Column 3: top (1/3), bottom (2/3) - note: reversed proportions
  const col3TopHeight = row2Height;
  const col3BottomHeight = row1Height;
  
  const photoPositions: Array<{ 
    gravity: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number 
  }> = [
    // Position 1: Column 1, spans 2 rows (full height)
    // x = margin, y = margin
    { 
      gravity: 'g_north_west', 
      x: margin, 
      y: margin, 
      width: columnWidth, 
      height: col1Height
    },
    // Position 2: Column 2, top (2/3 height)
    // x = margin + columnWidth + gap, y = margin
    { 
      gravity: 'g_north_west', 
      x: margin + columnWidth + gap, 
      y: margin, 
      width: columnWidth, 
      height: col2TopHeight
    },
    // Position 3: Column 2, bottom (1/3 height)
    // x = margin + columnWidth + gap, y = margin + row1Height + gap
    { 
      gravity: 'g_north_west', 
      x: margin + columnWidth + gap, 
      y: margin + row1Height + gap, 
      width: columnWidth, 
      height: col2BottomHeight
    },
    // Position 4: Column 3, top (1/3 height)
    // x = margin + 2*columnWidth + 2*gap, y = margin
    { 
      gravity: 'g_north_west', 
      x: margin + (columnWidth + gap) * 2, 
      y: margin, 
      width: columnWidth, 
      height: col3TopHeight
    },
    // Position 5: Column 3, bottom (2/3 height)
    // x = margin + 2*columnWidth + 2*gap, y = margin + row2Height + gap
    { 
      gravity: 'g_north_west', 
      x: margin + (columnWidth + gap) * 2, 
      y: margin + row2Height + gap, 
      width: columnWidth, 
      height: col3BottomHeight
    },
  ];

  // Build photo overlays with rounded corners and gold border
  const photoOverlays: string[] = [];
  const cornerRadius = 25; // Rounded corner radius in pixels
  const borderWidth = 8; // Gold border width in pixels
  const goldColor = 'rgb:FFD700'; // Gold color (RGB: 255, 215, 0)
  
  photosToUse.forEach((photo, index) => {
    const position = photoPositions[index];
    // Replace slashes with colons in publicId for overlay syntax
    const overlayId = photo.publicId.replace(/\//g, ':');
    
    // Photo overlay structure: l_<id>/<crop>/<radius,border>/fl_layer_apply,<position>
    // Component 1: overlay declaration
    // Component 2: crop and resize  
    // Component 3: rounded corners and border (same component per docs)
    // Component 4: apply with positioning (x,y in same component as fl_layer_apply)
    // Build positioning params first
    const positionParams = [position.gravity];
    if (position.x > 0) {
      positionParams.push(`x_${position.x}`);
    }
    positionParams.push(`y_${position.y}`);
    
    const overlay = `l_${overlayId}/c_fill,w_${position.width},h_${position.height}/r_${cornerRadius},bo_${borderWidth}px_solid_${goldColor}/fl_layer_apply,${positionParams.join(',')}`;
    
    photoOverlays.push(overlay);
  });

  // Build white ribbon overlay (background for text)
  // Create a white rectangle that spans the full width, positioned at the bottom of the card
  const ribbonHeight = 100; // Height of the white ribbon (reduced to make it narrower)
  const ribbonBottomMargin = 20; // Margin from bottom of card (ribbon bottom will be this distance from card bottom)
  const ribbonOpacity = 70; // Opacity percentage (0-100), 70 = 70% opaque (30% transparent)
  
  // Position ribbon so its bottom is just above the bottom of the card
  // When using g_south, y_0 positions at bottom, y_20 positions 20px from bottom
  // For ribbon bottom to be at ribbonBottomMargin from bottom, we position from bottom
  const ribbonYFromBottom = ribbonBottomMargin; // Position from bottom so ribbon bottom is at this distance
  
  // White pixel public ID - upload a 1x1 or 10x10 white PNG to your Cloudinary account
  // Instructions: 
  // 1. Create a 1x1 white pixel PNG image (or use any small white image)
  // 2. Upload it to your Cloudinary account
  // 3. Note the public_id (e.g., "white-pixel" or "holiday-assets/white-pixel")
  // 4. Update the whitePixelPublicId below to match your uploaded image's public_id
  const whitePixelPublicId = 'holiday-assets/white-pixel'; // Change this to match your uploaded white pixel public_id
  
  // Replace slashes with colons for overlay syntax
  const whitePixelOverlayId = whitePixelPublicId.replace(/\//g, ':');
  
  // Create white ribbon overlay using the white pixel image
  // Scale it to full width and desired height, add opacity, position below images
  // o_<percentage> controls opacity (0-100)
  // Position from bottom using calculated y value
  const whiteRibbon = `l_${whitePixelOverlayId}/c_fill,w_${canvasWidth},h_${ribbonHeight}/o_${ribbonOpacity}/fl_layer_apply,g_south,y_${ribbonYFromBottom}`;
  
  // Build text overlay (placed on top of white ribbon, center-aligned)
  const currentYear = new Date().getFullYear();
  const textContent = `${familyName} – Holiday ${currentYear}`;
  // URL encode the text
  const encodedText = encodeURIComponent(textContent);
  // Text overlay: l_text:<font>:<text>,<color>/fl_layer_apply,<position>
  // Color must be in same component as text overlay (per docs)
  // Use g_south to center horizontally, and position text at vertical center of ribbon
  // Ribbon bottom is at ribbonBottomMargin, ribbon top is at ribbonBottomMargin + ribbonHeight
  // Center of ribbon is at: ribbonBottomMargin + (ribbonHeight / 2)
  // This positions the text baseline/center at the vertical center of the ribbon
  // Using a festive script font: Pacifico for a playful, rounded holiday feel
  const textYFromBottom = ribbonBottomMargin;
  const textOverlay = `l_text:Pacifico_70:${encodedText},co_rgb:000000/fl_layer_apply,g_south,y_${Math.round(textYFromBottom)}`;

  // Background public ID
  const backgroundId = 'holiday-assets/collage-bg';

  // Assemble the full URL
  // Order: base transform, photo overlays, white ribbon, text overlay, background
  // White ribbon comes before text so it appears behind it
  const segments = [
    baseTransform,
    ...photoOverlays,
    whiteRibbon,
    textOverlay,
    backgroundId,
  ];

  const fullUrl = `${baseUrl}/${segments.join('/')}`;
  
  // Debug: log the URL structure
  if (typeof window !== 'undefined') {
    console.log('Generated Cloudinary URL:', fullUrl);
    console.log('Segments:', segments);
  }
  
  return fullUrl;
}

