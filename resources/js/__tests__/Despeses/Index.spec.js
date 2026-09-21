import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Despeses/Index.vue';

const categoriesList = [
    {
        id: 1,
        name: 'Menjar',
        subcategories: [{ id: 10, name: 'Supermercats', category_id: 1 }],
    },
];

function makeForm(initial) {
    const form = reactive({
        ...initial,
        errors: {},
        processing: false,
        post: vi.fn((url, options) => options?.onSuccess?.()),
        put: vi.fn((url, options) => options?.onSuccess?.()),
        reset: vi.fn(() => Object.assign(form, initial)),
    });

    return form;
}

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { categoriesList }, url: '/despeses' }),
    useForm: (initial) => makeForm(initial),
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

function buildExpense(overrides = {}) {
    return {
        id: 1,
        amount: '12.50',
        date: '2026-09-19',
        note: 'Fruita i verdura',
        subcategory_id: 10,
        subcategory: { id: 10, name: 'Supermercats', category_id: 1, category: { id: 1, name: 'Menjar' } },
        ...overrides,
    };
}

describe('Despeses/Index', () => {
    beforeEach(() => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('shows the empty state when there are no expenses', () => {
        const wrapper = mount(Index, {
            props: { expenses: { data: [], prev_page_url: null, next_page_url: null } },
        });

        expect(wrapper.text()).toContain('Encara no hi ha despeses registrades.');
    });

    test('lists the expenses with their category and amount', () => {
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null } },
        });

        expect(wrapper.text()).toContain('Menjar · Supermercats');
        expect(wrapper.text()).toContain('Fruita i verdura');
        expect(wrapper.text()).toContain('12,50');
    });

    test('clicking the edit button switches the row into edit mode', async () => {
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null } },
        });

        await wrapper.find('button[aria-label="Edita"]').trigger('click');

        expect(wrapper.find('form').exists()).toBe(true);
        expect(wrapper.text()).toContain('Cancel·la');
    });

    test('deleting an expense asks for confirmation before calling the server', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null } },
        });

        await wrapper.find('button[aria-label="Elimina"]').trigger('click');

        expect(window.confirm).toHaveBeenCalled();
        expect(router.delete).toHaveBeenCalledWith('/despeses/1', { preserveScroll: true });
    });

    test('does not delete when the confirmation is cancelled', async () => {
        window.confirm.mockReturnValue(false);
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null } },
        });

        await wrapper.find('button[aria-label="Elimina"]').trigger('click');

        expect(router.delete).not.toHaveBeenCalled();
    });

    test('shows pagination links only when they are available', () => {
        const wrapper = mount(Index, {
            props: {
                expenses: { data: [buildExpense()], prev_page_url: '/despeses?page=1', next_page_url: '/despeses?page=3' },
            },
        });

        expect(wrapper.text()).toContain('Anterior');
        expect(wrapper.text()).toContain('Següent');
    });
});
