import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import AppLayout from '../../Layouts/AppLayout.vue';

let currentUrl = '/despeses';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ url: currentUrl }),
    router: { post: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

describe('AppLayout', () => {
    test('renders the navigation links and the page content', () => {
        const wrapper = mount(AppLayout, { slots: { default: '<p>Contingut</p>' } });

        expect(wrapper.text()).toContain('Despeses');
        expect(wrapper.text()).toContain('Categories');
        expect(wrapper.text()).toContain('Contingut');
    });

    test('logs out when the "Surt" button is clicked', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(AppLayout);

        const logoutButton = wrapper.findAll('button').find((button) => button.text().includes('Surt'));
        await logoutButton.trigger('click');

        expect(router.post).toHaveBeenCalledWith('/logout');
    });

    test('toggles the dark theme on the page and remembers the choice', async () => {
        document.documentElement.removeAttribute('data-bs-theme');
        localStorage.clear();
        const wrapper = mount(AppLayout);

        const themeButton = wrapper.find('button[aria-label="Activa el mode fosc"]');
        await themeButton.trigger('click');

        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(wrapper.find('button[aria-label="Activa el mode clar"]').exists()).toBe(true);
    });

    test('highlights the link matching the current page', () => {
        currentUrl = '/categories';
        const wrapper = mount(AppLayout);

        const links = wrapper.findAll('a');
        const categoriesLink = links.find((link) => link.text() === 'Categories');
        const expensesLink = links.find((link) => link.text() === 'Despeses');

        expect(categoriesLink.classes()).toContain('active');
        expect(expensesLink.classes()).not.toContain('active');
    });
});
