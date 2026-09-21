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

        const trendChart = wrapper.findAllComponents(Bar).at(0);
        expect(trendChart.props('data').datasets[0].data).toEqual([9, 10, 11]);
    });

    test('switches to the last 12 months when the "12m" button is clicked', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(Index, { props: baseProps() });

        await wrapper.findAll('button').find((button) => button.text() === '12m').trigger('click');

        const trendChart = wrapper.findAllComponents(Bar).at(0);
        expect(trendChart.props('data').datasets[0].data).toHaveLength(12);
    });
});
