import React from 'react';
import { Transaction, Category, TransactionType, AnimalSpecies, Asset, Liability, Account, AccountType } from '../types.ts';

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  animalSpecies: AnimalSpecies[];
  assets: Asset[];
  liabilities: Liability[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, categories, accounts, animalSpecies, assets, liabilities }) => {
  // Filter out credit card payments from "Income" reporting
  // A credit card payment is an INCOME transaction on a CREDIT account
  const incomeTransactions = transactions.filter(t => {
    if (t.type !== TransactionType.INCOME) return false;
    const account = accounts.find(a => a.id === t.accountId);
    return account?.type !== AccountType.CREDIT;
  });

  const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const expensesByCategory = categories
    .filter(c => c.type === TransactionType.EXPENSE)
    .map(cat => ({
      name: cat.name,
      amount: transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0)
    }))
    .filter(c => c.amount > 0);

  const revenueByCategory = categories
    .filter(c => c.type === TransactionType.INCOME)
    .map(cat => ({
      name: cat.name,
      amount: incomeTransactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0)
    }))
    .filter(c => c.amount > 0);

  // Balance Sheet Real Data
  const livestockValue = animalSpecies.reduce((sum, s) => sum + (s.count * s.estimatedValue), 0);
  const fixedAssetValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalCashAndBank = netIncome; // Simplified for this app context
  const totalAssets = totalCashAndBank + livestockValue + fixedAssetValue;

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalEquity = totalAssets - totalLiabilities;

  // Download Helper
  const downloadCSV = (rows: string[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPL = () => {
    const rows = [
      ["Profit & Loss Statement"],
      ["Period Ending", new Date().toLocaleDateString()],
      [],
      ["REVENUE"],
      ...revenueByCategory.map(r => [r.name, r.amount.toFixed(2)]),
      ["Total Revenue", totalRevenue.toFixed(2)],
      [],
      ["OPERATING EXPENSES"],
      ...expensesByCategory.map(e => [e.name, e.amount.toFixed(2)]),
      ["Total Expenses", totalExpenses.toFixed(2)],
      [],
      ["NET INCOME", netIncome.toFixed(2)]
    ];
    downloadCSV(rows, "Profit_and_Loss");
  };

  const handleDownloadBalanceSheet = () => {
    const rows = [
      ["Balance Sheet"],
      ["Date", new Date().toLocaleDateString()],
      [],
      ["ASSETS"],
      ["Cash and Bank (Net Earnings)", totalCashAndBank.toFixed(2)],
      ["Livestock Value", livestockValue.toFixed(2)],
      ["Fixed Assets", fixedAssetValue.toFixed(2)],
      ["Total Assets", totalAssets.toFixed(2)],
      [],
      ["LIABILITIES"],
      ...liabilities.map(l => [l.name, l.currentBalance.toFixed(2)]),
      ["Total Liabilities", totalLiabilities.toFixed(2)],
      [],
      ["EQUITY"],
      ["Owner's Equity", totalEquity.toFixed(2)],
      ["Total Liabilities & Equity", (totalLiabilities + totalEquity).toFixed(2)]
    ];
    downloadCSV(rows, "Balance_Sheet");
  };

  const handleDownloadOE = () => {
    const rows = [
      ["Statement of Owner's Equity"],
      ["Date", new Date().toLocaleDateString()],
      [],
      ["Net Income (Retained Earnings)", netIncome.toFixed(2)],
      ["Contributed Capital / Non-Cash Equity", (totalEquity - netIncome).toFixed(2)],
      ["Total Owner's Equity", totalEquity.toFixed(2)]
    ];
    downloadCSV(rows, "Owners_Equity");
  };

  const handleDownloadCashFlow = () => {
    const rows = [
      ["Cash Flow Statement (Direct)"],
      [],
      ["Cash Inflow from Operations", totalRevenue.toFixed(2)],
      ["Cash Outflow for Operations", `-${totalExpenses.toFixed(2)}`],
      ["Net Cash Flow", netIncome.toFixed(2)]
    ];
    downloadCSV(rows, "Cash_Flow");
  };

  return (
    <div className="space-y-12 pb-12 print:p-0">
      <div className="flex justify-end print:hidden">
        <button 
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print All Reports</span>
        </button>
      </div>

      {/* Profit & Loss */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 relative group overflow-hidden break-inside-avoid">
        <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Profit & Loss Statement</h2>
            <p className="text-sm text-slate-500">For the period ending {new Date().toLocaleDateString()}</p>
          </div>
          <button 
            onClick={handleDownloadPL}
            className="print:hidden text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>CSV</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between font-semibold text-slate-700 uppercase text-sm tracking-wider">
            <span>Revenue</span>
            <span>Amount</span>
          </div>
          {revenueByCategory.length > 0 ? revenueByCategory.map(item => (
            <div key={item.name} className="flex justify-between text-slate-600 pl-4 border-l-2 border-emerald-100">
              <span>{item.name}</span>
              <span>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )) : <div className="text-slate-400 italic pl-4">No revenue recorded</div>}
          <div className="flex justify-between font-bold text-slate-900 border-t pt-2 mt-2">
            <span>Total Revenue</span>
            <span>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between font-semibold text-slate-700 uppercase text-sm tracking-wider mt-8">
            <span>Operating Expenses</span>
            <span>Amount</span>
          </div>
          {expensesByCategory.length > 0 ? expensesByCategory.map(item => (
            <div key={item.name} className="flex justify-between text-slate-600 pl-4 border-l-2 border-rose-100">
              <span>{item.name}</span>
              <span>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )) : <div className="text-slate-400 italic pl-4">No expenses recorded</div>}
          <div className="flex justify-between font-bold text-slate-900 border-t pt-2 mt-2">
            <span>Total Expenses</span>
            <span>(${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
          </div>

          <div className="flex justify-between font-black text-lg text-blue-700 border-t-2 border-slate-900 pt-4 mt-8 bg-blue-50/50 p-4 rounded-lg">
            <span>Net Income / (Loss)</span>
            <span>${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      {/* Balance Sheet */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 break-inside-avoid">
        <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Balance Sheet</h2>
            <p className="text-sm text-slate-500">As of {new Date().toLocaleDateString()}</p>
          </div>
          <button 
            onClick={handleDownloadBalanceSheet}
            className="print:hidden text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>CSV</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2 uppercase text-xs tracking-widest">Assets</h3>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Current Assets (Earnings)</span>
              <span>${totalCashAndBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Livestock Assets</span>
              <span>${livestockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Fixed Assets (Equipment)</span>
              <span>${fixedAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-4 border-t">
              <span>Total Assets</span>
              <span>${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2 uppercase text-xs tracking-widest">Liabilities & Equity</h3>
            <div className="flex justify-between text-rose-600 text-sm">
              <span>Total Liabilities</span>
              <span>(${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm font-semibold">
              <span>Owner's Equity</span>
              <span>${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-4 border-t">
              <span>Total Liabilities & Equity</span>
              <span>${(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Owner's Equity */}
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 break-inside-avoid">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Statement of Owner's Equity</h2>
              <p className="text-sm text-slate-500">As of {new Date().toLocaleDateString()}</p>
            </div>
            <button 
              onClick={handleDownloadOE}
              className="print:hidden text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>CSV</span>
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Net Income (Retained Earnings)</span>
              <span className={netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Contributed Capital / Non-Cash Equity</span>
              <span>${(totalEquity - netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-4 border-t-2 border-slate-900 mt-4">
              <span>Total Owner's Equity</span>
              <span>${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic mt-4">Note: Equity is calculated as the difference between Total Assets and Total Liabilities.</p>
          </div>
        </section>

        {/* Cash Flow Summary */}
        <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 break-inside-avoid">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-lg font-bold text-slate-800">Cash Flow Statement (Direct)</h2>
            <button 
              onClick={handleDownloadCashFlow}
              className="print:hidden text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>CSV</span>
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Cash Inflow from Operations</span>
              <span>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Cash Outflow for Operations</span>
              <span>(${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-4 border-t">
              <span>Net Cash Flow</span>
              <span>${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;