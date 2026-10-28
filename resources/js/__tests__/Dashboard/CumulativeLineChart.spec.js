import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import CumulativeLineChart from '../../Pages/Dashboard/Partials/CumulativeLineChart.vue';

vi.mock('vue-chartjs', () => ({
    Line: { props: ['data', 'options'], template: '<div class="line-stub" />' },
}));

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const zeros = Array(12).fill(0);

function months(values) {
    return [...values, ...Array(12 - values.length).fill(0)];
}

describe('CumulativeLineChart', () => {
    test('shows an empty state when no series has data', () => {
        const wrapper = mount(CumulativeLineChart, {
            props: { monthLabels, seriesList: [{ label: 'Real', values: zeros, color: '#000' }] },
        });

        expect(wrapper.text()).toContain('Sense dades per a aquest període.');
        expect(wrapper.find('.line-stub').exists()).toBe(false);
    });

    test('draws the running total of each series', async () => {
        const { Line } = await import('vue-chartjs');
        const wrapper = mount(CumulativeLineChart, {
            props: { monthLabels, seriesList: [{ label: 'Real', values: months([10, 0, 5]), color: '#2a78d6' }] },
        });

        const data = wrapper.findComponent(Line).props('data');
        expect(data.labels).toEqual(monthLabels);
        expect(data.datasets[0].label).toBe('Real');
        expect(data.datasets[0].data.slice(0, 4)).toEqual([10, 10, 15, 15]);
        expect(data.datasets[0].borderColor).toBe('#2a78d6');
    });

    test('leaves the months after lastMonth empty', async () => {
        const { Line } = await import('vue-chartjs');
        const wrapper = mount(CumulativeLineChart, {
            props: { monthLabels, seriesList: [{ label: 'Real', values: months([10, 20, 30]), color: '#000', lastMonth: 2 }] },
        });

        expect(wrapper.findComponent(Line).props('data').datasets[0].data.slice(0, 3)).toEqual([10, 30, null]);
    });

    test('shows a legend, since it compares several series', async () => {
        const { Line } = await import('vue-chartjs');
        const wrapper = mount(CumulativeLineChart, {
            props: {
                monthLabels,
                seriesList: [
                    { label: 'Pressupost', values: months([50]), color: '#eb6834' },
                    { label: 'Real', values: months([40]), color: '#2a78d6' },
                ],
            },
        });

        expect(wrapper.findComponent(Line).props('options').plugins.legend.display).toBe(true);
    });
});
