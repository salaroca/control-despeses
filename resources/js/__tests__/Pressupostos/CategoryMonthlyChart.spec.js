import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import CategoryMonthlyChart from '../../Pages/Pressupostos/Partials/CategoryMonthlyChart.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const zeros = Array(12).fill(0);

describe('CategoryMonthlyChart', () => {
    test('shows an empty state when there is no budget nor expense in the year', () => {
        const wrapper = mount(CategoryMonthlyChart, {
            props: { monthLabels, budgetData: zeros, actualData: zeros },
        });

        expect(wrapper.text()).toContain('Sense pressupost ni despeses aquest any.');
        expect(wrapper.find('.bar-stub').exists()).toBe(false);
    });

    test('passes the months and the budget and real series to a vertical bar chart', async () => {
        const { Bar } = await import('vue-chartjs');
        const budgetData = [...zeros];
        budgetData[2] = 60;
        const actualData = [...zeros];
        actualData[2] = 45;

        const wrapper = mount(CategoryMonthlyChart, { props: { monthLabels, budgetData, actualData } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('data').labels).toEqual(monthLabels);
        expect(chart.props('data').datasets.map((dataset) => dataset.label)).toEqual([
            'Pressupost',
            'Real',
            'Mitjana pressupost',
            'Mitjana real',
        ]);
        expect(chart.props('data').datasets[0].data[2]).toBe(60);
        expect(chart.props('data').datasets[1].data[2]).toBe(45);
        expect(chart.props('options').indexAxis).toBeUndefined();
    });

    test('shows a legend, since there are two series', async () => {
        const { Bar } = await import('vue-chartjs');
        const actualData = [...zeros];
        actualData[0] = 10;

        const wrapper = mount(CategoryMonthlyChart, { props: { monthLabels, budgetData: zeros, actualData } });

        expect(wrapper.findComponent(Bar).props('options').plugins.legend.display).toBe(true);
    });

    test('draws dashed average lines at the total divided by 12 by default', async () => {
        const { Bar } = await import('vue-chartjs');
        const budgetData = Array(12).fill(100);
        const actualData = [...zeros];
        actualData[0] = 120;
        actualData[1] = 60;

        const wrapper = mount(CategoryMonthlyChart, { props: { monthLabels, budgetData, actualData } });

        const [, , budgetAverage, actualAverage] = wrapper.findComponent(Bar).props('data').datasets;
        expect(budgetAverage.type).toBe('line');
        expect(budgetAverage.borderDash).toBeDefined();
        expect(budgetAverage.data).toEqual(Array(12).fill(100));
        expect(actualAverage.data).toEqual(Array(12).fill(15));
    });

    test('divides the real average by the months already reached (actualMonths), budget still by 12', async () => {
        const { Bar } = await import('vue-chartjs');
        const budgetData = Array(12).fill(100);
        const actualData = [...zeros];
        actualData[0] = 120;
        actualData[1] = 60;

        const wrapper = mount(CategoryMonthlyChart, {
            props: { monthLabels, budgetData, actualData, actualMonths: 4 },
        });

        const [, , budgetAverage, actualAverage] = wrapper.findComponent(Bar).props('data').datasets;
        expect(budgetAverage.data).toEqual(Array(12).fill(100));
        expect(actualAverage.data).toEqual(Array(12).fill(45));
    });

    test('real average line is 0 when no month has been reached yet (future year)', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryMonthlyChart, {
            props: { monthLabels, budgetData: Array(12).fill(100), actualData: zeros, actualMonths: 0 },
        });

        const [, , , actualAverage] = wrapper.findComponent(Bar).props('data').datasets;
        expect(actualAverage.data).toEqual(zeros);
    });
});
