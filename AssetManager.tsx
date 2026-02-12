import React, { useState, useMemo } from 'react';
import { Asset, AssetCategory, AnimalSpecies, InventoryItem, AssetTerm } from '../types.ts';
import SearchBar, { SearchFilters } from './SearchBar.tsx';

interface AssetManagerProps {
  assets: Asset[];
  animalSpecies: AnimalSpecies[];
  inventoryItems: InventoryItem[];
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (asset: Asset) => void;
}

const AssetManager: React.FC<AssetManagerProps> = ({ assets, animalSpecies, inventoryItems, onAdd, onDelete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    date: '',
    type: '',
    price: '',
    query: ''
  });

  const [newAsset, setNewAsset] = useState<Omit<Asset, 'id'>>({
    name: '',
    category: AssetCategory.EQUIPMENT,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    currentValue: 0,
    description: ''
  });

  const livestockAssets = useMemo(() => {
    return animalSpecies.map(s => ({
      id: `animal-${s.id}`,
      name: `${s.name} (${s.count} head)`,
      category: AssetCategory.LIVESTOCK,
      purchaseDate: '-', 
      purchasePrice: 0, 
      currentValue: s.count * s.estimatedValue,
      description: `${s.breed} - Managed in Animal Management`,
      isLiveStock: true,
      isInventory: false
    }));
  }, [animalSpecies]);

  const inventoryAssets = useMemo(() => {
    return inventoryItems.map(i => ({
      id: `inv-${i.id}`,
      name: `${i.name} (${i.quantity} units)`,
      category: AssetCategory.INVENTORY,
      purchaseDate: '-', 
      purchasePrice: 0, 
      currentValue: i.quantity * i.unitCost,
      description: `${i.sku} - ${i.assetTerm === AssetTerm.LONG_TERM ? 'Long-term' : 'Short-term'} inventory asset`,
      isLiveStock: false,
      isInventory: true,
      term: i.assetTerm
    }));
  }, [inventoryItems]);

  const allAssets = useMemo(() => {
    return [
      ...assets.map(a => ({ ...a, isLiveStock: false, isInventory: false })),
      ...livestockAssets,
      ...inventoryAssets
    ].sort((a, b) => b.currentValue - a.currentValue);
  }, [assets, livestockAssets, inventoryAssets]);

  const filteredAssets = useMemo(() => {
    return allAssets.filter(a => {
      const matchesQuery = a.name.toLowerCase().includes(filters.query.toLowerCase()) || 
                           a.description.toLowerCase().includes(filters.query.toLowerCase());
      const matchesDate = !filters.date || a.purchaseDate === filters.date;
      const matchesType = !filters.type || a.category === filters.type;
      const matchesPrice = !filters.price || a.currentValue >= parseFloat(filters.price);
      
      return matchesQuery && matchesDate && matchesType && matchesPrice;
    });
  }, [allAssets, filters]);

  const stats = useMemo(() => {
    const fixedValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    const liveValue = animalSpecies.reduce((sum, s) => sum + (s.count * s.estimatedValue), 0);
    const invValue = inventoryItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
    
    return {
      totalValue: fixedValue + liveValue + invValue,
      fixedValue,
      liveValue,
      invValue,
      assetCount: assets.length + animalSpecies.length + inventoryItems.length
    };
  }, [assets, animalSpecies, inventoryItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      onUpdate({ ...editingAsset, ...newAsset });
      setEditingAsset(null);
    } else {
      onAdd(newAsset);
    }
    setNewAsset({
      name: '',
      category: AssetCategory.EQUIPMENT,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      currentValue: 0,
      description: ''
    });
    setShowForm(false);
  };

  const handleEditClick = (asset: any) => {
    if (asset.isLiveStock || asset.isInventory) return;
    setEditingAsset(asset);
    setNewAsset({
      name: asset.name,
      category: asset.category,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
      currentValue: asset.currentValue,
      description: asset.description
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Total Asset Value</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Fixed Property</p>
          <p className="text-xl font-bold text-slate-800 mt-1">${stats.fixedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Livestock Assets</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">${stats.liveValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase">Inventory Value</p>
          <p className="text-xl font-bold text-blue-500 mt-1">${stats.invValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <SearchBar 
        filters={filters} 
        setFilters={setFilters} 
        typeOptions={Object.values(AssetCategory)} 
        priceLabel="Min Current Value"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Consolidated Asset Ledger</h3>
        <button
          onClick={() => { setShowForm(true); setEditingAsset(null); setNewAsset({ name: '', category: AssetCategory.EQUIPMENT, purchaseDate: new Date().toISOString().split('T')[0], purchasePrice: 0, currentValue: 0, description: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          <span>Record New Asset</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingAsset ? 'Edit Asset Record' : 'New Asset Record'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Name</label>
                  <input type="text" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Deere Tractor" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select required value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value as AssetCategory})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.values(AssetCategory).filter(c => c !== AssetCategory.LIVESTOCK && c !== AssetCategory.INVENTORY).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Date</label>
                  <input type="date" required value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purchase Price ($)</label>
                  <input type="number" step="0.01" required value={newAsset.purchasePrice} onChange={e => setNewAsset({...newAsset, purchasePrice: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Value ($)</label>
                  <input type="number" step="0.01" required value={newAsset.currentValue} onChange={e => setNewAsset({...newAsset, currentValue: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea value={newAsset.description} onChange={e => setNewAsset({...newAsset, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20" placeholder="Condition, location, or serial numbers..."></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">{editingAsset ? 'Update' : 'Save'} Asset</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Asset</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Purchased</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Value</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAssets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">{allAssets.length === 0 ? "No assets found." : "No assets match your search."}</td></tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className={`hover:bg-slate-50 transition-colors group ${asset.isLiveStock ? 'bg-emerald-50/20' : asset.isInventory ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{asset.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[250px]">{asset.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        asset.isLiveStock ? 'bg-emerald-100 text-emerald-700' : 
                        asset.isInventory ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{asset.purchaseDate}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">${asset.currentValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {!asset.isLiveStock && !asset.isInventory && (
                          <>
                            <button onClick={() => handleEditClick(asset)} className="text-slate-300 hover:text-blue-600 p-1 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => onDelete(asset.id)} className="text-slate-300 hover:text-rose-500 p-1 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                        {(asset.isLiveStock || asset.isInventory) && (
                          <span className="text-[10px] text-slate-400 font-medium italic">Synced</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetManager;