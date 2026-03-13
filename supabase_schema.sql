/*
  -- SQL SCHEMA FOR SUPABASE --
  
  -- 1. Create profiles table
  CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- 2. Create categories table
  CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL for global
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- 3. Create transactions table
  CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES categories ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    category_icon TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- 4. Create app_settings table
  CREATE TABLE app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    background_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
  );

  -- Insert default settings
  INSERT INTO app_settings (id, background_url) VALUES ('global', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1920')
  ON CONFLICT (id) DO NOTHING;

  -- Insert default categories
  INSERT INTO categories (name, type, icon) VALUES 
    ('Ăn uống', 'expense', 'Utensils'),
    ('Di chuyển', 'expense', 'Car'),
    ('Mua sắm', 'expense', 'ShoppingBag'),
    ('Giải trí', 'expense', 'Gamepad2'),
    ('Y tế', 'expense', 'Stethoscope'),
    ('Lương', 'income', 'Banknote'),
    ('Thưởng', 'income', 'Gift'),
    ('Đầu tư', 'income', 'TrendingUp')
  ON CONFLICT DO NOTHING;

  -- 5. Enable Row Level Security (RLS)
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

  -- 6. Policies for profiles
  CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
  CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "Admins can update any profile." ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

  -- 7. Policies for categories
  CREATE POLICY "Categories are viewable by everyone if global or owned." ON categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
  CREATE POLICY "Users can insert their own categories." ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete their own categories." ON categories
    FOR DELETE USING (auth.uid() = user_id);

  -- 8. Policies for transactions
  CREATE POLICY "Users can view own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own transactions." ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own transactions." ON transactions FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own transactions." ON transactions FOR DELETE USING (auth.uid() = user_id);

  -- 9. Policies for app_settings
  CREATE POLICY "App settings are viewable by everyone." ON app_settings FOR SELECT USING (true);
  CREATE POLICY "Admins can update app settings." ON app_settings
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

  -- 10. Function to handle new user signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 11. Trigger for new user signup
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
