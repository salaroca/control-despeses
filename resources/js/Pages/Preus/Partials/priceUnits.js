// Units a size can be typed in, with the unit the product compares by and the factor to convert
// to it. Must match Price::SIZE_UNITS on the server.
export const SIZE_UNITS = {
    g: { unit: 'kg', factor: 0.001 },
    kg: { unit: 'kg', factor: 1 },
    ml: { unit: 'l', factor: 0.001 },
    l: { unit: 'l', factor: 1 },
    u: { unit: 'u', factor: 1 },
};

// Size units allowed for a product: all of them until it has a unit, then only compatible ones.
export function allowedSizeUnits(productUnit) {
    const unitList = Object.keys(SIZE_UNITS);

    return productUnit ? unitList.filter((sizeUnit) => SIZE_UNITS[sizeUnit].unit === productUnit) : unitList;
}

// Total quantity in kg, l or u: 6 × 1.5 l → 9, 4 × 125 g → 0.5. Null when it cannot be worked out.
export function baseQuantity(packCount, size, sizeUnit) {
    const count = Number(packCount);
    const amount = Number(size);

    if (!SIZE_UNITS[sizeUnit] || !(count > 0) || !(amount > 0)) {
        return null;
    }

    return count * amount * SIZE_UNITS[sizeUnit].factor;
}

function formatNumber(value, maximumFractionDigits = 3) {
    return new Intl.NumberFormat('ca-ES', { maximumFractionDigits }).format(value);
}

// "6 × 1,5 l", or "1,5 l" for a single item.
export function formatQuantity(packCount, size, sizeUnit) {
    const single = `${formatNumber(Number(size))} ${sizeUnit}`;

    return Number(packCount) > 1 ? `${packCount} × ${single}` : single;
}

// "9 l", "0,5 kg", "12 u".
export function formatBaseQuantity(quantity, unit) {
    return `${formatNumber(quantity)} ${unit}`;
}

// "0,13 €/l". Three decimals below 10 cents, so very cheap units (water, salt) still differ.
export function formatUnitPrice(unitPrice, unit) {
    const digits = unitPrice < 0.1 ? 3 : 2;
    const amount = new Intl.NumberFormat('ca-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(unitPrice);

    return `${amount}/${unit}`;
}
