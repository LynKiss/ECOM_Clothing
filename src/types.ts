export type PageId = 'dashboard' | 'products' | 'orders' | 'customers' | 'interface' | 'security' | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}
