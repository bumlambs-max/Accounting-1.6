import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType, Account } from '../types.ts';
import { suggestCategory } from '../services/geminiService.ts';

interface TransactionFormProps {
  categories: Category[];
  accounts: Account[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  fixedType?: TransactionType;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, accounts, onSubmit, onCancel, fixedType, initialData }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || fixedType || TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || (accounts.length > 0 ? accounts[0].id : ''));
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Sync categoryId with type changes
  useEffect(() => {
    if (!initialData) {
      const filtered = categories.filter(c => c.type === type);
      if (filtered.length > 0) {
        setCategoryId(filtered[0].id);
      }
    }
  }, [type, categories, initialData]);

  const handleAiCategorize = async () => {
    if (!description) return;
    setIsSuggesting(true);
    try {
      const suggestedName = await suggestCategory(description, categories);
      const matched = categories.find(c => c.name.toLowerCase() === suggestedName?.toLowerCase());
      if (matched) {
        if (!fixedType || matched.type === fixedType) {
          setCategoryId(matched.id);
          setType(matched.type);
        }
      }
    } catch (error) {
      console.error("AI categorization failed", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId || !accountId) return;
    onSubmit({
      description,
      amount: parseFloat(amount),
      type,
      categoryId,
      accountId,
      date
    });
    if (!initialData) {
      setDescription('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/60 backdrop-blur-md p-6 rounded-xl border border-slate-200 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4">
      <h3 className="font-bold text-slate-800 text-lg mb-2">{initialData ? 'Edit Transaction' : 'Add New Transaction'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <div className="relative">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={fixedType === TransactionType.INCOME ? "e.g. Grain Sale" : "e.g. Tractor Parts"}
              required
            />
            <button
              type="button"
              onClick={handleAiCategorize}
              disabled={isSuggesting}
              className="absolute right-2 top-1.5 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded hover:bg-blue-100 transition-colors"
            >
              {isSuggesting ? 'Thinking...' : 'AI Categorize'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Financial Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
            ))}
            {accounts.length === 0 && <option value="" disabled>Please create an account first</option>}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!fixedType && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entry Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.INCOME}>Income</option>
            </select>
          </div>
        )}
        <div className={fixedType ? "md:col-span-2" : ""}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {categories.filter(c => c.type === type).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={accounts.length === 0}
          className={`px-6 py-2 rounded-lg font-bold transition-colors shadow-sm ${accounts.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
        >
          {initialData ? 'Update' : 'Confirm'} {fixedType ? fixedType.toLowerCase() : 'Record'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;