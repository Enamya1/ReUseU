import React, { useState, useCallback } from 'react'
import SearchInputEnhanced from "@/components/ui/search-input-enhanced"
import { SearchSuggestion } from "@/components/ui/search-suggestions"

// Example component demonstrating search suggestions functionality
const SearchWithSuggestionsDemo: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<'text' | 'image'>('text')

  // Mock data for demonstration
  const mockProducts: SearchSuggestion[] = [
    {
      id: '1',
      title: 'iPhone 14 Pro Max',
      description: 'Excellent condition, 256GB, Space Gray',
      image: '/api/placeholder/60/60',
      price: 899,
      currency: 'USD',
      category: 'Electronics',
      confidence: 0.95
    },
    {
      id: '2',
      title: 'MacBook Air M2',
      description: 'Like new, 8GB RAM, 256GB SSD',
      image: '/api/placeholder/60/60',
      price: 1099,
      currency: 'USD',
      category: 'Electronics',
      confidence: 0.88
    },
    {
      id: '3',
      title: 'Nike Air Jordan 1',
      description: 'Size 10, White/Red, Limited Edition',
      image: '/api/placeholder/60/60',
      price: 250,
      currency: 'USD',
      category: 'Fashion',
      confidence: 0.82
    },
    {
      id: '4',
      title: 'Gaming Chair',
      description: 'Ergonomic design, RGB lighting',
      image: '/api/placeholder/60/60',
      price: 299,
      currency: 'USD',
      category: 'Furniture',
      confidence: 0.75
    },
    {
      id: '5',
      title: 'Coffee Maker',
      description: 'Programmable, 12-cup capacity',
      image: '/api/placeholder/60/60',
      price: 89,
      currency: 'USD',
      category: 'Home & Kitchen',
      confidence: 0.68
    }
  ]

  // Simulate search suggestions
  const handleSearch = useCallback((query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = mockProducts.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
      )
      
      setSuggestions(filtered)
      setIsLoading(false)
    }, 500)
  }, [])

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    console.log('Selected suggestion:', suggestion)
    // Here you would typically navigate to the product page or perform search
    // For now, we'll just clear suggestions
    setSuggestions([])
  }, [])

  const handleImageUpload = useCallback((file: File) => {
    console.log('Image uploaded:', file.name)
    setSearchType('image')
    
    // Simulate image search results
    setIsLoading(true)
    setTimeout(() => {
      // For image search, show different results with higher confidence
      const imageResults = mockProducts.map(product => ({
        ...product,
        confidence: Math.min(product.confidence + 0.1, 1) // Boost confidence for image search
      }))
      setSuggestions(imageResults)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleSearchSubmit = useCallback((query: string) => {
    console.log('Search submitted:', query)
    // Here you would typically navigate to search results page
    // or perform the actual search
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Search with AI Suggestions</h1>
        <p className="text-muted-foreground">
          Start typing to see intelligent product suggestions, or upload an image to find similar items.
        </p>
      </div>

      <div className="relative">
        <SearchInputEnhanced
          suggestions={suggestions}
          isLoadingSuggestions={isLoading}
          onSuggestionClick={handleSuggestionClick}
          onImageUpload={handleImageUpload}
          onSearchSubmit={handleSearchSubmit}
          suggestionType={searchType}
          placeholder="Search for products..."
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">How it works:</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Text Search</h3>
            <p className="text-sm text-muted-foreground">
              Type keywords to get instant product suggestions with confidence scores.
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Image Search</h3>
            <p className="text-sm text-muted-foreground">
              Click the + button or drag & drop an image to find visually similar products.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">Try these searches:</h3>
        <div className="flex flex-wrap gap-2">
          {['iPhone', 'MacBook', 'Nike', 'Gaming', 'Coffee'].map((term) => (
            <button
              key={term}
              onClick={() => {
                // Simulate typing in the search input
                const input = document.querySelector('input[type="text"]') as HTMLInputElement
                if (input) {
                  input.value = term
                  input.dispatchEvent(new Event('input', { bubbles: true }))
                  handleSearch(term)
                }
              }}
              className="px-3 py-1 text-sm bg-background border rounded-full hover:bg-accent transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchWithSuggestionsDemo