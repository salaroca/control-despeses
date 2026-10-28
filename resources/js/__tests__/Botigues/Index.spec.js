import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Botigues/Index.vue';

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

const createdForms = [];

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/botigues' }),
    useForm: (initial) => {
        const form = makeForm(initial);
        createdForms.push(form);

        return form;
    },
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

const shopsList = [
    { id: 1, name: 'Bon Preu' },
    { id: 2, name: 'Mercadona' },
];

beforeEach(() => {
    createdForms.length = 0;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Botigues/Index', () => {
    test('shows the empty state when there are no shops', () => {
        const wrapper = mount(Index, { props: { shopsList: [] } });

        expect(wrapper.text()).toContain('Encara no hi ha botigues registrades.');
    });

    test('lists the shops and shows the prices tabs with Botigues active', () => {
        const wrapper = mount(Index, { props: { shopsList } });

        expect(wrapper.text()).toContain('Bon Preu');
        expect(wrapper.text()).toContain('Mercadona');
        expect(wrapper.find('a[data-prices-tab="/botigues"]').classes()).toContain('active');
        expect(wrapper.find('a[data-prices-tab="/articles"]').classes()).not.toContain('active');
    });

    test('creates a shop', async () => {
        const wrapper = mount(Index, { props: { shopsList } });

        await wrapper.find('input[placeholder^="Nom de la botiga"]').setValue('Lidl');
        await wrapper.find('form').trigger('submit');

        expect(createdForms[0].post).toHaveBeenCalledWith('/botigues', expect.any(Object));
        expect(createdForms[0].reset).toHaveBeenCalled();
    });

    test('edits a shop inline', async () => {
        const wrapper = mount(Index, { props: { shopsList } });

        await wrapper.findAll('button[aria-label="Edita botiga"]')[0].trigger('click');
        const editForm = createdForms.at(-1);
        expect(editForm.name).toBe('Bon Preu');

        await wrapper.findAll('button').find((button) => button.text() === 'Desa').trigger('click');
        expect(editForm.put).toHaveBeenCalledWith('/botigues/1', expect.any(Object));
    });

    test('deletes a shop after confirming', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index, { props: { shopsList } });

        await wrapper.findAll('button[aria-label="Elimina botiga"]')[1].trigger('click');

        expect(router.delete).toHaveBeenCalledWith('/botigues/2', expect.any(Object));
    });

    test('warns how many prices go away when deleting a shop', async () => {
        const wrapper = mount(Index, { props: { shopsList: [{ id: 3, name: 'Lidl', prices_count: 2 }] } });

        await wrapper.find('button[aria-label="Elimina botiga"]').trigger('click');

        expect(window.confirm).toHaveBeenCalledWith('Segur que vols eliminar la botiga "Lidl"? També s\'esborraran els seus 2 preus apuntats.');
    });
});
