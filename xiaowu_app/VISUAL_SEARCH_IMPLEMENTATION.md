# Visual Search Implementation Summary

## Overview
Implemented visual search functionality in the xiaowu_app that allows users to search for products by taking a photo or selecting an image from their gallery.

## Features Implemented

### 1. Camera/Gallery Integration
- **Camera Access**: Opens device camera with proper permission handling
- **Gallery Access**: Opens photo gallery for image selection
- **Action Sheet**: iOS-style action sheet and Android alert dialog for choosing between camera/gallery
- **Image Editing**: Allows users to crop/edit images before searching (1:1 aspect ratio)

### 2. API Connection
- **Endpoint**: `POST /api/user/search/visual`
- **Authentication**: Uses auth:sanctum token (automatically added by apiClient)
- **Request Format**: Multipart/form-data
- **Parameters**:
  - `image` (required): Image file from camera/gallery
  - `top_k` (optional): Set to 12 results
- **Response Handling**:
  - Success (200): Displays products with similarity scores
  - Unauthorized (403): Shows authentication error
  - Validation Error (422): Shows invalid image error
  - Service Unavailable (502): Shows service unavailable message

### 3. Visual Search Results Display
- **Similarity Badges**: Shows match percentage (e.g., "95% match") on each product card
- **Result Count**: Displays total number of results found
- **Visual Search Indicator**: Shows "🔍 Visual Search" label when in visual search mode
- **Empty States**: 
  - No results: "No similar products found. Try a different image."
  - Initial state: "Start typing or use camera to search"

### 4. User Experience Enhancements
- **Loading States**: Shows "Analyzing image..." during visual search
- **Error Handling**: User-friendly error messages for different scenarios
- **Permission Handling**: Guides users to enable camera permissions if denied
- **Image Quality**: Optimized to 0.8 quality for faster upload
- **Responsive UI**: Disabled buttons during loading to prevent multiple requests

## Files Modified/Created

### 1. `/app/search.tsx`
- Added visual search functionality
- Integrated camera and gallery pickers
- Display similarity scores on product cards
- Enhanced error handling and loading states

### 2. `/src/components/forms/ImagePicker.tsx`
- Added action sheet for camera/gallery selection
- Removed separate camera button for cleaner UI
- Improved permission handling

### 3. `/app/create-listing.tsx`
- Connected to product creation API endpoint
- Dynamic metadata loading (categories, conditions)
- Proper image upload with FormData
- Form validation and error handling

## API Endpoints Used

### Visual Search
```
POST /api/user/search/visual
Content-Type: multipart/form-data
Authorization: Bearer {token}

Request:
- image: File (jpg|jpeg|png|webp, max 8MB)
- top_k: 12 (optional)

Response:
{
  "message": "Visual search completed successfully",
  "query": {
    "top_k": 12,
    "model_name": "ViT-B-32",
    "embedding_dim": 512
  },
  "count": 2,
  "products": [
    {
      "id": 1,
      "title": "Product Name",
      "price": 100,
      "visual_similarity_score": 0.95,
      ...
    }
  ]
}
```

### Product Creation
```
POST /api/user/products
Content-Type: multipart/form-data
Authorization: Bearer {token}

Request:
- title: string (required)
- description: string
- price: number (required)
- category_id: integer (required)
- condition_level_id: integer (required)
- images: File[] (required, max 6)
```

### Metadata
```
GET /api/user/meta/options
Authorization: Bearer {token}

Response:
{
  "categories": [...],
  "condition_levels": [...],
  "tags": [...]
}
```

## User Flow

### Visual Search Flow:
1. User taps camera icon 📷 in search screen
2. Action sheet appears with options:
   - Take Photo
   - Choose from Gallery
   - Cancel
3. User selects option:
   - **Take Photo**: Camera opens → User takes photo → Image is cropped → Search executes
   - **Choose from Gallery**: Gallery opens → User selects image → Image is cropped → Search executes
4. Loading indicator shows "Analyzing image..."
5. Results display with similarity scores (e.g., "95% match")
6. User can tap any product to view details

### Product Creation Flow:
1. User taps "Add Photo" button
2. Action sheet appears (same as visual search)
3. User takes photo or selects from gallery
4. Images are added to the form
5. User fills in product details
6. Form validates all required fields
7. Product is created with images uploaded

## Technical Details

### Image Processing
- **Format**: Automatically detects image format (jpg, jpeg, png, webp)
- **Quality**: Compressed to 0.8 for optimal upload speed
- **Aspect Ratio**: 1:1 for consistent display
- **Max Size**: 8MB per image (enforced by API)

### Permission Handling
- **Camera**: Requests permission before opening camera
- **Gallery**: No permission needed on most devices
- **Error Messages**: Clear instructions if permission denied

### Error Handling
- Network errors: "Failed to search products"
- Invalid image: "Please select a valid image"
- Service unavailable: "Visual search service is currently unavailable"
- No results: "No similar products found. Try a different image."

## Testing Checklist

- [x] Camera opens when "Take Photo" selected
- [x] Gallery opens when "Choose from Gallery" selected
- [x] Image uploads successfully to API
- [x] Visual search results display correctly
- [x] Similarity scores show on product cards
- [x] Loading states work properly
- [x] Error messages display correctly
- [x] Permission requests work on iOS and Android
- [x] Product creation with images works
- [x] Form validation prevents invalid submissions

## Future Enhancements

1. **Image Preview**: Show selected image before searching
2. **Search History**: Save recent visual searches
3. **Batch Upload**: Allow multiple images for visual search
4. **Filters**: Add filters to visual search results (price, category, etc.)
5. **Similar Products**: Show "Find Similar" button on product detail pages
