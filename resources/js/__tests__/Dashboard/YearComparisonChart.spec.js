import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import YearComparisonChart from '../../Pages/Dashboard/Partials/YearComparisonChart.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const zeros = Array(12).fill(0);

function months(values) {
    return [...values, ...Array(12 - values.length).fill(0)];
}

function mountChart(props) {
    return mount(YearComparisonChart, { props: { monthLabels, year: 2026, untilMonth: 3, ...props } });
}

describe('YearComparisonChart', () => {
    test('shows an empty state when neither year has expenses', () => {
        const wrapper = mountChart({ currentData: zeros, previousData: zeros });

        expect(wrapper.text()).toContain("Sense despeses ni aquest any ni l'anterior.");
        expect(wrapper.find('.bar-stub').exists()).toBe(false);
    });

    test('draws the previous year and the selected year, leaving months after the selected one empty', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mountChart({
            currentData: months([10, 20, 30, 40]),
            previousData: months([5, 15, 25, 35]),
        });

        const data = wrapper.findComponent(Bar).props('data');
        expect(data.labels).toEqual(monthLabels);
        expect(data.datasets.map((dataset) => dataset.label)).toEqual(['2025', '2026']);
        expect(data.datasets[0].data.slice(0, 4)).toEqual([5, 15, 25, 35]);
        expect(data.datasets[1].data.slice(0, 4)).toEqual([10, 20, 30, null]);
        expect(wrapper.findComponent(Bar).props('options').plugins.legend.display).toBe(true);
    });

    test('compares the same period of both years and shows spending more in red', () => {
        // Jan–Mar: 2026 = 60, 2025 = 45 (April of 2025 must not count).
        const wrapper = mountChart({
            currentData: months([10, 20, 30]),
            previousData: months([5, 15, 25, 999]),
        });

        const summary = wrapper.find('.period-summary').text();
        expect(summary).toContain('Gen–Mar 2026:');
        expect(summary).toMatch(/60,00\s€/);
        expect(summary).toMatch(/45,00\s€/);
        expect(summary).toContain('més que el 2025');
        expect(summary).toMatch(/\+33,3\s?%/);
        expect(wrapper.find('.period-difference').classes()).toContain('text-danger');
    });

    test('shows spending less in green', () => {
        const wrapper = mountChart({ currentData: months([10]), previousData: months([40]), untilMonth: 1 });

        const summary = wrapper.find('.period-summary').text();
        expect(summary).toContain('Gen 2026:');
        expect(summary).toContain('menys que el 2025');
        expect(wrapper.find('.period-difference').classes()).toContain('text-success');
    });

    test('omits the percentage when the previous year had no expenses in the period', () => {
        const wrapper = mountChart({ currentData: months([10]), previousData: months([0, 0, 0, 50]) });

        expect(wrapper.find('.period-summary').text()).not.toContain('%');
    });

    test('says it is equal when both periods have the same total', () => {
        const wrapper = mountChart({ currentData: months([10, 20]), previousData: months([30]) });

        expect(wrapper.find('.period-summary').text()).toContain('Igual que el 2025');
    });

    test('uses the server period totals and shows the cutoff day for the month in progress', () => {
        const wrapper = mountChart({
            currentData: months([10, 20, 30]),
            previousData: months([5, 15, 25]),
            untilMonth: 10,
            cutoffDay: 19,
            periodTotals: { current: 200, previous: 100 },
        });

        const summary = wrapper.find('.period-summary').text();
        expect(summary).toContain('Gen–19 Oct 2026:');
        expect(summary).toMatch(/200,00\s€/);
        expect(summary).toMatch(/100,00\s€/);
        expect(summary).toMatch(/\+100\s?%/);
    });
});
