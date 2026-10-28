import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Articles/Index.vue';

function makeForm(initial) {
    const form = reactive({
        ...initial,
        errors: {},
        processing: false,
        transformer: (data) => data,
        transform: vi.fn((callback) => {
            form.transformer = callback;

            return form;
        }),
        post: vi.fn((url, options) => options?.onSuccess?.()),
        put: vi.fn((url, options) => options?.onSuccess?.()),
        reset: vi.fn(() => Object.assign(form, initial)),
    });

    return form;
}

const createdForms = [];

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/articles' }),
    useForm: (initial) => {
        const form = makeForm(initial);
        createdForms.push(form);

        return form;
    },
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

const productsList = [
    { id: 1, name: 'Alvocat', group: 'Fruites i Verdures', unit: 'kg' },
    { id: 2, name: 'Arròs', group: 'Cereal', unit: null },
    { id: 3, name: 'Pastanaga', group: 'Fruites i Verdures', unit: null },
    { id: 4, name: 'Sal', group: null, unit: null },
];

beforeEach(() => {
    createdForms.length = 0;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Articles/Index', () => {
    test('shows the empty state when there are no products', () => {
        const wrapper = mount(Index, { props: { productsList: [] } });

        expect(wrapper.text()).toContain('Encara no hi ha articles registrats.');
    });

    test('groups the products by group, alphabetically, with "Sense grup" last', () => {
        const wrapper = mount(Index, { props: { productsList } });

        const sectionNames = wrapper.findAll('[data-group-section]').map((section) => section.attributes('data-group-section'));
        expect(sectionNames).toEqual(['Cereal', 'Fruites i Verdures', 'Sense grup']);
        expect(wrapper.find('[data-group-section="Fruites i Verdures"]').text()).toContain('(2)');
        expect(wrapper.find('a[data-prices-tab="/articles"]').classes()).toContain('active');
    });

    test('shows the comparison unit when the product has one', () => {
        const wrapper = mount(Index, { props: { productsList } });

        expect(wrapper.find('[data-product-row="1"] [data-unit]').text()).toBe('Quilo (kg)');
        expect(wrapper.find('[data-product-row="2"] [data-unit]').exists()).toBe(false);
    });

    test('filters by name ignoring accents and case', async () => {
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('input[aria-label="Cerca un article"]').setValue('ARROS');

        expect(wrapper.findAll('[data-product-row]')).toHaveLength(1);
        expect(wrapper.find('[data-product-row="2"]').exists()).toBe(true);
        expect(wrapper.find('[data-products-count]').text()).toBe('1 de 4 articles');
    });

    test('filters by group, including products without group', async () => {
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('select[aria-label="Filtra per grup"]').setValue('Fruites i Verdures');
        expect(wrapper.findAll('[data-product-row]')).toHaveLength(2);

        await wrapper.find('select[aria-label="Filtra per grup"]').setValue('Sense grup');
        expect(wrapper.findAll('[data-product-row]')).toHaveLength(1);
        expect(wrapper.find('[data-product-row="4"]').exists()).toBe(true);
    });

    test('shows a message when nothing matches the search', async () => {
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('input[aria-label="Cerca un article"]').setValue('xocolata');

        expect(wrapper.text()).toContain('Cap article coincideix amb la cerca.');
    });

    test('suggests the existing groups when typing one', () => {
        const wrapper = mount(Index, { props: { productsList } });

        const optionList = wrapper.findAll('#product-groups option').map((option) => option.attributes('value'));
        expect(optionList).toEqual(['Cereal', 'Fruites i Verdures']);
    });

    test('creates a product, sending empty group and unit as null', async () => {
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('input[placeholder^="Nom de l\'article"]').setValue('Llenties');
        await wrapper.find('form').trigger('submit');

        const createForm = createdForms[0];
        expect(createForm.post).toHaveBeenCalledWith('/articles', expect.any(Object));
        expect(createForm.transformer({ name: 'Llenties', group: '', unit: '' }))
            .toEqual({ name: 'Llenties', group: null, unit: null });
    });

    test('edits a product inline with its group and unit', async () => {
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('[data-product-row="2"] button[aria-label="Edita article"]').trigger('click');
        const editForm = createdForms.at(-1);
        expect(editForm.name).toBe('Arròs');
        expect(editForm.unit).toBe('');

        await wrapper.find('[data-product-row="2"] select[aria-label="Es compara per"]').setValue('kg');
        await wrapper.findAll('button').find((button) => button.text() === 'Desa').trigger('click');

        expect(editForm.unit).toBe('kg');
        expect(editForm.put).toHaveBeenCalledWith('/articles/2', expect.any(Object));
    });

    test('deletes a product after confirming', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, { props: { productsList } });

        await wrapper.find('[data-product-row="4"] button[aria-label="Elimina article"]').trigger('click');

        expect(router.delete).toHaveBeenCalledWith('/articles/4', expect.any(Object));
    });

    test('warns how many prices go away when deleting a product', async () => {
        const wrapper = mount(Index, { props: { productsList: [{ id: 9, name: 'Aigua', group: null, unit: 'l', prices_count: 3 }] } });

        await wrapper.find('button[aria-label="Elimina article"]').trigger('click');

        expect(window.confirm).toHaveBeenCalledWith('Segur que vols eliminar l\'article "Aigua"? També s\'esborraran els seus 3 preus apuntats.');
    });
});
