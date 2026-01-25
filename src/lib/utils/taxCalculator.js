/**
 * Calculate tax amount from subtotal
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxRate - Tax rate in percentage (e.g., 10 for 10%)
 * @returns {number} - Tax amount
 */
export function calculateTax(subtotal, taxRate) {
  if (!taxRate || taxRate <= 0) return 0;
  return (subtotal * taxRate) / 100;
}

/**
 * Calculate total including tax
 * @param {number} subtotal - The subtotal amount
 * @param {number} taxRate - Tax rate in percentage
 * @returns {number} - Total amount including tax
 */
export function calculateTotalWithTax(subtotal, taxRate) {
  const taxAmount = calculateTax(subtotal, taxRate);
  return subtotal + taxAmount;
}

/**
 * Format currency with locale
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (e.g., 'GHS', 'USD')
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currencyCode) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code
 * @returns {string} - Currency symbol
 */
export function getCurrencySymbol(currencyCode) {
  const currencies = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'KES': 'KSh',
    'GHS': 'GH₵',
    'ZAR': 'R',
  };
  return currencies[currencyCode] || currencyCode;
}