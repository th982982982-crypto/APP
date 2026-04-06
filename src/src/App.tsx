import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Profile, AppSettings } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { LogOut, LayoutDashboard, Users, Wallet, Menu, X, Settings, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (settingsData) setSettings(settingsData);

      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <Wallet className="text-emerald-400 w-10 h-10" />
          </div>
          <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-1/2 animate-[loading_1.5s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth backgroundUrl={settings?.background_url || undefined} />;
  }

  return (
    <div className="min-h-screen text-white selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Liquid Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Background Image Overlay */}
      {settings?.background_url && (
        <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
          <img 
            src={settings.background_url} 
            alt="" 
            className="w-full h-full object-cover grayscale" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-80 glass-sidebar p-10 sticky top-0 h-screen">
          <div className="flex items-center gap-4 mb-16">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Wallet className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gia đình Voi</h1>
          </div>

          <nav className="flex-1 space-y-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all ${
                activeTab === 'dashboard' 
                ? 'glass-item-active font-bold' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-6 h-6" />
              Tổng quan
            </button>
            
            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all ${
                  activeTab === 'admin' 
                  ? 'glass-item-active font-bold' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
                Quản trị viên
              </button>
            )}
          </nav>

          <div className="mt-auto pt-10 border-t border-white/5">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 font-bold border border-white/10 shadow-inner">
                {profile?.full_name?.[0] || profile?.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white truncate">{profile?.full_name || 'Người dùng'}</p>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold group"
            >
              <LogOut className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden glass-nav p-5 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <Wallet className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-white tracking-tight">Gia đình Voi</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-3 text-rose-400 hover:bg-rose-500/10 rounded-2xl"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </header>

          <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'dashboard' ? <Dashboard /> : <AdminPanel onSettingsUpdate={setSettings} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav px-8 py-4 flex justify-around items-center z-50">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                activeTab === 'dashboard' ? 'text-emerald-400' : 'text-white/30'
              }`}
            >
              <LayoutDashboard className="w-7 h-7" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tổng quan</span>
            </button>
            
            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  activeTab === 'admin' ? 'text-emerald-400' : 'text-white/30'
                }`}
              >
                <ShieldCheck className="w-7 h-7" />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
              </button>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
