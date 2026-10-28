import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Comparativa from '../../Pages/Preus/Comparativa.vue';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/preus/comparativa' }),
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

function option(overrides) {
    return {
        price_id: 1,
        shop: 'Mercadona',
        brand: null,
        price: '1.00',
        pack_count: 1,
        size: '1.000',
        size_unit: 'l',
        date: '2026-10-21',
        base_unit: 'l',
        unit_price: 1,
        is_cheapest: false,
        difference: 0,
        ...overrides,
    };
}

const comparisonList = [
    {
        id: 1,
        name: 'Aigua',
        group: 'Beguda',
        unit: 'l',
        options: [
            option({ price_id: 11, brand: 'Hacendado', price: '1.20', pack_count: 6, size: '1.500', unit_price: 0.1333, is_cheapest: true }),
            option({ price_id: 12, shop: 'Bon Preu', brand: 'Font Vella', price: '2.85', pack_count: 6, size: '1.500', unit_price: 0.3167, difference: 1.375, date: '2026-05-01' }),
        ],
    },
    {
        id: 2,
        name: 'Brou pollastre',
        group: 'Líquid',
        unit: 'l',
        options: [
            option({ price_id: 21, shop: 'Bon Preu', unit_price: 2.3, is_cheapest: true }),
            option({ price_id: 22, unit_price: 2.31, difference: 0.0043 }),
        ],
    },
    {
        id: 3,
        name: 'CocaCola (llauna)',
        group: null,
        unit: 'u',
        options: [option({ price_id: 31, size_unit: 'u', base_unit: 'u', is_cheapest: true })],
    },
];

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Preus/Comparativa', () => {
    test('shows an empty state with a link to add prices', () => {
        const wrapper = mount(Comparativa, { props: { comparisonList: [] } });

        expect(wrapper.text()).toContain('Encara no hi ha preus per comparar.');
        expect(wrapper.find('a[href="/preus"]').exists()).toBe(true);
    });

    test('shows each product with its options, the cheapest marked with a check and in words', () => {
        const wrapper = mount(Comparativa, { props: { comparisonList } });

        const water = wrapper.find('[data-comparison-product="1"]');
        expect(water.text()).toContain('Beguda · per litre');

        const cheapest = water.find('[data-option="11"]');
        expect(cheapest.classes()).toContain('cheapest-option');
        expect(cheapest.text()).toContain('Mercadona · Hacendado');
        expect(cheapest.text()).toContain('6 × 1,5 l');
        expect(cheapest.find('[data-option-unit-price]').text()).toMatch(/0,13\s€\/l/);
        expect(cheapest.find('[data-option-cheapest]').text()).toBe('més barat');

        const other = water.find('[data-option="12"]');
        expect(other.classes()).not.toContain('cheapest-option');
        expect(other.find('[data-option-difference]').text()).toMatch(/\+137,5\s?%/);
    });

    test('greys out prices older than three months', () => {
        const wrapper = mount(Comparativa, { props: { comparisonList } });

        const oldDate = wrapper.find('[data-option="12"] [data-option-date]');
        expect(oldDate.classes()).toContain('old-price');
        expect(oldDate.attributes('title')).toContain('fa 173 dies');
        expect(wrapper.find('[data-option="11"] [data-option-date]').classes()).not.toContain('old-price');
    });

    test('summarises in how many products each shop is the cheapest', () => {
        const wrapper = mount(Comparativa, { props: { comparisonList } });

        expect(wrapper.find('[data-shop-summary="Mercadona"]').text()).toBe('Mercadona: 2');
        expect(wrapper.find('[data-shop-summary="Bon Preu"]').text()).toBe('Bon Preu: 1');
        const order = wrapper.findAll('[data-shop-summary]').map((badge) => badge.attributes('data-shop-summary'));
        expect(order).toEqual(['Mercadona', 'Bon Preu']);
    });

    test('filters by name and by group, updating the summary', async () => {
        const wrapper = mount(Comparativa, { props: { comparisonList } });

        await wrapper.find('input[aria-label="Cerca un article"]').setValue('brou');
        expect(wrapper.findAll('[data-comparison-product]')).toHaveLength(1);
        expect(wrapper.find('[data-shop-summary="Bon Preu"]').text()).toBe('Bon Preu: 1');
        expect(wrapper.find('[data-shop-summary="Mercadona"]').exists()).toBe(false);

        await wrapper.find('input[aria-label="Cerca un article"]').setValue('');
        await wrapper.find('select[aria-label="Filtra per grup"]').setValue('Sense grup');
        expect(wrapper.findAll('[data-comparison-product]')).toHaveLength(1);
        expect(wrapper.find('[data-comparison-product="3"]').exists()).toBe(true);
    });

    test('shows the prices tabs with "Comparativa" active', () => {
        const wrapper = mount(Comparativa, { props: { comparisonList } });

        expect(wrapper.find('a[data-prices-tab="/preus/comparativa"]').classes()).toContain('active');
    });
});
