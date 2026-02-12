import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, Account } from '../types.ts';
import SearchBar, { SearchFilters } from './SearchBar.tsx';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts, onDelete, onEdit }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    date: '',
    type: '',
    price: '',
    query: ''
  });

  const uniqueCategoryNames = useMemo(() => {
    return Array.from(new Set(categories.map(c => c.name)));
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const category = categories.find(c => c.id === t.categoryId);
      const account = accounts.find(a => a.id === t.accountId);
      const matchesQuery = t.description.toLowerCase().includes(filters.query.toLowerCase()) || 
                           (category?.name.toLowerCase().includes(filters.query.toLowerCase()) ?? false) ||
                           (account?.name.toLowerCase().includes(filters.query.toLowerCase()) ?? false);
      const matchesDate = !filters.date || t.date === filters.date;
      const matchesType = !filters.type || category?.name === filters.type;
      const matchesPrice = !filters.price || t.amount >= parseFloat(filters.price);
      
      return matchesQuery && matchesDate && matchesType && matchesPrice;
    });
  }, [transactions, categories, accounts, filters]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  return (
    <div className="space-y-4">
      <SearchBar 
        filters={filters} 
        setFilters={setFilters} 
        typeOptions={uniqueCategoryNames}
        priceLabel="Min Amount"
      />
      
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Account</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {transactions.length === 0 ? "No transactions found. Add one to get started." : "No results match your search criteria."}
                  </td>
                </tr>
              ) : (
                sortedTransactions.map(t => {
                  const category = categories.find(c => c.id === t.categoryId);
                  const account = accounts.find(a => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${category?.color || '#cbd5e1'}15`, color: category?.color || '#64748b' }}
                        >
                          {category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {account?.name || 'Unknown Account'}
                      </td>
                      <td className={`px-6 py-4 text-sm font-black text-right ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onEdit(t)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

export default TransactionList;