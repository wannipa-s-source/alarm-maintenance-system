'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, IdCard, LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = { type: 'idle' | 'error' | 'success'; message: string };

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm';

const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle', message: '' });

    if (password.length < 6) {
      setStatus({ type: 'error', message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setStatus({ type: 'error', message: error.message });
      setLoading(false);
      return;
    }

    // หลังสมัครสมาชิกแล้วต้องเข้าสู่ระบบใหม่เสมอ
    setStatus({
      type: 'success',
      message: 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบเพื่อเริ่มใช้งาน',
    });
    setLoading(false);
    setTimeout(() => {
      router.replace('/login');
    }, 1200);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0a0f1d] overflow-hidden p-4 transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Register Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827]/90 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-blue-900/40 p-8 sm:p-10 transition-all">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-500/20 rounded-2xl mb-4 text-blue-600 dark:text-cyan-400 shadow-inner border border-blue-100 dark:border-blue-500/30">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h4l2-2h8a2 2 0 012 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">สมัครสมาชิก (Register)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Smart Factory Maintenance System</p>
        </div>

        {/* Alert Box */}
        {status.message && (
          <div
            className={`mb-6 p-3 rounded-xl border text-sm text-center flex items-center justify-center gap-2 ${
              status.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {status.type === 'error' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className={labelClass}>
              ชื่อ-นามสกุล
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="สมชาย ใจดี"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className={labelClass}>
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className={labelClass}>
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-5 h-5" />
              </div>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-sm"
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                <span>กำลังสมัครสมาชิก...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ลิงก์กลับไปหน้า Login */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <p className="text-xs text-center text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} Smart Factory Maintenance System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
