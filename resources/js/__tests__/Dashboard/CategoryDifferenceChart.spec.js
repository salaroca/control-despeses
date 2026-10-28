import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import CategoryDifferenceChart from '../../Pages/Dashboard/Partials/CategoryDifferenceChart.vue';

vi.mock('vue-chartjs', () => ({
    Bar: { props: ['data', 'options'], template: '<div class="bar-stub" />' },
}));

const items = [
    { name: 'Menjar', current: 100, previous: 60 },
    { name: 'Transport', current: 10, previous: 30 },
];

describe('CategoryDifferenceChart', () => {
    test('shows an empty state when there are no categories', () => {
        const wrapper = mount(CategoryDifferenceChart, { props: { items: [], year: 2026 } });

        expect(wrapper.text()).toContain('Sense dades per a aquest període.');
    });

    test('draws one horizontal bar per category with the difference against the previous year', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryDifferenceChart, { props: { items, year: 2026 } });

        const chart = wrapper.findComponent(Bar);
        expect(chart.props('data').labels).toEqual(['Menjar', 'Transport']);
        expect(chart.props('data').datasets[0].data).toEqual([40, -20]);
        expect(chart.props('options').indexAxis).toBe('y');
    });

    test('colors spending more red and spending less green, and explains it in words', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryDifferenceChart, { props: { items, year: 2026 } });

        expect(wrapper.findComponent(Bar).props('data').datasets[0].backgroundColor).toEqual(['#d63939', '#2fb344']);
        expect(wrapper.find('.difference-caption').text()).toBe('Vermell: gastes més que el 2025 · Verd: gastes menys.');
    });

    test('the tooltip shows the difference and both yearly totals', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryDifferenceChart, { props: { items, year: 2026 } });

        const label = wrapper.findComponent(Bar).props('options').plugins.tooltip.callbacks.label;
        const lines = label({ dataIndex: 0, parsed: { x: 40 } });
        expect(lines[0]).toMatch(/^\+40,00\s€$/);
        expect(lines[1]).toMatch(/^2026: 100,00\s€$/);
        expect(lines[2]).toMatch(/^2025: 60,00\s€$/);
    });

    test('clicking a bar emits the item name when it is clickable', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryDifferenceChart, { props: { items, year: 2026, isClickable: true } });

        wrapper.findComponent(Bar).props('options').onClick({}, [{ index: 1 }]);

        expect(wrapper.emitted('select')).toEqual([['Transport']]);
    });

    test('clicking does nothing when it is not clickable', async () => {
        const { Bar } = await import('vue-chartjs');
        const wrapper = mount(CategoryDifferenceChart, { props: { items, year: 2026 } });

        wrapper.findComponent(Bar).props('options').onClick({}, [{ index: 0 }]);

        expect(wrapper.emitted('select')).toBeUndefined();
    });
});
