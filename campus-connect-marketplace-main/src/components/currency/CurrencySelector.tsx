import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

const CurrencySelector: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency, currencies, isLoading } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = useMemo(
    () => currencies.find((currency) => currency.code === selectedCurrency),
    [currencies, selectedCurrency],
  );

  const filteredCurrencies = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return currencies;
    return currencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(normalized) || currency.symbol.toLowerCase().includes(normalized),
    );
  }, [currencies, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between"
          disabled={isLoading}
        >
          <span className="truncate">
            {selectedOption ? `${selectedOption.code} (${selectedOption.symbol})` : selectedCurrency}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="end">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search currency"
              className="pl-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border border-border">
            {filteredCurrencies.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">No currencies found.</div>
            ) : (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                    selectedCurrency === currency.code && 'bg-muted',
                  )}
                >
                  <span>{`${currency.code} (${currency.symbol})`}</span>
                  <Check className={cn('h-4 w-4', selectedCurrency === currency.code ? 'opacity-100' : 'opacity-0')} />
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CurrencySelector;
