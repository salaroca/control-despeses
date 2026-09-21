import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Pressupostos/Index.vue';

const categoriesList = [
    {
        id: 1,
        name: 'Subministres',
        subcategories: [
            { id: 10, name: 'Electricitat', category_id: 1, bank_id: 100 },
            { id: 11, name: 'Aigua', category_id: 1, bank_id: null },
        ],
    },
];

const banksList = [{ id: 100, name: 'Banc A' }];

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { categoriesList, banksList }, url: '/pressupostos' }),
    router: { post: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

function mountIndex(budgets = [], actuals = []) {
    return mount(Index, { props: { year: 2026, budgets, actuals } });
}

describe('Pressupostos/Index', () => {
    test('renders a cell per subcategory and month with the saved amount', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.00' }]);

        const marchInput = wrapper.find('input[aria-label="Electricitat - Mar"]');

        expect(marchInput.element.value).toBe('60.00');
    });

    test('shows a subtotal row per category, summing its subcategories', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 3, amount: '60.00' },
            { subcategory_id: 11, month: 3, amount: '15.00' },
        ]);

        const categoryRow = wrapper.find('tr[data-category-row="1"]');

        expect(categoryRow.text()).toContain('Subministres');
        expect(categoryRow.find('td[data-month="3"]').text()).toContain('75,00');
    });

    test('shows the yearly total for a subcategory', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 1, amount: '10.00' },
            { subcategory_id: 10, month: 2, amount: '20.00' },
        ]);

        expect(wrapper.text()).toContain('30,00');
    });

    test('saves the amount when a cell loses focus', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mountIndex();

        const input = wrapper.find('input[aria-label="Electricitat - Gen"]');
        await input.setValue('45');
        await input.trigger('blur');

        expect(router.post).toHaveBeenCalledWith(
            '/pressupostos',
            { subcategory_id: 10, year: 2026, month: 1, amount: 45 },
            expect.objectContaining({ preserveState: true }),
        );
    });

    test('clearing a cell sends a null amount to delete it', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mountIndex([{ subcategory_id: 10, month: 1, amount: '45.00' }]);

        const input = wrapper.find('input[aria-label="Electricitat - Gen"]');
        await input.setValue('');
        await input.trigger('blur');

        expect(router.post).toHaveBeenCalledWith(
            '/pressupostos',
            { subcategory_id: 10, year: 2026, month: 1, amount: null },
            expect.objectContaining({ preserveState: true }),
        );
    });

    test('marks a cell green when spending stayed at or under budget', () => {
        const wrapper = mountIndex(
            [{ subcategory_id: 10, month: 3, amount: '60.00' }],
            [{ subcategory_id: 10, month: 3, total: 60 }],
        );

        const cell = wrapper.find('input[aria-label="Electricitat - Mar"]').element.closest('td');
        expect(cell.className).toContain('table-success');
    });

    test('marks a cell red when spending went over budget', () => {
        const wrapper = mountIndex(
            [{ subcategory_id: 10, month: 3, amount: '60.00' }],
            [{ subcategory_id: 10, month: 3, total: 75 }],
        );

        const cell = wrapper.find('input[aria-label="Electricitat - Mar"]').element.closest('td');
        expect(cell.className).toContain('table-danger');
    });

    test('does not color a cell with no budget entered', () => {
        const wrapper = mountIndex([], [{ subcategory_id: 10, month: 3, total: 75 }]);

        const cell = wrapper.find('input[aria-label="Electricitat - Mar"]').element.closest('td');
        expect(cell.className).not.toContain('table-success');
        expect(cell.className).not.toContain('table-danger');
    });

    test('shows the real expense as a tooltip on the cell', () => {
        const wrapper = mountIndex(
            [{ subcategory_id: 10, month: 3, amount: '60.00' }],
            [{ subcategory_id: 10, month: 3, total: 45 }],
        );

        const cell = wrapper.find('input[aria-label="Electricitat - Mar"]').element.closest('td');
        const expected = new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(45);
        expect(cell.querySelector('.budget-tooltip').textContent).toBe(`Despesa real: ${expected}`);
    });

    test('shows a fallback tooltip when there is no real expense yet', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.00' }]);

        const cell = wrapper.find('input[aria-label="Electricitat - Mar"]').element.closest('td');
        expect(cell.querySelector('.budget-tooltip').textContent).toBe('Despesa real: cap');
    });

    test('shows links to the previous and next year', () => {
        const wrapper = mountIndex();
        const links = wrapper.findAll('a');

        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2025')).toBe(true);
        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2027')).toBe(true);
    });

    test('sums the subcategory budgets of the same bank into the bank total row', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.00' }]);

        const bankRow = wrapper.find('tr[data-bank-row="100"]');

        expect(bankRow.text()).toContain('Banc A');
        expect(bankRow.find('td[data-month="3"]').text()).toContain('60,00');
    });

    test('groups subcategories without a bank under "Sense banc"', () => {
        const wrapper = mountIndex([{ subcategory_id: 11, month: 3, amount: '15.00' }]);

        const noneRow = wrapper.find('tr[data-bank-row="none"]');

        expect(noneRow.text()).toContain('Sense banc');
        expect(noneRow.find('td[data-month="3"]').text()).toContain('15,00');
    });

    test('shows a total row summing every bank for each month and the year', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 3, amount: '60.00' },
            { subcategory_id: 11, month: 3, amount: '15.00' },
            { subcategory_id: 10, month: 4, amount: '20.00' },
        ]);

        const totalRow = wrapper.find('tr[data-bank-row="total"]');

        expect(totalRow.find('td[data-month="3"]').text()).toContain('75,00');
        expect(totalRow.find('td[data-month="4"]').text()).toContain('20,00');
        expect(totalRow.text()).toContain('95,00');
    });
});
