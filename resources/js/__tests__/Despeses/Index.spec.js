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

const banksList = [{ id: 100, name: 'Banc A' }];

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
    usePage: () => ({ props: { categoriesList, banksList }, url: '/despeses' }),
    useForm: (initial) => makeForm(initial),
    router: { delete: vi.fn(), get: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

const emptyFilters = { search: null, subcategory_id: null };

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
            props: { expenses: { data: [], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        expect(wrapper.text()).toContain('Encara no hi ha despeses registrades.');
    });

    test('lists the expenses with their category and amount', () => {
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        expect(wrapper.text()).toContain('Menjar · Supermercats');
        expect(wrapper.text()).toContain('Fruita i verdura');
        expect(wrapper.text()).toContain('12,50');
    });

    test('shows the bank name when the expense has one', () => {
        const wrapper = mount(Index, {
            props: {
                expenses: {
                    data: [buildExpense({ bank_id: 100, bank: { id: 100, name: 'Banc A' } })],
                    prev_page_url: null,
                    next_page_url: null,
                },
                filters: emptyFilters,
            },
        });

        expect(wrapper.text()).toContain('Banc A');
    });

    test('clicking the edit button switches the row into edit mode', async () => {
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        await wrapper.find('button[aria-label="Edita"]').trigger('click');

        expect(wrapper.find('form').exists()).toBe(true);
        expect(wrapper.text()).toContain('Cancel·la');
    });

    test('deleting an expense asks for confirmation before calling the server', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        await wrapper.find('button[aria-label="Elimina"]').trigger('click');

        expect(window.confirm).toHaveBeenCalled();
        expect(router.delete).toHaveBeenCalledWith('/despeses/1', { preserveScroll: true });
    });

    test('does not delete when the confirmation is cancelled', async () => {
        window.confirm.mockReturnValue(false);
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        await wrapper.find('button[aria-label="Elimina"]').trigger('click');

        expect(router.delete).not.toHaveBeenCalled();
    });

    test('shows pagination links only when they are available', () => {
        const wrapper = mount(Index, {
            props: {
                expenses: { data: [buildExpense()], prev_page_url: '/despeses?page=1', next_page_url: '/despeses?page=3' },
                filters: emptyFilters,
            },
        });

        expect(wrapper.text()).toContain('Anterior');
        expect(wrapper.text()).toContain('Següent');
    });

    test('typing in the search box requests filtered expenses after a debounce', async () => {
        vi.useFakeTimers();
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        await wrapper.find('input[placeholder="Cerca per text a la nota..."]').setValue('fruita');
        vi.advanceTimersByTime(300);

        expect(router.get).toHaveBeenCalledWith(
            '/despeses',
            { search: 'fruita', subcategory_id: undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
        vi.useRealTimers();
    });

    test('selecting a subcategory filters immediately without waiting', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: { expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null }, filters: emptyFilters },
        });

        await wrapper.find('select[aria-label="Filtra per subcategoria"]').setValue('10');

        expect(router.get).toHaveBeenCalledWith(
            '/despeses',
            { search: undefined, subcategory_id: 10 },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    });

    test('the clear button resets the filters and is disabled when there is nothing to clear', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, {
            props: {
                expenses: { data: [buildExpense()], prev_page_url: null, next_page_url: null },
                filters: { search: 'fruita', subcategory_id: null },
            },
        });

        const clearButton = wrapper.find('button[type="button"].btn-outline-secondary');
        expect(clearButton.attributes('disabled')).toBeUndefined();

        await clearButton.trigger('click');

        expect(router.get).toHaveBeenCalledWith(
            '/despeses',
            { search: undefined, subcategory_id: undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    });

    test('shows a specific empty state when the search has no matches', () => {
        const wrapper = mount(Index, {
            props: {
                expenses: { data: [], prev_page_url: null, next_page_url: null },
                filters: { search: 'inexistent', subcategory_id: null },
            },
        });

        expect(wrapper.text()).toContain('Cap despesa coincideix amb la cerca.');
    });
});
