import React, { useState, useMemo } from 'react';
import { Category, TransactionType } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (category: Omit<Category, 'id'>) => void;
  onUpdate: (category: Category) => void;
  onDelete: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [color, setColor] = useState(COLORS[0]);

  const resetForm = () => {
    setName('');
    setType(TransactionType.EXPENSE);
    setColor(COLORS[0]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setIsAdding(true);
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" category? This will affect your ledger filtering.`)) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdate({ id: editingId, name, type, color });
    } else {
      onAdd({ name, type, color });
    }
    resetForm();
  };

  const incomeCategories = useMemo(() => categories.filter(c => c.type === TransactionType.INCOME), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE), [categories]);

  const CategoryGrid = ({ items, title }: { items: Category[], title: string }) => (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((cat) => (
          <div 
            key={cat.id} 
            className={`bg-white p-4 rounded-xl border transition-all group relative overflow-hidden ${
              editingId === cat.id 
                ? 'border-blue-500 ring-2 ring-blue-50 shadow-md' 
                : 'border-slate-100 shadow-sm hover:border-slate-300'
            }`}
          >
            {editingId === cat.id && (
              <div className="absolute top-0 right-0 p-1">
                <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase">Editing</span>
              </div>
            )}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{cat.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(cat)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center space-x-1"
                  title="Edit Category"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Delete Category"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic py-4 pl-2">No categories defined for this type.</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Category Configuration</h3>
          <p className="text-xs text-slate-500 mt-1">Manage labels and colors for your financial ledger.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setName(''); setType(TransactionType.EXPENSE); setColor(COLORS[0]); }}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-100 text-xs font-black uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-emerald-100 shadow-xl shadow-emerald-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-slate-800 text-lg tracking-tight flex items-center space-x-2">
              <span className={`w-2 h-6 rounded-full ${editingId ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <span>{editingId ? 'Edit Existing Category' : 'Design New Category'}</span>
            </h4>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Label Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                  placeholder="e.g. Livestock Feed, Market Sales..."
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ledger Placement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`px-4 py-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                      type === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-inner' : 'bg-white border-slate-100 text-slate-400 grayscale'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`px-4 py-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                      type === TransactionType.EXPENSE ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-inner' : 'bg-white border-slate-100 text-slate-400 grayscale'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Theme Color Mapping</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-xl border-4 transition-all hover:scale-110 ${
                      color === c ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center space-x-4 border border-slate-100">
                <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview Appearance</p>
                  <p className="font-bold text-slate-800">{name || 'Category Name'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-xs uppercase tracking-widest"
            >
              Cancel Changes
            </button>
            <button
              type="submit"
              className={`px-8 py-3 text-white font-black rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest ${
                editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              {editingId ? 'Update Identity' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-12">
        <CategoryGrid items={incomeCategories} title="Revenue & Income Channels" />
        <CategoryGrid items={expenseCategories} title="Expense & Operational Streams" />
      </div>
    </div>
  );
};

export default CategoryManager;