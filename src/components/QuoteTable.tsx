import React from 'react';
import { EvaluatedQuoteItem } from '../types';
import { CheckCircle, AlertTriangle, Clock, ShieldAlert, FileText, AlertCircle } from 'lucide-react';

interface QuoteTableProps {
  items: EvaluatedQuoteItem[];
  onSelectPr: (prNo: string) => void;
  onToggleStatus: (quoteId: string) => void;
  onEditItem: (item: EvaluatedQuoteItem) => void;
}

export const QuoteTable: React.FC<QuoteTableProps> = ({
  items,
  onSelectPr,
  onToggleStatus,
  onEditItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">검색 결과가 없습니다</h3>
        <p className="text-xs text-slate-500">필터 조건이나 검색어를 변경해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3">상태</th>
              <th className="py-3 px-3">견적번호 / PR번호</th>
              <th className="py-3 px-3">품목코드 / 품명</th>
              <th className="py-3 px-3">공급사</th>
              <th className="py-3 px-3 text-right">수량</th>
              <th className="py-3 px-3 text-right">단가 (KRW)</th>
              <th className="py-3 px-3 text-center">단가 판정</th>
              <th className="py-3 px-3 text-center">납기 판정</th>
              <th className="py-3 px-3">필요일 / 약속일</th>
              <th className="py-3 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {items.map(item => {
              return (
                <tr
                  key={item.quote_id}
                  className="hover:bg-slate-50/80 transition group"
                >
                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      onClick={() => onToggleStatus(item.quote_id)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                        item.status === '발주'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="클릭하여 상태 전환 (발주 ↔ 견적)"
                    >
                      {item.status}
                    </button>
                  </td>

                  {/* Quote ID & PR No */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono font-medium text-slate-900">{item.quote_id}</div>
                    <button
                      onClick={() => onSelectPr(item.pr_no)}
                      className="text-[11px] text-blue-600 hover:underline font-mono"
                    >
                      {item.pr_no}
                    </button>
                  </td>

                  {/* Item Code & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-slate-500 text-[11px]">{item.item_code}</span>
                      {item.has_name_discrepancy && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-200"
                          title="동일 품목코드 내 품목명 표기 상이 존재"
                        >
                          표기상이
                        </span>
                      )}
                    </div>
                    <div
                      className="font-medium text-slate-900 max-w-[180px] truncate"
                      title={item.item_name}
                    >
                      {item.item_name}
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="py-3 px-3 font-medium whitespace-nowrap">
                    {item.supplier}
                  </td>

                  {/* Qty & Unit */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                    {item.qty.toLocaleString()} {item.unit}
                  </td>

                  {/* Unit Price & Lowest / Outlier badges */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {item.unit_price !== null ? (
                      <div>
                        <div className="font-mono font-semibold text-slate-900">
                          {item.unit_price.toLocaleString()} 원
                        </div>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          {item.is_lowest && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              최저가
                            </span>
                          )}
                          {item.deviation_pct !== null && (
                            <span
                              className={`text-[10px] font-mono ${
                                item.price_state === '이상치'
                                  ? 'text-rose-600 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              ({item.deviation_pct > 0 ? `+${item.deviation_pct}%` : `${item.deviation_pct}%`})
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">미기재</span>
                    )}
                  </td>

                  {/* Price State */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {item.price_state === '이상치' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        <ShieldAlert className="w-3 h-3 mr-1 text-orange-600" />
                        이상치
                      </span>
                    )}
                    {item.price_state === '정상' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        정상
                      </span>
                    )}
                    {item.price_state === '비교 불가' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        비교불가(&lt;3건)
                      </span>
                    )}
                    {item.price_state === '단가 미기재' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                        공란
                      </span>
                    )}
                  </td>

                  {/* Delivery State */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {item.delivery_state === '지연' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                        지연 ({item.d_day_label})
                      </span>
                    )}
                    {item.delivery_state === '임박' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 mr-1 text-amber-600" />
                        임박 ({item.d_day_label})
                      </span>
                    )}
                    {item.delivery_state === '정상' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                        정상 ({item.d_day_label})
                      </span>
                    )}
                    {item.delivery_state === '납기 미기재' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        납기미기재
                      </span>
                    )}
                    {item.delivery_state === '판정 대상 아님' && (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                    <div className="text-slate-500" title="요청 필요일">필요: {item.required_date}</div>
                    <div className="flex items-center space-x-1">
                      <span className={item.is_over_required ? 'text-orange-600 font-semibold' : 'text-slate-800'}>
                        약속: {item.promised_date || '미기재'}
                      </span>
                      {item.is_over_required && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="필요일 초과 납기" />
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onSelectPr(item.pr_no)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mr-2"
                    >
                      PR비교
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
