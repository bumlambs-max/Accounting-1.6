
import React, { useState } from 'react';
import { Category, Transaction, Account, AnimalSpecies, AnimalLog, InventoryItem, InventoryMovement, Asset, Liability, NavItemConfig } from '../types.ts';
import { MODULE_REGISTRY } from '../constants.tsx';
import CategoryManager from './CategoryManager.tsx';
import { ApiService } from '../services/apiService.ts';

interface SettingsProps {
  // Farm Name
  farmName: string;
  onUpdateFarmName: (name: string) => void;
  // Category Props
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  // Data for Backup
  user: any;
  transactions: Transaction[];
  accounts: Account[];
  animalSpecies: AnimalSpecies[];
  animalLogs: AnimalLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  assets: Asset[];
  liabilities: Liability[];
  // Sidebar Props
  sidebarConfig: NavItemConfig[];
  onUpdateSidebar: (config: NavItemConfig[]) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  // Bulk actions
  onImportData: (data: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  farmName, onUpdateFarmName,
  categories, onAddCategory, onUpdateCategory, onDeleteCategory,
  user, transactions, accounts, animalSpecies, animalLogs, inventoryItems, inventoryMovements, assets, liabilities,
  sidebarConfig, onUpdateSidebar, isSidebarCollapsed, onToggleCollapse,
  onImportData
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Section collapse states
  const [isDisplayOpen, setIsDisplayOpen] = useState(true);
  const [isCloudOpen, setIsCloudOpen] = useState(true);
  const [isDataMgmtOpen, setIsDataMgmtOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  const handleCloudPull = async () => {
    if (!window.confirm("Pull latest data from the cloud? Local changes not yet synced might be lost.")) return;
    setIsSyncing(true);
    try {
      const data = await ApiService.pullData(user.email);
      if (data) onImportData(data);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleVisibility = (id: string) => {
    const newConfig = sidebarConfig.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    onUpdateSidebar(newConfig);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newConfig = [...sidebarConfig];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newConfig.length) return;
    
    const temp = newConfig[index];
    newConfig[index] = newConfig[targetIndex];
    newConfig[targetIndex] = temp;
    
    onUpdateSidebar(newConfig);
  };

  const handleExport = () => {
    const backupData = {
      version: '1.4',
      timestamp: new Date().toISOString(),
      farmName,
      user,
      transactions,
      categories,
      accounts,
      animalSpecies,
      animalLogs,
      inventoryItems,
      inventoryMovements,
      assets,
      liabilities,
      sidebarConfig,
      isSidebarCollapsed
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.transactions || !data.categories) {
          throw new Error('Invalid backup file format.');
        }

        if (window.confirm('Warning: Restoring from backup will replace ALL current data. Do you wish to proceed?')) {
          onImportData(data);
          alert('Data restored successfully!');
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse backup file.');
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const SectionHeader = ({ icon, title, isOpen, onToggle }: { icon: React.ReactNode, title: string, isOpen: boolean, onToggle: () => void }) => (
    <button onClick={onToggle} className="w-full flex items-center justify-between mb-6 group focus:outline-none">
      <div className={`flex items-center space-x-3 px-5 py-2.5 rounded-full border transition-all duration-300 bg-white border-slate-200 shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:shadow-md group-hover:shadow-emerald-100/50`}>
        <div className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">{icon}</div>
        <h2 className="text-lg font-bold text-slate-700 tracking-tight group-hover:text-emerald-800 transition-colors whitespace-nowrap">{title}</h2>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 bg-white border border-slate-200 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:border-emerald-300 group-hover:shadow-md group-hover:shadow-emerald-100`}>
        <svg className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Account Identity */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          title="Account Identity"
          isOpen={true}
          onToggle={() => {}} // Mandatory section
        />
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farm Entity Name</label>
            <input 
              type="text" 
              value={farmName} 
              onChange={(e) => onUpdateFarmName(e.target.value)}
              className="w-full max-w-md px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold text-slate-800"
              placeholder="Enter your farm's name..."
            />
            <p className="text-sm text-slate-500 mt-2">This name is isolated to your email account <span className="font-bold">{user.email}</span>.</p>
          </div>
        </div>
      </section>

      {/* Cloud & Cross-Device Sync */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
          title="Cloud & Remote Sync"
          isOpen={isCloudOpen}
          onToggle={() => setIsCloudOpen(!isCloudOpen)}
        />
        {isCloudOpen && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Isolated Data Stream</p>
                <p className="text-sm text-slate-500">Your farm data is only accessible to <span className="text-emerald-600 font-bold">{user.email}</span>.</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-widest">Connected</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleCloudPull}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                {isSyncing ? <svg className="animate-spin h-5 w-5 mr-3 border-2 border-white/20 border-t-white rounded-full" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                <span>Force Cloud Pull</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          title="Display Preferences"
          isOpen={isDisplayOpen}
          onToggle={() => setIsDisplayOpen(!isDisplayOpen)}
        />
        {isDisplayOpen && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="font-bold text-slate-800">Compact Sidebar</p><p className="text-sm text-slate-500">Collapse the navigation menu into an icon-only view.</p></div>
              <button onClick={onToggleCollapse} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSidebarCollapsed ? 'bg-emerald-600' : 'bg-slate-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSidebarCollapsed ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-700">Sidebar Layout & Visibility</p>
                <p className="text-xs text-slate-500">Change the order of modules or hide those you don't frequently use.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {sidebarConfig.map((item, index) => {
                  const moduleInfo = MODULE_REGISTRY.find(m => m.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.visible ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                          {moduleInfo?.icon}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${item.visible ? 'text-slate-800' : 'text-slate-400 italic'}`}>{moduleInfo?.label || item.id}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{item.visible ? 'Visible' : 'Hidden'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col space-y-0.5">
                          <button 
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button 
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === sidebarConfig.length - 1}
                            className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <button
                          onClick={() => toggleVisibility(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${item.visible ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {item.visible ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" /></svg>}
          title="Financial Categories"
          isOpen={isCategoriesOpen}
          onToggle={() => setIsCategoriesOpen(!isCategoriesOpen)}
        />
        {isCategoriesOpen && <CategoryManager categories={categories} onAdd={onAddCategory} onUpdate={onUpdateCategory} onDelete={onDeleteCategory} />}
      </section>

      {/* Data Mgmt Section */}
      <section>
        <SectionHeader 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
          title="Manual Import/Export"
          isOpen={isDataMgmtOpen}
          onToggle={() => setIsDataMgmtOpen(!isDataMgmtOpen)}
        />
        {isDataMgmtOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="text-lg font-bold text-slate-800 mb-2">Offline Backup</h3><button onClick={handleExport} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all">Download .JSON</button></div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-400"><h3 className="text-lg font-bold text-slate-800 mb-2">Restore Backup</h3><input type="file" accept=".json" onChange={handleImport} className="hidden" id="restore-upload" /><label htmlFor="restore-upload" className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer">Select File</label></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
