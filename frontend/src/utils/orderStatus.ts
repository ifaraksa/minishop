import type { OrderStatus } from '../types';

export interface OrderStatusMeta {
  value: OrderStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  step: number;
}

export const ORDER_STATUS_LIST: OrderStatusMeta[] = [
  {
    value: 'pending',
    label: 'Menunggu',
    badgeClass: 'border-[#96662E]/25 bg-[#F2E7D8] text-[#8A5B24]',
    dotClass: 'bg-[#96662E]',
    step: 0,
  },
  {
    value: 'processing',
    label: 'Diproses',
    badgeClass: 'border-[#3B6285]/25 bg-[#E6EEF4] text-[#2F5373]',
    dotClass: 'bg-[#3B6285]',
    step: 1,
  },
  {
    value: 'shipped',
    label: 'Dikirim',
    badgeClass: 'border-[#5B5288]/25 bg-[#ECEAF5] text-[#4C4375]',
    dotClass: 'bg-[#5B5288]',
    step: 2,
  },
  {
    value: 'completed',
    label: 'Selesai',
    badgeClass: 'border-[#4A6B53]/25 bg-[#E4ECE5] text-[#35503C]',
    dotClass: 'bg-[#4A6B53]',
    step: 3,
  },
  {
    value: 'cancelled',
    label: 'Dibatalkan',
    badgeClass: 'border-[#A1483F]/25 bg-[#F2E1DF] text-[#963E35]',
    dotClass: 'bg-[#A1483F]',
    step: -1,
  },
];

export const ORDER_FLOW_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed'];

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return (
    ORDER_STATUS_LIST.find((item) => item.value === status) ?? {
      value: 'pending',
      label: status,
      badgeClass: 'border-[#1A1A18]/15 bg-[#EBE8E0] text-[#63625C]',
      dotClass: 'bg-[#63625C]',
      step: 0,
    }
  );
}
