import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, AppSettings } from '../types';
import { Users, Shield, ShieldAlert, Loader2, Image as ImageIcon, Save, CheckCircle, Upload, X, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel({ onSettingsUpdate }: { onSettingsUpdate: (settings: AppSettings) => void }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bgUrl, setBgUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('app_settings').select('*').eq('id', 'global').single()
      ]);

      if (usersRes.error) throw usersRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setUsers(usersRes.data || []);
      setSettings(settingsRes.data);
      setBgUrl(settingsRes.data.background_url || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u));
    } catch (err: any) {
      alert('Lỗi khi cập nhật quyền: ' + err.message);
    }
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

  const uploadBackground = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bg-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('transaction-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert('Lỗi: Không tìm thấy Bucket "transaction-images" trong Supabase Storage. Vui lòng tạo Bucket này và đặt chế độ Public để tải ảnh nền.');
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('transaction-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading background:', err);
      return null;
    }
  };

  const updateSettings = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      let finalBgUrl = bgUrl;
      
      if (imageFile) {
        const uploadedUrl = await uploadBackground(imageFile);
        if (uploadedUrl) {
          finalBgUrl = uploadedUrl;
          setBgUrl(uploadedUrl);
        } else {
          throw new Error('Không thể tải ảnh lên');
        }
      }

      const { error } = await supabase
        .from('app_settings')
        .update({ background_url: finalBgUrl, updated_at: new Date().toISOString() })
        .eq('id', 'global');

      if (error) throw error;
      
      const newSettings = { id: 'global', background_url: finalBgUrl, updated_at: new Date().toISOString() };
      setSettings(newSettings);
      onSettingsUpdate(newSettings);
      
      setSuccess(true);
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert('Lỗi khi cập nhật cài đặt: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-16"
    >
      {/* App Settings Section */}
      <motion.section variants={itemVariants} className="space-y-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <ImageIcon className="text-emerald-400 w-6 h-6" />
          </div>
          Cài đặt giao diện
        </h2>
        
        <div className="liquid-glass p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Ảnh nền hiện tại / Tải lên mới</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all min-h-[300px] relative overflow-hidden group"
              >
                {(imagePreview || bgUrl) ? (
                  <>
                    <img 
                      src={imagePreview || bgUrl} 
                      alt="Background" 
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/10">
                      <Upload className="w-10 h-10 text-emerald-400" />
                      <span className="text-base font-black text-white">
                        {imageFile ? 'Ảnh mới đã chọn' : 'Thay đổi ảnh nền'}
                      </span>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Click hoặc kéo thả ảnh mới</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-8 bg-white/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                      <Upload className="w-12 h-12 text-white/20 group-hover:text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <span className="text-base font-black text-white block">Tải ảnh nền lên</span>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-2">Hỗ trợ JPG, PNG, WebP</p>
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

              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Hoặc dán URL ảnh tại đây..."
                />
                {bgUrl && (
                  <button 
                    onClick={() => {
                      setBgUrl('');
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="p-4 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
                    title="Xóa ảnh nền"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Xem trước (Preview)</label>
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black/20">
                {(imagePreview || bgUrl) ? (
                  <>
                    <img 
                      src={imagePreview || bgUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover grayscale opacity-10" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                          <Wallet className="text-white w-8 h-8" />
                        </div>
                        <p className="text-2xl font-black text-white tracking-tight">Gia đình Voi</p>
                        <div className="h-1.5 w-16 bg-emerald-500/20 rounded-full mx-auto"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm font-black uppercase tracking-widest italic">
                    Chưa có ảnh nền
                  </div>
                )}
              </div>
              
              <button
                onClick={updateSettings}
                disabled={saving || (!imageFile && bgUrl === settings?.background_url)}
                className="w-full btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : success ? (
                  <CheckCircle className="w-7 h-7" />
                ) : (
                  <Save className="w-7 h-7" />
                )}
                {saving ? 'Đang lưu cài đặt...' : success ? 'Đã lưu thành công!' : 'Lưu tất cả thay đổi'}
              </button>
              
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center leading-relaxed">
                * Ảnh nền sẽ được áp dụng cho trang đăng nhập và nền ứng dụng
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* User Management Section */}
      <motion.section variants={itemVariants} className="space-y-8">
        <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <Users className="text-emerald-400 w-6 h-6" />
          </div>
          Quản lý người dùng
        </h2>

        <div className="liquid-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Người dùng</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Email</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Vai trò</th>
                  <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-10 py-6">
                      <div className="font-black text-white text-lg">{user.full_name || 'N/A'}</div>
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">ID: {user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-white/60">{user.email}</td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        user.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                        : 'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Đổi vai trò
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
