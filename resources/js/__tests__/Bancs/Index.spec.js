import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Bancs/Index.vue';

let banksList;

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
    usePage: () => ({ props: { banksList }, url: '/bancs' }),
    useForm: (initial) => makeForm(initial),
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

beforeEach(() => {
    banksList = [
        { id: 1, name: 'Banc A' },
        { id: 2, name: 'Banc B' },
    ];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Bancs/Index', () => {
    test('shows the empty state when there are no banks', () => {
        banksList = [];
        const wrapper = mount(Index);

        expect(wrapper.text()).toContain('Encara no hi ha bancs registrats.');
    });

    test('lists the banks', () => {
        const wrapper = mount(Index);

        expect(wrapper.text()).toContain('Banc A');
        expect(wrapper.text()).toContain('Banc B');
    });

    test('clicking the edit button switches the row into edit mode', async () => {
        const wrapper = mount(Index);

        await wrapper.find('button[aria-label="Edita banc"]').trigger('click');

        expect(wrapper.text()).toContain('Cancel·la');
        expect(wrapper.findAll('input[type="text"]').some((input) => input.element.value === 'Banc A')).toBe(true);
    });

    test('deleting a bank asks for confirmation before calling the server', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mount(Index);

        await wrapper.find('button[aria-label="Elimina banc"]').trigger('click');

        expect(window.confirm).toHaveBeenCalled();
        expect(router.delete).toHaveBeenCalledWith('/bancs/1', { preserveScroll: true });
    });
});
