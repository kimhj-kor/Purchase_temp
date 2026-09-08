import React from 'react';
import { EvaluatedQuoteItem } from '../types';
import { Layers, ArrowUpRight, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';

interface PRGroupViewProps {
  items: EvaluatedQuoteItem[];
  onSelectPr: (prNo: string) => void;
  onToggleStatus: (quoteId: string) => void;
}

export const PRGroupView: React.FC<PRGroupViewProps> = ({
  items,
  onSelectPr,
  onToggleStatus,
}) => {
  // Group by pr_no
  const prMap = new Map<string, EvaluatedQuoteItem[]>();
  items.forEach(item => {
    if (!prMap.has(item.pr_no)) {
      prMap.set(item.pr_no, []);
    }
    prMap.get(item.pr_no)!.push(item);
  });

  const prGroups = Array.from(prMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  if (prGroups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">표시할 구매요청(PR) 그룹이 없습니다</h3>
        <p className="text-xs text-slate-500">검색 조건이나 필터를 초기화해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {prGroups.map(([prNo, groupItems]) => {
        const first = groupItems[0];
        const orderedItem = groupItems.find(i => i.status === '발주');
        const hasOutlier = groupItems.some(i => i.price_state === '이상치');
        const hasDelay = groupItems.some(i => i.delivery_state === '지연');
        const hasUrgent = groupItems.some(i => i.delivery_state === '임박');

        return (
          <div
            key={prNo}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                    {prNo}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {first.item_code} | {first.item_name}
                  </span>
                </div>
                <button
                  onClick={() => onSelectPr(prNo)}
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <span>비교 상세</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {/* Summary info */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px]">수량 / 단위</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {first.qty.toLocaleString()} {first.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">요청 필요일</span>
                  <span className="font-semibold text-slate-800 font-mono">{first.required_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">견적 건수</span>
                  <span className="font-semibold text-slate-800 font-mono">{groupItems.length}개사</span>
                </div>
              </div>

              {/* Badges & Alerts */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {hasOutlier && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    <ShieldAlert className="w-3 h-3 mr-1 text-orange-600" />
                    단가 이상치 포함
                  </span>
                )}
                {hasDelay && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                    납기 지연
                  </span>
                )}
                {hasUrgent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    납기 임박
                  </span>
                )}
                {orderedItem && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" />
                    발주완료 ({orderedItem.supplier})
                  </span>
                )}
              </div>

              {/* Suppliers List */}
              <div className="space-y-1.5 mb-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  공급사별 견적 비교
                </div>
                {groupItems.map(q => {
                  return (
                    <div
                      key={q.quote_id}
                      className={`flex items-center justify-between text-xs p-2 rounded-lg border transition ${
                        q.is_lowest
                          ? 'bg-blue-50/60 border-blue-200 font-medium'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleStatus(q.quote_id)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            q.status === '발주'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="상태 전환"
                        >
                          {q.status}
                        </button>
                        <span className="text-slate-800 font-medium">{q.supplier}</span>
                        {q.is_lowest && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-blue-300">
                            최저가
                          </span>
                        )}
                        {q.price_state === '이상치' && (
                          <span className="bg-orange-100 text-orange-800 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-orange-200">
                            이상치
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-slate-900 font-semibold">
                          {q.unit_price !== null ? `${q.unit_price.toLocaleString()} 원` : '미기재'}
                        </span>
                        <span className="text-[11px] text-slate-500 w-16 text-right">
                          {q.delivery_state !== '판정 대상 아님' ? q.d_day_label : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
              <span>견적ID: {groupItems.map(q => q.quote_id).join(', ')}</span>
              <button
                onClick={() => onSelectPr(prNo)}
                className="text-blue-600 hover:underline font-medium"
              >
                상세 비교표 보기 →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
