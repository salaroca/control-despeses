import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Pressupostos/Index.vue';
import CategoryMonthlyChart from '../../Pages/Pressupostos/Partials/CategoryMonthlyChart.vue';

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

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

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
    vi.useRealTimers();
});

// The real average depends on today's date, so tests pin "today" explicitly.
function setToday(isoDate) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(isoDate));
}

function mountIndex(budgets = [], actuals = [], bankActuals = []) {
    return mount(Index, { props: { year: 2026, budgets, actuals, bankActuals } });
}

// Opens the Real tab with every category unfolded, unless isExpanded is false.
async function mountRealTab(budgets = [], actuals = [], bankActuals = [], isExpanded = true) {
    const wrapper = mountIndex(budgets, actuals, bankActuals);
    await wrapper.find('button[data-tab="real"]').trigger('click');

    if (isExpanded) {
        await wrapper.find('button[data-expand-all]').trigger('click');
    }

    return wrapper;
}

describe('Pressupostos/Index', () => {
    test('renders a cell per subcategory and month with the saved amount', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.00' }]);

        const marchInput = wrapper.find('input[aria-label="Electricitat - Mar"]');

        // Saved as "60.00", shown without trailing zeros.
        expect(marchInput.element.value).toBe('60');
    });

    test('shows a subtotal row per category, summing its subcategories', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 3, amount: '60.00' },
            { subcategory_id: 11, month: 3, amount: '15.00' },
        ]);

        const categoryRow = wrapper.find('tr[data-category-row="1"]');

        expect(categoryRow.text()).toContain('Subministres');
        expect(categoryRow.find('td[data-month="3"]').text()).toBe('75');
    });

    test('shows the yearly total for a subcategory', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 1, amount: '10.00' },
            { subcategory_id: 10, month: 2, amount: '20.00' },
        ]);

        expect(wrapper.find('tr[data-budget-subcategory-row="10"]').text()).toContain('30');
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

    test('leaves a cell plain when spending stayed at or under budget', () => {
        const wrapper = mountIndex(
            [{ subcategory_id: 10, month: 3, amount: '60.00' }],
            [{ subcategory_id: 10, month: 3, total: 60 }],
        );

        const input = wrapper.find('input[aria-label="Electricitat - Mar"]');
        expect(input.classes()).not.toContain('text-danger');
        expect(input.element.closest('td').hasAttribute('data-over-budget')).toBe(false);
    });

    test('shows the amount in red when spending went over budget', () => {
        const wrapper = mountIndex(
            [{ subcategory_id: 10, month: 3, amount: '60.00' }],
            [{ subcategory_id: 10, month: 3, total: 75 }],
        );

        const input = wrapper.find('input[aria-label="Electricitat - Mar"]');
        expect(input.classes()).toContain('text-danger');
        expect(input.element.closest('td').hasAttribute('data-over-budget')).toBe(true);
    });

    test('does not color a cell with no budget entered', () => {
        const wrapper = mountIndex([], [{ subcategory_id: 10, month: 3, total: 75 }]);

        expect(wrapper.find('input[aria-label="Electricitat - Mar"]').classes()).not.toContain('text-danger');
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
        expect(bankRow.find('td[data-month="3"]').text()).toBe('60');
    });

    test('groups subcategories without a bank under "Sense banc"', () => {
        const wrapper = mountIndex([{ subcategory_id: 11, month: 3, amount: '15.00' }]);

        const noneRow = wrapper.find('tr[data-bank-row="none"]');

        expect(noneRow.text()).toContain('Sense banc');
        expect(noneRow.find('td[data-month="3"]').text()).toBe('15');
    });

    test('shows a total row summing every bank for each month and the year', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 3, amount: '60.00' },
            { subcategory_id: 11, month: 3, amount: '15.00' },
            { subcategory_id: 10, month: 4, amount: '20.00' },
        ]);

        const totalRow = wrapper.find('tr[data-bank-row="total"]');

        expect(totalRow.find('td[data-month="3"]').text()).toBe('75');
        expect(totalRow.find('td[data-month="4"]').text()).toBe('20');
        expect(totalRow.text()).toContain('95');
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
        expect(row.find('td[data-month="3"]').text()).toBe('45');
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
        expect(categoryRow.find('td[data-month="3"]').text()).toBe('55');

        const totalRow = wrapper.find('tr[data-actual-total-row]');
        expect(totalRow.find('td[data-month="3"]').text()).toBe('55');
        expect(totalRow.find('td[data-month="4"]').text()).toBe('5');
        expect(totalRow.text()).toContain('60');
    });

    test('real tab marks in red, without arrow, the months over budget, and leaves the rest plain', async () => {
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
        const overBudget = row.find('td[data-month="3"] [data-over-budget]');
        expect(overBudget.exists()).toBe(true);
        expect(overBudget.classes()).toContain('text-danger');
        expect(overBudget.text()).toContain('45');
        expect(overBudget.text()).not.toContain('▲');
        expect(overBudget.text()).toContain('per sobre del pressupost');
        expect(row.find('td[data-month="4"] [data-over-budget]').exists()).toBe(false);
        expect(row.find('td[data-month="4"]').text()).toBe('30');
        expect(row.find('td[data-month="5"] [data-over-budget]').exists()).toBe(false);
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

        expect(wrapper.find('tr[data-actual-bank-row="100"] td[data-month="3"]').text()).toBe('50');
        expect(wrapper.find('tr[data-actual-bank-row="none"] td[data-month="3"]').text()).toBe('12');
        expect(wrapper.find('tr[data-actual-bank-row="total"] td[data-month="3"]').text()).toBe('62');
    });

    test('charts tab shows one chart per category with its monthly budget and real totals', async () => {
        const wrapper = mountIndex(
            [
                { subcategory_id: 10, month: 3, amount: '60.00' },
                { subcategory_id: 11, month: 3, amount: '15.00' },
            ],
            [{ subcategory_id: 10, month: 3, total: 45 }],
        );
        await wrapper.find('button[data-tab="charts"]').trigger('click');

        expect(wrapper.find('button[data-tab="charts"]').classes()).toContain('active');
        expect(wrapper.find('div[data-chart-category="1"]').text()).toContain('Subministres');

        const chart = wrapper.findComponent(CategoryMonthlyChart);
        expect(chart.props('budgetData')[2]).toBe(75);
        expect(chart.props('actualData')[2]).toBe(45);
        expect(chart.props('actualData')[3]).toBe(0);
    });

    test('keeps the charts tab in the year links', () => {
        pageUrl = '/pressupostos?year=2026&tab=charts';
        const wrapper = mountIndex();

        expect(wrapper.find('button[data-tab="charts"]').classes()).toContain('active');
        const links = wrapper.findAll('a');
        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2027&tab=charts')).toBe(true);
    });

    test('budget tab shows the monthly average (year total ÷ 12) next to each yearly total', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 1, amount: '100.00' },
            { subcategory_id: 10, month: 2, amount: '20.00' },
        ]);

        const categoryRow = wrapper.find('tr[data-category-row="1"]');
        expect(categoryRow.find('td[data-average]').text()).toBe('10');
        expect(wrapper.find('tr[data-bank-row="total"] td[data-average]').text()).toBe('10');
    });

    test('real tab averages over the months already reached this year, current month included', async () => {
        setToday('2026-04-15');
        const wrapper = await mountRealTab(
            [],
            [
                { subcategory_id: 10, month: 3, total: 30 },
                { subcategory_id: 10, month: 4, total: 6 },
            ],
            [{ bank_id: 100, month: 3, total: 24 }],
        );

        // Year 2026, today April → ÷ 4.
        expect(wrapper.find('tr[data-actual-subcategory-row="10"] td[data-average]').text()).toBe('9');
        expect(wrapper.find('tr[data-actual-total-row] td[data-average]').text()).toBe('9');
        expect(wrapper.find('tr[data-actual-bank-row="100"] td[data-average]').text()).toBe('6');
    });

    test('real tab averages over all 12 months for a past year', async () => {
        setToday('2027-02-01');
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 36 }]);

        expect(wrapper.find('tr[data-actual-subcategory-row="10"] td[data-average]').text()).toBe('3');
    });

    test('real tab average is 0 for a future year', async () => {
        setToday('2025-06-01');
        const wrapper = await mountRealTab();

        expect(wrapper.find('tr[data-actual-total-row] td[data-average]').text()).toBe('0');
    });

    test('budget average stays ÷ 12 even in the current year', () => {
        setToday('2026-04-15');
        const wrapper = mountIndex([{ subcategory_id: 10, month: 1, amount: '120.00' }]);

        expect(wrapper.find('tr[data-category-row="1"] td[data-average]').text()).toContain('10');
    });

    test('charts tab passes the months already reached to each chart for the real average', async () => {
        setToday('2026-04-15');
        const wrapper = mountIndex();
        await wrapper.find('button[data-tab="charts"]').trigger('click');

        expect(wrapper.findComponent(CategoryMonthlyChart).props('actualMonths')).toBe(4);
    });

    test('marks every monthly average cell and header with the highlighted column class', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 1, amount: '12.00' }]);

        const averageCells = wrapper.findAll('td[data-average]');
        expect(averageCells.length).toBeGreaterThan(0);
        averageCells.forEach((cell) => expect(cell.classes()).toContain('average-col'));

        const header = wrapper.findAll('th').find((th) => th.text() === 'Mitjana/mes');
        expect(header.classes()).toContain('average-col');
    });

    test('real tab starts with the categories folded and opens one when clicked', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 45 }], [], false);

        expect(wrapper.find('tr[data-actual-category-row="1"]').exists()).toBe(true);
        expect(wrapper.find('tr[data-actual-subcategory-row="10"]').exists()).toBe(false);

        const toggle = wrapper.find('button[data-toggle-category="1"]');
        expect(toggle.attributes('aria-expanded')).toBe('false');
        await toggle.trigger('click');

        expect(toggle.attributes('aria-expanded')).toBe('true');
        expect(wrapper.find('tr[data-actual-subcategory-row="10"]').exists()).toBe(true);

        await wrapper.find('button[data-collapse-all]').trigger('click');
        expect(wrapper.find('tr[data-actual-subcategory-row="10"]').exists()).toBe(false);
    });

    test('real tab hides the subcategories and categories without any expense in the year', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 45 }]);

        expect(wrapper.find('tr[data-actual-subcategory-row="10"]').exists()).toBe(true);
        expect(wrapper.find('tr[data-actual-subcategory-row="11"]').exists()).toBe(false);
    });

    test('real tab shows an empty message when the year has no expenses', async () => {
        const wrapper = await mountRealTab();

        expect(wrapper.find('tr[data-actual-category-row="1"]').exists()).toBe(false);
        expect(wrapper.text()).toContain('Encara no hi ha despeses aquest any.');
    });

    test('real tab highlights the current month column only for the current year', async () => {
        setToday('2026-10-19');
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 10, total: 5 }]);

        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-month="10"]').classes()).toContain('current-month');
        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-month="9"]').classes()).not.toContain('current-month');
        expect(wrapper.find('tr[data-actual-bank-row="total"] td[data-month="10"]').classes()).toContain('current-month');
    });

    test('real tab does not highlight any month for another year', async () => {
        setToday('2027-10-19');
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 10, total: 5 }]);

        expect(wrapper.findAll('.current-month')).toHaveLength(0);
    });

    test('real tab marks in red the monthly averages that go over the budget of the same months', async () => {
        setToday('2026-04-15');
        // Budgets from January to April: Electricitat 10/month (40), Aigua 20/month (80).
        const budgets = [1, 2, 3, 4].flatMap((month) => [
            { subcategory_id: 10, month, amount: '10.00' },
            { subcategory_id: 11, month, amount: '20.00' },
        ]);
        const wrapper = await mountRealTab(budgets, [
            { subcategory_id: 10, month: 2, total: 60 },
            { subcategory_id: 11, month: 2, total: 40 },
        ]);

        // Electricitat: 60 spent against 40 budgeted → average 15, over.
        const electricitat = wrapper.find('tr[data-actual-subcategory-row="10"] td[data-average]');
        expect(electricitat.find('[data-over-budget]').exists()).toBe(true);
        expect(electricitat.text()).toContain('▲ 15');

        // Aigua: 40 spent against 80 budgeted → average 10, under.
        const aigua = wrapper.find('tr[data-actual-subcategory-row="11"] td[data-average]');
        expect(aigua.find('[data-over-budget]').exists()).toBe(false);
        expect(aigua.text()).toBe('10');

        // Category and total: 100 spent against 120 budgeted → under.
        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-average] [data-over-budget]').exists()).toBe(false);
        expect(wrapper.find('tr[data-actual-total-row] td[data-average] [data-over-budget]').exists()).toBe(false);
    });

    test('a yearly bill paid as budgeted early in the year is not flagged', async () => {
        setToday('2026-10-19');
        const wrapper = await mountRealTab(
            [{ subcategory_id: 10, month: 1, amount: '462.00' }],
            [{ subcategory_id: 10, month: 1, total: 462 }],
        );

        expect(wrapper.findAll('td[data-average] [data-over-budget]')).toHaveLength(0);
    });

    test('budget months after the current one do not count yet', async () => {
        setToday('2026-04-15');
        // Only December has budget: nothing budgeted so far, so it is not judged.
        const wrapper = await mountRealTab(
            [{ subcategory_id: 10, month: 12, amount: '100.00' }],
            [{ subcategory_id: 10, month: 2, total: 60 }],
        );

        expect(wrapper.findAll('td[data-average] [data-over-budget]')).toHaveLength(0);
    });

    test('real tab does not judge the average of a row without budget', async () => {
        setToday('2026-04-15');
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 2, total: 60 }]);

        expect(wrapper.findAll('td[data-average] [data-over-budget]')).toHaveLength(0);
    });

    test('a category average counts the budget of its subcategories without expenses', async () => {
        setToday('2026-04-15');
        // Only Electricitat has expenses (40, no budget of its own), but Aigua's 60 budgeted from
        // January to April belongs to the category, so the category is under budget.
        const wrapper = await mountRealTab(
            [{ subcategory_id: 11, month: 1, amount: '60.00' }],
            [{ subcategory_id: 10, month: 2, total: 40 }],
        );

        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-average]').text()).toBe('10');
        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-average] [data-over-budget]').exists()).toBe(false);
    });

    test('real tab does not flag amounts that are over budget only by cents', async () => {
        setToday('2026-04-15');
        const budgets = [1, 2, 3, 4].map((month) => ({ subcategory_id: 10, month, amount: '53.00' }));
        const wrapper = await mountRealTab(budgets, [
            { subcategory_id: 10, month: 1, total: 53 },
            { subcategory_id: 10, month: 2, total: 53.15 },
            { subcategory_id: 10, month: 3, total: 53 },
            { subcategory_id: 10, month: 4, total: 53 },
        ]);

        const row = wrapper.find('tr[data-actual-subcategory-row="10"]');
        expect(row.find('td[data-month="2"]').text()).toBe('53');
        expect(row.find('[data-over-budget]').exists()).toBe(false);
    });

    test('real tab flags a month as soon as the whole-euro figure is above the budget', async () => {
        const wrapper = await mountRealTab(
            [{ subcategory_id: 10, month: 3, amount: '53.00' }],
            [{ subcategory_id: 10, month: 3, total: 54.2 }],
        );

        expect(wrapper.find('tr[data-actual-subcategory-row="10"] td[data-month="3"] [data-over-budget]').text()).toContain('54');
    });

    test('real tab shades every other month column so each one is easy to follow', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 5 }]);

        const row = wrapper.find('tr[data-actual-category-row="1"]');
        expect(row.find('td[data-month="1"]').classes()).not.toContain('alt-month');
        expect(row.find('td[data-month="2"]').classes()).toContain('alt-month');
        expect(row.find('td[data-month="3"]').classes()).not.toContain('alt-month');
        expect(wrapper.find('tr[data-actual-subcategory-row="10"] td[data-month="2"]').classes()).toContain('alt-month');
        expect(wrapper.find('tr[data-actual-bank-row="total"] td[data-month="12"]').classes()).toContain('alt-month');
    });



    test('real tab shows in red, without arrow, the totals already over the budget of the whole year', async () => {
        setToday('2026-04-15');
        // Electricitat: 130 spent against 120 for the whole year → red. Aigua: 40 against 240 → plain.
        const wrapper = await mountRealTab(
            [
                { subcategory_id: 10, month: 1, amount: '120.00' },
                { subcategory_id: 11, month: 1, amount: '240.00' },
            ],
            [
                { subcategory_id: 10, month: 2, total: 130 },
                { subcategory_id: 11, month: 2, total: 40 },
            ],
        );

        const electricitat = wrapper.find('tr[data-actual-subcategory-row="10"] td[data-total]');
        expect(electricitat.classes()).toContain('text-danger');
        expect(electricitat.text()).not.toContain('▲');
        expect(electricitat.text()).toContain('130');

        expect(wrapper.find('tr[data-actual-subcategory-row="11"] td[data-total]').classes()).not.toContain('text-danger');
        // Category and general total: 170 against 360 → plain.
        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-total]').classes()).not.toContain('text-danger');
        expect(wrapper.find('tr[data-actual-total-row] td[data-total]').classes()).not.toContain('text-danger');
    });

    test('real tab leaves the total plain for rows without budget', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 2, total: 130 }]);

        expect(wrapper.findAll('td[data-total].text-danger')).toHaveLength(0);
    });

    test('real tab flags month by month the categories and the total over that month budget, even folded', async () => {
        // March: budget 40 + 20 = 60, real 50 + 30 = 80 → over. April: budget 60, real 50 → plain.
        const wrapper = await mountRealTab(
            [
                { subcategory_id: 10, month: 3, amount: '40.00' },
                { subcategory_id: 11, month: 3, amount: '20.00' },
                { subcategory_id: 10, month: 4, amount: '60.00' },
            ],
            [
                { subcategory_id: 10, month: 3, total: 50 },
                { subcategory_id: 11, month: 3, total: 30 },
                { subcategory_id: 10, month: 4, total: 50 },
            ],
            [],
            false,
        );

        const categoryRow = wrapper.find('tr[data-actual-category-row="1"]');
        expect(categoryRow.find('td[data-month="3"] [data-over-budget]').text()).toContain('80');
        expect(categoryRow.find('td[data-month="3"]').text()).not.toContain('▲');
        expect(categoryRow.find('td[data-month="4"] [data-over-budget]').exists()).toBe(false);
        expect(categoryRow.find('td[data-month="4"]').text()).toBe('50');

        const totalRow = wrapper.find('tr[data-actual-total-row]');
        expect(totalRow.find('td[data-month="3"] [data-over-budget]').exists()).toBe(true);
        expect(totalRow.find('td[data-month="4"] [data-over-budget]').exists()).toBe(false);
    });

    test('real tab does not flag a category month without budget', async () => {
        const wrapper = await mountRealTab([], [{ subcategory_id: 10, month: 3, total: 50 }], [], false);

        expect(wrapper.find('tr[data-actual-category-row="1"] td[data-month="3"] [data-over-budget]').exists()).toBe(false);
    });

    test('budget tab starts with every category open, and each one can be folded', async () => {
        const wrapper = mountIndex();

        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(true);

        const toggle = wrapper.find('button[data-budget-toggle-category="1"]');
        expect(toggle.attributes('aria-expanded')).toBe('true');
        await toggle.trigger('click');

        expect(toggle.attributes('aria-expanded')).toBe('false');
        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(false);
        // The category subtotal row stays visible.
        expect(wrapper.find('tr[data-category-row="1"]').exists()).toBe(true);

        await wrapper.find('button[data-budget-expand-all]').trigger('click');
        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(true);

        await wrapper.find('button[data-budget-collapse-all]').trigger('click');
        expect(wrapper.find('input[aria-label="Electricitat - Gen"]').exists()).toBe(false);
    });

    test('budget tab shades every other month and highlights the current one', () => {
        setToday('2026-10-19');
        const wrapper = mountIndex();

        const categoryRow = wrapper.find('tr[data-category-row="1"]');
        expect(categoryRow.find('td[data-month="2"]').classes()).toContain('alt-month');
        expect(categoryRow.find('td[data-month="3"]').classes()).not.toContain('alt-month');
        expect(categoryRow.find('td[data-month="10"]').classes()).toContain('current-month');
        expect(wrapper.find('tr[data-budget-subcategory-row="10"] td[data-month="10"]').classes()).toContain('current-month');
    });

    test('budget inputs show decimals when the saved amount has cents', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.50' }]);

        expect(wrapper.find('input[aria-label="Electricitat - Mar"]').element.value).toBe('60.5');
    });
});
