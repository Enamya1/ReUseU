# 🏗️ ARCHITECTURE DOCUMENTATION

## 📐 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native + Expo)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PRESENTATION LAYER                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Screens  │  │ Components │  │   Styles   │         │  │
│  │  │  (21 pages)│  │   (UI)     │  │(StyleSheet)│         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   STATE MANAGEMENT LAYER                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Auth     │  │  Currency  │  │ Favorites  │         │  │
│  │  │  Context   │  │  Context   │  │  Context   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐                          │  │
│  │  │   Theme    │  │React Query │                          │  │
│  │  │  Context   │  │  (Cache)   │                          │  │
│  │  └────────────┘  └────────────┘                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    BUSINESS LOGIC LAYER                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Hooks    │  │  Services  │  │   Utils    │         │  │
│  │  │  (Custom)  │  │   (API)    │  │ (Helpers)  │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      DATA LAYER                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Axios    │  │AsyncStorage│  │   i18n     │         │  │
│  │  │  (HTTP)    │  │ (Storage)  │  │(Translate) │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │   Laravel Backend    │      │   Python Backend     │        │
│  │     (Port 8000)      │      │     (Port 8001)      │        │
│  │                      │      │                      │        │
│  │  • Authentication    │      │  • AI Chat           │        │
│  │  • Products CRUD     │      │  • Recommendations   │        │
│  │  • Messages          │      │  • Visual Search     │        │
│  │  • Wallet            │      │  • Similar Products  │        │
│  │  • User Management   │      │  • ML Models         │        │
│  └──────────────────────┘      └──────────────────────┘        │
│            ↕                              ↕                      │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Database (MySQL/PostgreSQL)          │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAM

### Authentication Flow
```
User Input (Login)
    ↓
LoginScreen
    ↓
AuthContext.login()
    ↓
authApi.login() → Axios
    ↓
Laravel Backend (/api/user/login)
    ↓
Response (token + user)
    ↓
AsyncStorage.setItem('auth_token')
    ↓
AuthContext.setUser()
    ↓
Navigate to Home
```

### Product Listing Flow
```
User Opens App
    ↓
HomeScreen (index.tsx)
    ↓
useAuth().getRecommendedProducts()
    ↓
productsApi.getRecommended() → Axios
    ↓
Python Backend (/py/api/user/recommendations/products)
    ↓
Response (products array)
    ↓
React Query Cache
    ↓
Render ProductCards
```

### Create Listing Flow
```
User Fills Form
    ↓
CreateListingScreen
    ↓
expo-image-picker (select images)
    ↓
FormData (title, price, images)
    ↓
AuthContext.createProduct()
    ↓
productsApi.create() → Axios (multipart/form-data)
    ↓
Laravel Backend (/api/user/products)
    ↓
Upload images to storage
    ↓
Save to database
    ↓
Response (product created)
    ↓
Navigate to My Listings
```

### Favorites Flow
```
User Taps Heart Icon
    ↓
ProductCard
    ↓
FavoritesContext.toggleFavorite()
    ↓
favoritesApi.add() → Axios
    ↓
Laravel Backend (/api/user/favorites)
    ↓
Save to database
    ↓
Response (success)
    ↓
Update local state
    ↓
Re-render with filled heart
```

---

## 📱 SCREEN NAVIGATION FLOW

```
App Launch
    ↓
Check AsyncStorage for token
    ↓
┌─────────────┬─────────────┐
│  No Token   │  Has Token  │
└─────────────┴─────────────┘
      ↓              ↓
  Login Screen   Check account_completed
      ↓              ↓
  Signup      ┌──────────┬──────────┐
      ↓       │  false   │   true   │
  Onboarding  └──────────┴──────────┘
      ↓            ↓           ↓
      └────────→ Onboarding  Main App
                     ↓           ↓
                Main App    Tab Navigator
                     ↓           ↓
              ┌──────┴──────┬────────┬────────┬────────┐
              ↓             ↓        ↓        ↓        ↓
           Home        Create    Messages  Nearby   Profile
              ↓
        Product Detail
              ↓
        Seller Profile
```

---

## 🗂️ FILE STRUCTURE BREAKDOWN

### Screens (app/)
```
app/
├── (auth)/              # Authentication flow (Stack)
│   ├── _layout.tsx     # Auth stack navigator
│   ├── login.tsx       # Login screen
│   ├── signup.tsx      # Signup screen
│   └── onboarding.tsx  # Onboarding screen
│
├── (tabs)/              # Main app (Tabs)
│   ├── _layout.tsx     # Tab navigator
│   ├── index.tsx       # Home/Products feed
│   ├── create.tsx      # Create listing
│   ├── messages.tsx    # Messages list
│   ├── nearby.tsx      # Nearby products
│   └── profile.tsx     # User profile
│
├── product/             # Product detail (Stack)
│   └── [id].tsx        # Dynamic product detail
│
├── seller/              # Seller profile (Stack)
│   └── [id].tsx        # Dynamic seller profile
│
├── my-listing-detail/   # Edit listing (Stack)
│   └── [id].tsx        # Dynamic listing editor
│
├── ai/                  # AI features (Stack)
│   ├── assistant.tsx   # AI text chat
│   └── voice.tsx       # AI voice call
│
├── admin/               # Admin panel (Stack)
│   └── index.tsx       # Admin dashboard
│
├── exchange.tsx         # Exchange products (Modal)
├── favorites.tsx        # Favorites list (Modal)
├── my-listings.tsx      # My listings (Modal)
├── products.tsx         # All products (Modal)
├── search.tsx           # Search results (Modal)
├── wallet.tsx           # Wallet (Modal)
└── _layout.tsx          # Root layout
```

### Services (src/services/)
```
services/
├── api.ts               # Main Axios client
│   ├── apiClient        # Laravel backend instance
│   ├── apiClientPy      # Python backend instance
│   └── interceptors     # Auth & error handling
│
├── authService.ts       # Authentication endpoints
│   ├── login()
│   ├── signup()
│   ├── logout()
│   └── adminLogin()
│
├── productService.ts    # Product endpoints
│   ├── getRecommended()
│   ├── getDetail()
│   ├── create()
│   ├── update()
│   ├── search()
│   └── getNearby()
│
├── messageService.ts    # Message endpoints
│   ├── getContacts()
│   ├── getThread()
│   ├── send()
│   └── getNotifications()
│
├── walletService.ts     # Wallet endpoints
│   ├── getBalance()
│   ├── createPaymentRequest()
│   └── confirmPayment()
│
├── aiService.ts         # AI endpoints
│   ├── createSession()
│   ├── sendMessage()
│   ├── getHistory()
│   └── deleteSession()
│
└── favoritesService.ts  # Favorites endpoints
    ├── getAll()
    └── add()
```

### Contexts (src/contexts/)
```
contexts/
├── AuthContext.tsx
│   ├── State: user, token, isAuthenticated
│   ├── Actions: login, logout, signup
│   └── API calls: All backend endpoints
│
├── CurrencyContext.tsx
│   ├── State: selectedCurrency, rates
│   ├── Actions: setSelectedCurrency
│   └── Utils: convertPrice, formatPrice
│
├── FavoritesContext.tsx
│   ├── State: favorites, favoriteProducts
│   ├── Actions: toggleFavorite, addFavorite
│   └── API calls: Favorites endpoints
│
└── ThemeContext.tsx
    ├── State: theme (light/dark)
    └── Actions: toggleTheme
```

---

## 🔐 SECURITY IMPLEMENTATION

### Token Management
```typescript
// Storage
AsyncStorage.setItem('auth_token', token);
AsyncStorage.setItem('auth_token_type', 'Bearer');

// Axios Interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      AsyncStorage.removeItem('auth_token');
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);
```

### Secure Storage
- Tokens: AsyncStorage (encrypted on iOS)
- Sensitive data: expo-secure-store
- User preferences: AsyncStorage
- Cache: React Query (memory)

---

## 🌐 API ENDPOINT MAPPING

### Laravel Backend (Port 8000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/user/login | POST | User login |
| /api/admin/login | POST | Admin login |
| /api/user/signup | POST | User registration |
| /api/user/logout | POST | Logout |
| /api/user/products | GET/POST | Products CRUD |
| /api/user/products/{id} | GET/PATCH | Product detail/update |
| /api/user/products/{id}/mark-sold | PATCH | Mark sold |
| /api/user/favorites | GET/POST | Favorites |
| /api/user/messages | GET/POST | Messages |
| /api/user/messages/contacts | GET | Contact list |
| /api/wallets | GET | Wallet balance |
| /api/user/payment-requests | POST | Payment request |
| /api/user/settings | GET/PATCH | User profile |
| /api/user/nearby | GET | Nearby products |
| /api/user/search/products | GET | Search |
| /api/user/meta/options | GET | Categories, conditions |

### Python Backend (Port 8001)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /py/api/user/recommendations/products | GET | AI recommendations |
| /py/api/user/recommendations/exchange-products | GET | Exchange recommendations |
| /py/api/user/products/{id}/similar | GET | Similar products |
| /api/ai/sessions | POST | Create AI session |
| /api/ai/sessions/{id}/messages | POST | Send AI message |
| /api/ai/sessions/{id}/voice-call | POST | Voice call |
| /api/ai/history | GET | AI history |

---

## 📊 STATE MANAGEMENT STRATEGY

### Global State (Context)
- **AuthContext**: User, token, authentication
- **CurrencyContext**: Currency conversion
- **FavoritesContext**: Favorites list
- **ThemeContext**: Theme preference

### Server State (React Query)
- Products list
- Product details
- Messages
- Wallet balance
- AI history

### Local State (useState)
- Form inputs
- UI toggles
- Loading states
- Error messages

### Persistent State (AsyncStorage)
- Auth token
- User preferences
- Language selection
- Currency selection

---

## 🎨 STYLING APPROACH

### StyleSheet API
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
});
```

### Theme System
```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#0066FF',
  secondary: '#34C759',
  error: '#FF3B30',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
};
```

### Responsive Design
- Flexbox for layouts
- Percentage-based widths
- Platform-specific styles
- Screen size detection

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### Image Optimization
- expo-image (cached, optimized)
- Thumbnail support
- Lazy loading
- Placeholder images

### List Optimization
- FlatList with keyExtractor
- getItemLayout for fixed heights
- removeClippedSubviews
- maxToRenderPerBatch

### Network Optimization
- React Query caching
- Request deduplication
- Stale-while-revalidate
- Optimistic updates

### Bundle Optimization
- Code splitting (Expo Router)
- Lazy imports
- Tree shaking
- Asset optimization

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Services (API calls)
- Utils (helpers)
- Hooks (custom logic)

### Integration Tests
- Context providers
- API integration
- Navigation flows

### E2E Tests
- Critical user flows
- Authentication
- Product creation
- Checkout process

---

## 📈 SCALABILITY CONSIDERATIONS

### Code Organization
- Feature-based structure
- Reusable components
- Shared utilities
- Type safety (TypeScript)

### Performance
- Pagination for lists
- Infinite scroll
- Image caching
- Request batching

### Maintainability
- Clear naming conventions
- Comprehensive documentation
- Error boundaries
- Logging system

---

**Architecture Complete! Ready for Production! 🎉**
