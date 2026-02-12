import React, { useState, useMemo } from 'react';
import { Account, AccountType, Transaction, TransactionType } from '../types.ts';

interface AccountRegistryProps {
  accounts: Account[];
  transactions: Transaction[];
  onAdd: (account: Omit<Account, 'id'>) => void;
  onUpdate: (account: Account) => void;
  onDelete: (id: string) => void;
}

const AccountRegistry: React.FC<AccountRegistryProps> = ({ accounts, transactions, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState<Omit<Account, 'id'>>({
    name: '',
    type: AccountType.CHECKING,
    initialBalance: 0,
    paymentDay: 1
  });

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
      let balance = acc.initialBalance;
      const accTransactions = transactions.filter(t => t.accountId === acc.id);
      accTransactions.forEach(t => {
        if (t.type === TransactionType.INCOME) balance += t.amount;
        else balance -= t.amount;
      });
      balances[acc.id] = balance;
    });
    return balances;
  }, [accounts, transactions]);

  const totalLiquidity = Object.values(accountBalances).reduce((sum, b) => sum + b, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      onUpdate({ ...editingAccount, ...formData });
      setEditingAccount(null);
    } else {
      onAdd(formData);
    }
    setFormData({ name: '', type: AccountType.CHECKING, initialBalance: 0, paymentDay: 1 });
    setShowForm(false);
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({ name: acc.name, type: acc.type, initialBalance: acc.initialBalance, paymentDay: acc.paymentDay || 1 });
    setShowForm(true);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.CHECKING: return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case AccountType.SAVINGS: return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case AccountType.CASH: return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      case AccountType.CREDIT: return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    }
  };

  const getOrdinalSuffix = (i: number) => {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return i + "st";
    if (j === 2 && k !== 12) return i + "nd";
    if (j === 3 && k !== 13) return i + "rd";
    return i + "th";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Liquid Cash</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">${totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accounts Tracked</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{accounts.length}</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingAccount(null); setFormData({ name: '', type: AccountType.CHECKING, initialBalance: 0, paymentDay: 1 }); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${acc.type === AccountType.CREDIT ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {getAccountIcon(acc.type)}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(acc)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onDelete(acc.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800">{acc.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{acc.type}</p>
              
              {acc.type === AccountType.CREDIT && acc.paymentDay && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Due Date</p>
                  <p className="text-xs font-black text-rose-600">The {getOrdinalSuffix(acc.paymentDay)}</p>
                </div>
              )}

              <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Initial</p>
                  <p className="text-xs font-semibold text-slate-500">${acc.initialBalance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Current</p>
                  <p className={`text-xl font-black ${accountBalances[acc.id] >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${accountBalances[acc.id].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 font-bold italic">No accounts recorded in the registry yet.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingAccount ? 'Edit Account' : 'New Account Entry'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Main Farm Checking" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AccountType})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.values(AccountType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Balance ($)</label>
                  <input type="number" step="0.01" required value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                {formData.type === AccountType.CREDIT && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Due Day (1-31)</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number" 
                        min="1" 
                        max="31" 
                        required 
                        value={formData.paymentDay} 
                        onChange={e => setFormData({...formData, paymentDay: parseInt(e.target.value)})} 
                        className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                      />
                      <span className="text-sm font-medium text-slate-500">of every month</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">{editingAccount ? 'Update' : 'Create'} Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccountRegistry;