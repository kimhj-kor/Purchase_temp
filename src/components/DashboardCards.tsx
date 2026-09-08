import React from 'react';
import { EvaluatedQuoteItem } from '../types';
import { AlertTriangle, Clock, ShieldAlert, FileText, AlertCircle } from 'lucide-react';

interface DashboardCardsProps {
  items: EvaluatedQuoteItem[];
  activeFilter: string;
  onSelectFilter: (filterKey: string) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  items,
  activeFilter,
  onSelectFilter,
}) => {
  const delayedCount = items.filter(i => i.delivery_state === '지연').length;
  const urgentCount = items.filter(i => i.delivery_state === '임박').length;
  const outlierCount = items.filter(i => i.price_state === '이상치').length;
  const discrepancyCount = items.filter(i => i.has_name_discrepancy).length;
  const missingCount = items.filter(
    i => i.unit_price === null || i.promised_date === null
  ).length;

  const cards = [
    {
      id: 'delay',
      title: '납기 지연 (발주건)',
      count: delayedCount,
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeColor: 'bg-rose-100 text-rose-800',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      filterKey: 'delay',
      desc: '약속 납기가 기준일 초과',
    },
    {
      id: 'urgent',
      title: '납기 임박 (0~7일)',
      count: urgentCount,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      filterKey: 'urgent',
      desc: '기준일 기준 7일 이내 도래',
    },
    {
      id: 'outlier',
      title: '단가 이상치 (±30%)',
      count: outlierCount,
      color: 'bg-orange-50 border-orange-200 text-orange-900',
      badgeColor: 'bg-orange-100 text-orange-800',
      icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
      filterKey: 'outlier',
      desc: 'PR 중앙값 대비 30% 초과 편차',
    },
    {
      id: 'discrepancy',
      title: '품목명 표기 상이',
      count: discrepancyCount,
      color: 'bg-purple-50 border-purple-200 text-purple-900',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      filterKey: 'discrepancy',
      desc: '동일 품목코드 다른 명칭',
    },
    {
      id: 'missing',
      title: '단가·납기 공란',
      count: missingCount,
      color: 'bg-slate-50 border-slate-200 text-slate-800',
      badgeColor: 'bg-slate-200 text-slate-700',
      icon: <AlertCircle className="w-5 h-5 text-slate-600" />,
      filterKey: 'missing',
      desc: '정보 미입력 견적 행',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map(card => {
        const isSelected = activeFilter === card.filterKey;
        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter(isSelected ? 'all' : card.filterKey)}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${card.color} ${
              isSelected ? 'ring-2 ring-blue-600 ring-offset-1 font-semibold' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">{card.title}</span>
              {card.icon}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight">{card.count}건</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${card.badgeColor}`}>
                {card.desc}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
