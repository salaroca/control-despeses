import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Dashboard/Index.vue';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { categoriesList: [] }, url: '/dashboard' }),
    router: { get: vi.fn(), post: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
    Line: { props: ['data', 'options'], template: '<div class="line-stub" />' },
}));

function buildDeviationTrend() {
    // 12 months ending at 2026-03, deviation = index (0..11) for easy assertions.
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const years = [2025, 2025, 2025, 2025, 2025, 2025, 2025, 2025, 2025, 2026, 2026, 2026];

    return months.map((month, index) => ({ year: years[index], month, deviation: index }));
}

function baseProps(overrides = {}) {
    return {
        year: 2026,
        month: 3,
        monthlyTotal: 75,
        annualTotal: 75,
        monthlyBudget: 80,
        annualBudget: 80,
        byCategory: [{ name: 'Menjar', total: 50 }],
        bySubcategory: [{ name: 'Supermercats', total: 50 }],
        byBank: [{ name: 'Banc A', total: 50 }],
        deviationTrend: buildDeviationTrend(),
        yearComparison: {
            current: [30, 20, 75, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            previous: [40, 10, 60, 50, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        monthlyBudgets: [50, 50, 80, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        categoryComparison: [
            {
                name: 'Menjar',
                current: 125,
                previous: 110,
                subcategories: [
                    { name: 'Supermercats', current: 100, previous: 70 },
                    { name: 'Panaderia', current: 25, previous: 40 },
                ],
            },
        ],
        comparisonPeriod: { cutoffDay: null, current: 125, previous: 110 },
        yearlyTotals: [
            { year: 2025, spent: 1200, budgeted: 0, monthsCounted: 12, isCurrent: false },
            { year: 2026, spent: 300, budgeted: 900, monthsCounted: 3, isCurrent: true },
        ],
        ...overrides,
    };
}

describe('Dashboard/Index', () => {
    test('shows the monthly and annual totals', () => {
        const wrapper = mount(Index, { props: baseProps() });

        expect(wrapper.text()).toContain('75,00');
        expect(wrapper.text()).toContain('80,00');
    });

    test('shows a positive deviation as "good" (under budget)', () => {
        const wrapper = mount(Index, { props: baseProps({ monthlyTotal: 50, monthlyBudget: 80 }) });

        expect(wrapper.find('.text-success').exists()).toBe(true);
    });

    test('shows a negative deviation as "critical" (over budget)', () => {
        const wrapper = mount(Index, { props: baseProps({ monthlyTotal: 100, monthlyBudget: 80 }) });

        expect(wrapper.find('.text-danger').exists()).toBe(true);
    });

    test('navigates to the selected month', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, { props: baseProps() });

        await wrapper.find('input[type="month"]').setValue('2026-05');
        await wrapper.find('input[type="month"]').trigger('change');

        expect(router.get).toHaveBeenCalledWith('/dashboard', { year: 2026, month: 5 });
    });

    test('shows the last 3 months of deviation by default', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(Index, { props: baseProps() });

        const trendChart = wrapper.findComponent({ name: 'DeviationTrendChart' }).findComponent(Bar);
        expect(trendChart.props('data').datasets[0].data).toEqual([9, 10, 11]);
    });

    test('switches to the last 12 months when the "12m" button is clicked', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(Index, { props: baseProps() });

        await wrapper.findAll('button').find((button) => button.text() === '12m').trigger('click');

        const trendChart = wrapper.findComponent({ name: 'DeviationTrendChart' }).findComponent(Bar);
        expect(trendChart.props('data').datasets[0].data).toHaveLength(12);
    });

    test('shows the comparison with the previous year', () => {
        const wrapper = mount(Index, { props: baseProps() });

        expect(wrapper.find('section[data-section="comparison"]').text()).toContain('2026 vs. 2025');
        expect(wrapper.text()).toContain('Gen–Mar 2026');
    });

    test('shows the cumulative charts and the category difference against the previous year', async () => {
        const { Line } = await import('vue-chartjs');
        const wrapper = mount(Index, { props: baseProps() });

        expect(wrapper.find('section[data-section="year"]').text()).toContain('Despesa acumulada vs. pressupost');
        expect(wrapper.text()).toContain('Acumulat 2026 vs. 2025');
        expect(wrapper.text()).toContain('Diferència per categoria vs. 2025 (Gen–Mar)');

        const [budgetChart, yearChart] = wrapper.findAllComponents(Line);
        expect(budgetChart.props('data').datasets.map((dataset) => dataset.label)).toEqual(['Pressupost', 'Real']);
        // Real expense stops at the selected month (March); the budget covers the whole year.
        expect(budgetChart.props('data').datasets[1].data.slice(0, 4)).toEqual([30, 50, 125, null]);
        expect(budgetChart.props('data').datasets[0].data[11]).toBe(630);
        expect(yearChart.props('data').datasets.map((dataset) => dataset.label)).toEqual(['2025', '2026']);
        expect(yearChart.props('data').datasets[0].data.slice(0, 4)).toEqual([40, 50, 110, 160]);
    });

    test('shows the subcategories of the category picked in the selector', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(Index, { props: baseProps() });

        expect(wrapper.find('.subcategory-detail').exists()).toBe(false);

        await wrapper.find('#category-detail').setValue('Menjar');

        expect(wrapper.find('.subcategory-detail').text()).toContain('Menjar: subcategories');
        const detailChart = wrapper.find('.subcategory-detail').findComponent(Bar);
        expect(detailChart.props('data').labels).toEqual(['Supermercats', 'Panaderia']);
        expect(detailChart.props('data').datasets[0].data).toEqual([30, -15]);
    });

    test('clicking a category bar shows its subcategories', async () => {
        const wrapper = mount(Index, { props: baseProps() });

        const categoryChart = wrapper.findAllComponents({ name: 'CategoryDifferenceChart' }).at(0);
        await categoryChart.vm.$emit('select', 'Menjar');

        expect(wrapper.find('#category-detail').element.value).toBe('Menjar');
        expect(wrapper.find('.subcategory-detail').exists()).toBe(true);
    });

    test('the period label includes the cutoff day for the month in progress', () => {
        const wrapper = mount(Index, {
            props: baseProps({ comparisonPeriod: { cutoffDay: 19, current: 125, previous: 110 } }),
        });

        expect(wrapper.text()).toContain('Diferència per categoria vs. 2025 (Gen–19 Mar)');
        expect(wrapper.text()).toContain('Gen–19 Mar 2026:');
    });

    test('groups the charts in three titled blocks: month, year and comparison', () => {
        const wrapper = mount(Index, { props: baseProps() });

        const monthSection = wrapper.find('section[data-section="month"]');
        const yearSection = wrapper.find('section[data-section="year"]');
        const comparisonSection = wrapper.find('section[data-section="comparison"]');

        expect(monthSection.find('.section-title').text()).toBe('Aquest mes');
        expect(monthSection.text()).toContain('març 2026');
        expect(monthSection.text()).toContain('Despesa per subcategoria');
        expect(monthSection.text()).toContain('Despesa per banc');

        expect(yearSection.find('.section-title').text()).toBe('Aquest any');
        expect(yearSection.text()).toContain('Despesa acumulada vs. pressupost');
        expect(yearSection.findComponent({ name: 'DeviationTrendChart' }).exists()).toBe(true);

        expect(comparisonSection.find('.section-title').text()).toBe('Comparativa amb 2025');
        expect(comparisonSection.findComponent({ name: 'YearComparisonChart' }).exists()).toBe(true);
        expect(comparisonSection.text()).toContain('Acumulat 2026 vs. 2025');
        expect(comparisonSection.findComponent({ name: 'CategoryDifferenceChart' }).exists()).toBe(true);
    });

    test('shows the yearly evolution as the last block', () => {
        const wrapper = mount(Index, { props: baseProps() });

        const sections = wrapper.findAll('section[data-section]');
        expect(sections.at(-1).attributes('data-section')).toBe('evolution');
        expect(sections.at(-1).find('.section-title').text()).toBe('Evolució anual');
        expect(sections.at(-1).findComponent({ name: 'YearlyEvolution' }).props('items')).toHaveLength(2);
    });
});
