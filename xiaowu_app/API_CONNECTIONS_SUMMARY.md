# API Connections Summary - Profile Page & Related Features

## Overview
This document outlines all API endpoint connections for the profile page and its related features (My Listings, Favorites, Wallet, Language, Notifications) in the xiaowu_app.

---

## Profile Page (`app/(tabs)/profile.tsx`)

### Connected API Endpoints:

#### 1. **Wallet Balance**
- **Endpoint**: `GET /api/wallets`
- **Service**: `walletService.getWallets()`
- **Usage**: Displays user's wallet balance and currency in profile
- **Response**: Array of wallets with balance and currency

#### 2. **Language Settings**
- **Endpoint**: `GET /api/user/settings/language`
- **Service**: `authService.getLanguage()`
- **Usage**: Retrieves current user language preference
- **Response**: `{ language: "en" | "zh" | "ar" }`

- **Endpoint**: `PATCH /api/user/settings`
- **Service**: `authService.updateLanguage(language)`
- **Usage**: Updates user language preference
- **Request**: `{ language: string }`

#### 3. **My Listings Count**
- **Endpoint**: `GET /api/user/products/cards`
- **Service**: `productService.getMyProducts({ page: 1, page_size: 1 })`
- **Usage**: Gets total count of user's product listings
- **Response**: `{ total: number, products: Product[] }`

#### 4. **Favorites Count**
- **Endpoint**: `GET /api/user/get_favorites`
- **Service**: `favoritesService.getFavorites()`
- **Usage**: Gets count of favorited products
- **Response**: `{ products: Product[], total: number }`

#### 5. **Notifications Count**
- **Endpoint**: `GET /api/user/messages/notification`
- **Service**: `messageService.getMessageNotifications({ limit: 1 })`
- **Usage**: Gets unread message notifications count
- **Response**: `{ total: number, messages: any[] }`

#### 6. **User Profile**
- **Endpoint**: `GET /api/user/me`
- **Context**: `AuthContext` (automatically loaded)
- **Usage**: Displays user information (name, email, profile picture)
- **Response**: `{ user: User }`

#### 7. **Logout**
- **Endpoint**: `POST /api/user/logout`
- **Service**: `authService.logout()`
- **Usage**: Signs out the user
- **Response**: `{ message: "Logout successful" }`

---

## My Listings Page (`app/my-listings.tsx`)

### Connected API Endpoints:

#### 1. **Get User Products**
- **Endpoint**: `GET /api/user/products/cards`
- **Service**: `productService.getMyProducts({ page, page_size, status })`
- **Usage**: Fetches paginated list of user's product listings
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `page_size` (optional, default: 12)
  - `status` (optional: "available" | "sold")
- **Response**: 
  ```json
  {
    "products": Product[],
    "total": number,
    "page": number,
    "page_size": number,
    "total_pages": number
  }
  ```

#### 2. **Get Product Detail**
- **Endpoint**: `GET /api/user/get_product/{product_id}`
- **Service**: `productService.getProductDetail(productId)`
- **Usage**: View individual product details
- **Side Effect**: Creates behavioral event with type "click"

---

## Favorites Page (`app/favorites.tsx`)

### Connected API Endpoints:

#### 1. **Get Favorites**
- **Endpoint**: `GET /api/user/get_favorites`
- **Service**: `favoritesService.getFavorites()`
- **Usage**: Fetches all favorited products
- **Response**: `{ products: Product[], total: number }`

#### 2. **Add to Favorites**
- **Endpoint**: `POST /api/user/favorites`
- **Service**: `favoritesService.addFavorite(productId)`
- **Request**: `{ product_id: number }`
- **Usage**: Add product to favorites

#### 3. **Remove from Favorites**
- **Endpoint**: `DELETE /api/user/favorites/{product_id}`
- **Service**: `favoritesService.removeFavorite(productId)`
- **Usage**: Remove product from favorites

---

## Wallet Page (`app/wallet.tsx`)

### Connected API Endpoints:

#### 1. **Get Wallets**
- **Endpoint**: `GET /api/wallets`
- **Service**: `walletService.getWallets()`
- **Usage**: Fetches user's wallet information
- **Response**: `{ wallets: Wallet[] }`

#### 2. **Get Transactions**
- **Endpoint**: `GET /api/wallets/{wallet_id}/transactions`
- **Service**: `walletService.getTransactions(walletId, { page_size: 20 })`
- **Usage**: Fetches wallet transaction history
- **Query Parameters**:
  - `page` (optional)
  - `page_size` (optional)
  - `type` (optional)
- **Response**: `{ transactions: Transaction[], total: number }`

#### 3. **Top Up Wallet** (Handler ready)
- **Endpoint**: `POST /api/wallets/{wallet_id}/top-up`
- **Service**: `walletService.topUpWallet(walletId, amount)`
- **Request**: `{ amount: number }`

#### 4. **Withdraw from Wallet** (Handler ready)
- **Endpoint**: `POST /api/wallets/{wallet_id}/withdraw`
- **Service**: `walletService.withdrawFromWallet(walletId, amount)`
- **Request**: `{ amount: number }`

---

## Notification Service (`src/services/notificationService.ts`)

### Available API Endpoints:

#### 1. **Get Notification Settings**
- **Endpoint**: `GET /api/user/settings/notifications`
- **Service**: `notificationService.getNotificationSettings()`
- **Usage**: Retrieve user notification preferences

#### 2. **Update Notification Settings**
- **Endpoint**: `PATCH /api/user/settings/notifications`
- **Service**: `notificationService.updateNotificationSettings(settings)`
- **Request**: 
  ```json
  {
    "email_notifications": boolean,
    "push_notifications": boolean,
    "message_notifications": boolean,
    "product_notifications": boolean
  }
  ```

#### 3. **Get All Notifications**
- **Endpoint**: `GET /api/user/notifications`
- **Service**: `notificationService.getNotifications({ page, page_size, type })`

#### 4. **Mark Notification as Read**
- **Endpoint**: `PATCH /api/user/notifications/{notification_id}/read`
- **Service**: `notificationService.markNotificationRead(notificationId)`

#### 5. **Mark All Notifications as Read**
- **Endpoint**: `PATCH /api/user/notifications/read-all`
- **Service**: `notificationService.markAllNotificationsRead()`

---

## Additional Services Available

### Auth Service (`src/services/authService.ts`)
- `login(email, password)` - POST /api/user/login
- `signup(data)` - POST /api/user/signup
- `logout()` - POST /api/user/logout
- `updateProfile(data)` - PATCH /api/user/settings
- `getUniversityOptions(universityId?)` - GET /api/user/settings/university-options
- `updateUniversitySettings(data)` - PATCH /api/user/settings/university
- `getMetaOptions()` - GET /api/user/meta/options
- `uploadProfilePicture(imageUri)` - POST /api/user/settings/profile-picture

### Product Service (`src/services/productService.ts`)
- `getRecommendedProducts(params)` - GET /py/api/user/recommendations/products
- `getProductDetail(productId)` - GET /api/user/get_product/{product_id}
- `getSimilarProducts(productId, params)` - GET /py/api/user/products/{id}/similar
- `getNearbyProducts(params)` - GET /api/user/nearby
- `createProduct(data)` - POST /api/user/products
- `updateProduct(productId, data)` - PATCH /api/user/products/{id}
- `markProductSold(productId)` - PATCH /api/user/products/{id}/mark-sold
- `getProductForEdit(productId)` - GET /api/user/products/{id}/edit
- `getProductEngagement(productId)` - GET /api/user/products/{id}/engagement
- `searchProducts(params)` - GET /api/user/search/products
- `visualSearchProducts(imageUri, topK)` - POST /api/user/search/visual

### Message Service (`src/services/messageService.ts`)
- `sendMessage(data)` - POST /api/user/messages
- `getMessages(params)` - GET /api/user/messages
- `getMessageNotifications(params)` - GET /api/user/messages/notification
- `getMessageContacts(params)` - GET /api/user/messages/contacts
- `transferMoney(data)` - POST /api/user/messages/transfer
- `createPaymentRequest(data)` - POST /api/user/payment-requests
- `confirmPaymentRequest(requestId)` - POST /api/user/payment-requests/{id}/confirm

---

## Authentication Flow

All API requests use **Sanctum Bearer Token Authentication**:
- Token stored securely via `SecureStore`
- Automatically attached to requests via axios interceptor
- Header format: `Authorization: Bearer <token>`

---

## Error Handling

All services use centralized error handling via `handleApiError()`:
- Extracts error messages from API responses
- Handles validation errors
- Returns user-friendly error messages

---

## Summary

✅ **Profile Page**: Fully connected to all required endpoints
- Wallet balance display
- Language settings (get & update)
- My listings count
- Favorites count
- Notifications count
- User profile data
- Logout functionality

✅ **My Listings Page**: Fully connected
- Paginated product listings
- Filter by status (all/available/sold)
- Real-time data from API

✅ **Favorites Page**: Fully connected
- Get all favorites
- Add/remove favorites
- Real-time data from API

✅ **Wallet Page**: Fully connected
- Wallet balance display
- Transaction history
- Top-up/withdraw handlers ready

✅ **Notification Service**: Created and ready
- Get/update notification settings
- Fetch notifications
- Mark as read functionality

All pages now use real API data instead of mock data, with proper loading states and error handling.
