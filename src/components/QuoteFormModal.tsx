import React, { useState, useEffect } from 'react';
import { QuoteItem } from '../types';
import { X, Save } from 'lucide-react';

interface QuoteFormModalProps {
  isOpen: boolean;
  editingItem: QuoteItem | null;
  onClose: () => void;
  onSave: (item: QuoteItem) => void;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  isOpen,
  editingItem,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<QuoteItem>({
    quote_id: '',
    pr_no: 'PR-2026-999',
    item_code: 'IT-001',
    item_name: 'MTBE 수입품',
    supplier: '신규공급사',
    unit: 't',
    qty: 10,
    unit_price: 500000,
    currency: 'KRW',
    quote_date: '2026-09-07',
    required_date: '2026-09-30',
    promised_date: '2026-09-25',
    status: '견적',
    remark: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      // Generate new quote ID
      setFormData({
        quote_id: `QT-${Math.floor(100 + Math.random() * 900)}`,
        pr_no: 'PR-2026-100',
        item_code: 'IT-001',
        item_name: 'MTBE 수입품',
        supplier: '신규공급사',
        unit: 't',
        qty: 10,
        unit_price: 500000,
        currency: 'KRW',
        quote_date: new Date().toISOString().split('T')[0],
        required_date: '2026-09-30',
        promised_date: '2026-09-25',
        status: '견적',
        remark: '',
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quote_id || !formData.pr_no || !formData.supplier) {
      alert('견적번호, PR번호, 공급사는 필수 입력 항목입니다.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {editingItem ? '견적 단건 정보 수정' : '신규 견적 등록'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">견적번호 (Quote ID)*</label>
              <input
                type="text"
                required
                value={formData.quote_id}
                onChange={e => setFormData({ ...formData, quote_id: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono"
                placeholder="예: QT-099"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">구매요청번호 (PR No)*</label>
              <input
                type="text"
                required
                value={formData.pr_no}
                onChange={e => setFormData({ ...formData, pr_no: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                placeholder="예: PR-2026-033"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">품목 코드*</label>
              <select
                value={formData.item_code}
                onChange={e => {
                  const code = e.target.value;
                  const names: Record<string, string> = {
                    'IT-001': 'MTBE 수입품',
                    'IT-002': '라피네이트-1',
                    'IT-003': 'AIBN 개시제',
                    'IT-004': 'PMMA 포장백 25kg',
                    'IT-005': '열교환기 가스켓',
                    'IT-006': '산화방지제 AO-11',
                    'IT-007': '펌프 메카니컬씰',
                    'IT-008': '팔레트(플라스틱)',
                  };
                  setFormData({ ...formData, item_code: code, item_name: names[code] || formData.item_name });
                }}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="IT-001">IT-001 (MTBE 수입품)</option>
                <option value="IT-002">IT-002 (라피네이트-1)</option>
                <option value="IT-003">IT-003 (AIBN 개시제)</option>
                <option value="IT-004">IT-004 (PMMA 포장백 25kg)</option>
                <option value="IT-005">IT-005 (열교환기 가스켓)</option>
                <option value="IT-006">IT-006 (산화방지제 AO-11)</option>
                <option value="IT-007">IT-007 (펌프 메카니컬씰)</option>
                <option value="IT-008">IT-008 (팔레트(플라스틱))</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">품목명*</label>
              <input
                type="text"
                required
                value={formData.item_name}
                onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">공급사*</label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">수량 (qty)*</label>
              <input
                type="number"
                min="1"
                required
                value={formData.qty}
                onChange={e => setFormData({ ...formData, qty: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">단위 (unit)*</label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="t">t (톤)</option>
                <option value="kg">kg</option>
                <option value="EA">EA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">단가 (unit_price, 공란 가능)</label>
              <input
                type="number"
                value={formData.unit_price !== null ? formData.unit_price : ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    unit_price: e.target.value === '' ? null : parseFloat(e.target.value),
                  })
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                placeholder="미기재 시 비워두세요"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">진행 상태*</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as '견적' | '발주' })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="견적">견적</option>
                <option value="발주">발주</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">견적일 (quote_date)</label>
              <input
                type="date"
                value={formData.quote_date}
                onChange={e => setFormData({ ...formData, quote_date: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">요청 필요일 (required_date)</label>
              <input
                type="date"
                value={formData.required_date}
                onChange={e => setFormData({ ...formData, required_date: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">약속 납기 (promised_date)</label>
              <input
                type="date"
                value={formData.promised_date || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    promised_date: e.target.value === '' ? null : e.target.value,
                  })
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                placeholder="공란 가능"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">비고 (remark)</label>
            <input
              type="text"
              value={formData.remark}
              onChange={e => setFormData({ ...formData, remark: e.target.value })}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              placeholder="특이사항 입력..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
