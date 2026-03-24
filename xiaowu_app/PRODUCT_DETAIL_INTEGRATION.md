# Product Detail API Integration

## ✅ Successfully Connected GET /api/user/get_product/{product_id}

### **API Endpoint Specification**

**Endpoint:** `GET /api/user/get_product/{product_id}`

**Authentication:** 
- auth:sanctum required
- role=user only

**Path Parameters:**
- `product_id` (required, integer) - The ID of the product to retrieve

**Side Effects:**
- Creates a `behavioral_events` record with `event_type: "click"`
- Tracks user engagement for recommendation system

**Response Codes:**
- `200 OK` - Product retrieved successfully
  ```json
  {
    "message": "Product retrieved successfully",
    "product": {
      "id": 1,
      "title": "...",
      "price": 45,
      "images": [...],
      "tags": [...],
      "category": {...},
      "condition_level": {...},
      "seller": {...}
    }
  }
  ```
- `404 Not Found` - Product not found
  ```json
  {
    "message": "Product not found."
  }
  ```
- `422 Validation Error` - Invalid product_id format
  ```json
  {
    "message": "Validation Error",
    "errors": {...}
  }
  ```
- `403 Forbidden` - User access required
  ```json
  {
    "message": "Unauthorized: Only users can access this endpoint."
  }
  ```

---

## 📱 Implementation Details

### **Files Modified**

#### 1. `src/services/productService.ts`
- **Added:** `getProductDetail(productId: number)` function
- **Endpoint:** `/api/user/get_product/${productId}`
- **Returns:** `Product` object from response data
- **Features:**
  - Uses authenticated `apiClient`
  - Proper error handling
  - Returns `response.data.product` (nested structure)

```typescript
export const getProductDetail = async (productId: number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/api/user/get_product/${productId}`);
    return response.data.product;
  } catch (error) {
    throw handleApiError(error);
  }
};
```

#### 2. `app/product/[id].tsx`
- **Removed:** Mock data and simulated API calls
- **Added:** Real API integration with proper error handling
- **Features:**
  - Fetches product on mount
  - Validates product ID parameter
  - Shows loading state
  - Handles 404, 403, and validation errors
  - Displays toast notifications for errors

**Key Changes:**
```typescript
// Added imports
import { useAuth } from '../../src/contexts/AuthContext';
import { getProductDetail } from '../../src/services/productService';
import { useToast } from '../../src/hooks/useToast';

// Real API call in useEffect
useEffect(() => {
  const fetchProduct = async () => {
    if (!id) {
      toast({ title: 'Invalid product ID', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        toast({ title: 'Invalid product ID format', type: 'error' });
        setIsLoading(false);
        return;
      }

      const fetchedProduct = await getProductDetail(productId);
      setProduct(fetchedProduct);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      
      let errorMessage = 'Failed to load product';
      if (error.response?.status === 404) {
        errorMessage = 'Product not found';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. User access required.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ title: errorMessage, type: 'error' });
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProduct();
}, [id]);
```

#### 3. `src/types/index.ts`
- **Updated:** `Product` interface to match API response
- **Changes:**
  - Added `full_name?: string` to seller object
  - Added `dormitory_name?: string` to dormitory object

```typescript
export interface Product {
  seller?: {
    id: number;
    username: string;
    full_name?: string; // ← Added
    profile_picture?: string;
  };
  dormitory?: Dormitory | {
    latitude?: number;
    longitude?: number;
    dormitory_name?: string; // ← Added
  };
  // ... rest of fields
}
```

---

## 🎯 User Flow

1. **User clicks on a product card** → Navigates to `/product/[id]`
2. **App extracts product ID** from URL parameters
3. **Calls `getProductDetail(productId)`** → Backend API
4. **Backend creates behavioral event** (event_type: "click")
5. **Returns product data** with full details
6. **Displays product detail screen** with:
   - Image carousel
   - Title, price, badges
   - Description
   - Seller info
   - Location
   - Message/Favorite buttons

---

## 🔒 Authentication Requirements

**IMPORTANT:** This endpoint requires authentication!

- User must be logged in to view product details
- If user is not authenticated, the API will return 401/403 error
- The app shows appropriate error message: "Access denied. User access required."

---

## 🧪 Testing Checklist

### Test Cases:
1. ✅ **Valid product ID** - Should display product details
2. ✅ **Invalid product ID format** - Shows "Invalid product ID format" error
3. ✅ **Non-existent product** - Shows "Product not found" error
4. ✅ **Unauthenticated user** - Shows "Access denied" error
5. ✅ **Loading state** - Shows loading spinner while fetching
6. ✅ **Image carousel** - Displays all product images
7. ✅ **Seller info** - Shows seller name and location
8. ✅ **Message button** - Opens chat with seller
9. ✅ **Favorite button** - Toggles favorite status

---

## 📊 Behavioral Event Tracking

The backend automatically tracks:
- **Event Type:** "click"
- **Product ID:** Viewed product
- **User ID:** Current user
- **Session ID:** Current session
- **Timestamp:** When the view occurred

This data is used for:
- Personalized recommendations
- Analytics
- User behavior insights

---

## 🚀 Next Steps

The product detail page is now fully functional and connected to the real API! 

**What works:**
- ✅ Fetches real product data from backend
- ✅ Displays all product information
- ✅ Shows proper error messages
- ✅ Handles loading states
- ✅ Tracks behavioral events (backend side)
- ✅ Navigation to seller profile
- ✅ Message seller functionality

**Optional enhancements:**
- Add related products section
- Implement product sharing
- Add report/inappropriate content flag
- Show product view count/stats
- Recently viewed products history
