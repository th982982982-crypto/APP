import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, Category, Wallet as WalletType } from '../types';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, 
  Tag, FileText, Loader2, X, Utensils, Car, ShoppingBag, 
  Gamepad2, Stethoscope, Banknote, Gift, Briefcase, 
  Coffee, Home, Plane, Zap, Heart, PlusCircle, ChevronDown,
  CreditCard, PiggyBank, Shirt, Bus, Smartphone, 
  GraduationCap, Dumbbell, Wine, Music, Film, Wifi, Lightbulb,
  Upload, Image as ImageIcon, Settings, LayoutGrid
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  Utensils, Car, ShoppingBag, Gamepad2, Stethoscope, 
  Banknote, Gift, TrendingUp, Briefcase, Coffee, 
  Home, Plane, Zap, Heart, PlusCircle, CreditCard,
  PiggyBank, Shirt, Bus, Smartphone, GraduationCap,
  Dumbbell, Wine, Music, Film, Wifi, Lightbulb
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  
  // Form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('PlusCircle');

  // New Wallet state
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletBudget, setNewWalletBudget] = useState('');
  const [newWalletIcon, setNewWalletIcon] = useState('Wallet');
  const [newWalletColor, setNewWalletColor] = useState('#10b981');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, catsRes, walletsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('wallets').select('*').order('name', { ascending: true })
      ]);

      if (transRes.error) throw transRes.error;
      if (catsRes.error) throw catsRes.error;
      if (walletsRes.error) throw walletsRes.error;

      const categoriesData = catsRes.data || [];
      const transactionsData = transRes.data || [];
      const walletsData = walletsRes.data || [];

      // Map category and wallet data to the transaction object in memory for maximum resilience
      const mappedTransactions = transactionsData.map((t: any) => {
        const catId = t.category || t.category_id;
        const cat = categoriesData.find(c => c.id === catId);
        const wallet = walletsData.find(w => w.id === t.wallet_id);
        return {
          ...t,
          category_id: catId,
          category_name: t.category_name || cat?.name || 'N/A',
          category_icon: t.category_icon || cat?.icon || 'PlusCircle',
          wallet_name: wallet?.name || 'N/A'
        };
      });

      setTransactions(mappedTransactions);
      setCategories(categoriesData);
      setWallets(walletsData);
      if (walletsData.length > 0 && !selectedWallet) {
        setSelectedWallet(walletsData[0]);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDate = (type: 'day' | 'week' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start = new Date(now.setDate(diff));
      end = new Date(now.setDate(diff + 6));
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(parseInt(value));
    setAmount(formatted);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('transaction-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert('Lỗi: Không tìm thấy Bucket "transaction-images" trong Supabase Storage. Vui lòng tạo Bucket này và đặt chế độ Public để tải ảnh lên.');
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('transaction-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert('Vui lòng chọn hạng mục');
      return;
    }
    if (!selectedWallet) {
      alert('Vui lòng chọn ví sử dụng');
      return;
    }
    
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const numericAmount = parseInt(amount.replace(/\D/g, ''));

      const transactionData: any = {
        user_id: user.id,
        amount: numericAmount,
        type,
        category: selectedCategory.id,
        wallet_id: selectedWallet.id,
        date,
        description,
      };

      // Only add image_url if it's provided to avoid "column not found" errors
      // if the user hasn't updated their database schema yet.
      if (imageUrl) {
        transactionData.image_url = imageUrl;
      }

      const { error } = await supabase.from('transactions').insert([transactionData]);

      if (error) throw error;

      // Update wallet balance locally and in DB
      const newBalance = type === 'income' 
        ? selectedWallet.balance + numericAmount 
        : selectedWallet.balance - numericAmount;

      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', selectedWallet.id);

      // Refresh data to get updated balances
      fetchData();
      
      setShowAddForm(false);
      setAmount('');
      setSelectedCategory(null);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      alert('Lỗi khi thêm giao dịch: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          user_id: user.id,
          name: newWalletName,
          balance: parseInt(newWalletBalance.replace(/\D/g, '')) || 0,
          monthly_budget: parseInt(newWalletBudget.replace(/\D/g, '')) || null,
          icon: newWalletIcon,
          color: newWalletColor
        }])
        .select()
        .single();

      if (error) throw error;
      
      setWallets([...wallets, data]);
      if (!selectedWallet) setSelectedWallet(data);
      setShowAddWallet(false);
      setNewWalletName('');
      setNewWalletBalance('');
      setNewWalletBudget('');
    } catch (err: any) {
      alert('Lỗi khi thêm ví: ' + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('categories').insert([
        {
          user_id: user.id,
          name: newCatName,
          type,
          icon: newCatIcon,
        },
      ]).select().single();

      if (error) throw error;
      
      setCategories([...categories, data]);
      setSelectedCategory(data);
      setShowAddCategory(false);
      setNewCatName('');
    } catch (err: any) {
      alert('Lỗi khi thêm hạng mục: ' + err.message);
    }
  };

  const deleteTransaction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase.from('transactions').delete().match({ id: deletingId });
      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  // Filtering by date range
  const filteredTransactions = transactions.filter(t => {
    const tDate = t.date;
    return tDate >= startDate && tDate <= endDate;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const categoryData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category_name);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        acc.push({ name: t.category_name, value: Number(t.amount) });
      }
      return acc;
    }, []);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#eab308', '#06b6d4', '#ec4899', '#f97316'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-400 w-10 h-10" /></div>;

  return (
    <motion.div 
      className="space-y-12 pb-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with Date Filter */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">Chào buổi sáng!</h2>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Quản lý tài chính gia đình</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-xl p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setQuickDate('day')}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Ngày
            </button>
            <button 
              onClick={() => setQuickDate('week')}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Tuần
            </button>
            <button 
              onClick={() => setQuickDate('month')}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Tháng
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 px-4 py-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none"
              />
            </div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="flex items-center gap-2 px-4 py-2">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            Thêm giao dịch
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="liquid-glass p-10 relative overflow-hidden group hover:shadow-[0_20px_80px_rgba(16,185,129,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Wallet className="w-16 h-16 text-white" />
          </div>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-2">Tổng số dư các ví</p>
          <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">
            {formatCurrency(wallets.reduce((acc, w) => acc + w.balance, 0))}
          </h3>
          {balance !== 0 && (
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 w-fit px-4 py-1.5 rounded-full border border-emerald-400/20 backdrop-blur-md">
              {balance > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
              <span className={balance > 0 ? "" : "text-rose-400"}>
                {balance > 0 ? "Số dư dương" : "Số dư âm"}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="liquid-glass p-10 relative overflow-hidden group hover:shadow-[0_20px_80px_rgba(59,130,246,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <TrendingUp className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-2">Tổng thu nhập</p>
          <h3 className="text-4xl font-black text-emerald-400 mb-4 tracking-tighter">{formatCurrency(totalIncome)}</h3>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden backdrop-blur-md">
            <div 
              className="bg-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
              style={{ width: totalIncome > 0 ? '100%' : '0%' }}
            ></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="liquid-glass p-10 relative overflow-hidden group hover:shadow-[0_20px_80px_rgba(244,63,94,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <TrendingDown className="w-16 h-16 text-rose-400" />
          </div>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-2">Tổng chi tiêu</p>
          <h3 className="text-4xl font-black text-rose-400 mb-4 tracking-tighter">{formatCurrency(totalExpense)}</h3>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden backdrop-blur-md">
            <div 
              className="bg-rose-400 h-full rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-1000"
              style={{ width: totalIncome > 0 ? `${Math.min((totalExpense / totalIncome) * 100, 100)}%` : (totalExpense > 0 ? '100%' : '0%') }}
            ></div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Wallets Section */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight">Ví của tôi</h3>
            <button 
              onClick={() => setShowAddWallet(true)}
              className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest hover:text-white transition-colors bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20"
            >
              <Plus className="w-4 h-4" />
              Tạo ví mới
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wallets.map((wallet) => (
              <motion.div 
                key={wallet.id}
                whileHover={{ y: -5 }}
                className={`liquid-glass p-6 relative overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedWallet?.id === wallet.id ? 'border-emerald-400/50 bg-white/10' : 'border-transparent'
                }`}
                onClick={() => setSelectedWallet(wallet)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-white" style={{ color: wallet.color }}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  {wallet.monthly_budget && (
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      Hạn mức: {formatCurrency(wallet.monthly_budget)}
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-black text-white mb-1">{wallet.name}</h4>
                <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(wallet.balance)}</p>
                
                {wallet.monthly_budget && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[8px] font-black text-white/30 uppercase tracking-widest">
                      <span>Sử dụng</span>
                      <span>{Math.round((Math.abs(transactions.filter(t => t.wallet_id === wallet.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)) / wallet.monthly_budget) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min((Math.abs(transactions.filter(t => t.wallet_id === wallet.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)) / wallet.monthly_budget) * 100, 100)}%`,
                          backgroundColor: wallet.color
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight">Giao dịch gần đây</h3>
            <button className="text-xs font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Xem tất cả</button>
          </div>
          
          <div className="space-y-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => {
                const Icon = ICON_MAP[t.category_icon || 'PlusCircle'] || PlusCircle;
                return (
                  <motion.div 
                    key={t.id} 
                    variants={itemVariants}
                    className="liquid-glass p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-pointer border-white/5 hover:translate-x-2 duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/10 ${
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{t.description || t.category_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.category_name}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                          <span className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest flex items-center gap-1">
                            <Wallet className="w-2 h-2" /> {t.wallet_name}
                          </span>
                          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{new Date(t.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`text-xl font-black tracking-tighter ${
                          t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        {t.image_url && (
                          <span className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest flex items-center justify-end gap-1 mt-1">
                            <ImageIcon className="w-3 h-3" /> Đã đính kèm
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => deleteTransaction(e, t.id)}
                        className="p-3 text-white/5 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="liquid-glass p-20 flex flex-col items-center justify-center text-white/20 italic gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                Chưa có giao dịch nào trong khoảng thời gian này
              </div>
            )}
          </div>
        </motion.div>

        {/* Category Analysis */}
        <motion.div variants={itemVariants} className="space-y-8">
          <h3 className="text-2xl font-black text-white tracking-tight">Phân tích chi tiêu</h3>
          <div className="liquid-glass p-10 space-y-10">
            {categoryData.length > 0 ? (
              <div className="space-y-10">
                <div className="h-72 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Tổng chi</span>
                    <span className="text-2xl font-black text-white">{formatCurrency(totalExpense)}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={110}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '24px', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                          padding: '16px 20px'
                        }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {categoryData.map((item: any, index: number) => {
                    const percentage = ((item.value / totalExpense) * 100).toFixed(1);
                    return (
                      <div key={item.name} className="group flex items-center justify-between p-4 rounded-3xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <div>
                            <p className="text-sm font-black text-white">{item.name}</p>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{percentage}%</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-white">{formatCurrency(item.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-white/20 text-sm italic gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-10 h-10 opacity-20" />
                </div>
                Chưa có dữ liệu chi tiêu
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
              onClick={() => setShowAddForm(false)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl liquid-glass p-6 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-white tracking-tight">Thêm giao dịch mới</h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Số tiền (VNĐ)</label>
                    <div className="relative">
                      <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-6 h-6" />
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        className="input-field pl-16 text-2xl font-black"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Loại giao dịch</label>
                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                          type === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-white/30 hover:text-white'
                        }`}
                      >
                        Chi tiêu
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                          type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/30 hover:text-white'
                        }`}
                      >
                        Thu nhập
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Chọn ví sử dụng</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => setSelectedWallet(wallet)}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                          selectedWallet?.id === wallet.id 
                            ? 'bg-white/10 border-emerald-400 shadow-lg shadow-emerald-400/10' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Wallet className="w-5 h-5" style={{ color: wallet.color }} />
                        <span className="text-[10px] font-black text-white truncate w-full text-center">{wallet.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddWallet(true)}
                      className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5 text-white/30" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Thêm ví</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Hạng mục</label>
                    <button 
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline"
                    >
                      + Thêm hạng mục
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {categories.filter(c => c.type === type).map((cat) => {
                      const Icon = ICON_MAP[cat.icon] || PlusCircle;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border ${
                            selectedCategory?.id === cat.id 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                            : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center truncate w-full">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Ngày giao dịch</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-6 h-6" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input-field pl-16 font-bold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Ghi chú</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-6 h-6" />
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field pl-16 font-bold"
                        placeholder="Ăn trưa, đổ xăng..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Ảnh đính kèm (Hóa đơn)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/5 transition-all relative overflow-hidden group min-h-[160px]"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-emerald-400" />
                          <span className="text-sm font-black text-white">Ảnh đã được chọn</span>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Click để thay đổi</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-emerald-500/10 transition-colors">
                          <Upload className="w-8 h-8 text-white/20 group-hover:text-emerald-400" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black text-white">Tải ảnh lên hoặc kéo thả</span>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">JPG, PNG, WebP</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg shadow-2xl shadow-emerald-500/20"
                >
                  {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Plus className="w-7 h-7" />}
                  {isUploading ? 'Đang xử lý...' : 'Xác nhận giao dịch'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showAddWallet && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
              onClick={() => setShowAddWallet(false)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md liquid-glass p-6 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white tracking-tight">Tạo ví mới</h3>
                <button 
                  onClick={() => setShowAddWallet(false)}
                  className="p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWallet} className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tên ví</label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="input-field"
                    placeholder="Ví chính, Tiết kiệm..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Số dư ban đầu</label>
                    <input
                      type="text"
                      value={newWalletBalance}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewWalletBalance(val ? new Intl.NumberFormat('vi-VN').format(parseInt(val)) : '');
                      }}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Hạn mức tháng</label>
                    <input
                      type="text"
                      value={newWalletBudget}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewWalletBudget(val ? new Intl.NumberFormat('vi-VN').format(parseInt(val)) : '');
                      }}
                      className="input-field"
                      placeholder="Không bắt buộc"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Màu sắc</label>
                  <div className="flex flex-wrap gap-3">
                    {['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewWalletColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newWalletColor === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm font-black">
                  Tạo ví ngay
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
              onClick={() => setShowAddCategory(false)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md liquid-glass p-6 md:p-10 overflow-y-auto max-h-[90vh] scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white tracking-tight">Thêm hạng mục</h3>
                <button 
                  onClick={() => setShowAddCategory(false)}
                  className="p-2 text-white/20 hover:text-white rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Tên hạng mục</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="input-field font-bold"
                    placeholder="Ví dụ: Ăn uống, Di chuyển..."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Chọn biểu tượng</label>
                  <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-2 scrollbar-hide">
                    {Object.keys(ICON_MAP).map((iconName) => {
                      const Icon = ICON_MAP[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewCatIcon(iconName)}
                          className={`p-4 rounded-2xl transition-all border ${
                            newCatIcon === iconName 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary py-4 font-black shadow-xl shadow-emerald-500/20"
                >
                  Lưu hạng mục
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
              onClick={() => setDeletingId(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm liquid-glass p-6 md:p-10 text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Xác nhận xóa?</h3>
              <p className="text-white/40 text-sm font-bold mb-8">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-black hover:bg-white/10 transition-all border border-white/5"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-4 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
