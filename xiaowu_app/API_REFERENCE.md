# 🔌 API ENDPOINTS REFERENCE

Complete reference for all backend API endpoints used in the mobile application.

---

## 🏗️ BACKEND ARCHITECTURE

```
Mobile App
    ↓
┌───────────────────────────────────────┐
│   Laravel Backend (Port 8000)        │
│   - Authentication                    │
│   - Products CRUD                     │
│   - Messages                          │
│   - Wallet                            │
│   - User Management                   │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│   Python Backend (Port 8001)         │
│   - AI Features                       │
│   - Recommendations                   │
│   - Visual Search                     │
│   - Similar Products                  │
└───────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION ENDPOINTS

### Laravel Backend (Port 8000)

#### User Login
```
POST /api/user/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "account_completed": true
}
```

#### Admin Login
```
POST /api/admin/login
Content-Type: application/json

Request:
{
  "email": "admin@example.com",
  "password": "admin123"
}

Response (200):
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer"
}
```

#### User Signup
```
POST /api/user/signup
Content-Type: application/json

Request:
{
  "full_name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "phone_number": "+1234567890"
}

Response (201):
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### Logout
```
POST /api/user/logout
Authorization: Bearer {token}

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## 🛍️ PRODUCT ENDPOINTS

### Laravel Backend (Port 8000)

#### Get Product Detail
```
GET /api/user/get_product/{id}
Authorization: Bearer {token}

Response (200):
{
  "message": "Product retrieved successfully",
  "product": {
    "id": 1,
    "title": "iPhone 13 Pro",
    "description": "Like new condition",
    "price": 899.99,
    "currency": "USD",
    "status": "available",
    "seller": {...},
    "images": [...],
    "category": {...},
    "condition_level": {...}
  }
}
```

#### Create Product
```
POST /api/user/products
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "category_id": 1,
  "condition_level_id": 2,
  "title": "iPhone 13 Pro",
  "description": "Like new",
  "price": 899.99,
  "dormitory_id": 5,
  "tag_ids[]": [1, 2, 3],
  "images[]": [File, File],
  "primary_image_index": 0
}

Response (201):
{
  "message": "Product created successfully",
  "product": {...}
}
```

#### Update Product
```
PATCH /api/user/products/{id}
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Updated Title",
  "description": "Updated description",
  "price": 799.99,
  "category_id": 2,
  "condition_level_id": 3
}

Response (200):
{
  "message": "Product updated successfully",
  "product": {...}
}
```

#### Mark Product as Sold
```
PATCH /api/user/products/{id}/mark-sold
Authorization: Bearer {token}

Response (200):
{
  "message": "Product marked as sold",
  "product": {
    "id": 1,
    "status": "sold"
  }
}
```

#### Get My Product Cards
```
GET /api/user/products/cards?page=1&page_size=20
Authorization: Bearer {token}

Response (200):
{
  "message": "Products retrieved successfully",
  "page": 1,
  "page_size": 20,
  "total": 45,
  "total_pages": 3,
  "products": [...]
}
```

#### Get Product for Edit
```
GET /api/user/products/{id}/edit
Authorization: Bearer {token}

Response (200):
{
  "message": "Product retrieved successfully",
  "product": {
    "id": 1,
    "title": "...",
    "images": [...],
    "tags": [...]
  }
}
```

#### Get Product Engagement
```
GET /api/user/products/{id}/engagement
Authorization: Bearer {token}

Response (200):
{
  "message": "Engagement retrieved successfully",
  "product_id": 1,
  "views": 150,
  "clicks": 45,
  "recent_clickers": [...]
}
```

#### Search Products
```
GET /api/user/search/products?q=iphone&page=1&page_size=20
Authorization: Bearer {token}

Response (200):
{
  "message": "Search completed",
  "query": {
    "q": "iphone",
    "normalized": "iphone"
  },
  "page": 1,
  "page_size": 20,
  "total": 25,
  "products": [...]
}
```

#### Get Search Suggestions
```
GET /api/user/search/products/suggestions?q=iph&suggestions_limit=5
Authorization: Bearer {token}

Response (200):
{
  "message": "Suggestions retrieved",
  "query": {
    "q": "iph",
    "normalized": "iph"
  },
  "suggestions": ["iphone", "iphone 13", "iphone pro"]
}
```

#### Visual Search
```
POST /api/user/search/visual
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "image": File,
  "top_k": 10
}

Response (200):
{
  "message": "Visual search completed",
  "count": 10,
  "products": [...]
}
```

#### Get Nearby Products
```
GET /api/user/nearby?lat=40.7128&lng=-74.0060&distance_km=5
Authorization: Bearer {token}

Response (200):
{
  "message": "Nearby products retrieved",
  "center": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "distance_km": 5,
  "products": [...]
}
```

---

## 🔄 EXCHANGE ENDPOINTS

### Laravel Backend (Port 8000)

#### Create Exchange Product
```
POST /api/exchange-products
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "exchange_type": "exchange_only",
  "target_product_category_id": 2,
  "target_product_condition_id": 3,
  "target_product_title": "Looking for MacBook",
  "expiration_date": "2024-12-31",
  "category_id": 1,
  "condition_level_id": 2,
  "title": "iPhone 13",
  "price": 800,
  "images[]": [File, File]
}

Response (201):
{
  "message": "Exchange product created",
  "exchange_product": {...},
  "product": {...}
}
```

### Python Backend (Port 8001)

#### Get Exchange Recommendations
```
GET /py/api/user/recommendations/exchange-products?page=1&page_size=20
Authorization: Bearer {token}

Response (200):
{
  "message": "Recommendations retrieved",
  "page": 1,
  "page_size": 20,
  "exchange_products": [
    {
      "exchange_product": {...},
      "product": {...}
    }
  ]
}
```

---

## ❤️ FAVORITES ENDPOINTS

### Laravel Backend (Port 8000)

#### Get All Favorites
```
GET /api/user/get_favorites
Authorization: Bearer {token}

Response (200):
{
  "message": "Favorites retrieved",
  "products": [...]
}
```

#### Add to Favorites
```
POST /api/user/favorites
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "product_id": 1
}

Response (201):
{
  "message": "Product added to favorites"
}
```

---

## 💬 MESSAGE ENDPOINTS

### Laravel Backend (Port 8000)

#### Get Message Contacts
```
GET /api/user/messages/contacts?limit=50
Authorization: Bearer {token}

Response (200):
{
  "message": "Contacts retrieved",
  "total": 15,
  "contacts": [
    {
      "conversation_id": 1,
      "user": {...},
      "last_message": {...}
    }
  ]
}
```

#### Get Message Thread
```
GET /api/user/messages?conversation_id=1&limit=50&before_id=100
Authorization: Bearer {token}

Response (200):
{
  "message": "Messages retrieved",
  "conversation": {
    "id": 1,
    "other_user": {...}
  },
  "messages": [...]
}
```

#### Send Message
```
POST /api/user/messages
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "receiver_id": 2,
  "message_text": "Hello!",
  "product_id": 5
}

Response (201):
{
  "message": "Message sent",
  "conversation_id": 1,
  "message_data": {...}
}
```

#### Get Message Notifications
```
GET /api/user/messages/notification?limit=20
Authorization: Bearer {token}

Response (200):
{
  "message": "Notifications retrieved",
  "total": 5,
  "messages": [...]
}
```

#### Transfer Money
```
POST /api/user/messages/transfer
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "conversation_id": 1,
  "amount": 50.00,
  "currency": "USD",
  "reference": "Payment for iPhone"
}

Response (201):
{
  "message": "Transfer completed",
  "transfer": {...}
}
```

---

## 💰 WALLET ENDPOINTS

### Laravel Backend (Port 8000)

#### Get Wallet Balance
```
GET /api/wallets
Authorization: Bearer {token}

Response (200):
{
  "message": "Wallets retrieved",
  "wallets": [
    {
      "id": 1,
      "balance": "1250.50",
      "currency": "USD"
    }
  ]
}
```

#### Create Payment Request
```
POST /api/user/payment-requests
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "conversation_id": 1,
  "product_id": 5,
  "amount": 899.99,
  "currency": "USD",
  "message": "Payment for iPhone",
  "expires_in_hours": 24
}

Response (201):
{
  "message": "Payment request created",
  "payment_request": {...}
}
```

#### Confirm Payment Request
```
POST /api/user/payment-requests/{id}/confirm
Authorization: Bearer {token}

Response (200):
{
  "message": "Payment confirmed",
  "payment": {...}
}
```

---

## 🤖 AI ENDPOINTS

### Laravel Backend (Port 8000)

#### Create AI Session
```
POST /api/ai/sessions
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Product Search"
}

Response (201):
{
  "session_id": "uuid-here",
  "expires_at": "2024-12-31T23:59:59Z",
  "message": "Session created"
}
```

#### Send AI Message
```
POST /api/ai/sessions/{session_id}/messages
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "message": "Show me laptops under $1000",
  "message_type": "text"
}

Response (200):
{
  "response": "Here are some laptops...",
  "products": [...],
  "should_display_products": true
}
```

#### Send AI Voice Message
```
POST /api/ai/sessions/{session_id}/voice-call
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "message": "Show me phones",
  "audio_duration_seconds": 3
}

Response (200):
{
  "response": "Here are some phones...",
  "voice_response": {
    "text": "...",
    "should_speak": true
  }
}
```

#### Get AI History
```
GET /api/ai/history?page=1&page_size=20&include_messages=true
Authorization: Bearer {token}

Response (200):
{
  "message": "History retrieved",
  "page": 1,
  "page_size": 20,
  "total": 15,
  "history": [...]
}
```

#### Get AI Session Messages
```
GET /api/ai/sessions/{session_id}/messages
Authorization: Bearer {token}

Response (200):
{
  "message": "Messages retrieved",
  "session_id": "uuid",
  "messages": [...]
}
```

#### Delete AI History
```
DELETE /api/ai/history/{session_id}
Authorization: Bearer {token}

Response (200):
{
  "message": "Session deleted",
  "session_id": "uuid"
}
```

#### Rename AI History
```
PATCH /api/ai/history/{session_id}/rename
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "New Title"
}

Response (200):
{
  "message": "Session renamed",
  "session_id": "uuid",
  "title": "New Title"
}
```

---

## 👤 USER ENDPOINTS

### Laravel Backend (Port 8000)

#### Get User Profile
```
GET /api/user/settings
Authorization: Bearer {token}

Response (200):
{
  "message": "Profile retrieved",
  "user": {...}
}
```

#### Update User Profile
```
PATCH /api/user/settings
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
{
  "full_name": "John Doe",
  "username": "johndoe",
  "bio": "Hello world",
  "profile_picture": File
}

Response (200):
{
  "message": "Profile updated",
  "user": {...}
}
```

#### Get University Options
```
GET /api/user/settings/university-options?university_id=1
Authorization: Bearer {token}

Response (200):
{
  "message": "Options retrieved",
  "universities": [...],
  "dormitories": [...]
}
```

#### Update University Settings
```
PATCH /api/user/settings/university
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "university_id": 1,
  "dormitory_id": 5
}

Response (200):
{
  "message": "Settings updated",
  "user": {...},
  "university": {...},
  "dormitory": {...}
}
```

#### Get Seller Profile
```
GET /api/user/sellers/{id}?page=1&page_size=20
Authorization: Bearer {token}

Response (200):
{
  "message": "Seller profile retrieved",
  "seller": {...},
  "page": 1,
  "page_size": 20,
  "products": [...]
}
```

---

## 🏷️ META ENDPOINTS

### Laravel Backend (Port 8000)

#### Get Meta Options
```
GET /api/user/meta/options
Authorization: Bearer {token}

Response (200):
{
  "message": "Options retrieved",
  "categories": [...],
  "condition_levels": [...],
  "tags": [...]
}
```

#### Get Dormitories by University
```
GET /api/user/meta/dormitories/by-university
Authorization: Bearer {token}

Response (200):
{
  "message": "Dormitories retrieved",
  "university_id": 1,
  "dormitories": [...]
}
```

#### Create Tag
```
POST /api/user/tags
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "vintage"
}

Response (201):
{
  "message": "Tag created",
  "tag": {
    "id": 10,
    "name": "vintage"
  }
}
```

---

## 🐍 PYTHON BACKEND ENDPOINTS

### Python Backend (Port 8001)

#### Get Product Recommendations
```
GET /py/api/user/recommendations/products?page=1&page_size=20&random_count=5
Authorization: Bearer {token}

Response (200):
{
  "message": "Recommendations retrieved",
  "page": 1,
  "page_size": 20,
  "products": [...]
}
```

#### Get Similar Products
```
GET /py/api/user/products/{id}/similar?page=1&page_size=10
Authorization: Bearer {token}

Response (200):
{
  "message": "Similar products retrieved",
  "product_id": 1,
  "page": 1,
  "page_size": 10,
  "products": [...]
}
```

---

## 🔒 AUTHENTICATION HEADERS

All authenticated endpoints require:

```
Authorization: Bearer {access_token}
Accept: application/json
```

For file uploads:
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

---

## ⚠️ ERROR RESPONSES

### 400 Bad Request
```json
{
  "message": "Validation Error",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized: Only users can access this endpoint."
}
```

### 404 Not Found
```json
{
  "message": "Product not found."
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation Error",
  "errors": {
    "price": ["The price must be a number."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 📊 PAGINATION

Standard pagination format:

```json
{
  "page": 1,
  "page_size": 20,
  "total": 150,
  "total_pages": 8,
  "data": [...]
}
```

Query parameters:
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

---

## 🔍 FILTERING & SORTING

Common query parameters:

- `q` - Search query
- `category_id` - Filter by category
- `condition_level_id` - Filter by condition
- `min_price` - Minimum price
- `max_price` - Maximum price
- `sort_by` - Sort field (price, date, etc.)
- `sort_order` - asc or desc

---

**API Reference Complete! 🎉**
