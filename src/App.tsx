import { useState, useEffect, useMemo } from 'react';
import { QuoteItem } from './types';
import { INITIAL_QUOTES } from './data/defaultQuotes';
import { evaluateQuotes } from './utils/calculator';
import { Navbar } from './components/Navbar';
import { DashboardCards } from './components/DashboardCards';
import { FilterBar } from './components/FilterBar';
import { QuoteTable } from './components/QuoteTable';
import { PRGroupView } from './components/PRGroupView';
import { PRDetailModal } from './components/PRDetailModal';
import { QuoteFormModal } from './components/QuoteFormModal';
import { ImportPanel } from './components/ImportPanel';
import { LoginView } from './components/LoginView';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Database, ShieldCheck, Code, CheckCircle, Copy } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'exs02.quotes.v1';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteItem[]>(INITIAL_QUOTES);
  const [loadingDb, setLoadingDb] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [filter, setFilter] = useState<{
    search: string;
    status: string;
    deliveryState: string;
    priceState: string;
    itemCode: string;
    supplier: string;
    viewMode: 'table' | 'pr_group';
  }>({
    search: '',
    status: 'all',
    deliveryState: 'all',
    priceState: 'all',
    itemCode: 'all',
    supplier: 'all',
    viewMode: 'table',
  });

  const [activeDashboardFilter, setActiveDashboardFilter] = useState<string>('all');
  const [selectedPrNo, setSelectedPrNo] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Check Supabase Auth session on mount
  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setAuthLoading(false);
      // Fallback to local storage if supabase not configured
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuotes(parsed);
          }
        }
      } catch (e) {
        console.error('LocalStorage load error:', e);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setAuthLoading(false);
        if (session) {
          fetchQuotesFromSupabase(session.user.id);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setAuthLoading(false);
        if (session) {
          fetchQuotesFromSupabase(session.user.id);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch quotes from Supabase
  const fetchQuotesFromSupabase = async (userId: string) => {
    if (!supabase) return;
    setLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from('purchase_quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes from Supabase:', error);
        // Fallback to local storage if table doesn't exist yet
        loadFromLocalStorage();
      } else if (data && data.length > 0) {
        // Map db row format to QuoteItem if needed
        const mapped: QuoteItem[] = data.map((row: any) => ({
          quote_id: row.quote_id,
          pr_no: row.pr_no,
          item_code: row.item_code,
          item_name: row.item_name,
          supplier: row.supplier,
          unit: row.unit,
          qty: Number(row.qty),
          unit_price: row.unit_price !== null ? Number(row.unit_price) : null,
          currency: row.currency || 'KRW',
          quote_date: row.quote_date,
          required_date: row.required_date,
          promised_date: row.promised_date || null,
          status: row.status || '견적',
          remark: row.remark || '',
        }));
        setQuotes(mapped);
      } else {
        // If table is empty for this user, seed with initial quotes and save to supabase
        setQuotes(INITIAL_QUOTES);
        await saveQuotesToSupabase(INITIAL_QUOTES, userId);
      }
    } catch (e) {
      console.error('Supabase fetch exception:', e);
      loadFromLocalStorage();
    } finally {
      setLoadingDb(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuotes(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('LocalStorage load error:', e);
    }
    setQuotes(INITIAL_QUOTES);
  };

  // Save / Accumulate quotes to Supabase
  const saveQuotesToSupabase = async (items: QuoteItem[], userId?: string) => {
    const currentUserId = userId || session?.user?.id;
    if (!supabase || !currentUserId) return;

    try {
      // Upsert or insert records (accumulate CSV data)
      const payload = items.map(q => ({
        user_id: currentUserId,
        quote_id: q.quote_id,
        pr_no: q.pr_no,
        item_code: q.item_code,
        item_name: q.item_name,
        supplier: q.supplier,
        unit: q.unit,
        qty: q.qty,
        unit_price: q.unit_price,
        currency: q.currency,
        quote_date: q.quote_date,
        required_date: q.required_date,
        promised_date: q.promised_date,
        status: q.status,
        remark: q.remark,
      }));

      // We can upsert on (user_id, quote_id) if unique constraint exists, or delete and insert / upsert
      const { error } = await supabase
        .from('purchase_quotes')
        .upsert(payload, { onConflict: 'user_id,quote_id' });

      if (error) {
        console.error('Error saving to Supabase (check if unique constraint exists):', error);
      }
    } catch (e) {
      console.error('Supabase save exception:', e);
    }
  };

  // Save to LocalStorage whenever quotes change as local cache
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }, [quotes]);

  // Evaluated quotes
  const evaluatedItems = useMemo(() => {
    return evaluateQuotes(quotes);
  }, [quotes]);

  // Filter items
  const filteredItems = useMemo(() => {
    return evaluatedItems.filter(item => {
      // Dashboard quick filter
      if (activeDashboardFilter === 'delay' && item.delivery_state !== '지연') return false;
      if (activeDashboardFilter === 'urgent' && item.delivery_state !== '임박') return false;
      if (activeDashboardFilter === 'outlier' && item.price_state !== '이상치') return false;
      if (activeDashboardFilter === 'discrepancy' && !item.has_name_discrepancy) return false;
      if (
        activeDashboardFilter === 'missing' &&
        item.unit_price !== null &&
        item.promised_date !== null
      )
        return false;

      // FilterBar dropdowns & search
      if (filter.status !== 'all' && item.status !== filter.status) return false;
      if (filter.deliveryState !== 'all' && item.delivery_state !== filter.deliveryState) return false;
      if (filter.priceState !== 'all' && item.price_state !== filter.priceState) return false;
      if (filter.itemCode !== 'all' && item.item_code !== filter.itemCode) return false;
      if (filter.supplier !== 'all' && item.supplier !== filter.supplier) return false;

      if (filter.search.trim()) {
        const q = filter.search.toLowerCase();
        const match =
          item.pr_no.toLowerCase().includes(q) ||
          item.quote_id.toLowerCase().includes(q) ||
          item.item_code.toLowerCase().includes(q) ||
          item.item_name.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q) ||
          item.remark.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [evaluatedItems, filter, activeDashboardFilter]);

  // Handlers
  const handleToggleStatus = (quoteId: string) => {
    setQuotes(prev => {
      const updated = prev.map(q => {
        if (q.quote_id === quoteId) {
          const newStatus = q.status === '발주' ? '견적' : '발주';
          return { ...q, status: newStatus };
        }
        return q;
      });
      saveQuotesToSupabase(updated);
      return updated;
    });
  };

  const handleSaveQuote = (item: QuoteItem) => {
    setQuotes(prev => {
      const exists = prev.some(q => q.quote_id === item.quote_id);
      let updated: QuoteItem[];
      if (exists) {
        updated = prev.map(q => (q.quote_id === item.quote_id ? item : q));
      } else {
        updated = [item, ...prev];
      }
      saveQuotesToSupabase(updated);
      return updated;
    });
  };

  const handleResetData = () => {
    if (confirm('모든 변경사항을 초기화하고 기본 샘플 데이터(80건)로 복원하시겠습니까?')) {
      setQuotes(INITIAL_QUOTES);
      saveQuotesToSupabase(INITIAL_QUOTES);
      setFilter({
        search: '',
        status: 'all',
        deliveryState: 'all',
        priceState: 'all',
        itemCode: 'all',
        supplier: 'all',
        viewMode: 'table',
      });
      setActiveDashboardFilter('all');
    }
  };

  const handleExportCsv = () => {
    const headers = ['quote_id', 'pr_no', 'item_code', 'item_name', 'supplier', 'unit', 'qty', 'unit_price', 'currency', 'quote_date', 'required_date', 'promised_date', 'status', 'remark'];
    const rows = evaluatedItems.map(q => [
      q.quote_id,
      q.pr_no,
      q.item_code,
      `"${q.item_name}"`,
      `"${q.supplier}"`,
      q.unit,
      q.qty,
      q.unit_price !== null ? q.unit_price : '',
      q.currency,
      q.quote_date,
      q.required_date,
      q.promised_date || '',
      q.status,
      `"${q.remark || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('SignOut error:', e);
      }
    }
    // Thoroughly remove all Supabase and auth tokens from localStorage and sessionStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
        localStorage.removeItem(key);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))) {
        sessionStorage.removeItem(key);
      }
    }
    setSession(null);
    window.location.replace(window.location.pathname);
  };

  const sqlSchemaText = `-- 1. purchase_quotes 테이블 생성 (누적 저장용)
create table if not exists public.purchase_quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quote_id text not null,
  pr_no text not null,
  item_code text not null,
  item_name text not null,
  supplier text not null,
  unit text not null,
  qty numeric not null,
  unit_price numeric,
  currency text default 'KRW',
  quote_date date not null,
  required_date date not null,
  promised_date date,
  status text default '견적',
  remark text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint purchase_quotes_user_quote_unique unique (user_id, quote_id)
);

-- 2. RLS(Row Level Security) 활성화
alter table public.purchase_quotes enable row level security;

-- 3. 사용자별 접근 정책 설정 (CRUD)
create policy "Users can view their own purchase quotes"
  on public.purchase_quotes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own purchase quotes"
  on public.purchase_quotes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own purchase quotes"
  on public.purchase_quotes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own purchase quotes"
  on public.purchase_quotes for delete
  using (auth.uid() = user_id);`;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">인증 정보 확인 중...</p>
        </div>
      </div>
    );
  }

  // If Supabase is configured and user is not logged in, show LoginView
  if (isSupabaseConfigured && !session) {
    return <LoginView onLoginSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar
        totalCount={quotes.length}
        userEmail={session?.user?.email}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
        onLogout={handleLogout}
      />

      {/* Supabase SQL Schema helper banner */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Supabase DB 연동 활성화됨 (CSV 데이터 누적 저장 및 사용자 인증 적용)</span>
        </div>
        <button
          onClick={() => setShowSqlModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
        >
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span>Supabase SQL 스키마 보기</span>
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loadingDb && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Supabase 데이터베이스에서 데이터를 불러오는 중...</span>
          </div>
        )}

        {/* Dashboard Warning Summary Cards */}
        <DashboardCards
          items={evaluatedItems}
          activeFilter={activeDashboardFilter}
          onSelectFilter={filterKey => setActiveDashboardFilter(filterKey)}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          filter={filter}
          onFilterChange={newF => setFilter(prev => ({ ...prev, ...newF }))}
          items={evaluatedItems}
          onResetFilters={() => {
            setFilter({
              search: '',
              status: 'all',
              deliveryState: 'all',
              priceState: 'all',
              itemCode: 'all',
              supplier: 'all',
              viewMode: 'table',
            });
            setActiveDashboardFilter('all');
          }}
          onExportCsv={handleExportCsv}
        />

        {/* Main Content View */}
        {filter.viewMode === 'table' ? (
          <QuoteTable
            items={filteredItems}
            onSelectPr={prNo => setSelectedPrNo(prNo)}
            onToggleStatus={handleToggleStatus}
            onEditItem={item => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
          />
        ) : (
          <PRGroupView
            items={filteredItems}
            onSelectPr={prNo => setSelectedPrNo(prNo)}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </main>

      {/* PR Comparison Detail Modal */}
      <PRDetailModal
        prNo={selectedPrNo}
        items={evaluatedItems}
        onClose={() => setSelectedPrNo(null)}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add / Edit Quote Modal */}
      <QuoteFormModal
        isOpen={isAddModalOpen}
        editingItem={editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveQuote}
      />

      {/* File Import Modal with CSV accumulation */}
      <ImportPanel
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={rawItems => {
          const newItems = rawItems as QuoteItem[];
          // Accumulate imported items with existing quotes (deduplicating by quote_id if already exists, or appending)
          setQuotes(prev => {
            const existingMap = new Map(prev.map(q => [q.quote_id, q]));
            for (const item of newItems) {
              existingMap.set(item.quote_id, item);
            }
            const merged = Array.from(existingMap.values()) as QuoteItem[];
            saveQuotesToSupabase(merged);
            return merged;
          });
        }}
      />

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-semibold text-sm">Supabase 데이터베이스 SQL 스키마</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-300">
                Supabase SQL Editor에서 아래 SQL을 실행하여 인증 연동 및 CSV 데이터 누적 저장을 위한 테이블과 RLS 정책을 생성하세요.
              </p>
              <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre">
                {sqlSchemaText}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchemaText);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
              >
                {copiedSql ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? '복사 완료!' : 'SQL 복사하기'}</span>
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
