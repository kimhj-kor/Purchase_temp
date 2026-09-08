export interface QuoteItem {
  quote_id: string;
  pr_no: string;
  item_code: string;
  item_name: string;
  supplier: string;
  unit: string;
  qty: number;
  unit_price: number | null;
  currency: string;
  quote_date: string;
  required_date: string;
  promised_date: string | null;
  status: '견적' | '발주';
  remark: string;
}

export type PriceState = '이상치' | '정상' | '비교 불가' | '단가 미기재';
export type DeliveryState = '지연' | '임박' | '정상' | '납기 미기재' | '판정 대상 아님';

export interface EvaluatedQuoteItem extends QuoteItem {
  median_price: number | null;
  deviation_pct: number | null;
  price_state: PriceState;
  is_lowest: boolean;
  d_day: number | null;
  d_day_label: string;
  delivery_state: DeliveryState;
  delivery_rank: number;
  is_over_required: boolean;
  has_name_discrepancy: boolean;
  is_ordered_not_lowest: boolean;
}

export type FilterState = {
  search: string;
  status: string; // 'all' | '견적' | '발주'
  deliveryState: string; // 'all' | '지연' | '임박' | '정상' | '납기 미기재'
  priceState: string; // 'all' | '이상치' | '정상' | '비교 불가'
  itemCode: string; // 'all' | IT-001 ...
  supplier: string; // 'all' | supplier name
  viewMode: 'table' | 'pr_group';
};
