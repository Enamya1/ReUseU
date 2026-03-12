# Search Suggestions Integration Guide

## Overview

The search suggestions system provides an intelligent product search experience with both text and image search capabilities. This guide shows how to integrate the suggestion template into your application.

## Components Created

### 1. SearchSuggestions Component (`@/components/ui/search-suggestions`)
- Displays product suggestions in a dropdown format
- Shows confidence scores, prices, and categories
- Supports loading states and different search types (text/image)
- Responsive design with mobile-friendly layout

### 2. SearchInputEnhanced Component (`@/components/ui/search-input-enhanced`)
- Enhanced version of the search input with suggestion integration
- Handles suggestion display logic and user interactions
- Maintains search state and manages suggestion visibility
- Supports both text and image search modes

### 3. useSearchWithSuggestions Hook (`@/hooks/useSearchWithSuggestions`)
- Provides search logic and suggestion management
- Generates mock suggestions for demonstration
- Handles image upload and search type switching
- Ready for API integration

## Integration Steps

### Step 1: Import the Components

```tsx
import SearchInputEnhanced from "@/components/ui/search-input-enhanced"
import { useSearchWithSuggestions } from "@/hooks/useSearchWithSuggestions"
```

### Step 2: Use the Hook in Your Component

```tsx
const Header = () => {
  const {
    suggestions,
    isLoading,
    generateSuggestions,
    handleSuggestionClick,
    handleImageUpload,
    handleSearchSubmit
  } = useSearchWithSuggestions()

  return (
    <div className="flex items-center gap-4">
      <SearchInputEnhanced
        suggestions={suggestions}
        isLoadingSuggestions={isLoading}
        onSuggestionClick={handleSuggestionClick}
        onImageUpload={handleImageUpload}
        onSearchSubmit={handleSearchSubmit}
        onChange={(e) => generateSuggestions(e.target.value)}
        className="text-white"
      />
    </div>
  )
}
```

### Step 3: Replace Existing SearchInput (Optional)

If you want to replace the existing search input in the Header component:

```tsx
// In Header.tsx, replace:
<SearchInput ... />

// With:
<SearchInputEnhanced
  suggestions={suggestions}
  isLoadingSuggestions={isLoading}
  onSuggestionClick={handleSuggestionClick}
  onImageUpload={handleImageUpload}
  onSearchSubmit={handleSearchSubmit}
  onChange={(e) => generateSuggestions(e.target.value)}
  className="text-white"
/>
```

## API Integration (Future)

When you're ready to connect to a real API, modify the `useSearchWithSuggestions` hook:

```tsx
// Replace the mock data generation with actual API calls
const generateSuggestions = useCallback(async (query: string, type: 'text' | 'image' = 'text') => {
  if (query.length < 2) {
    setSuggestions([])
    return
  }

  setIsLoading(true)

  try {
    const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}&type=${type}`)
    const data = await response.json()
    setSuggestions(data.suggestions)
  } catch (error) {
    console.error('Search suggestions error:', error)
    setSuggestions([])
  } finally {
    setIsLoading(false)
  }
}, [])
```

## Features

### Text Search
- Real-time suggestions as you type
- Confidence scores for each suggestion
- Category and price information
- Click to select and search

### Image Search
- Upload images via + button or drag & drop
- Enhanced confidence scores for visual search
- "Similar items" suggestions
- Automatic search type switching

### User Experience
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Accessibility features (screen reader support)
- Keyboard navigation support
- Loading states and error handling

## Customization

### Styling
The components use Tailwind CSS classes and can be customized via:
- `className` prop for container styling
- CSS variables for theme colors
- Component-specific className props

### Suggestion Data Structure
```tsx
interface SearchSuggestion {
  id: string
  title: string
  description?: string
  image?: string
  price?: number
  currency?: string
  category?: string
  confidence?: number
}
```

### Configuration Options
- `maxItems`: Maximum number of suggestions to display (default: 5)
- `type`: Search type ('text' | 'image')
- `visible`: Control suggestion visibility
- `isLoading`: Show loading state

## Demo

See `SearchWithSuggestionsDemo` component for a complete working example with mock data.

## Next Steps

1. **API Integration**: Replace mock data with real API calls
2. **Analytics**: Add search analytics and user behavior tracking
3. **Machine Learning**: Implement intelligent ranking and personalization
4. **Performance**: Add debouncing and caching for better performance
5. **Internationalization**: Add multi-language support for suggestions