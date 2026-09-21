import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Categories/Index.vue';

let categoriesList;
let errors;

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
    usePage: () => ({ props: { categoriesList, errors }, url: '/categories' }),
    useForm: (initial) => makeForm(initial),
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

beforeEach(() => {
    categoriesList = [
        {
            id: 1,
            name: 'Menjar',
            subcategories: [{ id: 10, name: 'Supermercats', category_id: 1 }],
        },
        {
            id: 2,
            name: 'Oci',
            subcategories: [],
        },
    ];
    errors = {};
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Categories/Index', () => {
    test('shows the empty state when there are no categories', () => {
        categoriesList = [];
        const wrapper = mount(Index);

        expect(wrapper.text()).toContain('Encara no hi ha categories.');
    });

    test('lists the categories with their subcategories', () => {
        const wrapper = mount(Index);

        expect(wrapper.text()).toContain('Menjar');
        expect(wrapper.text()).toContain('Supermercats');
        expect(wrapper.text()).toContain('Sense subcategories');
    });

    test('clicking the edit button switches the category into edit mode', async () => {
        const wrapper = mount(Index);

        await wrapper.find('button[aria-label="Edita categoria"]').trigger('click');

        expect(wrapper.text()).toContain('Cancel·la');
    });

    test('deleting a category asks for confirmation before calling the server', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index);

        await wrapper.find('button[aria-label="Elimina categoria"]').trigger('click');

        expect(window.confirm).toHaveBeenCalled();
        expect(router.delete).toHaveBeenCalledWith('/categories/1', { preserveScroll: true });
    });

    test('deleting a subcategory asks for confirmation before calling the server', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index);

        await wrapper.find('button[aria-label="Elimina subcategoria"]').trigger('click');

        expect(router.delete).toHaveBeenCalledWith('/subcategories/10', { preserveScroll: true });
    });

    test('shows the delete error message when present', () => {
        errors = { delete: 'No es pot eliminar.' };

        const wrapper = mount(Index);

        expect(wrapper.text()).toContain('No es pot eliminar.');
    });
});
