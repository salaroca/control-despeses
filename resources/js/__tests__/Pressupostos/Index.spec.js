import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Pressupostos/Index.vue';

const categoriesList = [
    {
        id: 1,
        name: 'Subministres',
        subcategories: [{ id: 10, name: 'Electricitat', category_id: 1 }],
    },
];

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { categoriesList }, url: '/pressupostos' }),
    router: { post: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

function mountIndex(budgets = []) {
    return mount(Index, { props: { year: 2026, budgets } });
}

describe('Pressupostos/Index', () => {
    test('renders a cell per subcategory and month with the saved amount', () => {
        const wrapper = mountIndex([{ subcategory_id: 10, month: 3, amount: '60.00' }]);

        const marchInput = wrapper.find('input[aria-label="Electricitat - Mar"]');

        expect(marchInput.element.value).toBe('60.00');
    });

    test('shows the yearly total for a subcategory', () => {
        const wrapper = mountIndex([
            { subcategory_id: 10, month: 1, amount: '10.00' },
            { subcategory_id: 10, month: 2, amount: '20.00' },
        ]);

        expect(wrapper.text()).toContain('30,00');
    });

    test('saves the amount when a cell loses focus', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mountIndex();

        const input = wrapper.find('input[aria-label="Electricitat - Gen"]');
        await input.setValue('45');
        await input.trigger('blur');

        expect(router.post).toHaveBeenCalledWith(
            '/pressupostos',
            { subcategory_id: 10, year: 2026, month: 1, amount: 45 },
            expect.objectContaining({ preserveState: true }),
        );
    });

    test('clearing a cell sends a null amount to delete it', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mountIndex([{ subcategory_id: 10, month: 1, amount: '45.00' }]);

        const input = wrapper.find('input[aria-label="Electricitat - Gen"]');
        await input.setValue('');
        await input.trigger('blur');

        expect(router.post).toHaveBeenCalledWith(
            '/pressupostos',
            { subcategory_id: 10, year: 2026, month: 1, amount: null },
            expect.objectContaining({ preserveState: true }),
        );
    });

    test('shows links to the previous and next year', () => {
        const wrapper = mountIndex();
        const links = wrapper.findAll('a');

        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2025')).toBe(true);
        expect(links.some((link) => link.attributes('href') === '/pressupostos?year=2027')).toBe(true);
    });
});
