import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  mockWallets, 
  mockTransactions, 
  mockWalletHistory, 
  Wallet as WalletType, 
  Transaction, 
  WalletStatusHistory 
} from '@/lib/mockData';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  History, 
  ShieldAlert, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Lock,
  Unlock,
  Coins,
  Globe,
  Eye,
  EyeOff,
  Power,
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import CurrencySelector from '@/components/currency/CurrencySelector';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/api';

const WalletPage = () => {
  const { user, accessToken, tokenType, refreshBalance } = useAuth();
  const { formatWithSelectedCurrency, selectedCurrency, setSelectedCurrency, convertPrice, currencies } = useCurrency();
  
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusHistory, setStatusHistory] = useState<WalletStatusHistory[]>([]);
  
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [walletStatusReason, setWalletStatusReason] = useState('');

  // Fetch wallets from API
  const fetchWallets = async () => {
    if (!accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/wallets'), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const transformedWallets: WalletType[] = (data.wallets || []).map((w: any) => ({
          id: w.id.toString(),
          user_id: w.user_id || user?.id || 0,
          balance: parseFloat(w.balance),
          currency: w.currency,
          status: w.status_code || 'active', // Use status_code from API (e.g., "active")
          is_public: w.is_public === 1 || w.is_public === true,
          created_at: w.created_at,
          metadata: {
            type: w.name,
            description: w.description,
            wallet_type_code: w.wallet_type_code,
            wallet_type_name: w.wallet_type_name,
            available_balance: parseFloat(w.available_balance || '0'),
            locked_balance: parseFloat(w.locked_balance || '0'),
            frozen_at: w.frozen_at,
            freeze_reason: w.freeze_reason
          }
        }));
        setWallets(transformedWallets);
        if (transformedWallets.length > 0 && !selectedWalletId) {
          setSelectedWalletId(transformedWallets[0].id);
        }
        const primaryBalance = transformedWallets.length > 0 ? transformedWallets[0].balance : 0;
        void refreshBalance(primaryBalance);
      } else {
        toast.error(data.message || 'Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('An error occurred while fetching wallets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchWallets();
    }
  }, [accessToken]);

  // Fetch transactions for selected wallet
  const fetchTransactions = async () => {
    if (!accessToken || !selectedWalletId) return;
    
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/transactions?limit=50`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const transformedTransactions: Transaction[] = (data.transactions || []).map((t: any) => ({
          id: (t.id || '').toString(),
          wallet_id: (t.wallet_id || selectedWalletId).toString(),
          type: t.type || 'unknown',
          amount: parseFloat(t.amount || '0'),
          fee: 0,
          status: t.status || 'pending',
          description: t.reference || t.type || 'Transaction',
          created_at: t.created_at || new Date().toISOString(),
          related_wallet_id: t.related_wallet_id?.toString(),
          metadata: typeof t.metadata === 'string' ? JSON.parse(t.metadata) : (t.metadata || {})
        }));
        setTransactions(transformedTransactions);
      } else {
        toast.error(data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('An error occurred while fetching transactions');
    }
  };

  useEffect(() => {
    if (accessToken && selectedWalletId) {
      fetchTransactions();
      fetchStatusHistory();
    }
  }, [accessToken, selectedWalletId]);

  // Fetch status history for selected wallet
  const fetchStatusHistory = async () => {
    if (!accessToken || !selectedWalletId) return;
    
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/status-history`), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const transformedHistory: WalletStatusHistory[] = (data.history || []).map((h: any) => ({
          id: (h.id || '').toString(),
          wallet_id: (h.wallet_id || selectedWalletId).toString(),
          previous_status: h.previous_status,
          new_status: h.new_status,
          reason: h.reason,
          created_at: h.created_at || new Date().toISOString(),
          metadata: typeof h.metadata === 'string' ? JSON.parse(h.metadata) : (h.metadata || {})
        }));
        setStatusHistory(transformedHistory);
      } else {
        toast.error(data.message || 'Failed to fetch status history');
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      toast.error('An error occurred while fetching status history');
    }
  };

  // Form states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  
  // Create Wallet states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletDescription, setNewWalletDescription] = useState('');
  const [newWalletTypeId, setNewWalletTypeId] = useState<string>('1'); // Default to 1 (Default)
  const [newWalletCurrency, setNewWalletCurrency] = useState('CNY');
  const [newWalletInitialBalance, setNewWalletInitialBalance] = useState('0');

  const selectedWallet = useMemo(() => 
    wallets.find(w => w.id === selectedWalletId), 
  [wallets, selectedWalletId]);

  const filteredWallets = useMemo(() => {
    return wallets.filter(w => {
      const matchesSearch = w.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (w.metadata?.type as string || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [wallets, searchQuery, statusFilter]);

  const walletTransactions = useMemo(() => 
    transactions.filter(t => t.wallet_id === selectedWalletId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [transactions, selectedWalletId]);

  const walletStatusHistory = useMemo(() => 
    statusHistory.filter(h => h.wallet_id === selectedWalletId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [statusHistory, selectedWalletId]);

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      toast.error('Please enter a wallet name');
      return;
    }

    if (!accessToken) {
      toast.error('Authentication session expired. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/wallets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          wallet_type_id: parseInt(newWalletTypeId),
          name: newWalletName,
          description: newWalletDescription,
          currency: newWalletCurrency,
          initial_balance: parseFloat(newWalletInitialBalance) || 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchWallets();
        toast.success(data.message || 'Wallet created successfully');
        setIsCreateDialogOpen(false);
        setNewWalletName('');
        setNewWalletDescription('');
        setNewWalletTypeId('1');
        setNewWalletCurrency('CNY');
        setNewWalletInitialBalance('0');
      } else if (response.status === 409) {
        toast.error(data.message || 'Wallet already exists.');
      } else if (response.status === 422) {
        const errors = data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast.error(firstError[0] || 'Validation Error');
      } else {
        toast.error(data.message || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('An error occurred while creating the wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('Please enter a valid amount (minimum 0.01)');
      return;
    }

    if (!accessToken || !selectedWalletId) return;

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/top-up`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          amount: amount,
          type: 'top-up',
          reference: `Top-up via Web`,
          metadata: { source: 'web_app' }
        })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchWallets();
        await fetchTransactions();
        setTopUpAmount('');
        setIsTopUpDialogOpen(false);
        toast.success(data.message || 'Wallet topped up successfully');
      } else if (response.status === 409) {
        toast.error(data.message || 'Wallet is not active.');
      } else if (response.status === 422) {
        const firstError = Object.values(data.errors || {})[0] as string[];
        toast.error(firstError?.[0] || 'Validation Error');
      } else {
        toast.error(data.message || 'Failed to top up wallet');
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      toast.error('An error occurred during top-up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('Please enter a valid amount (minimum 0.01)');
      return;
    }

    if (selectedWallet && (selectedWallet.metadata?.available_balance as number || 0) < amount) {
      toast.error('Insufficient available balance');
      return;
    }

    if (!accessToken || !selectedWalletId) return;

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/withdraw`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          amount: amount,
          type: 'withdrawal',
          reference: `Withdrawal via Web`,
          metadata: { source: 'web_app' }
        })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchWallets();
        await fetchTransactions();
        setWithdrawAmount('');
        setIsWithdrawDialogOpen(false);
        toast.success(data.message || 'Wallet withdrawal completed successfully');
      } else if (response.status === 409) {
        toast.error(data.message || 'Insufficient available balance.');
      } else if (response.status === 422) {
        const firstError = Object.values(data.errors || {})[0] as string[];
        toast.error(firstError?.[0] || 'Validation Error');
      } else {
        toast.error(data.message || 'Failed to withdraw funds');
      }
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      toast.error('An error occurred during withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!transferRecipient) {
      toast.error('Please enter recipient wallet ID');
      return;
    }

    const availableBalance = selectedWallet?.metadata?.available_balance as number || 0;
    if (availableBalance < amount) {
      toast.error('Insufficient available balance');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setWallets(wallets.map(w => 
        w.id === selectedWalletId ? { ...w, balance: w.balance - amount } : w
      ));
      
      const newTx: Transaction = {
        id: `T-${Math.random().toString(36).substr(2, 9)}`,
        wallet_id: selectedWalletId,
        type: 'transfer_out',
        amount: amount,
        fee: 0,
        status: 'completed',
        description: `Transfer to ${transferRecipient}`,
        related_wallet_id: transferRecipient,
        created_at: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      
      setTransferAmount('');
      setTransferRecipient('');
      setIsTransferDialogOpen(false);
      setIsLoading(false);
      toast.success('Transfer successful');
    }, 1000);
  };

  const handleToggleFreeze = async () => {
    if (!selectedWallet || !selectedWalletId || !accessToken) return;
    
    const action = selectedWallet.status === 'frozen' ? 'unfreeze' : 'freeze';
    
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/status-requests`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          action: action,
          reason: freezeReason || (action === 'freeze' ? 'User requested freeze' : 'User requested unfreeze')
        })
      });

      const data = await response.json();

      if (response.status === 201 || response.ok) {
        toast.success(data.message || 'Wallet status request submitted successfully');
        setFreezeReason('');
        setIsFreezeDialogOpen(false);
        await fetchWallets();
        await fetchStatusHistory();
      } else {
        toast.error(data.message || 'Failed to submit status request');
      }
    } catch (error) {
      console.error('Error submitting status request:', error);
      toast.error('An error occurred while submitting the request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublicity = async () => {
    if (!selectedWallet || !selectedWalletId || !accessToken) return;
    
    const newPublicStatus = !selectedWallet.is_public;
    
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          is_public: newPublicStatus
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Wallet set to ${newPublicStatus ? 'public' : 'private'}`);
        await fetchWallets();
      } else {
        toast.error(data.message || 'Failed to update wallet publicity');
      }
    } catch (error) {
      console.error('Error updating publicity:', error);
      toast.error('An error occurred while updating publicity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWalletStatus = async () => {
    if (!selectedWallet || !selectedWalletId || !accessToken) return;
    
    const isClosed = selectedWallet.status === 'closed';
    const endpoint = isClosed ? 'open' : 'close';
    
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/wallets/${selectedWalletId}/${endpoint}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `${tokenType || 'Bearer'} ${accessToken}`
        },
        body: JSON.stringify({
          reason: walletStatusReason || `User requested to ${endpoint} wallet`
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Wallet ${isClosed ? 'opened' : 'closed'} successfully`);
        setWalletStatusReason('');
        setIsStatusDialogOpen(false);
        await fetchWallets();
        await fetchStatusHistory();
      } else {
        toast.error(data.message || `Failed to ${endpoint} wallet`);
      }
    } catch (error) {
      console.error(`Error ${endpoint}ing wallet:`, error);
      toast.error(`An error occurred while trying to ${endpoint} the wallet`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500/10 text-green-500">Active</Badge>;
      case 'frozen':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500">Frozen</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-500">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top-up':
      case 'deposit':
      case 'initial':
      case 'transfer':
      case 'transfer_in':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
      case 'withdraw':
      case 'transfer_out':
      case 'fee':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const isCredit = (type: string) => {
    return ['top-up', 'transfer_in', 'deposit', 'initial', 'transfer'].includes(type);
  };

  const getTransactionColorClass = (type: string) => {
    return isCredit(type) ? 'text-green-500' : 'text-red-500';
  };

  const getTransactionPrefix = (type: string) => {
    return isCredit(type) ? '+' : '-';
  };

  if (!user) {
    return (
      <MainLayout showFooter={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please log in to manage your wallets.</p>
          <Button asChild>
            <a href="/login">Log In</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showFooter={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet Management</h1>
            <p className="text-muted-foreground">Manage your funds, transfers, and transaction history.</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wallet</DialogTitle>
                <DialogDescription>
                  Enter the details for your new wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Wallet Type</Label>
                  <RadioGroup 
                    value={newWalletTypeId} 
                    onValueChange={setNewWalletTypeId}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="type-default" />
                      <Label htmlFor="type-default" className="cursor-pointer">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="type-escrow" />
                      <Label htmlFor="type-escrow" className="cursor-pointer">Escrow</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Wallet Name</Label>
                  <Input 
                    id="name"
                    placeholder="e.g. My Savings, Daily Expenses" 
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    maxLength={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                  <Input 
                    id="description"
                    placeholder="What is this wallet for?" 
                    value={newWalletDescription}
                    onChange={(e) => setNewWalletDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                    <Input 
                      id="currency"
                      value={newWalletCurrency}
                      onChange={(e) => setNewWalletCurrency(e.target.value.toUpperCase())}
                      maxLength={3}
                      placeholder="CNY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance" className="text-sm font-medium">Initial Balance</Label>
                    <Input 
                      id="balance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newWalletInitialBalance}
                      onChange={(e) => setNewWalletInitialBalance(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateWallet} disabled={isLoading}>Create Wallet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Wallet List */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Wallets</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search wallets..."
                      className="pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {filteredWallets.length > 0 ? (
                    filteredWallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => setSelectedWalletId(wallet.id)}
                        className={`flex items-center justify-between p-4 text-left transition-colors hover:bg-accent/50 ${
                          selectedWalletId === wallet.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedWalletId === wallet.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium">
                              {wallet.metadata?.type as string || wallet.id}
                              {wallet.is_public && <Globe className="w-3 h-3 text-green-500" />}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                              {wallet.metadata?.wallet_type_name as string || 'General Wallet'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold numeric-text">
                            {formatWithSelectedCurrency(wallet.balance, wallet.currency)}
                          </div>
                          <div className="text-[10px] mt-1">
                            {getStatusBadge(wallet.status)}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No wallets found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-8 space-y-6">
            {selectedWallet ? (
              <>
                {/* Wallet Overview Card */}
                <Card className="bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    {getStatusBadge(selectedWallet.status)}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          {selectedWallet.metadata?.type as string || 'Wallet Details'}
                          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
                            {selectedWallet.metadata?.wallet_type_name as string || 'General'}
                          </span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          ID: {selectedWallet.id} • Created {format(new Date(selectedWallet.created_at), 'PPP')}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-6 px-2 text-[10px] gap-1 ${selectedWallet.is_public ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20' : 'text-muted-foreground bg-muted hover:bg-muted/80'}`}
                            onClick={handleTogglePublicity}
                            disabled={isLoading}
                          >
                            {selectedWallet.is_public ? (
                              <>
                                <Globe className="w-3 h-3" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                Private
                              </>
                            )}
                          </Button>
                        </CardDescription>
                        {selectedWallet.metadata?.description && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            {selectedWallet.metadata.description as string}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-6">
                      <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Total Balance</span>
                      <h2 className="text-5xl font-bold numeric-text tracking-tighter">
                        {formatWithSelectedCurrency(selectedWallet.balance, selectedWallet.currency)}
                      </h2>
                      
                      {/* Balance Breakdown */}
                      {(selectedWallet.metadata?.available_balance !== undefined || selectedWallet.metadata?.locked_balance !== undefined) && (
                        <div className="flex gap-4 mt-4 text-[10px] font-semibold uppercase tracking-tight">
                          <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-green-500/5 text-green-600">
                            <span className="opacity-70 mb-0.5 text-[8px]">Available</span>
                            <span>{formatWithSelectedCurrency(selectedWallet.metadata.available_balance as number || 0, selectedWallet.currency)}</span>
                          </div>
                          <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-orange-500/5 text-orange-600">
                            <span className="opacity-70 mb-0.5 text-[8px]">Locked</span>
                            <span>{formatWithSelectedCurrency(selectedWallet.metadata.locked_balance as number || 0, selectedWallet.currency)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Top Up Dialog */}
                      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2" disabled={selectedWallet.status === 'frozen' || selectedWallet.status === 'closed'}>
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                            <span>Top Up</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Top Up Wallet</DialogTitle>
                            <DialogDescription>Add funds to your wallet instantly.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Amount ({selectedWallet.currency})</label>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsTopUpDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleTopUp} disabled={isLoading}>Confirm Top Up</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Withdraw Dialog */}
                      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 " disabled={selectedWallet.status === 'frozen' || selectedWallet.status === 'closed'}>
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                            <span>Withdraw</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw Funds</DialogTitle>
                            <DialogDescription>Transfer funds from your wallet to your bank account.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Amount ({selectedWallet.currency})</label>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">A small processing fee of 1.00 CNY will be applied.</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleWithdraw} disabled={isLoading}>Confirm Withdrawal</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Transfer Dialog */}
                      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 " disabled={selectedWallet.status === 'frozen' || selectedWallet.status === 'closed'}>
                            <Send className="w-5 h-5 text-blue-500" />
                            <span>Transfer</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>P2P Transfer</DialogTitle>
                            <DialogDescription>Send money instantly to another wallet user.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Recipient Wallet ID</label>
                              <Input 
                                placeholder="e.g. W-123456" 
                                value={transferRecipient}
                                onChange={(e) => setTransferRecipient(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Amount ({selectedWallet.currency})</label>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleTransfer} disabled={isLoading}>Send Funds</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Freeze/Unfreeze Dialog */}
                      <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 " disabled={selectedWallet.status === 'closed'}>
                            {selectedWallet.status === 'frozen' ? (
                              <>
                                <Unlock className="w-5 h-5 text-green-500" />
                                <span>Unfreeze</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5 text-orange-500" />
                                <span>Freeze</span>
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{selectedWallet.status === 'frozen' ? 'Request Unfreeze' : 'Freeze Wallet'}</DialogTitle>
                            <DialogDescription>
                              {selectedWallet.status === 'frozen' 
                                ? 'Submit a request to unfreeze your wallet.' 
                                : 'Temporarily disable all transactions for security.'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Reason</label>
                              <Input 
                                placeholder="Provide a reason..." 
                                value={freezeReason}
                                onChange={(e) => setFreezeReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFreezeDialogOpen(false)}>Cancel</Button>
                            <Button 
                              variant={selectedWallet.status === 'frozen' ? 'default' : 'destructive'}
                              onClick={handleToggleFreeze} 
                              disabled={isLoading}
                            >
                              Confirm
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Open/Close Wallet Dialog */}
                      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 ">
                            {selectedWallet.status === 'closed' ? (
                              <>
                                <Power className="w-5 h-5 text-green-500" />
                                <span>Open Wallet</span>
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-5 h-5 text-gray-500" />
                                <span>Close Wallet</span>
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{selectedWallet.status === 'closed' ? 'Open Wallet' : 'Close Wallet'}</DialogTitle>
                            <DialogDescription>
                              {selectedWallet.status === 'closed' 
                                ? 'Reactivate your wallet to start making transactions again.' 
                                : 'Deactivate your wallet. Note: Only non-primary wallets can be closed.'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Reason (Optional)</label>
                              <Input 
                                placeholder="Provide a reason..." 
                                value={walletStatusReason}
                                onChange={(e) => setWalletStatusReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
                            <Button 
                              variant={selectedWallet.status === 'closed' ? 'default' : 'destructive'}
                              onClick={handleToggleWalletStatus} 
                              disabled={isLoading}
                            >
                              Confirm
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for History */}
                <Tabs defaultValue="transactions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="transactions" className="gap-2">
                      <History className="w-4 h-4" />
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger value="status" className="gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Status History
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transactions">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Transaction History</CardTitle>
                        <CardDescription>Your recent chronological activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {walletTransactions.length > 0 ? (
                              walletTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getTransactionIcon(tx.type)}
                                      <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                                  </TableCell>
                                  <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">
                                    {tx.description}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium numeric-text ${getTransactionColorClass(tx.type)}`}>
                                    {getTransactionPrefix(tx.type)}
                                    {formatWithSelectedCurrency(tx.amount, selectedWallet.currency)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {tx.status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                                    ) : tx.status === 'pending' ? (
                                      <Clock className="w-4 h-4 text-yellow-500 ml-auto" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  No transactions found for this wallet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="status">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Status Lifecycle</CardTitle>
                        <CardDescription>Historical changes to wallet status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {walletStatusHistory.length > 0 ? (
                            walletStatusHistory.map((history) => (
                              <div key={history.id} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                                <div className="mt-1">
                                  {history.new_status === 'frozen' ? (
                                    <Lock className="w-5 h-5 text-orange-500" />
                                  ) : (
                                    <Unlock className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium">
                                      Status changed to <span className="capitalize">{history.new_status}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(history.created_at), 'MMM d, yyyy HH:mm')}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Reason: {history.reason}
                                  </div>
                                  <div className="text-[10px] mt-2 text-muted-foreground uppercase tracking-wider">
                                    Changed By: User #{history.changed_by}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-muted-foreground rounded-lg">
                              No status changes recorded.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] rounded-xl bg-muted/20">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">Select a wallet to view details and perform actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WalletPage;
