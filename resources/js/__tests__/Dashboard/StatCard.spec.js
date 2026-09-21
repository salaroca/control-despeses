import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import StatCard from '../../Pages/Dashboard/Partials/StatCard.vue';

describe('StatCard', () => {
    test('renders the label and value', () => {
        const wrapper = mount(StatCard, { props: { label: 'Gastat', value: '120,00 €' } });

        expect(wrapper.text()).toContain('Gastat');
        expect(wrapper.text()).toContain('120,00 €');
    });

    test('applies the success color for a "good" variant', () => {
        const wrapper = mount(StatCard, { props: { label: 'Desviació', value: '+10,00 €', variant: 'good' } });

        expect(wrapper.find('.h1').classes()).toContain('text-success');
    });

    test('applies the danger color for a "critical" variant', () => {
        const wrapper = mount(StatCard, { props: { label: 'Desviació', value: '-10,00 €', variant: 'critical' } });

        expect(wrapper.find('.h1').classes()).toContain('text-danger');
    });
});
