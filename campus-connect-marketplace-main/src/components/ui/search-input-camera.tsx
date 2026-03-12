import * as React from "react"
import { Search, Camera, Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onImageUpload?: (file: File) => void
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  showImageButton?: boolean
  suggestions?: any[]
  isLoadingSuggestions?: boolean
  onSuggestionClick?: (suggestion: any) => void
  onSearchSubmit?: (query: string) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
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
    const imageDropdownRef = React.useRef<HTMLDivElement>(null)
    
    const expanded = controlledExpanded ?? internalExpanded
    const setExpanded = onExpandedChange ?? setInternalExpanded
    
    // Show suggestions only when text area is clicked and there are suggestions
    const showSuggestions = expanded && (suggestions.length > 0 || isLoadingSuggestions) && searchQuery.length > 0
    
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target as Node) &&
            containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowImageDropdown(false)
        }
      }
      
      if (showImageDropdown) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showImageDropdown])
    
    // Handle Ctrl+V paste functionality
    React.useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        if (showImageDropdown && e.clipboardData?.files) {
          const items = Array.from(e.clipboardData.items)
          const imageItem = items.find(item => item.type.startsWith('image/'))
          
          if (imageItem) {
            const file = imageItem.getAsFile()
            if (file) {
              e.preventDefault()
              handleImageUpload(file)
              setShowImageDropdown(false)
            }
          }
        }
      }
      
      if (showImageDropdown) {
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
      }
    }, [showImageDropdown])
    
    const handleFocus = React.useCallback(() => {
      setExpanded(true)
    }, [setExpanded])
    
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element
      if (!relatedTarget?.closest('[data-search-actions]') && 
          !relatedTarget?.closest('[data-image-dropdown]') &&
          !relatedTarget?.closest('[data-suggestions]')) {
        // Delay collapse to allow suggestion clicks
        setTimeout(() => {
          setExpanded(false)
        }, 150)
      }
      props.onBlur?.(e)
    }, [setExpanded, props.onBlur])
    
    const handleImageUpload = React.useCallback((file: File) => {
      if (file && file.type.startsWith('image/')) {
        // Check file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
          alert('File size exceeds 20MB limit')
          return
        }
        
        onImageUpload?.(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        setShowImageDropdown(false)
      }
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
    
    const handleCameraButtonClick = React.useCallback(() => {
      setShowImageDropdown(!showImageDropdown)
    }, [showImageDropdown])
    
    const handleUploadButtonClick = React.useCallback(() => {
      fileInputRef.current?.click()
    }, [])
    
    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (showImageDropdown) {
        setIsDragging(true)
      }
    }, [showImageDropdown])
    
    const handleDragLeave = React.useCallback(() => {
      setIsDragging(false)
    }, [])
    
    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      
      if (showImageDropdown) {
        const files = Array.from(e.dataTransfer.files)
        const imageFile = files.find(file => file.type.startsWith('image/'))
        
        if (imageFile) {
          handleImageUpload(imageFile)
        }
      }
    }, [showImageDropdown, handleImageUpload])
    
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
      props.onKeyDown?.(e)
    }, [expanded, setExpanded, searchQuery, onSearchSubmit, props.onKeyDown])
    
    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      onChange?.(e)
    }, [onChange])

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
            "bg-background/80 backdrop-blur-sm rounded-full border border-border/60",
            "hover:bg-background hover:border-border/80 focus-within:bg-background focus-within:border-border",
            expanded ? "w-[400px] shadow-lg" : "w-[200px]",
            isDragging && "border-primary/50 bg-primary/5",
            className
          )}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors" />
            <Input
              ref={ref}
              type="text"
              placeholder={expanded ? "Search products, users, or upload an image..." : "Search"}
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
                  <ImageIcon className="w-4 h-4" />
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
                className="w-6 h-6 rounded-full object-cover border border-border transition-all duration-200"
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
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 rounded-full p-0 transition-all duration-300 ease-in-out",
                  "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
                  expanded ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )}
                onClick={handleCameraButtonClick}
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
        
        {/* Image Upload Dropdown */}
        {showImageDropdown && (
          <div 
            ref={imageDropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg z-50"
            data-image-dropdown
          >
            <div className="p-6 space-y-4">
              <div className="text-center space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full max-w-xs mx-auto"
                  onClick={handleUploadButtonClick}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>or drag image here</p>
                  <p>or press Ctrl+V to paste</p>
                </div>
                
                <div className="text-xs text-muted-foreground/70">
                  Maximum file size: 20MB
                </div>
              </div>
              
              {isDragging && (
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center bg-primary/5">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-primary font-medium">Drop image here to upload</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Accessibility announcement */}
        <div className="sr-only" role="status" aria-live="polite">
          {expanded ? "Search expanded" : "Search collapsed"}
          {imagePreview && "Image uploaded for search"}
          {isDragging && "Drop image to search"}
          {showImageDropdown && "Image upload dropdown open"}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

export default SearchInput