import React from 'react';

export interface SearchFilters {
  date: string;
  type: string;
  price: string;
  query: string;
}

interface SearchBarProps {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  typeOptions?: string[];
  priceLabel?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ filters, setFilters, typeOptions = [], priceLabel = "Price" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({ date: '', type: '', price: '', query: '' });
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Search</label>
          <input
            type="text"
            name="query"
            value={filters.query}
            onChange={handleChange}
            placeholder="Name or desc..."
            className="w-full px-3 py-1.5 text-sm bg-white/80 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Date</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
            className="w-full px-3 py-1.5 text-sm bg-white/80 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full px-3 py-1.5 text-sm bg-white/80 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">All Types</option>
            {typeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">{priceLabel} ($)</label>
          <input
            type="number"
            name="price"
            value={filters.price}
            onChange={handleChange}
            placeholder="Min amount..."
            className="w-full px-3 py-1.5 text-sm bg-white/80 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearFilters}
            className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest bg-slate-100 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
