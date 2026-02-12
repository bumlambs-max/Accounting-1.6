
import React, { useState, useMemo } from 'react';
import { AnimalSpecies, AnimalLog, PopulationChange } from '../types.ts';
import SearchBar, { SearchFilters } from './SearchBar.tsx';

interface AnimalManagerProps {
  species: AnimalSpecies[];
  logs: AnimalLog[];
  onAddSpecies: (item: Omit<AnimalSpecies, 'id' | 'count'>) => void;
  onUpdateSpecies: (item: AnimalSpecies) => void;
  onRecordLog: (log: Omit<AnimalLog, 'id'>) => void;
  onDeleteSpecies: (id: string) => void;
}

const AnimalManager: React.FC<AnimalManagerProps> = ({ 
  species, 
  logs, 
  onAddSpecies, 
  onUpdateSpecies, 
  onRecordLog,
  onDeleteSpecies
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
  const [showSpeciesForm, setShowSpeciesForm] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<AnimalSpecies | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    date: '',
    type: '',
    price: '',
    query: ''
  });

  // Form States
  const [newSpecies, setNewSpecies] = useState({ name: '', tag: '', breed: '', estimatedValue: 0 });
  const [newLog, setNewLog] = useState({ 
    speciesId: '', 
    type: PopulationChange.BOUGHT, 
    quantity: 1, 
    note: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const handleAddSpecies = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSpecies) {
      onUpdateSpecies({ ...editingSpecies, ...newSpecies });
      setEditingSpecies(null);
    } else {
      onAddSpecies(newSpecies);
    }
    setNewSpecies({ name: '', tag: '', breed: '', estimatedValue: 0 });
    setShowSpeciesForm(false);
  };

  const handleEditClick = (s: AnimalSpecies) => {
    setEditingSpecies(s);
    setNewSpecies({ name: s.name, tag: s.tag, breed: s.breed, estimatedValue: s.estimatedValue });
    setShowSpeciesForm(true);
  };

  const handleRecordLog = (e: React.FormEvent) => {
    e.preventDefault();
    const item = species.find(s => s.id === newLog.speciesId);
    if (!item) return;

    onRecordLog({
      ...newLog,
      valueAtTime: item.estimatedValue
    });
    setShowLogForm(false);
    setNewLog({ 
      speciesId: '', 
      type: PopulationChange.BOUGHT, 
      quantity: 1, 
      note: '', 
      date: new Date().toISOString().split('T')[0] 
  });
  };

  const totalLivestockValue = useMemo(() => {
    return species.reduce((sum, s) => sum + (s.count * s.estimatedValue), 0);
  }, [species]);

  const totalAnimalCount = useMemo(() => {
    return species.reduce((sum, s) => sum + s.count, 0);
  }, [species]);

  const mortalityStats = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentDeathLogs = logs.filter(log => 
      log.type === PopulationChange.DEATH && 
      new Date(log.date) >= oneYearAgo
    );

    const totalRecentDeaths = recentDeathLogs.reduce((sum, log) => sum + log.quantity, 0);

    const sheepSpeciesIds = species
      .filter(s => s.name.toLowerCase().includes('sheep'))
      .map(s => s.id);

    const sheepDeaths = recentDeathLogs
      .filter(log => sheepSpeciesIds.includes(log.speciesId))
      .reduce((sum, log) => sum + log.quantity, 0);

    return { totalRecentDeaths, sheepDeaths };
  }, [logs, species]);

  const filteredSpecies = useMemo(() => {
    return species.filter(s => {
      const matchesQuery = s.name.toLowerCase().includes(filters.query.toLowerCase()) || 
                           s.breed.toLowerCase().includes(filters.query.toLowerCase()) ||
                           s.tag.toLowerCase().includes(filters.query.toLowerCase());
      const matchesType = !filters.type || s.breed === filters.type || s.name === filters.type;
      const matchesPrice = !filters.price || s.estimatedValue >= parseFloat(filters.price);
      return matchesQuery && matchesType && matchesPrice;
    });
  }, [species, filters]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const item = species.find(s => s.id === log.speciesId);
      const matchesQuery = (item?.name.toLowerCase().includes(filters.query.toLowerCase()) ?? false) || 
                           log.note.toLowerCase().includes(filters.query.toLowerCase());
      const matchesDate = !filters.date || log.date === filters.date;
      const matchesType = !filters.type || log.type === filters.type;
      const matchesPrice = !filters.price || log.valueAtTime >= parseFloat(filters.price);
      
      return matchesQuery && matchesDate && matchesType && matchesPrice;
    });
  }, [logs, species, filters]);

  const sortedHistory = useMemo(() => {
    return [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredLogs]);

  const breedOptions = useMemo(() => Array.from(new Set(species.map(s => s.breed))), [species]);
  const logTypeOptions = Object.values(PopulationChange);

  const getLogBadgeStyles = (type: PopulationChange) => {
    switch (type) {
      case PopulationChange.BOUGHT: return 'bg-emerald-100 text-emerald-700';
      case PopulationChange.BIRTH: return 'bg-blue-100 text-blue-700';
      case PopulationChange.SOLD: return 'bg-amber-100 text-amber-700';
      case PopulationChange.DEATH: return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const isPositiveChange = (type: PopulationChange) => 
    type === PopulationChange.BOUGHT || type === PopulationChange.BIRTH;

  const handleDownloadReport = () => {
    const dataToExport = activeTab === 'status' ? filteredSpecies : filteredLogs;
    const rows = [
      ["Animal Population Report"],
      ["Report Date", new Date().toLocaleDateString()],
      ["Applied Filters", JSON.stringify(filters)],
      [],
      activeTab === 'status' 
        ? ["Species", "Tag/ID", "Breed", "Count", "Est. Value/Head", "Total Asset Value"]
        : ["Date", "Species", "Event", "Qty Change", "Value at Time", "Notes"],
      ...(activeTab === 'status' 
        ? (dataToExport as AnimalSpecies[]).map(s => [s.name, s.tag, s.breed, s.count.toString(), s.estimatedValue.toFixed(2), (s.count * s.estimatedValue).toFixed(2)])
        : (dataToExport as AnimalLog[]).map(l => {
            const s = species.find(x => x.id === l.speciesId);
            return [l.date, s?.name || 'Unknown', l.type, l.quantity.toString(), l.valueAtTime.toFixed(2), l.note];
          })
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Animal_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Animal Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Est. Asset Value</p>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">${totalLivestockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Based on current market estimates</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Animal Count</p>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalAnimalCount.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Active head across all species</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Deaths (Last 365d)</p>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-black text-rose-600">{mortalityStats.totalRecentDeaths}</p>
            {mortalityStats.sheepDeaths > 0 && (
              <span className="text-xs font-bold text-rose-400 uppercase tracking-tighter">({mortalityStats.sheepDeaths} sheep)</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Annual mortality rate indicator</p>
        </div>
      </div>

      <SearchBar 
        filters={filters} 
        setFilters={setFilters} 
        typeOptions={activeTab === 'status' ? breedOptions : logTypeOptions} 
        priceLabel={activeTab === 'status' ? "Value/Head" : "Value At Time"}
      />

      {/* Tabs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-200/50 backdrop-blur-sm p-1.5 rounded-xl w-fit border border-slate-200">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'status' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Populations
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Activity Logs
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowLogForm(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center space-x-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Log Change</span>
          </button>
          <button
            onClick={() => { setShowSpeciesForm(true); setEditingSpecies(null); setNewSpecies({ name: '', tag: '', breed: '', estimatedValue: 0 }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold flex items-center space-x-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span>New Species</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'status' ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Species</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tag/ID</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Count</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Value/Head</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total Value</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSpecies.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No animal records found matching filters.</td></tr>
                ) : (
                  filteredSpecies.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.breed}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{s.tag}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {s.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-right">${s.estimatedValue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">${(s.count * s.estimatedValue).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button onClick={() => handleEditClick(s)} className="text-slate-300 hover:text-blue-600 p-1 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => onDeleteSpecies(s.id)} className="text-slate-300 hover:text-rose-500 p-1 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Species</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedHistory.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No activity logs recorded yet.</td></tr>
                ) : (
                  sortedHistory.map(log => {
                    const item = species.find(s => s.id === log.speciesId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{item?.name || 'Archived Species'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase ${getLogBadgeStyles(log.type)}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right ${isPositiveChange(log.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositiveChange(log.type) ? '+' : '-'}{log.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 italic truncate max-w-[200px]">{log.note || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals remain essentially the same, ensuring forms are clean */}
      {showSpeciesForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddSpecies} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingSpecies ? 'Edit Species' : 'New Animal Species'}</h3>
              <button type="button" onClick={() => setShowSpeciesForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Common Name</label>
                  <input type="text" required value={newSpecies.name} onChange={e => setNewSpecies({...newSpecies, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Holstein Cow" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tag Prefix / ID</label>
                  <input type="text" value={newSpecies.tag} onChange={e => setNewSpecies({...newSpecies, tag: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="H-01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Breed/Category</label>
                  <input type="text" value={newSpecies.breed} onChange={e => setNewSpecies({...newSpecies, breed: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Dairy" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Value per Head ($)</label>
                  <input type="number" step="0.01" required value={newSpecies.estimatedValue} onChange={e => setNewSpecies({...newSpecies, estimatedValue: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowSpeciesForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">{editingSpecies ? 'Update' : 'Save'} Species</button>
            </div>
          </form>
        </div>
      )}

      {showLogForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRecordLog} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="font-bold text-emerald-800 tracking-tight">Record Population Change</h3>
              <button type="button" onClick={() => setShowLogForm(false)} className="text-emerald-400 hover:text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Species</label>
                <select required value={newLog.speciesId} onChange={e => setNewLog({...newLog, speciesId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Select an animal type...</option>
                  {species.map(s => <option key={s.id} value={s.id}>{s.name} ({s.tag}) - Current: {s.count}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Action Type</label>
                  <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value as PopulationChange})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value={PopulationChange.BOUGHT}>Bought (+)</option>
                    <option value={PopulationChange.BIRTH}>Birth (+)</option>
                    <option value={PopulationChange.SOLD}>Sold (-)</option>
                    <option value={PopulationChange.DEATH}>Death (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                  <input type="number" required min="1" value={newLog.quantity} onChange={e => setNewLog({...newLog, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" required value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                  <input type="text" value={newLog.note} onChange={e => setNewLog({...newLog, note: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. New born, Relocated to north field" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowLogForm(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md">Record Log</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AnimalManager;
