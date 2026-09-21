import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Login from '../../Pages/Auth/Login.vue';

let lastForm;
let formErrors;

function makeForm(initial) {
    const form = reactive({
        ...initial,
        errors: formErrors,
        processing: false,
        post: vi.fn((url, options) => options?.onFinish?.()),
        reset: vi.fn(),
    });

    lastForm = form;

    return form;
}

vi.mock('@inertiajs/vue3', () => ({
    useForm: (initial) => makeForm(initial),
}));

beforeEach(() => {
    formErrors = {};
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('Auth/Login', () => {
    test('renders the email and password fields', () => {
        const wrapper = mount(Login);

        expect(wrapper.find('input[type="email"]').exists()).toBe(true);
        expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    });

    test('submits the entered credentials to /login', async () => {
        const wrapper = mount(Login);

        await wrapper.find('input[type="email"]').setValue('user@example.com');
        await wrapper.find('input[type="password"]').setValue('secret123');
        await wrapper.find('form').trigger('submit.prevent');

        expect(lastForm.email).toBe('user@example.com');
        expect(lastForm.password).toBe('secret123');
        expect(lastForm.post).toHaveBeenCalledWith('/login', expect.objectContaining({ onFinish: expect.any(Function) }));
    });

    test('shows the validation error returned by the server', () => {
        formErrors = { email: 'Les dades introduïdes no coincideixen amb cap compte.' };

        const wrapper = mount(Login);

        expect(wrapper.text()).toContain('Les dades introduïdes no coincideixen amb cap compte.');
    });
});
