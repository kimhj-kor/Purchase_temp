import { QuoteItem, EvaluatedQuoteItem, PriceState, DeliveryState } from '../types';

export const BASE_DATE = '2026-08-27';

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
}

function getDaysDiff(date1: Date, date2: Date): number {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function evaluateQuotes(rawQuotes: QuoteItem[]): EvaluatedQuoteItem[] {
  // 1. Check item name discrepancies per item_code
  const itemNamesMap = new Map<string, Set<string>>();
  rawQuotes.forEach(q => {
    const code = q.item_code;
    const name = (q.item_name || '').trim();
    if (!itemNamesMap.has(code)) {
      itemNamesMap.set(code, new Set());
    }
    itemNamesMap.get(code)!.add(name);
  });

  const discrepancyCodes = new Set<string>();
  itemNamesMap.forEach((names, code) => {
    if (names.size >= 2) {
      discrepancyCodes.add(code);
    }
  });

  // 2. Group by pr_no to calculate medians and lowest prices
  const prGroups = new Map<string, QuoteItem[]>();
  rawQuotes.forEach(q => {
    if (!prGroups.has(q.pr_no)) {
      prGroups.set(q.pr_no, []);
    }
    prGroups.get(q.pr_no)!.push(q);
  });

  const prMedians = new Map<string, number | null>();
  const prValidPricesMap = new Map<string, { quote_id: string; price: number; quote_date: string }[]>();

  prGroups.forEach((quotes, prNo) => {
    const validPrices: { quote_id: string; price: number; quote_date: string }[] = [];
    quotes.forEach(q => {
      if (q.unit_price !== null && !isNaN(q.unit_price) && q.unit_price > 0) {
        validPrices.push({ quote_id: q.quote_id, price: q.unit_price, quote_date: q.quote_date });
      }
    });

    if (validPrices.length === 0) {
      prMedians.set(prNo, null);
      prValidPricesMap.set(prNo, []);
      return;
    }

    // Sort prices for median calculation
    const sorted = [...validPrices].sort((a, b) => a.price - b.price);
    let median: number;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      median = (sorted[mid - 1].price + sorted[mid].price) / 2;
    } else {
      median = sorted[mid].price;
    }
    prMedians.set(prNo, median);
    prValidPricesMap.set(prNo, validPrices);
  });

  // 3. Determine outliers (|deviation| > 30%)
  const outlierQuoteIds = new Set<string>();
  prGroups.forEach((quotes, prNo) => {
    const median = prMedians.get(prNo);
    const validPrices = prValidPricesMap.get(prNo) || [];
    if (validPrices.length >= 3 && median !== null && median !== undefined && median > 0) {
      validPrices.forEach(item => {
        const deviationPct = ((item.price - median) / median) * 100;
        // Boundary rule: 30.0 is normal, 30.1 is outlier
        if (Math.abs(deviationPct) > 30.0001) {
          outlierQuoteIds.add(item.quote_id);
        }
      });
    }
  });

  // 4. Determine lowest price candidate per PR (excluding outliers & missing prices)
  const prLowestQuoteId = new Map<string, string>();
  prGroups.forEach((quotes, prNo) => {
    const candidates = quotes.filter(q => {
      if (q.unit_price === null || q.unit_price <= 0) return false;
      if (outlierQuoteIds.has(q.quote_id)) return false;
      return true;
    });

    if (candidates.length > 0) {
      // Sort by price asc, then quote_date asc, then quote_id asc
      candidates.sort((a, b) => {
        if ((a.unit_price ?? 0) !== (b.unit_price ?? 0)) {
          return (a.unit_price ?? 0) - (b.unit_price ?? 0);
        }
        if (a.quote_date !== b.quote_date) {
          return a.quote_date.localeCompare(b.quote_date);
        }
        return a.quote_id.localeCompare(b.quote_id);
      });
      prLowestQuoteId.set(prNo, candidates[0].quote_id);
    }
  });

  const baseDateObj = parseDate(BASE_DATE)!;

  // 5. Evaluate each quote
  return rawQuotes.map(q => {
    const median = prMedians.get(q.pr_no) ?? null;
    let deviation_pct: number | null = null;
    let price_state: PriceState = '정상';

    if (q.unit_price === null || q.unit_price === undefined || isNaN(q.unit_price)) {
      price_state = '단가 미기재';
    } else {
      const validPrices = prValidPricesMap.get(q.pr_no) || [];
      if (validPrices.length < 3 || median === null || median === 0) {
        price_state = '비교 불가';
      } else {
        deviation_pct = Number((((q.unit_price - median) / median) * 100).toFixed(1));
        if (outlierQuoteIds.has(q.quote_id)) {
          price_state = '이상치';
        } else {
          price_state = '정상';
        }
      }
    }

    const is_lowest = prLowestQuoteId.get(q.pr_no) === q.quote_id;

    // Delivery calculation
    let d_day: number | null = null;
    let d_day_label = '-';
    let delivery_state: DeliveryState = '판정 대상 아님';
    let delivery_rank = 4;
    let is_over_required = false;

    const promisedDateObj = parseDate(q.promised_date);
    const requiredDateObj = parseDate(q.required_date);

    if (promisedDateObj && requiredDateObj) {
      if (promisedDateObj.getTime() > requiredDateObj.getTime()) {
        is_over_required = true;
      }
    }

    if (q.status === '발주') {
      if (!promisedDateObj) {
        delivery_state = '납기 미기재';
        delivery_rank = 3;
      } else {
        // D = promised_date - BASE_DATE
        d_day = getDaysDiff(promisedDateObj, baseDateObj);
        if (d_day < 0) {
          delivery_state = '지연';
          delivery_rank = 0;
          d_day_label = `D+${Math.abs(d_day)}`;
        } else if (d_day <= 7) {
          delivery_state = '임박';
          delivery_rank = 1;
          d_day_label = d_day === 0 ? 'D-DAY' : `D-${d_day}`;
        } else {
          delivery_state = '정상';
          delivery_rank = 2;
          d_day_label = `D-${d_day}`;
        }
      }
    } else {
      // 견적 상태
      if (promisedDateObj) {
        d_day = getDaysDiff(promisedDateObj, baseDateObj);
        if (d_day < 0) {
          d_day_label = `D+${Math.abs(d_day)}`;
        } else if (d_day === 0) {
          d_day_label = 'D-DAY';
        } else {
          d_day_label = `D-${d_day}`;
        }
      }
      delivery_state = '판정 대상 아님';
      delivery_rank = 4;
    }

    const has_name_discrepancy = discrepancyCodes.has(q.item_code);
    const is_ordered_not_lowest = q.status === '발주' && !is_lowest && price_state !== '이상치';

    return {
      ...q,
      median_price: median ? Math.round(median) : null,
      deviation_pct,
      price_state,
      is_lowest,
      d_day,
      d_day_label,
      delivery_state,
      delivery_rank,
      is_over_required,
      has_name_discrepancy,
      is_ordered_not_lowest,
    };
  });
}
