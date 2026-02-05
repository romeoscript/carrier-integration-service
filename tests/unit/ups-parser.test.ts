import { describe, it, expect } from 'vitest';
import {
  safeParseFloat,
  safeParseInt,
  parseUPSDate,
  extractMonetaryValue,
  extractCurrency,
} from '../../src/carriers/ups/ups-parser';
import { ValidationError } from '../../src/domain';

describe('UPS Parser Unit Tests', () => {
  describe('safeParseFloat', () => {
    it('should parse valid number strings', () => {
      expect(safeParseFloat('10.50', 'price')).toBe(10.5);
      expect(safeParseFloat('100', 'price')).toBe(100);
      expect(safeParseFloat('0.99', 'price')).toBe(0.99);
    });

    it('should throw on undefined', () => {
      expect(() => safeParseFloat(undefined, 'price')).toThrow(ValidationError);
      expect(() => safeParseFloat(undefined, 'price')).toThrow('price is missing');
    });

    it('should throw on invalid number strings', () => {
      expect(() => safeParseFloat('abc', 'price')).toThrow(ValidationError);
      expect(() => safeParseFloat('abc', 'price')).toThrow('not a valid number');
    });

    it('should throw on negative numbers', () => {
      expect(() => safeParseFloat('-10.50', 'price')).toThrow(ValidationError);
      expect(() => safeParseFloat('-10.50', 'price')).toThrow('cannot be negative');
    });

    it('should throw on NaN-producing inputs', () => {
      expect(() => safeParseFloat('', 'price')).toThrow(ValidationError);
      expect(() => safeParseFloat('  ', 'price')).toThrow(ValidationError);
    });
  });

  describe('safeParseInt', () => {
    it('should parse valid integer strings', () => {
      expect(safeParseInt('10', 'days')).toBe(10);
      expect(safeParseInt('0', 'days')).toBe(0);
      expect(safeParseInt('999', 'days')).toBe(999);
    });

    it('should throw on undefined', () => {
      expect(() => safeParseInt(undefined, 'days')).toThrow(ValidationError);
      expect(() => safeParseInt(undefined, 'days')).toThrow('days is missing');
    });

    it('should throw on invalid integer strings', () => {
      expect(() => safeParseInt('abc', 'days')).toThrow(ValidationError);
    });

    it('should throw on negative numbers', () => {
      expect(() => safeParseInt('-5', 'days')).toThrow(ValidationError);
    });
  });

  describe('parseUPSDate', () => {
    it('should parse valid YYYYMMDD dates', () => {
      expect(parseUPSDate('20240125', 'deliveryDate')).toBe('2024-01-25');
      expect(parseUPSDate('20231231', 'deliveryDate')).toBe('2023-12-31');
    });

    it('should throw on undefined', () => {
      expect(() => parseUPSDate(undefined, 'deliveryDate')).toThrow(ValidationError);
    });

    it('should throw on wrong length', () => {
      expect(() => parseUPSDate('2024125', 'deliveryDate')).toThrow(ValidationError);
      expect(() => parseUPSDate('202401255', 'deliveryDate')).toThrow(ValidationError);
    });

    it('should throw on invalid month', () => {
      expect(() => parseUPSDate('20241325', 'deliveryDate')).toThrow(ValidationError);
      expect(() => parseUPSDate('20240025', 'deliveryDate')).toThrow(ValidationError);
    });

    it('should throw on invalid day', () => {
      expect(() => parseUPSDate('20240132', 'deliveryDate')).toThrow(ValidationError);
      expect(() => parseUPSDate('20240100', 'deliveryDate')).toThrow(ValidationError);
    });

    it('should throw on non-numeric characters', () => {
      expect(() => parseUPSDate('2024ab25', 'deliveryDate')).toThrow(ValidationError);
    });
  });

  describe('extractMonetaryValue', () => {
    it('should extract negotiated rate when available', () => {
      const negotiated = { TotalCharge: { MonetaryValue: '10.50' } };
      const regular = { MonetaryValue: '12.00' };

      expect(extractMonetaryValue(negotiated, regular, 'charge')).toBe(10.5);
    });

    it('should fall back to regular rate when negotiated is missing', () => {
      const regular = { MonetaryValue: '12.00' };

      expect(extractMonetaryValue(undefined, regular, 'charge')).toBe(12.0);
    });

    it('should throw when both are missing', () => {
      expect(() => extractMonetaryValue(undefined, undefined, 'charge')).toThrow(ValidationError);
      expect(() => extractMonetaryValue(undefined, undefined, 'charge')).toThrow(
        'missing in both negotiated and regular charges'
      );
    });

    it('should throw on invalid negotiated value', () => {
      const negotiated = { TotalCharge: { MonetaryValue: 'invalid' } };
      const regular = { MonetaryValue: '12.00' };

      expect(() => extractMonetaryValue(negotiated, regular, 'charge')).toThrow(ValidationError);
    });
  });

  describe('extractCurrency', () => {
    it('should extract negotiated currency when available', () => {
      const negotiated = { TotalCharge: { CurrencyCode: 'USD' } };
      const regular = { CurrencyCode: 'EUR' };

      expect(extractCurrency(negotiated, regular)).toBe('USD');
    });

    it('should fall back to regular currency', () => {
      const regular = { CurrencyCode: 'EUR' };

      expect(extractCurrency(undefined, regular)).toBe('EUR');
    });

    it('should throw when both are missing', () => {
      expect(() => extractCurrency(undefined, undefined)).toThrow(ValidationError);
      expect(() => extractCurrency(undefined, undefined)).toThrow('Currency code is missing');
    });

    it('should throw on invalid currency code length', () => {
      const regular = { CurrencyCode: 'US' }; // Too short

      expect(() => extractCurrency(undefined, regular)).toThrow(ValidationError);
      expect(() => extractCurrency(undefined, regular)).toThrow('must be 3 characters');
    });
  });
});
