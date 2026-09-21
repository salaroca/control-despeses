import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import ExpenseBreakdownChart from '../../Pages/Dashboard/Partials/ExpenseBreakdownChart.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

describe('ExpenseBreakdownChart', () => {
    test('shows an empty state when there are no items', () => {
        const wrapper = mount(ExpenseBreakdownChart, { props: { items: [] } });

        expect(wrapper.text()).toContain('Sense despeses aquest mes.');
        expect(wrapper.find('.bar-stub').exists()).toBe(false);
    });

    test('passes the item names and totals to the chart', async () => {
        const { Bar } = await import('vue-chartjs');
        const items = [
            { name: 'Menjar', total: 50 },
            { name: 'Transport', total: 25 },
        ];
        const wrapper = mount(ExpenseBreakdownChart, { props: { items } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('data').labels).toEqual(['Menjar', 'Transport']);
        expect(chart.props('data').datasets[0].data).toEqual([50, 25]);
    });

    test('hides the legend since there is only one series', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(ExpenseBreakdownChart, { props: { items: [{ name: 'Menjar', total: 50 }] } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('options').plugins.legend.display).toBe(false);
    });

    test('is horizontal (indexAxis "y") by default', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(ExpenseBreakdownChart, { props: { items: [{ name: 'Menjar', total: 50 }] } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('options').indexAxis).toBe('y');
    });

    test('switches to vertical bars (indexAxis "x") with a scrollable, fixed-height container', async () => {
        const { Bar } = await import('vue-chartjs');
        const items = Array.from({ length: 20 }, (_, i) => ({ name: `Sub ${i}`, total: 10 }));
        const wrapper = mount(ExpenseBreakdownChart, { props: { items, horizontal: false } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('options').indexAxis).toBe('x');

        const scrollContainer = wrapper.find('.overflow-x-auto');
        expect(scrollContainer.exists()).toBe(true);
        expect(scrollContainer.attributes('style')).toContain('height: 260px');
    });
});
