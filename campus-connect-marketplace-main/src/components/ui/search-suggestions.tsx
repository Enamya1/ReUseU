import * as React from "react"
import { Product } from "@/lib/mockData"
import ProductCard from "@/components/products/ProductCard"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export interface SearchSuggestion {
  id: string
  title: string
  description?: string
  image?: string
  price?: number
  currency?: string
  category?: string
  confidence?: number
}

export interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[]
  isLoading?: boolean
  onSuggestionClick?: (suggestion: SearchSuggestion) => void
  className?: string
  visible?: boolean
  maxItems?: number
  type?: 'text' | 'image'
}

const SearchSuggestions = React.forwardRef<HTMLDivElement, SearchSuggestionsProps>(
  ({ 
    suggestions, 
    isLoading = false, 
    onSuggestionClick, 
    className, 
    visible = false,
    maxItems = 5,
    type = 'text'
  }, ref) => {
    const { t } = useTranslation()
    
    if (!visible || suggestions.length === 0) {
      return null
    }

    const displayedSuggestions = suggestions.slice(0, maxItems)

    return (
      <div 
        ref={ref}
        className={cn(
          "absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg z-50",
          "max-h-[400px] overflow-y-auto",
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {type === 'image' ? t('search.suggestions.imageTitle') : t('search.suggestions.textTitle')}
            </h3>
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                {t('search.suggestions.loading')}
              </div>
            )}
          </div>
        </div>

        {/* Suggestions List */}
        <div className="py-2">
          {displayedSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick?.(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors duration-150",
                "border-b border-border/20 last:border-b-0"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Image */}
                {suggestion.image && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={suggestion.image} 
                      alt={suggestion.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {suggestion.title}
                    </h4>
                    {suggestion.price && (
                      <span className="text-sm font-semibold text-primary">
                        {suggestion.currency && suggestion.currency !== 'USD' 
                          ? `${suggestion.price} ${suggestion.currency}`
                          : `$${suggestion.price}`
                        }
                      </span>
                    )}
                  </div>
                  
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {suggestion.description}
                    </p>
                  )}

                  {suggestion.category && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-accent/30 text-accent-foreground rounded-full">
                        {suggestion.category}
                      </span>
                      {suggestion.confidence && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% {t('search.suggestions.match')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence indicator */}
                {suggestion.confidence && !suggestion.category && (
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      suggestion.confidence > 0.8 ? "bg-green-500" :
                      suggestion.confidence > 0.6 ? "bg-yellow-500" : "bg-orange-500"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {suggestions.length > maxItems && (
          <div className="px-4 py-3 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">
              {t('search.suggestions.more', { count: suggestions.length - maxItems })}
            </p>
          </div>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && !isLoading && (
          <div className="px-4 py-8 text-center">
            <div className="text-muted-foreground">
              <p className="text-sm">{t('search.suggestions.noResults')}</p>
              <p className="text-xs mt-1">{t('search.suggestions.tryDifferent')}</p>
            </div>
          </div>
        )}
      </div>
    )
  }
)

SearchSuggestions.displayName = "SearchSuggestions"

export default SearchSuggestions