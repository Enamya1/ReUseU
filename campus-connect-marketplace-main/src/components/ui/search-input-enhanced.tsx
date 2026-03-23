import * as React from "react"
import { Search, Camera, Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import SearchSuggestions, { SearchSuggestion } from "@/components/ui/search-suggestions"

export interface SearchInputEnhancedProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onImageUpload?: (file: File) => void
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  showImageButton?: boolean
  suggestions?: SearchSuggestion[]
  isLoadingSuggestions?: boolean
  onSuggestionClick?: (suggestion: SearchSuggestion) => void
  onSearchSubmit?: (query: string) => void
  suggestionType?: 'text' | 'image'
}

const SearchInputEnhanced = React.forwardRef<HTMLInputElement, SearchInputEnhancedProps>(
  ({ 
    className, 
    onImageUpload, 
    expanded: controlledExpanded, 
    onExpandedChange,
    showImageButton = true,
    suggestions = [],
    isLoadingSuggestions = false,
    onSuggestionClick,
    onSearchSubmit,
    suggestionType = 'text',
    onBlur,
    onKeyDown,
    onChange,
    ...props 
  }, ref) => {
    const [internalExpanded, setInternalExpanded] = React.useState(false)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const [isDragging, setIsDragging] = React.useState(false)
    const [showImageDropdown, setShowImageDropdown] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const suggestionsRef = React.useRef<HTMLDivElement>(null)
    const imageDropdownRef = React.useRef<HTMLDivElement>(null)
    
    const expanded = controlledExpanded ?? internalExpanded
    const setExpanded = onExpandedChange ?? setInternalExpanded
    
    // Show suggestions when expanded and there are suggestions or loading
    const showSuggestions = expanded && (suggestions.length > 0 || isLoadingSuggestions) && searchQuery.length > 0
    
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
            suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
          setExpanded(false)
          setShowImageDropdown(false)
        }
      }
      
      if (expanded) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [expanded, setExpanded])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target as Node) &&
            !containerRef.current?.contains(event.target as Node)) {
          setShowImageDropdown(false)
        }
      }

      if (showImageDropdown) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showImageDropdown])

    React.useEffect(() => {
      const handlePaste = (event: ClipboardEvent) => {
        if (!showImageDropdown) return
        if (!event.clipboardData?.items?.length) return
        const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'))
        if (!imageItem) return
        const file = imageItem.getAsFile()
        if (!file) return
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) return
        const maxBytes = 8 * 1024 * 1024
        if (file.size > maxBytes) return
        event.preventDefault()
        onImageUpload?.(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        setShowImageDropdown(false)
      }

      if (showImageDropdown) {
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
      }
    }, [onImageUpload, showImageDropdown])
    
    const handleFocus = React.useCallback(() => {
      setExpanded(true)
    }, [setExpanded])
    
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element
      if (!relatedTarget?.closest('[data-search-actions]') && 
          !relatedTarget?.closest('[data-image-dropdown]') &&
          !relatedTarget?.closest('.data-suggestions')) {
        setTimeout(() => {
          setExpanded(false)
        }, 150)
      }
      onBlur?.(e)
    }, [setExpanded, onBlur])
    
    const handleImageUpload = React.useCallback((file: File) => {
      if (!file || !file.type.startsWith('image/')) {
        return
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return
      }
      const maxBytes = 8 * 1024 * 1024
      if (file.size > maxBytes) {
        return
      }
      onImageUpload?.(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setShowImageDropdown(false)
    }, [onImageUpload])
    
    const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    }, [handleImageUpload])
    
    const handleImageRemove = React.useCallback(() => {
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, [])
    
    const handleImageButtonClick = React.useCallback(() => {
      setShowImageDropdown((prev) => !prev)
    }, [])

    const handleUploadButtonClick = React.useCallback(() => {
      fileInputRef.current?.click()
    }, [])
    
    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }, [])
    
    const handleDragLeave = React.useCallback(() => {
      setIsDragging(false)
    }, [])
    
    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      
      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find(file => file.type.startsWith('image/'))
      
      if (imageFile) {
        handleImageUpload(imageFile)
      }
    }, [handleImageUpload])
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && expanded) {
        setExpanded(false)
        setShowImageDropdown(false)
        containerRef.current?.querySelector('input')?.blur()
      } else if (e.key === 'Enter' && onSearchSubmit) {
        e.preventDefault()
        onSearchSubmit(searchQuery)
        setExpanded(false)
      }
      onKeyDown?.(e)
    }, [expanded, setExpanded, searchQuery, onSearchSubmit, onKeyDown])
    
    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      onChange?.(e)
    }, [onChange])
    
    const handleSuggestionClick = React.useCallback((suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.title)
      onSuggestionClick?.(suggestion)
      setExpanded(false)
    }, [onSuggestionClick, setExpanded])

    return (
      <div 
        ref={containerRef}
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-300 ease-in-out",
            "bg-background/80 backdrop-blur-sm rounded-full",
            "hover:bg-background focus-within:bg-background",
            expanded ? "w-[400px] shadow-lg" : "w-[200px]",
            isDragging && "bg-primary/5",
            className
          )}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors" />
            <Input
              ref={ref}
              type="text"
              placeholder={expanded ? "Enter a keyword to search products" : "Search"}
              className={cn(
                "border-0 bg-transparent pl-9 pr-3 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/70 transition-all duration-200",
                expanded ? "w-full" : "w-full"
              )}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onChange={handleInputChange}
              value={searchQuery}
              {...props}
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-full pointer-events-none">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 w-4" />
                  <span>Drop image to search</span>
                </div>
              </div>
            )}
          </div>
          
          {imagePreview && (
            <div className="relative group shrink-0">
              <img
                src={imagePreview}
                alt="Uploaded image"
                className="w-6 h-6 rounded-full object-cover transition-all duration-200"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground 
                         flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200
                         hover:scale-110 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {showImageButton && (
            <div className="flex items-center gap-1 shrink-0" data-search-actions>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 w-8 rounded-md p-0 bg-background/80 text-muted-foreground transition-all duration-300 ease-in-out",
                  "hover:bg-background hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  expanded ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )}
                onClick={handleImageButtonClick}
                aria-label="Upload image"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {showImageDropdown && (
          <div
            ref={imageDropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-3 rounded-xl bg-background/95 p-4 shadow-xl backdrop-blur"
            data-image-dropdown
          >
            <h3 className="text-center text-xl font-semibold text-foreground">Upload the image in the following way</h3>
            <div className="mt-4 rounded-xl p-6">
              <div className="mx-auto flex max-w-xs flex-col items-center gap-4 text-center">
                <Button
                  type="button"
                  onClick={handleUploadButtonClick}
                  className="h-12 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <div className="space-y-1 text-2xl leading-none text-foreground">
                  <p className="text-base">or drag image here</p>
                  <p className="text-base">
                    or press <span className="font-semibold text-destructive">Ctrl+V</span> to paste
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">Maximum file size: 8MB</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Suggestions Dropdown */}
        <SearchSuggestions
          ref={suggestionsRef}
          suggestions={suggestions}
          isLoading={isLoadingSuggestions}
          onSuggestionClick={handleSuggestionClick}
          visible={showSuggestions}
          type={suggestionType}
          maxItems={5}
          className="data-suggestions"
        />
        
        {/* Accessibility announcement */}
        <div className="sr-only" role="status" aria-live="polite">
          {expanded ? "Search expanded" : "Search collapsed"}
          {imagePreview && "Image uploaded for search"}
          {isDragging && "Drop image to search"}
          {showImageDropdown && "Image upload dropdown open"}
          {showSuggestions && `${suggestions.length} suggestions available`}
        </div>
      </div>
    )
  }
)

SearchInputEnhanced.displayName = "SearchInputEnhanced"

export default SearchInputEnhanced
