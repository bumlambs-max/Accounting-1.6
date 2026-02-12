export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CASH = 'CASH',
  CREDIT = 'CREDIT'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  paymentDay?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  type: TransactionType;
}

export interface NavItemConfig {
  id: string;
  visible: boolean;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  categoryBreakdown: { [key: string]: number };
}

export enum PopulationChange {
  BOUGHT = 'BOUGHT',
  BIRTH = 'BIRTH',
  SOLD = 'SOLD',
  DEATH = 'DEATH'
}

export interface AnimalSpecies {
  id: string;
  name: string;
  tag: string;
  breed: string;
  count: number;
  estimatedValue: number;
}

export interface AnimalLog {
  id: string;
  speciesId: string;
  date: string;
  type: PopulationChange;
  quantity: number;
  note: string;
  valueAtTime: number;
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT'
}

export enum AssetTerm {
  SHORT_TERM = 'SHORT_TERM',
  LONG_TERM = 'LONG_TERM'
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unitCost: number;
  assetTerm: AssetTerm;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  note: string;
  date: string;
  unitCostAtTime: number;
}

export enum AssetCategory {
  EQUIPMENT = 'EQUIPMENT',
  VEHICLE = 'VEHICLE',
  REAL_ESTATE = 'REAL_ESTATE',
  TECHNOLOGY = 'TECHNOLOGY',
  LIVESTOCK = 'LIVESTOCK',
  INVENTORY = 'INVENTORY',
  OTHER = 'OTHER'
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  description: string;
}

export enum LiabilityCategory {
  LOAN = 'LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
  MORTGAGE = 'MORTGAGE',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  OTHER = 'OTHER'
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE-TIME'
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  dueDate?: string;
  installmentAmount?: number;
  paymentFrequency?: PaymentFrequency;
  description: string;
}