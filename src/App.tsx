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

const LOCAL_STORAGE_KEY = 'exs02.quotes.v1';

export default function App() {
  const [quotes, setQuotes] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('LocalStorage load error:', e);
    }
    return INITIAL_QUOTES;
  });

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

  // Save to LocalStorage whenever quotes change
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
    setQuotes(prev =>
      prev.map(q => {
        if (q.quote_id === quoteId) {
          const newStatus = q.status === '발주' ? '견적' : '발주';
          return { ...q, status: newStatus };
        }
        return q;
      })
    );
  };

  const handleSaveQuote = (item: QuoteItem) => {
    setQuotes(prev => {
      const exists = prev.some(q => q.quote_id === item.quote_id);
      if (exists) {
        return prev.map(q => (q.quote_id === item.quote_id ? item : q));
      } else {
        return [item, ...prev];
      }
    });
  };

  const handleResetData = () => {
    if (confirm('모든 변경사항을 초기화하고 기본 샘플 데이터(80건)로 복원하시겠습니까?')) {
      setQuotes(INITIAL_QUOTES);
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar
        totalCount={quotes.length}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* File Import Modal */}
      <ImportPanel
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={newItems => {
          setQuotes(newItems);
        }}
      />
    </div>
  );
}
