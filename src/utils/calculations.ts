import { CartItem } from '../modules/pos/types/cart';
import { DiscountType } from '../modules/pos/components/TransactionSummary/types';

const VAT_RATE = 0.12;

interface Totals {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  vat: number;
  total: number;
  items: CartItem[];
}

export const getDiscountRate = (discountType: DiscountType, customValue?: number): number => {
  switch (discountType) {
    case 'Senior':
    case 'PWD':
      return 0.20;
    case 'Employee':
      return 0.10;
    case 'Custom':
      return (customValue || 0) / 100;
    default:
      return 0;
  }
};

// Calculate subtotal before any discounts
export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Calculate discount for a single item
const calculateItemDiscount = (price: number, quantity: number, discountType: DiscountType, customValue?: number): number => {
  const subtotal = price * quantity;
  let discountPercentage = 0;

  switch (discountType) {
    case 'Senior':
    case 'PWD':
      discountPercentage = 0.20; // 20% discount
      break;
    case 'Employee':
      discountPercentage = 0.10; // 10% discount
      break;
    case 'Custom':
      if (customValue && customValue > 0) {
        discountPercentage = customValue / 100;
      }
      break;
    default:
      return 0;
  }

  return subtotal * discountPercentage;
};

// Calculate total discount amount for all items
export const calculateDiscount = (items: CartItem[], discountType: DiscountType, customValue?: number): number => {
  return items.reduce((total, item) => {
    return total + calculateItemDiscount(item.price, item.quantity, discountType, customValue);
  }, 0);
};

// Calculate VAT on the discounted amount
export const calculateVAT = (discountedAmount: number): number => {
  return discountedAmount * VAT_RATE;
};

// Calculate all totals
export const calculateTotals = (
  items: CartItem[],
  discountType: DiscountType,
  customValue?: number
): Totals => {
  const itemsWithDiscounts = items.map(item => ({
    ...item,
    discount: calculateItemDiscount(item.price, item.quantity, discountType, customValue)
  }));

  const subtotal = itemsWithDiscounts.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  const discountAmount = itemsWithDiscounts.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );

  const discountedSubtotal = subtotal - discountAmount;
  const vat = discountedSubtotal * VAT_RATE;
  const total = discountedSubtotal + vat;

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    vat,
    total,
    items: itemsWithDiscounts
  };
};
