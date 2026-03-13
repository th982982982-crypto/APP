export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  category?: string | null; // Added for database compatibility
  category_name: string;
  category_icon: string | null;
  wallet_id: string | null;
  wallet_name?: string;
  date: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  monthly_budget: number | null;
  icon: string;
  color: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string | null; // null means global/predefined
  name: string;
  type: 'income' | 'expense';
  icon: string;
  created_at: string;
};

export type AppSettings = {
  id: string;
  background_url: string | null;
  updated_at: string;
};
