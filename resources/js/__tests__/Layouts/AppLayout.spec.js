import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import AppLayout from '../../Layouts/AppLayout.vue';

let currentUrl = '/despeses';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ url: currentUrl }),
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

describe('AppLayout', () => {
    test('renders the navigation links and the page content', () => {
        const wrapper = mount(AppLayout, { slots: { default: '<p>Contingut</p>' } });

        expect(wrapper.text()).toContain('Despeses');
        expect(wrapper.text()).toContain('Categories');
        expect(wrapper.text()).toContain('Contingut');
    });

    test('highlights the link matching the current page', () => {
        currentUrl = '/categories';
        const wrapper = mount(AppLayout);

        const links = wrapper.findAll('a');
        const categoriesLink = links.find((link) => link.text() === 'Categories');
        const expensesLink = links.find((link) => link.text() === 'Despeses');

        expect(categoriesLink.classes()).toContain('fw-bold');
        expect(expensesLink.classes()).not.toContain('fw-bold');
    });
});
