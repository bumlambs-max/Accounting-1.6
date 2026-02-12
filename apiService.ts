
import { Transaction, Category, Account, AnimalSpecies, AnimalLog, InventoryItem, InventoryMovement, Asset, Liability, NavItemConfig } from '../types.ts';

export interface FarmData {
  farmName: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  animalSpecies: AnimalSpecies[];
  animalLogs: AnimalLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  assets: Asset[];
  liabilities: Liability[];
  sidebarConfig: NavItemConfig[];
  isSidebarCollapsed: boolean;
}

const STORAGE_PREFIX = 'farm_cloud_v2:';

export const ApiService = {
  /**
   * Pushes the entire farm state to the "Cloud".
   * Isolation is achieved by using the email as the key.
   */
  async pushData(email: string, data: FarmData): Promise<void> {
    const key = STORAGE_PREFIX + email.toLowerCase().trim();
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[CloudSync] Data isolated and pushed for ${email}`);
  },

  /**
   * Pulls the isolated farm state for a specific email.
   */
  async pullData(email: string): Promise<FarmData | null> {
    const key = STORAGE_PREFIX + email.toLowerCase().trim();
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    console.log(`[CloudSync] Isolated data retrieved for ${email}`);
    return JSON.parse(saved);
  }
};
