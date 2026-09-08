import React from 'react';
import { FilterState, EvaluatedQuoteItem } from '../types';
import { Search, List, Layers, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  items: EvaluatedQuoteItem[];
  onResetFilters: () => void;
  onExportCsv: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  items,
  onResetFilters,
  onExportCsv,
}) => {
  // Extract unique item codes & suppliers for dropdowns
  const uniqueItemCodes = Array.from(new Set(items.map(i => i.item_code))).sort();
  const uniqueSuppliers = Array.from(new Set(items.map(i => i.supplier))).sort();

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="PR번호, 품목명, 공급사, 견적번호 검색..."
            value={filter.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        {/* View Mode & Export */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200">
            <button
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filter.viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>전체 목록 보기</span>
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'pr_group' })}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filter.viewMode === 'pr_group'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PR별 비교 보기</span>
            </button>
          </div>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs sm:hidden"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>내보내기</span>
          </button>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">진행 상태</label>
          <select
            value={filter.status}
            onChange={e => onFilterChange({ status: e.target.value })}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="발주">발주</option>
            <option value="견적">견적</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">납기 판정</label>
          <select
            value={filter.deliveryState}
            onChange={e => onFilterChange({ deliveryState: e.target.value })}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">전체 납기 판정</option>
            <option value="지연">지연 (발주건)</option>
            <option value="임박">임박 (0~7일)</option>
            <option value="정상">정상</option>
            <option value="납기 미기재">납기 미기재</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">단가 이상치</label>
          <select
            value={filter.priceState}
            onChange={e => onFilterChange({ priceState: e.target.value })}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">전체 단가 상태</option>
            <option value="이상치">이상치 (±30% 초과)</option>
            <option value="정상">정상</option>
            <option value="비교 불가">비교 불가 (&lt;3건)</option>
            <option value="단가 미기재">단가 미기재</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">품목 코드</label>
          <select
            value={filter.itemCode}
            onChange={e => onFilterChange({ itemCode: e.target.value })}
            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">전체 품목</option>
            {uniqueItemCodes.map(code => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end space-x-2 col-span-2 sm:col-span-1">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">공급사</label>
            <select
              value={filter.supplier}
              onChange={e => onFilterChange({ supplier: e.target.value })}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">전체 공급사</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>
          {(filter.search || filter.status !== 'all' || filter.deliveryState !== 'all' || filter.priceState !== 'all' || filter.itemCode !== 'all' || filter.supplier !== 'all') && (
            <button
              onClick={onResetFilters}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="필터 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
