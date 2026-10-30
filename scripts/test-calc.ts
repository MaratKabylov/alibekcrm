import { findTierPrice, calculateItemTotal, calculateChargeTotal, formatCurrency } from '../src/lib/calculator';
import { initialPriceTiers } from '../src/lib/supabase/mock-data';

console.log('--- ТЕСТИРОВАНИЕ РАСЧЕТА СОГЛАСНО ТЗ РАЗДЕЛ 10 ---');

const tiersCup350 = initialPriceTiers.filter(t => t.product_id === 'prod-1');

// Тест 1 (п. 10.5): 5 000 стаканов 350 мл
const price5000 = findTierPrice(5000, tiersCup350);
const calc5000 = calculateItemTotal({ quantity: 5000, unitPrice: price5000! });
console.log(`Тест 10.5 (5 000 шт): Цена = ${price5000} ₸ (ожидается 35 ₸), Сумма = ${calc5000.subtotal} ₸ (ожидается 175 000 ₸) -> ${price5000 === 35 && calc5000.subtotal === 175000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);

// Тест 2 (п. 10.5): 10 000 стаканов 350 мл
const price10000 = findTierPrice(10000, tiersCup350);
const calc10000 = calculateItemTotal({ quantity: 10000, unitPrice: price10000! });
console.log(`Тест 10.5 (10 000 шт): Цена = ${price10000} ₸ (ожидается 30 ₸), Сумма = ${calc10000.subtotal} ₸ (ожидается 300 000 ₸) -> ${price10000 === 30 && calc10000.subtotal === 300000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);

// Тест 3 (п. 10.6): 7 000 стаканов 350 мл (промежуточный тираж)
const price7000 = findTierPrice(7000, tiersCup350);
const calc7000 = calculateItemTotal({ quantity: 7000, unitPrice: price7000! });
console.log(`Тест 10.6 (7 000 шт): Цена = ${price7000} ₸ (ожидается 35 ₸), Сумма = ${calc7000.subtotal} ₸ (ожидается 245 000 ₸) -> ${price7000 === 35 && calc7000.subtotal === 245000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);

// Тест 4 (п. 10.7): Доплаты
const chargeBottom = calculateChargeTotal({ chargeType: 'per_unit', unitPrice: 2, itemQuantity: 7000 });
const chargeCliche = calculateChargeTotal({ chargeType: 'one_time_fixed', unitPrice: 15000, chargeQuantity: 1 });
const chargeColor = calculateChargeTotal({ chargeType: 'per_color_unit', unitPrice: 1.5, itemQuantity: 7000, chargeQuantity: 2 });

console.log(`Тест 10.7 (Усиленное дно 2 ₸ * 7000): ${chargeBottom} ₸ (ожидается 14 000 ₸) -> ${chargeBottom === 14000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);
console.log(`Тест 10.7 (Клише разово): ${chargeCliche} ₸ (ожидается 15 000 ₸) -> ${chargeCliche === 15000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);
console.log(`Тест 10.7 (2 доп. цвета * 1.5 ₸ * 7000): ${chargeColor} ₸ (ожидается 21 000 ₸) -> ${chargeColor === 21000 ? '✅ ПРОЙДЕН' : '❌ ОШИБКА'}`);
