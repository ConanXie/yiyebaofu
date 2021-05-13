/* eslint-disable @typescript-eslint/naming-convention */
export interface Currency {
  curr_a: string;
  curr_b: string;
  etfRestoration: any[];
  fee: number;
  fee_sell: number;
  fell_buy: number;
  lq: string;
  maker_fee: string;
  marketcap: string;
  multiple: number;
  name: string;
  name_cn: string;
  name_en: string;
  p_rate: number;
  pair: string;
  prec_r: number;
  prec_t: number;
  prec_v: number;
  precision_rate: number;
  precision_total: number;
  precision_vol: number;
  rate: string;
  rate_percent: string;
  rate_percent_str: string;
  rate_percent_utc0: string;
  rate_percent_utc8: string;
  restoration: any[];
  symbol: string;
  taker_fee: string;
  trend: string;
  vol_a: string;
  vol_b: string;
}

export interface AllCurrencies {
  etf: Currency[];
  spot: Currency[];
}
