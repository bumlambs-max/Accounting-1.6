import React, { useState, useMemo } from 'react';
import { Liability, LiabilityCategory, Category, Transaction, TransactionType, Account, PaymentFrequency, AccountType } from '../types.ts';
import SearchBar, { SearchFilters } from './SearchBar.tsx';

interface LiabilityManagerProps {
  liabilities: Liability[];
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  onAdd: (liability: Omit<Liability, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (liability: Liability) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const LiabilityManager: React.FC<LiabilityManagerProps> = ({ 
  liabilities, 
  categories, 
  accounts,
  transactions,
  onAdd, 
  onDelete, 
  onUpdate, 
  onAddTransaction 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [showPayModal, setShowPayModal] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentCategory, setPaymentCategory] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [tempFrequency, setTempFrequency] = useState<PaymentFrequency>(PaymentFrequency.MONTHLY);
  
  const [filters, setFilters] = useState<SearchFilters>({
    date: '',
    type: '',
    price: '',
    query: ''
  });

  const [newLiability, setNewLiability] = useState<Omit<Liability, 'id'>>({
    name: '',
    category: LiabilityCategory.LOAN,
    originalAmount: 0,
    currentBalance: 0,
    interestRate: 0,
    dueDate: '',
    installmentAmount: 0,
    paymentFrequency: PaymentFrequency.MONTHLY,
    description: ''
  });

  const getNextMonthlyDate = (day: number) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    let currentMonthDate = new Date(year, month, day);
    if (currentMonthDate.getMonth() !== month) {
        currentMonthDate = new Date(year, month + 1, 0);
    }
    currentMonthDate.setHours(23, 59, 59, 999);

    if (currentMonthDate < now) {
      month += 1;
      let nextMonthDate = new Date(year, month, day);
      if (nextMonthDate.getMonth() !== (month % 12)) {
          nextMonthDate = new Date(year, month + 1, 0);
      }
      return nextMonthDate;
    }
    return currentMonthDate;
  };

  const getDateStatus = (dueDate?: string | Date, balance: number = 0) => {
    if (!dueDate || balance <= 0) return 'normal';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < now) return 'overdue';
    
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    if (due <= sevenDaysFromNow) return 'soon';
    
    return 'normal';
  };

  // Calculate Credit Card Balances and Next Recurring Due Date from Transactions
  const creditCardLiabilities = useMemo(() => {
    return accounts.filter(acc => acc.type === AccountType.CREDIT).map(acc => {
      let balance = acc.initialBalance;
      const accTransactions = transactions.filter(t => t.accountId === acc.id);
      
      accTransactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE) balance += t.amount;
        else balance -= t.amount;
      });

      const lastTransaction = accTransactions.length > 0 
        ? [...accTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      const nextDue = acc.paymentDay ? getNextMonthlyDate(acc.paymentDay) : null;

      return {
        id: acc.id,
        name: acc.name,
        balance: balance,
        currentBalance: balance, // Compatibility for modal
        lastActivity: lastTransaction,
        dueDate: nextDue,
        isCredit: true,
        installmentAmount: 0 // No fixed installment for cards
      };
    });
  }, [accounts, transactions]);

  const filteredLiabilities = useMemo(() => {
    return liabilities.filter(l => {
      const matchesQuery = l.name.toLowerCase().includes(filters.query.toLowerCase()) || 
                           l.description.toLowerCase().includes(filters.query.toLowerCase());
      const matchesDate = !filters.date || l.dueDate === filters.date;
      const matchesType = !filters.type || l.category === filters.type;
      const matchesPrice = !filters.price || l.currentBalance >= parseFloat(filters.price);
      
      return matchesQuery && matchesDate && matchesType && matchesPrice;
    });
  }, [liabilities, filters]);

  const stats = useMemo(() => {
    const manualTotal = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
    const creditTotal = creditCardLiabilities.reduce((sum, cc) => sum + cc.balance, 0);
    
    const totalBalance = manualTotal + creditTotal;
    const avgInterest = liabilities.length > 0 
      ? liabilities.reduce((sum, l) => sum + l.interestRate, 0) / liabilities.length 
      : 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const manualDueSoon = liabilities.filter(l => {
      if (!l.dueDate || l.currentBalance <= 0) return false;
      const due = new Date(l.dueDate);
      return due <= thirtyDaysFromNow;
    }).length;

    const creditDueSoon = creditCardLiabilities.filter(cc => {
      if (!cc.dueDate || cc.balance <= 0) return false;
      return cc.dueDate <= thirtyDaysFromNow;
    }).length;

    return { totalBalance, avgInterest, dueSoonCount: manualDueSoon + creditDueSoon };
  }, [liabilities, creditCardLiabilities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLiability) {
      onUpdate({ ...editingLiability, ...newLiability });
      setEditingLiability(null);
    } else {
      onAdd(newLiability);
    }
    setNewLiability({
      name: '',
      category: LiabilityCategory.LOAN,
      originalAmount: 0,
      currentBalance: 0,
      interestRate: 0,
      dueDate: '',
      installmentAmount: 0,
      paymentFrequency: PaymentFrequency.MONTHLY,
      description: ''
    });
    setShowForm(false);
  };

  const handleEditClick = (l: Liability) => {
    setEditingLiability(l);
    setNewLiability({
      name: l.name,
      category: l.category,
      originalAmount: l.originalAmount,
      currentBalance: l.currentBalance,
      interestRate: l.interestRate,
      dueDate: l.dueDate || '',
      installmentAmount: l.installmentAmount || 0,
      paymentFrequency: l.paymentFrequency || PaymentFrequency.MONTHLY,
      description: l.description
    });
    setShowForm(true);
  };

  const handleOpenPayModal = (item: any) => {
    setShowPayModal(item);
    const balance = item.isCredit ? item.balance : item.currentBalance;
    const defaultAmount = (!item.isCredit && item.installmentAmount && item.installmentAmount > 0) 
      ? Math.min(item.installmentAmount, balance)
      : balance;
    
    setPaymentAmount(defaultAmount.toString());
    setTempFrequency(item.paymentFrequency || PaymentFrequency.MONTHLY);
    
    const expenseCats = categories.filter(c => c.type === TransactionType.EXPENSE);
    if (expenseCats.length > 0) {
      setPaymentCategory(expenseCats[0].id);
    }
    if (accounts.length > 0) {
      const nonCreditAccounts = accounts.filter(a => a.type !== AccountType.CREDIT);
      setPaymentAccount(nonCreditAccounts.length > 0 ? nonCreditAccounts[0].id : accounts[0].id);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !paymentAmount || !paymentAccount) return;

    const amount = parseFloat(paymentAmount);

    if (showPayModal.isCredit) {
      onAddTransaction({
        date: paymentDate,
        description: `Credit Card Payment: ${showPayModal.name}`,
        amount: amount,
        categoryId: paymentCategory,
        accountId: showPayModal.id, 
        type: TransactionType.INCOME
      });
    } else {
      const newBalance = Math.max(0, showPayModal.currentBalance - amount);
      let nextDueDate = showPayModal.dueDate;

      // Logic to advance the due date based on selected frequency
      if (nextDueDate && tempFrequency !== PaymentFrequency.ONE_TIME) {
        const d = new Date(nextDueDate);
        if (tempFrequency === PaymentFrequency.MONTHLY) {
          d.setMonth(d.getMonth() + 1);
        } else if (tempFrequency === PaymentFrequency.YEARLY) {
          d.setFullYear(d.getFullYear() + 1);
        }
        nextDueDate = d.toISOString().split('T')[0];
      }

      onUpdate({
        ...showPayModal,
        currentBalance: newBalance,
        dueDate: nextDueDate
      });

      onAddTransaction({
        date: paymentDate,
        description: `Payment towards: ${showPayModal.name} (${tempFrequency})`,
        amount: amount,
        categoryId: paymentCategory,
        accountId: paymentAccount,
        type: TransactionType.EXPENSE
      });
    }

    setShowPayModal(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total Liabilities</p>
          <p className="text-2xl font-black text-rose-600 mt-1">${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Manual Loans + Credit Balances</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Avg. Interest Rate</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.avgInterest.toFixed(2)}%</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">On manual obligations</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Payments Due</p>
          <p className={`text-2xl font-bold mt-1 ${stats.dueSoonCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {stats.dueSoonCount} upcoming
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Due within next 30 days</p>
        </div>
      </div>

      <SearchBar 
        filters={filters} 
        setFilters={setFilters} 
        typeOptions={Object.values(LiabilityCategory)} 
        priceLabel="Min Balance"
      />

      {/* Real-time Credit Card Debts */}
      {creditCardLiabilities.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Credit Card Balances</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Automated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCardLiabilities.map(cc => {
              const dateStatus = getDateStatus(cc.dueDate || undefined, cc.balance);
              return (
                <div key={cc.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 truncate pr-4">{cc.name}</h4>
                    <button 
                      onClick={() => handleOpenPayModal(cc)}
                      className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest relative z-20"
                      disabled={cc.balance <= 0}
                    >
                      Pay Card
                    </button>
                  </div>
                  
                  {cc.dueDate && cc.balance > 0 && (
                    <div className="mt-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        dateStatus === 'overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        dateStatus === 'soon' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        Next Due: {cc.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <p className="text-xl font-black text-rose-600 mt-2">${cc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recent Activity</p>
                    {cc.lastActivity ? (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">{cc.lastActivity.description}</span>
                        <span className="text-slate-400 text-[10px] font-mono">{new Date(cc.lastActivity.date).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No ledger entries found</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex justify-between items-center border-t border-slate-100 pt-8">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Fixed Loans & Obligations</h3>
        <button
          onClick={() => { setShowForm(true); setEditingLiability(null); setNewLiability({ name: '', category: LiabilityCategory.LOAN, originalAmount: 0, currentBalance: 0, interestRate: 0, dueDate: '', installmentAmount: 0, paymentFrequency: PaymentFrequency.MONTHLY, description: '' }); }}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center space-x-2 shadow-lg shadow-rose-100 text-xs uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          <span>Record Obligation</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingLiability ? 'Edit Liability Record' : 'New Liability Record'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Liability Name</label>
                  <input type="text" required value={newLiability.name} onChange={e => setNewLiability({...newLiability, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" placeholder="e.g. Business Expansion Loan" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select required value={newLiability.category} onChange={e => setNewLiability({...newLiability, category: e.target.value as LiabilityCategory})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                    {Object.values(LiabilityCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.01" required value={newLiability.interestRate} onChange={e => setNewLiability({...newLiability, interestRate: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Original Amount ($)</label>
                  <input type="number" step="0.01" required value={newLiability.originalAmount} onChange={e => setNewLiability({...newLiability, originalAmount: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Balance ($)</label>
                  <input type="number" step="0.01" required value={newLiability.currentBalance} onChange={e => setNewLiability({...newLiability, currentBalance: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                
                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Schedule</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount Due ($)</label>
                  <input type="number" step="0.01" value={newLiability.installmentAmount} onChange={e => setNewLiability({...newLiability, installmentAmount: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Scheduled payment amount" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                  <select value={newLiability.paymentFrequency} onChange={e => setNewLiability({...newLiability, paymentFrequency: e.target.value as PaymentFrequency})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none">
                    {Object.values(PaymentFrequency).map(freq => <option key={freq} value={freq}>{freq}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next Payment Due Date</label>
                  <input type="date" value={newLiability.dueDate} onChange={e => setNewLiability({...newLiability, dueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea value={newLiability.description} onChange={e => setNewLiability({...newLiability, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none h-20" placeholder="Lender info, terms, or account numbers..."></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-sm">{editingLiability ? 'Update' : 'Save'} Liability</button>
            </div>
          </form>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayment} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="font-bold text-emerald-800">{showPayModal.isCredit ? 'Credit Card Payment' : 'Pay Off / Make Payment'}</h3>
              <button type="button" onClick={() => setShowPayModal(null)} className="text-emerald-400 hover:text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Recording payment for: <span className="font-bold">{showPayModal.name}</span></p>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Current Balance</p>
                    <p className="text-sm font-black text-slate-700">${showPayModal.currentBalance.toLocaleString()}</p>
                  </div>
                  {!showPayModal.isCredit && showPayModal.installmentAmount && showPayModal.installmentAmount > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Regular Installment</p>
                      <p className="text-sm font-black text-emerald-600">${showPayModal.installmentAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {!showPayModal.isCredit && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Frequency / Mode</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {Object.values(PaymentFrequency).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setTempFrequency(freq)}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          tempFrequency === freq ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount to Pay ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  max={showPayModal.currentBalance}
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-semibold" 
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {showPayModal.isCredit ? 'Paying From' : 'Source Account'}
                   </label>
                   <select 
                    required 
                    value={paymentAccount} 
                    onChange={e => setPaymentAccount(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                    ))}
                    {accounts.length === 0 && <option value="" disabled>Please create an account first</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select 
                    required 
                    value={paymentCategory} 
                    onChange={e => setPaymentCategory(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {categories.filter(c => c.type === TransactionType.EXPENSE).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {!showPayModal.isCredit && tempFrequency !== PaymentFrequency.ONE_TIME && (
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight text-center bg-emerald-50 py-2 rounded-lg">
                  * Next due date will automatically advance by one {tempFrequency === PaymentFrequency.MONTHLY ? 'month' : 'year'}.
                </p>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowPayModal(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm">Confirm Payment</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Liability</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Schedule</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Next Due</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Balance</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLiabilities.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">{liabilities.length === 0 ? "No manual liabilities recorded." : "No manual liabilities match your search."}</td></tr>
              ) : (
                filteredLiabilities.map(l => {
                  const dateStatus = getDateStatus(l.dueDate, l.currentBalance);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{l.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{l.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {l.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {l.installmentAmount && l.installmentAmount > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700">${l.installmentAmount.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">/ {l.paymentFrequency?.toLowerCase()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {l.dueDate && l.currentBalance > 0 ? (
                          <div className="flex flex-col">
                            <span className={`font-bold ${
                              dateStatus === 'overdue' ? 'text-rose-600' : 
                              dateStatus === 'soon' ? 'text-amber-600' : 
                              'text-slate-600'
                            }`}>
                              {new Date(l.dueDate).toLocaleDateString()}
                            </span>
                            {dateStatus === 'overdue' && <span className="text-[9px] font-black text-rose-500 uppercase animate-pulse">Overdue</span>}
                            {dateStatus === 'soon' && <span className="text-[9px] font-black text-amber-500 uppercase">Due Soon</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">
                        ${l.currentBalance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            onClick={() => handleOpenPayModal(l)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest mr-1"
                            title="Record Payment"
                            disabled={l.currentBalance <= 0}
                          >
                            Pay
                          </button>
                          <button onClick={() => handleEditClick(l)} className="text-slate-300 hover:text-blue-600 p-1 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => onDelete(l.id)} className="text-slate-300 hover:text-rose-500 p-1 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiabilityManager;
