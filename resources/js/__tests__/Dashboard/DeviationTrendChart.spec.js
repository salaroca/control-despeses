import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import DeviationTrendChart from '../../Pages/Dashboard/Partials/DeviationTrendChart.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

describe('DeviationTrendChart', () => {
    test('shows an empty state when there are no items', () => {
        const wrapper = mount(DeviationTrendChart, { props: { items: [] } });

        expect(wrapper.text()).toContain('Sense dades per a aquest període.');
    });

    test('passes the month labels and deviation values to the chart', async () => {
        const { Bar } = await import('vue-chartjs');
        const items = [
            { label: 'Gen 26', deviation: 20 },
            { label: 'Feb 26', deviation: -10 },
        ];
        const wrapper = mount(DeviationTrendChart, { props: { items } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('data').labels).toEqual(['Gen 26', 'Feb 26']);
        expect(chart.props('data').datasets[0].data).toEqual([20, -10]);
    });

    test('colors positive deviations green and negative ones red', async () => {
        const { Bar } = await import('vue-chartjs');
        const items = [
            { label: 'Gen 26', deviation: 20 },
            { label: 'Feb 26', deviation: -10 },
        ];
        const wrapper = mount(DeviationTrendChart, { props: { items } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('data').datasets[0].backgroundColor).toEqual(['#2fb344', '#d63939']);
    });
});
