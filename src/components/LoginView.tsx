import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck, Database, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [customUrl, setCustomUrl] = useState(localStorage.getItem('custom_supabase_url') || metaEnvGet('VITE_SUPABASE_URL') || '');
  const [customKey, setCustomKey] = useState(localStorage.getItem('custom_supabase_key') || metaEnvGet('VITE_SUPABASE_ANON_KEY') || '');
  const [showConfig, setShowConfig] = useState(!isSupabaseConfigured);

  function metaEnvGet(key: string) {
    try {
      return (import.meta as any).env?.[key] || '';
    } catch {
      return '';
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const activeClient = supabase;
    if (!activeClient) {
      setErrorMsg('Supabase 클라이언트가 초기화되지 않았습니다. 아래 "Supabase 연결 설정"에서 URL과 Anon Key를 입력해주세요.');
      setLoading(false);
      setShowConfig(true);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await activeClient.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('회원가입이 완료되었습니다! 이메일 확인 후 로그인하거나 바로 로그인하세요.');
        setIsSignUp(false);
      } else {
        const { error } = await activeClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) {
      alert('Supabase URL과 Anon Key를 모두 입력해주세요.');
      return;
    }
    localStorage.setItem('custom_supabase_url', customUrl.trim());
    localStorage.setItem('custom_supabase_key', customKey.trim());
    alert('Supabase 설정이 저장되었습니다. 페이지를 새로고침합니다.');
    window.location.reload();
  };

  const handleClearConfig = () => {
    if (confirm('저장된 커스텀 Supabase 설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('custom_supabase_url');
      localStorage.removeItem('custom_supabase_key');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">구매 견적 비교·납기 판정기</h1>
          <p className="text-xs text-slate-400 mt-1">Supabase 인가된 사용자 인증 시스템</p>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition border border-slate-700/60"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showConfig ? '▲ Supabase 연결 설정 닫기' : '⚙️ Supabase 연결 설정 (URL / Key 입력)'}</span>
          </button>
        </div>

        {showConfig && (
          <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase 프로젝트 연결 설정</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isSupabaseConfigured ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-amber-900/60 text-amber-300 border border-amber-700'}`}>
                {isSupabaseConfigured ? '연결됨' : '미연결'}
              </span>
            </div>
            <p className="text-slate-400 mb-3 text-[11px]">
              Supabase 대시보드(Project Settings &gt; API)에서 발급받은 Project URL과 anon/public key를 입력하세요.
            </p>
            <form onSubmit={handleSaveConfig} className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Supabase URL</label>
                <input
                  type="text"
                  placeholder="https://xyzproject.supabase.co"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition shadow"
                >
                  설정 저장 및 새로고침
                </button>
                {localStorage.getItem('custom_supabase_url') && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium rounded-lg text-xs transition"
                  >
                    초기화
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">이메일 주소</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-blue-400 transition"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <div className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase 클라우드 DB 연동 및 데이터 누적 저장</span>
          </div>
        </div>
      </div>
    </div>
  );
};
