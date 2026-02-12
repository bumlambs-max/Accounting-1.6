import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Transaction, 
  Category, 
  TransactionType, 
  AnimalSpecies, 
  AnimalLog, 
  PopulationChange, 
  Account,
  AccountType,
  NavItemConfig
} from './types.ts';
import { INITIAL_CATEGORIES, MODULE_REGISTRY } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import Reports from './components/Reports.tsx';
import Settings from './components/Settings.tsx';
import AnimalManager from './components/AnimalManager.tsx';
import AssetManager from './components/AssetManager.tsx';
import LiabilityManager from './components/LiabilityManager.tsx';
import InventoryManager from './components/InventoryManager.tsx';
import AccountRegistry from './components/AccountRegistry.tsx';
import SignIn from './components/SignIn.tsx';
import { ApiService, FarmData } from './services/apiService.ts';

interface User {
  name: string;
  email: string;
}

const getInitialDataTemplate = (): FarmData => ({
  farmName: 'My Private Farm',
  transactions: [],
  categories: INITIAL_CATEGORIES,
  accounts: [],
  animalSpecies: [],
  animalLogs: [],
  inventoryItems: [],
  inventoryMovements: [],
  assets: [],
  liabilities: [],
  sidebarConfig: MODULE_REGISTRY.map(m => ({ id: m.id, visible: true })),
  isSidebarCollapsed: false
});

interface TransactionPageProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionPage: React.FC<TransactionPageProps> = ({ type, transactions, categories, accounts, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(t => {
    if (t.type !== type) return false;
    if (type === TransactionType.INCOME) {
      const account = accounts.find(a => a.id === t.accountId);
      return account?.type !== AccountType.CREDIT;
    }
    return true;
  });

  const pageLabel = type === TransactionType.INCOME ? 'Income' : 'Expense';
  const themeColor = type === TransactionType.INCOME ? 'bg-emerald-600' : 'bg-blue-600';

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (t: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      onUpdate({ ...t, id: editingTransaction.id });
    } else {
      onAdd(t);
    }
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">{pageLabel} Ledger</h2>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className={`${themeColor} text-white px-6 py-2 rounded-lg font-bold shadow-md hover:opacity-90 transition-all flex items-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add {pageLabel}</span>
          </button>
        )}
      </div>

      {showForm && (
        <TransactionForm 
          categories={categories} 
          accounts={accounts} 
          fixedType={type}
          initialData={editingTransaction || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      <TransactionList 
        transactions={filteredTransactions} 
        categories={categories} 
        accounts={accounts} 
        onDelete={onDelete} 
        onEdit={handleEdit} 
      />
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  farmName: string;
  onLogout: () => void;
  sidebarConfig: NavItemConfig[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSyncing: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, user, farmName, onLogout, sidebarConfig, isCollapsed, onToggleCollapse, isSyncing }) => {
  const location = useLocation();

  const getTitle = () => {
    const active = MODULE_REGISTRY.find(m => m.path === location.pathname);
    return active ? active.label : 'Financial Overview';
  };

  const enabledModules = useMemo(() => {
    return sidebarConfig
      .filter(c => c.visible)
      .map(c => MODULE_REGISTRY.find(m => m.id === c.id))
      .filter((m): m is NonNullable<typeof m> => !!m);
  }, [sidebarConfig]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* 
        On mobile/tablet (< lg): sticky top bar with horizontal scrollable menu
        On desktop (>= lg): fixed sidebar
      */}
      <aside className={`
        sticky top-0 bg-white/95 backdrop-blur-md border-b lg:border-r border-slate-200 z-50 transition-all duration-300 print:hidden
        flex flex-col w-full lg:sticky lg:top-0 lg:h-screen lg:inset-y-0
        ${isCollapsed ? 'lg:w-24' : 'lg:w-64'}
      `}>
        {/* Top Header Section (Farm Name & User Actions) */}
        <div className="px-6 py-4 lg:py-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <rect x="10" y="7" width="4" height="11" rx="2" fill="currentColor"/>
                <path d="M8 18C8 18 5 13 6 9C7 5 10 3 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 18C16 18 19 13 18 9C17 5 14 3 14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {(!isCollapsed || window.innerWidth < 1024) && (
              <span className="text-lg font-black text-slate-800 tracking-tight truncate max-w-[120px] lg:max-w-none">
                {farmName}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
             {/* Desktop Collapse Toggle */}
            <button onClick={onToggleCollapse} className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-emerald-600 hover:text-white transition-all absolute -right-3 top-16 shadow-md border border-white`}>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* User Profile & Logout (Row-based for all screens in header) */}
            <div className={`flex items-center space-x-2`}>
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-700 font-bold text-[10px] uppercase">
                {user.name.charAt(0)}
              </div>
              <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 rounded-lg lg:bg-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Horizontal scroll on mobile, vertical list on desktop) */}
        <nav className={`
          flex flex-row lg:flex-col lg:space-y-1.5 flex-1 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden custom-scrollbar px-4 lg:px-6 pb-2 lg:pb-0 scroll-smooth
        `}>
          {enabledModules.map((module) => (
            <Link 
              key={module.id} 
              to={module.path} 
              className={`
                flex items-center space-x-2 lg:space-x-3 px-3 py-2 lg:px-4 lg:py-3 rounded-lg transition-all relative group/nav whitespace-nowrap flex-shrink-0
                ${location.pathname === module.path ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100/50' : 'text-slate-500 hover:bg-slate-100'}
              `}
            >
              <div className="flex-shrink-0">{module.icon}</div>
              {(!isCollapsed || window.innerWidth < 1024) && <span className="font-medium text-xs lg:text-sm">{module.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Desktop Footer Only Info */}
        <div className="hidden lg:block mt-auto p-6 border-t border-slate-100">
          <div className={`p-4 bg-emerald-50 rounded-xl transition-all duration-300 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
             {!isCollapsed && <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight">{isSyncing ? 'Cloud Syncing...' : 'In Sync'}</p>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex mb-8 justify-between items-center px-8 pt-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{getTitle()}</h1>
            <p className="text-slate-500 text-sm">Isolated Account: <span className="font-bold text-emerald-600">{user.email}</span></p>
          </div>
        </header>
        <div className="p-4 lg:p-8 pt-4 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [data, setData] = useState<FarmData>(getInitialDataTemplate());

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('active_user', JSON.stringify(user));
      setData(getInitialDataTemplate());

      const loadFromCloud = async () => {
        setIsSyncing(true);
        const cloudData = await ApiService.pullData(user.email);
        if (cloudData) {
          setData(cloudData);
        } else {
          setData(prev => ({ ...prev, farmName: `${user.name.split(' ')[0]}'s Farm` }));
        }
        setIsSyncing(false);
      };
      loadFromCloud();
    } else {
      localStorage.removeItem('active_user');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await ApiService.pushData(user.email, data);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [data, user]);

  const updateData = (updates: Partial<FarmData>) => setData(prev => ({ ...prev, ...updates }));

  const handleLogout = () => { if (window.confirm("Log out? Local changes will remain in sync.")) setUser(null); };

  if (!user) return <SignIn onSignIn={setUser} />;

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    updateData({ transactions: [...data.transactions, { ...t, id: crypto.randomUUID() }] });
  };

  const handleUpdateTransaction = (t: Transaction) => {
    updateData({ transactions: data.transactions.map(x => x.id === t.id ? t : x) });
  };

  const handleDeleteTransaction = (id: string) => {
    updateData({ transactions: data.transactions.filter(t => t.id !== id) });
  };

  const handleRecordAnimalLog = (l: Omit<AnimalLog, 'id'>) => {
    const isAdd = l.type === PopulationChange.BOUGHT || l.type === PopulationChange.BIRTH;
    const changeAmount = isAdd ? l.quantity : -l.quantity;

    setData(prev => ({
      ...prev,
      animalLogs: [...prev.animalLogs, { ...l, id: crypto.randomUUID() }],
      animalSpecies: prev.animalSpecies.map(s => 
        s.id === l.speciesId ? { ...s, count: Math.max(0, s.count + changeAmount) } : s
      )
    }));
  };

  return (
    <Router>
      <Layout 
        user={user} 
        farmName={data.farmName} 
        onLogout={handleLogout} 
        sidebarConfig={data.sidebarConfig} 
        isCollapsed={data.isSidebarCollapsed} 
        onToggleCollapse={() => updateData({ isSidebarCollapsed: !data.isSidebarCollapsed })} 
        isSyncing={isSyncing}
      >
        <Routes>
          <Route path="/" element={<Dashboard {...data} />} />
          <Route path="/accounts" element={<AccountRegistry accounts={data.accounts} transactions={data.transactions} onAdd={(a) => updateData({ accounts: [...data.accounts, { ...a, id: crypto.randomUUID() }] })} onUpdate={(a) => updateData({ accounts: data.accounts.map(x => x.id === a.id ? a : x) })} onDelete={(id) => updateData({ accounts: data.accounts.filter(x => x.id !== id) })} />} />
          <Route path="/income" element={<TransactionPage type={TransactionType.INCOME} transactions={data.transactions} categories={data.categories} accounts={data.accounts} onAdd={handleAddTransaction} onUpdate={handleUpdateTransaction} onDelete={handleDeleteTransaction} />} />
          <Route path="/expenses" element={<TransactionPage type={TransactionType.EXPENSE} transactions={data.transactions} categories={data.categories} accounts={data.accounts} onAdd={handleAddTransaction} onUpdate={handleUpdateTransaction} onDelete={handleDeleteTransaction} />} />
          <Route path="/animals" element={<AnimalManager species={data.animalSpecies} logs={data.animalLogs} onAddSpecies={(s) => updateData({ animalSpecies: [...data.animalSpecies, { ...s, id: crypto.randomUUID(), count: 0 }] })} onUpdateSpecies={(s) => updateData({ animalSpecies: data.animalSpecies.map(x => x.id === s.id ? s : x) })} onRecordLog={handleRecordAnimalLog} onDeleteSpecies={(id) => updateData({ animalSpecies: data.animalSpecies.filter(x => x.id !== id) })} />} />
          <Route path="/inventory" element={<InventoryManager items={data.inventoryItems} movements={data.inventoryMovements} onAddItem={(i) => updateData({ inventoryItems: [...data.inventoryItems, { ...i, id: crypto.randomUUID(), quantity: 0 }] })} onUpdateItem={(i) => updateData({ inventoryItems: data.inventoryItems.map(x => x.id === i.id ? i : x) })} onRecordMovement={(m) => updateData({ inventoryMovements: [...data.inventoryMovements, { ...m, id: crypto.randomUUID() }] })} onDeleteItem={(id) => updateData({ inventoryItems: data.inventoryItems.filter(x => x.id !== id) })} />} />
          <Route path="/assets" element={<AssetManager assets={data.assets} animalSpecies={data.animalSpecies} inventoryItems={data.inventoryItems} onAdd={(a) => updateData({ assets: [...data.assets, { ...a, id: crypto.randomUUID() }] })} onDelete={(id) => updateData({ assets: data.assets.filter(x => x.id !== id) })} onUpdate={(a) => updateData({ assets: data.assets.map(x => x.id === a.id ? a : x) })} />} />
          <Route path="/liabilities" element={<LiabilityManager liabilities={data.liabilities} categories={data.categories} accounts={data.accounts} transactions={data.transactions} onAdd={(l) => updateData({ liabilities: [...data.liabilities, { ...l, id: crypto.randomUUID() }] })} onDelete={(id) => updateData({ liabilities: data.liabilities.filter(x => x.id !== id) })} onUpdate={(l) => updateData({ liabilities: data.liabilities.map(x => x.id === l.id ? l : x) })} onAddTransaction={handleAddTransaction} />} />
          <Route path="/settings" element={<Settings {...data} onAddCategory={(c) => updateData({ categories: [...data.categories, { ...c, id: crypto.randomUUID() }] })} onUpdateCategory={(c) => updateData({ categories: data.categories.map(x => x.id === c.id ? c : x) })} onDeleteCategory={(id) => updateData({ categories: data.categories.filter(x => x.id !== id) })} onUpdateSidebar={(cfg) => updateData({ sidebarConfig: cfg })} onToggleCollapse={() => updateData({ isSidebarCollapsed: !data.isSidebarCollapsed })} onImportData={setData} onUpdateFarmName={(name) => updateData({ farmName: name })} user={user} />} />
          <Route path="/reports" element={<Reports {...data} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;