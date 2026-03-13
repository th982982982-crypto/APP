import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  backgroundUrl?: string;
}

export default function Auth({ backgroundUrl }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const defaultBg = "https://69b3b182d5fa7152051c5893.imgix.net/Gia%20%C4%90%C3%ACnh/Voi.jpg";

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url("${backgroundUrl || defaultBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="liquid-glass p-10 md:p-12">
          <div className="text-center mb-12">
            <div className="inline-flex p-5 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 shadow-inner mb-8">
              <Wallet className="text-emerald-400 w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
              {isSignUp ? 'Bắt đầu ngay' : 'Chào mừng bạn'}
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
              {isSignUp ? 'Quản lý tài chính thông minh hơn' : 'Đăng nhập để quản lý chi tiêu'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@vidu.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-5 rounded-2xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg shadow-2xl shadow-emerald-500/20"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-7 h-7" /> Đăng ký ngay
                </>
              ) : (
                <>
                  <LogIn className="w-7 h-7" /> Đăng nhập
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest transition-colors"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Tạo ngay'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
