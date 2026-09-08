import React, { useState } from 'react';
import Papa from 'papaparse';
import { QuoteItem } from '../types';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (newItems: QuoteItem[]) => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseAndApply = (csvString: string) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const rows = results.data as any[];
          if (!rows || rows.length === 0) {
            setErrorMsg('파싱된 데이터가 없습니다. CSV 헤더와 형식을 확인해 주세요.');
            return;
          }

          const parsedItems: QuoteItem[] = rows.map((row, index) => {
            const quote_id = row.quote_id || row['견적번호'] || `QT-${String(index + 1).padStart(3, '0')}`;
            const pr_no = row.pr_no || row['PR번호'] || 'PR-2026-000';
            const item_code = row.item_code || row['품목코드'] || 'IT-001';
            const item_name = row.item_name || row['품목명'] || '일반품목';
            const supplier = row.supplier || row['공급사'] || '공급사미지정';
            const unit = row.unit || row['단위'] || 'EA';
            const qtyStr = row.qty || row['수량'] || '1';
            const qty = parseFloat(qtyStr.toString().replace(/,/g, '')) || 1;
            
            const rawPrice = row.unit_price !== undefined ? row.unit_price : row['단가'];
            const unit_price =
              rawPrice === '' || rawPrice === null || rawPrice === undefined || isNaN(parseFloat(rawPrice))
                ? null
                : parseFloat(rawPrice.toString().replace(/,/g, ''));

            const currency = row.currency || row['통화'] || 'KRW';
            const quote_date = row.quote_date || row['견적일'] || '2026-08-01';
            const required_date = row.required_date || row['요청필요일'] || '2026-09-01';
            
            const rawPromised = row.promised_date !== undefined ? row.promised_date : row['약속납기'];
            const promised_date =
              rawPromised === '' || rawPromised === null || rawPromised === undefined || rawPromised === '-'
                ? null
                : rawPromised.toString().trim();

            const statusVal = (row.status || row['상태'] || '견적').trim();
            const status = statusVal === '발주' ? '발주' : '견적';
            const remark = row.remark || row['비고'] || '';

            return {
              quote_id: quote_id.trim(),
              pr_no: pr_no.trim(),
              item_code: item_code.trim(),
              item_name: item_name.trim(),
              supplier: supplier.trim(),
              unit: unit.trim(),
              qty,
              unit_price,
              currency: currency.trim(),
              quote_date: quote_date.trim(),
              required_date: required_date.trim(),
              promised_date,
              status,
              remark: remark.trim(),
            };
          });

          onImportData(parsedItems);
          setSuccessMsg(`성공적으로 ${parsedItems.length}건의 견적 데이터를 반입했습니다.`);
          setErrorMsg(null);
          setTimeout(() => {
            onClose();
            setSuccessMsg(null);
          }, 1500);
        } catch (err: any) {
          setErrorMsg(`데이터 변환 중 오류 발생: ${err.message}`);
        }
      },
      error: (error: any) => {
        setErrorMsg(`CSV 파싱 오류: ${error.message}`);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        parseAndApply(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setErrorMsg('반입할 텍스트를 입력해 주세요.');
      return;
    }
    parseAndApply(pastedText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">구매 견적 파일 반입 (CSV / 텍스트)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">1. CSV 파일 업로드</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700 mb-1">여기를 클릭하거나 파일을 드래그하여 업로드하세요</p>
              <p className="text-[11px] text-slate-500">UTF-8 인코딩된 ERP 내보내기 CSV 파일 지원</p>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs">또는 텍스트 직접 붙여넣기</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Paste Text Form */}
          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">2. CSV 텍스트 붙여넣기</label>
            <textarea
              rows={6}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="quote_id,pr_no,item_code,item_name,supplier,unit,qty,unit_price,currency,quote_date,required_date,promised_date,status,remark&#10;QT-001,PR-2026-001,IT-001,MTBE 수입품,유진테크,t,5,,KRW,2026-08-05,2026-09-07,2026-08-29,견적,"
              className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                붙여넣은 데이터 반입
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">ERP 표준 포맷 (`quote_id`, `pr_no`, `item_code`, ...) 준수</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-50 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
