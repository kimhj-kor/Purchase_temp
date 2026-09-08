import React, { useState } from 'react';
import { EvaluatedQuoteItem } from '../types';
import { X, Copy, Check, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PRDetailModalProps {
  prNo: string | null;
  items: EvaluatedQuoteItem[];
  onClose: () => void;
  onToggleStatus: (quoteId: string) => void;
}

export const PRDetailModal: React.FC<PRDetailModalProps> = ({
  prNo,
  items,
  onClose,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);

  if (!prNo) return null;

  const prQuotes = items.filter(i => i.pr_no === prNo);
  if (prQuotes.length === 0) return null;

  const first = prQuotes[0];

  const handleCopyTable = () => {
    const headers = ['견적번호', 'PR번호', '품목코드', '품명', '공급사', '수량', '단가', '단가판정', '납기판정', '약속일', '상태'];
    const rows = prQuotes.map(q => [
      q.quote_id,
      q.pr_no,
      q.item_code,
      q.item_name,
      q.supplier,
      `${q.qty} ${q.unit}`,
      q.unit_price !== null ? q.unit_price : '미기재',
      q.price_state,
      q.delivery_state,
      q.promised_date || '미기재',
      q.status,
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">구매요청(PR) 공급사 견적 상세 비교</h2>
              <span className="font-mono bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-md font-semibold">
                {prNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              품목: [{first.item_code}] {first.item_name} ({first.qty.toLocaleString()} {first.unit}) | 필요일: {first.required_date}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyTable}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span className="text-emerald-700">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>비교표 복사 (탭 텍스트)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
            <div className="font-semibold mb-1">💡 구매 담당자 검토 가이드</div>
            <p className="leading-relaxed">
              본 PR 내 공급사별 단가, 중앙값 편차, 최저가 후보 및 납기 일정을 비교합니다. 이상치 견적은 최저가 선정에서 자동 제외됩니다. 행의 [발주/견적] 버튼을 클릭하여 즉시 상태를 전환할 수 있습니다.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-3 px-4">견적번호</th>
                  <th className="py-3 px-4">공급사</th>
                  <th className="py-3 px-4 text-right">단가 (KRW)</th>
                  <th className="py-3 px-4 text-center">중앙값 대비 편차</th>
                  <th className="py-3 px-4 text-center">단가 판정</th>
                  <th className="py-3 px-4 text-center">납기 판정</th>
                  <th className="py-3 px-4">약속 납기</th>
                  <th className="py-3 px-4 text-center">상태 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {prQuotes.map(q => {
                  return (
                    <tr
                      key={q.quote_id}
                      className={q.is_lowest ? 'bg-blue-50/40 font-medium' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4 font-mono text-slate-600">{q.quote_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{q.supplier}</span>
                          {q.is_lowest && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                              최저가 후보
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {q.unit_price !== null ? `${q.unit_price.toLocaleString()} 원` : '미기재'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {q.deviation_pct !== null ? (
                          <span
                            className={
                              q.price_state === '이상치' ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }
                          >
                            {q.deviation_pct > 0 ? `+${q.deviation_pct}%` : `${q.deviation_pct}%`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {q.price_state === '이상치' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            <ShieldAlert className="w-3 h-3 mr-1 text-orange-600" /> 이상치
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">정상</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {q.delivery_state === '지연' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                            지연 ({q.d_day_label})
                          </span>
                        )}
                        {q.delivery_state === '임박' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            임박 ({q.d_day_label})
                          </span>
                        )}
                        {q.delivery_state === '정상' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            정상 ({q.d_day_label})
                          </span>
                        )}
                        {q.delivery_state === '납기 미기재' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700">
                            납기미기재
                          </span>
                        )}
                        {q.delivery_state === '판정 대상 아님' && <span className="text-slate-400">-</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {q.promised_date || '미기재'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleStatus(q.quote_id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition shadow-xs ${
                            q.status === '발주'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                          }`}
                        >
                          {q.status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            총 {prQuotes.length}개 공급사 견적 비교 중
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
