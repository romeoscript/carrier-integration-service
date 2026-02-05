import { ValidationError } from '../../domain/errors';

/**
 * Safely parse a string to a float with validation
 * Throws ValidationError if the value is not a valid number
 */
export function safeParseFloat(value: string | undefined, fieldName: string): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is missing`);
  }

  const parsed = parseFloat(value);
  
  if (isNaN(parsed)) {
    throw new ValidationError(`${fieldName} is not a valid number: ${value}`);
  }

  if (parsed < 0) {
    throw new ValidationError(`${fieldName} cannot be negative: ${parsed}`);
  }

  return parsed;
}

/**
 * Safely parse a string to an integer with validation
 * Throws ValidationError if the value is not a valid integer
 */
export function safeParseInt(value: string | undefined, fieldName: string): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is missing`);
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new ValidationError(`${fieldName} is not a valid integer: ${value}`);
  }

  if (parsed < 0) {
    throw new ValidationError(`${fieldName} cannot be negative: ${parsed}`);
  }

  return parsed;
}

/**
 * Safely parse a UPS date string (YYYYMMDD) to ISO format
 * Throws ValidationError if the date format is invalid
 */
export function parseUPSDate(dateStr: string | undefined, fieldName: string): string {
  if (!dateStr) {
    throw new ValidationError(`${fieldName} is missing`);
  }

  if (dateStr.length !== 8) {
    throw new ValidationError(`${fieldName} must be 8 characters (YYYYMMDD): ${dateStr}`);
  }

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Validate date components
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
    throw new ValidationError(`${fieldName} contains non-numeric values: ${dateStr}`);
  }

  if (monthNum < 1 || monthNum > 12) {
    throw new ValidationError(`${fieldName} has invalid month: ${month}`);
  }

  if (dayNum < 1 || dayNum > 31) {
    throw new ValidationError(`${fieldName} has invalid day: ${day}`);
  }

  return `${year}-${month}-${day}`;
}

/**
 * Safely extract a monetary value from UPS response
 * Handles both regular and negotiated rates
 */
export function extractMonetaryValue(
  negotiated: { TotalCharge?: { MonetaryValue?: string } } | undefined,
  regular: { MonetaryValue?: string } | undefined,
  fieldName: string
): number {
  // Try negotiated rate first
  if (negotiated?.TotalCharge?.MonetaryValue) {
    return safeParseFloat(negotiated.TotalCharge.MonetaryValue, `${fieldName} (negotiated)`);
  }

  // Fall back to regular rate
  if (regular?.MonetaryValue) {
    return safeParseFloat(regular.MonetaryValue, fieldName);
  }

  throw new ValidationError(`${fieldName} is missing in both negotiated and regular charges`);
}

/**
 * Safely extract currency code
 */
export function extractCurrency(
  negotiated: { TotalCharge?: { CurrencyCode?: string } } | undefined,
  regular: { CurrencyCode?: string } | undefined
): string {
  const currency = negotiated?.TotalCharge?.CurrencyCode || regular?.CurrencyCode;
  
  if (!currency) {
    throw new ValidationError('Currency code is missing');
  }

  if (currency.length !== 3) {
    throw new ValidationError(`Currency code must be 3 characters: ${currency}`);
  }

  return currency;
}