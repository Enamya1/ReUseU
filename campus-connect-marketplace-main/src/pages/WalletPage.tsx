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
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import CurrencySelector from '@/components/currency/CurrencySelector';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/api';

const WalletPage = () => {
  const { user, accessToken, tokenType } = useAuth();
  const { formatWithSelectedCurrency, selectedCurrency, setSelectedCurrency, convertPrice, currencies } = useCurrency();
  
  // Set default currency to CNY on load
  useEffect(() => {
    setSelectedCurrency('CNY');
  }, [setSelectedCurrency]);
  
  const [wallets, setWallets] = useState<WalletType[]>(mockWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [statusHistory, setStatusHistory] = useState<WalletStatusHistory[]>(mockWalletHistory);
  
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  
  // Create Wallet states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
        const newWallet: WalletType = {
          id: data.wallet?.id?.toString() || `W-${Math.floor(100000 + Math.random() * 900000)}`,
          user_id: user?.id || 1,
          balance: parseFloat(newWalletInitialBalance) || 0,
          currency: newWalletCurrency,
          status: 'active',
          created_at: new Date().toISOString(),
          metadata: { 
            type: newWalletName,
            description: newWalletDescription
          }
        };
        setWallets([...wallets, newWallet]);
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

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setWallets(wallets.map(w => 
        w.id === selectedWalletId ? { ...w, balance: w.balance + amount } : w
      ));
      
      const newTx: Transaction = {
        id: `T-${Math.random().toString(36).substr(2, 9)}`,
        wallet_id: selectedWalletId,
        type: 'top-up',
        amount: amount,
        fee: 0,
        status: 'completed',
        description: 'Manual Top-up',
        created_at: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      
      setTopUpAmount('');
      setIsLoading(false);
      toast.success('Top-up successful');
    }, 1000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedWallet && selectedWallet.balance < amount) {
      toast.error('Insufficient funds');
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
        type: 'withdrawal',
        amount: amount,
        fee: 1, // Fixed fee for simulation
        status: 'completed',
        description: 'Bank Withdrawal',
        created_at: new Date().toISOString()
      };
      setTransactions([newTx, ...transactions]);
      
      setWithdrawAmount('');
      setIsLoading(false);
      toast.success('Withdrawal successful');
    }, 1000);
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

    if (selectedWallet && selectedWallet.balance < amount) {
      toast.error('Insufficient funds');
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
      setIsLoading(false);
      toast.success('Transfer successful');
    }, 1000);
  };

  const handleToggleFreeze = () => {
    if (!selectedWallet) return;
    
    const newStatus = selectedWallet.status === 'active' ? 'frozen' : 'active';
    
    setIsLoading(true);
    setTimeout(() => {
      setWallets(wallets.map(w => 
        w.id === selectedWalletId ? { ...w, status: newStatus as any } : w
      ));
      
      const newHistory: WalletStatusHistory = {
        id: `H-${Math.random().toString(36).substr(2, 9)}`,
        wallet_id: selectedWalletId,
        old_status: selectedWallet.status,
        new_status: newStatus,
        reason: freezeReason || 'User request',
        changed_by: user?.id || 1,
        created_at: new Date().toISOString()
      };
      setStatusHistory([newHistory, ...statusHistory]);
      
      setFreezeReason('');
      setIsLoading(false);
      toast.success(`Wallet ${newStatus === 'frozen' ? 'frozen' : 'unfrozen'} successfully`);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'frozen':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Frozen</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top-up':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'transfer_in':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'transfer_out':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
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
                        className={`flex items-center justify-between p-4 text-left transition-colors border-b last:border-0 hover:bg-accent/50 ${
                          selectedWalletId === wallet.id ? 'bg-accent border-l-4 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedWalletId === wallet.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium">{wallet.id}</div>
                            <div className="text-xs text-muted-foreground">{wallet.metadata?.type as string || 'General'}</div>
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
                <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    {getStatusBadge(selectedWallet.status)}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          {selectedWallet.metadata?.type as string || 'Wallet Details'}
                        </CardTitle>
                        <CardDescription>
                          ID: {selectedWallet.id} • Created {format(new Date(selectedWallet.created_at), 'PPP')}
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
                      <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Available Balance</span>
                      <h2 className="text-5xl font-bold numeric-text tracking-tighter">
                        {formatWithSelectedCurrency(selectedWallet.balance, selectedWallet.currency)}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Top Up Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-dashed" disabled={selectedWallet.status === 'frozen'}>
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
                            <Button variant="outline" onClick={() => setTopUpAmount('')}>Cancel</Button>
                            <Button onClick={handleTopUp} disabled={isLoading}>Confirm Top Up</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Withdraw Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-dashed" disabled={selectedWallet.status === 'frozen'}>
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
                            <Button variant="outline" onClick={() => setWithdrawAmount('')}>Cancel</Button>
                            <Button onClick={handleWithdraw} disabled={isLoading}>Confirm Withdrawal</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Transfer Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-dashed" disabled={selectedWallet.status === 'frozen'}>
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
                            <Button variant="outline" onClick={() => {
                              setTransferAmount('');
                              setTransferRecipient('');
                            }}>Cancel</Button>
                            <Button onClick={handleTransfer} disabled={isLoading}>Send Funds</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Freeze/Unfreeze Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-col h-auto py-4 gap-2 border-dashed">
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
                            <Button variant="outline" onClick={() => setFreezeReason('')}>Cancel</Button>
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
                                  <TableCell className={`text-right font-medium numeric-text ${
                                    tx.type === 'top-up' || tx.type === 'transfer_in' ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {tx.type === 'top-up' || tx.type === 'transfer_in' ? '+' : '-'}
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
                              <div key={history.id} className="flex gap-4 p-4 border rounded-lg bg-muted/30">
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
                            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
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
              <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/20">
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
