import { describe, expect, test } from 'vitest';
import {
    allowedSizeUnits,
    baseQuantity,
    formatBaseQuantity,
    formatQuantity,
    formatUnitPrice,
} from '../../Pages/Preus/Partials/priceUnits';

describe('priceUnits', () => {
    test('allows every unit until the product has one, then only compatible ones', () => {
        expect(allowedSizeUnits(null)).toEqual(['g', 'kg', 'ml', 'l', 'u']);
        expect(allowedSizeUnits('kg')).toEqual(['g', 'kg']);
        expect(allowedSizeUnits('l')).toEqual(['ml', 'l']);
        expect(allowedSizeUnits('u')).toEqual(['u']);
    });

    test('works out the total quantity in kg, l or u', () => {
        expect(baseQuantity(6, 1.5, 'l')).toBe(9);
        expect(baseQuantity(4, 125, 'g')).toBe(0.5);
        expect(baseQuantity('1', '330', 'ml')).toBeCloseTo(0.33);
        expect(baseQuantity(1, 12, 'u')).toBe(12);
    });

    test('returns null when the quantity cannot be worked out', () => {
        expect(baseQuantity(1, '', 'l')).toBeNull();
        expect(baseQuantity(0, 1, 'l')).toBeNull();
        expect(baseQuantity(1, 1, '')).toBeNull();
    });

    test('formats the quantity as typed, hiding "1 ×"', () => {
        expect(formatQuantity(6, 1.5, 'l')).toBe('6 × 1,5 l');
        expect(formatQuantity(1, 500, 'g')).toBe('500 g');
    });

    test('formats the base quantity and the price per unit', () => {
        expect(formatBaseQuantity(9, 'l')).toBe('9 l');
        expect(formatBaseQuantity(0.5, 'kg')).toBe('0,5 kg');
        expect(formatUnitPrice(4, 'kg')).toMatch(/^4,00\s€\/kg$/);
        // Below 10 cents, three decimals so cheap products still differ.
        expect(formatUnitPrice(0.1333, 'l')).toMatch(/^0,13\s€\/l$/);
        expect(formatUnitPrice(0.0567, 'l')).toMatch(/^0,057\s€\/l$/);
    });
});
