import { PriceTier, SurchargeType } from '@/types/database';

/**
 * Округление half-up до 2 десятичных знаков согласно ТЗ п. 5.2
 */
export function roundCurrency(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Форматирование суммы в тенге (KZT)
 */
export function formatCurrency(amount: number, currency: string = 'KZT'): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ₸`;
}

/**
 * Поиск цены за единицу товара по тиражу (п. 4.2 и п. 10.6 ТЗ):
 * Выбирает максимальную нижнюю границу (min_quantity), не превышающую указанное количество.
 * Например: при ступенях 1000 (40 ₸), 5000 (35 ₸), 10000 (30 ₸):
 * - 5 000 шт -> 35 ₸
 * - 7 000 шт -> 35 ₸
 * - 10 000 шт -> 30 ₸
 * Если тираж ниже минимальной ступени, возвращает null (требуется ручной расчет или предупреждение).
 */
export function findTierPrice(quantity: number, tiers: PriceTier[]): number | null {
  if (!tiers || tiers.length === 0 || quantity <= 0) {
    return null;
  }

  // Сортируем ступени по возрастанию min_quantity
  const sorted = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);

  // Ищем наибольшую ступень, где min_quantity <= quantity
  let selectedTier: PriceTier | null = null;
  for (const tier of sorted) {
    if (quantity >= tier.min_quantity) {
      // Если задана max_quantity, проверяем её включение
      if (tier.max_quantity === null || tier.max_quantity === undefined || quantity <= tier.max_quantity) {
        selectedTier = tier;
      } else if (quantity > tier.max_quantity && !sorted.some(t => t.min_quantity > tier.min_quantity)) {
        // Если это последняя ступень и max_quantity превышена
        selectedTier = tier;
      }
    }
  }

  return selectedTier ? selectedTier.unit_price : null;
}

export interface CalculateItemParams {
  quantity: number;
  unitPrice: number;
  discountPercent?: number; // 0..100
}

export interface CalculatedItemResult {
  baseAmount: number; // кол-во * цена
  discountAmount: number; // сумма скидки
  subtotal: number; // итог позиции после скидки
}

/**
 * Расчет стоимости позиции товара со скидкой
 */
export function calculateItemTotal(params: CalculateItemParams): CalculatedItemResult {
  const { quantity, unitPrice, discountPercent = 0 } = params;
  
  if (quantity < 0 || unitPrice < 0) {
    throw new Error('Количество и цена не могут быть отрицательными');
  }

  const cleanDiscount = Math.max(0, Math.min(100, discountPercent));
  const baseAmount = roundCurrency(quantity * unitPrice);
  const discountAmount = roundCurrency(baseAmount * (cleanDiscount / 100));
  const subtotal = roundCurrency(baseAmount - discountAmount);

  return {
    baseAmount,
    discountAmount,
    subtotal,
  };
}

export interface ChargeCalculationParams {
  chargeType: SurchargeType;
  unitPrice: number;
  itemQuantity?: number;
  chargeQuantity?: number;
}

/**
 * Расчет доплаты (п. 4.3 и 5.2 ТЗ):
 * - per_unit: цена доплаты умножается на тираж товара (напр. усиленное дно: 2 ₸ * 7000 шт = 14 000 ₸)
 * - per_color_unit: цена за цвет * тираж * кол-во доп. цветов (напр. 1.5 ₸ * 7000 шт * 1 доп. цвет = 10 500 ₸)
 * - one_time_fixed: разовый сбор (напр. клише = 15 000 ₸)
 * - custom_manual: ручная сумма
 * Доплаты рассчитываются отдельно и не дисконтируются!
 */
export function calculateChargeTotal(params: ChargeCalculationParams): number {
  const { chargeType, unitPrice, itemQuantity = 1, chargeQuantity = 1 } = params;

  switch (chargeType) {
    case 'per_unit':
      return roundCurrency(unitPrice * itemQuantity);
    case 'per_color_unit':
      return roundCurrency(unitPrice * itemQuantity * chargeQuantity);
    case 'one_time_fixed':
      return roundCurrency(unitPrice * chargeQuantity);
    case 'custom_manual':
      return roundCurrency(unitPrice);
    default:
      return roundCurrency(unitPrice);
  }
}
