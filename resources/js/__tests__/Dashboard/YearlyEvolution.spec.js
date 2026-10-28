import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import YearlyEvolution from '../../Pages/Dashboard/Partials/YearlyEvolution.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

const items = [
    { year: 2025, spent: 24000, budgeted: 0, monthsCounted: 12, isCurrent: false },
    { year: 2026, spent: 26000, budgeted: 34000, monthsCounted: 10, isCurrent: true },
];

describe('YearlyEvolution', () => {
    test('shows an empty state when there are no years', () => {
        const wrapper = mount(YearlyEvolution, { props: { items: [] } });

        expect(wrapper.text()).toContain('Encara no hi ha despeses.');
    });

    test('draws budgeted and spent bars per year, marking the current one', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(YearlyEvolution, { props: { items } });

        const data = wrapper.findComponent(Bar).props('data');
        expect(data.labels).toEqual(['2025', '2026 (en curs)']);
        expect(data.datasets.map((dataset) => dataset.label)).toEqual(['Pressupostat', 'Gastat']);
        expect(data.datasets[1].data).toEqual([24000, 26000]);
        expect(wrapper.findComponent(Bar).props('options').plugins.legend.display).toBe(true);
    });

    test('shows a row per year with spent, budget, deviation and monthly average', () => {
        const wrapper = mount(YearlyEvolution, { props: { items } });

        const row2025 = wrapper.find('tr[data-year-row="2025"]');
        expect(row2025.find('td[data-spent]').text()).toMatch(/24\.000\s€/);
        expect(row2025.find('td[data-budgeted]').text()).toBe('–');
        expect(row2025.find('td[data-deviation]').text()).toBe('–');
        expect(row2025.find('td[data-average]').text()).toMatch(/2\.000\s€/);
        expect(row2025.find('td[data-change]').text()).toBe('–');

        const row2026 = wrapper.find('tr[data-year-row="2026"]');
        expect(row2026.text()).toContain('en curs');
        expect(row2026.find('td[data-deviation] .text-success').text()).toMatch(/\+8\.000\s€/);
        expect(row2026.find('td[data-average]').text()).toMatch(/2\.600\s€/);
    });

    test('compares each year with the previous one by monthly average, in red when it goes up', () => {
        const wrapper = mount(YearlyEvolution, { props: { items } });

        // 2.600 €/month against 2.000 €/month → +30 %.
        const change = wrapper.find('tr[data-year-row="2026"] td[data-change] span');
        expect(change.classes()).toContain('text-danger');
        expect(change.text()).toMatch(/\+30\s?%/);
    });

    test('shows a decrease in green', () => {
        const wrapper = mount(YearlyEvolution, {
            props: {
                items: [
                    { year: 2025, spent: 2400, budgeted: 0, monthsCounted: 12, isCurrent: false },
                    { year: 2026, spent: 1800, budgeted: 0, monthsCounted: 12, isCurrent: false },
                ],
            },
        });

        const change = wrapper.find('tr[data-year-row="2026"] td[data-change] span');
        expect(change.classes()).toContain('text-success');
        expect(change.text()).toMatch(/-25\s?%|−25\s?%/);
    });
});
