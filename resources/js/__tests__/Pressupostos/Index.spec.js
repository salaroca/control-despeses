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

let pageUrl = '/pressupostos';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { categoriesList, banksList }, url: pageUrl }),
    router: { post: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

beforeEach(() => {
    vi.clearAllMocks();
    pageUrl = '/pressupostos';
});

afterEach(() => {
    vi.restoreAllMocks();
});

function mountIndex(budgets = [], actuals = [], bankActuals = []) {
    return mount(Index, { props: { year: 2026, budgets, actuals, bankActuals } });
}

async function mountRealTab(budgets = [], actuals = [], bankActuals = []) {
    const wrapper = mountIndex(budgets, actuals, bankActuals);
    await wrapper.find('button[data-tab="real"]').trigger('click');

    return wrapper;
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

    test('shows the budget tab by default', () => {
        const wrapper = mountIndex();

        expect(wrapper.find('button[data-tab="budget"]').classes()).toContain('active');
        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(true);
        expect(wrapper.find('tr[data-actual-total-row]').exists()).toBe(false);
    });

    test('switching to the real tab shows the real expense instead of the budget inputs', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 45 }]);

        expect(wrapper.find('button[data-tab="real"]').classes()).toContain('active');
        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(false);

        const row = wrapper.find('tr[data-actual-subcategory-row="10"]');
        expect(row.find('td[data-month="3"]').text()).toContain('45,00');
        expect(row.find('td[data-month="4"]').text()).toBe('–');
    });

    test('opens the real tab when the URL asks for it, and keeps it in the year links', () => {
        pageUrl = '/pressupostos?year=2026&tab=real';
        const wrapper = mountIndex();

        expect(wrapper.find('button[data-tab="real"]').classes()).toContain('active');
        const links = wrapper.findAll('a');
        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2025&tab=real')).toBe(true);
    });

    test('real tab shows a subtotal per category and a general total row', async () => {
        const wrapper = await mountRealTab([], [
            { subcategory_id: 10, month: 3, total: 45 },
            { subcategory_id: 11, month: 3, total: 10 },
            { subcategory_id: 10, month: 4, total: 5 },
        ]);

        const categoryRow = wrapper.find('tr[data-actual-category-row="1"]');
        expect(categoryRow.find('td[data-month="3"]').text()).toContain('55,00');

        const totalRow = wrapper.find('tr[data-actual-total-row]');
        expect(totalRow.find('td[data-month="3"]').text()).toContain('55,00');
        expect(totalRow.find('td[data-month="4"]').text()).toContain('5,00');
        expect(totalRow.text()).toContain('60,00');
    });

    test('real tab colors a cell red or green against the budget, and leaves it plain without budget', async () => {
        const wrapper = await mountRealTab(
            [
                { subcategory_id: 10, month: 3, amount: '40.00' },
                { subcategory_id: 10, month: 4, amount: '40.00' },
            ],
            [
                { subcategory_id: 10, month: 3, total: 45 },
                { subcategory_id: 10, month: 4, total: 30 },
                { subcategory_id: 10, month: 5, total: 30 },
            ],
        );

        const row = wrapper.find('tr[data-actual-subcategory-row="10"]');
        expect(row.find('td[data-month="3"]').classes()).toContain('table-danger');
        expect(row.find('td[data-month="4"]').classes()).toContain('table-success');
        expect(row.find('td[data-month="5"]').classes()).not.toContain('table-success');
        expect(row.find('td[data-month="5"]').classes()).not.toContain('table-danger');
    });

    test('real tab shows the real expense per bank, with "Sense banc" and a total', async () => {
        const wrapper = await mountRealTab(
            [],
            [{ subcategory_id: 10, month: 3, total: 62 }],
            [
                { bank_id: 100, month: 3, total: 50 },
                { bank_id: null, month: 3, total: 12 },
            ],
        );

        expect(wrapper.find('tr[data-actual-bank-row="100"] td[data-month="3"]').text()).toContain('50,00');
        expect(wrapper.find('tr[data-actual-bank-row="none"] td[data-month="3"]').text()).toContain('12,00');
        expect(wrapper.find('tr[data-actual-bank-row="total"] td[data-month="3"]').text()).toContain('62,00');
    });
});
