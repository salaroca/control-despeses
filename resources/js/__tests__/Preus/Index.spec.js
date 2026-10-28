import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Index from '../../Pages/Preus/Index.vue';

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
        reset: vi.fn((...fields) => fields.forEach((field) => {
            form[field] = initial[field];
        })),
    });

    return form;
}

const createdForms = [];

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/preus' }),
    useForm: (initial) => {
        const form = makeForm(initial);
        createdForms.push(form);

        return form;
    },
    router: { delete: vi.fn() },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

const productsList = [{ id: 1, name: 'Aigua', unit: 'l' }];
const shopsList = [{ id: 10, name: 'Mercadona' }, { id: 11, name: 'Bon Preu' }];

const priceRow = {
    id: 5,
    product_id: 1,
    shop_id: 10,
    brand: 'Hacendado',
    price: '1.20',
    pack_count: 6,
    size: '1.500',
    size_unit: 'l',
    date: '2026-10-21',
    base_unit: 'l',
    base_quantity: 9,
    unit_price: 0.1333,
    product: { id: 1, name: 'Aigua', unit: 'l' },
    shop: { id: 10, name: 'Mercadona' },
};

function mountPage(props = {}) {
    return mount(Index, {
        props: {
            prices: { data: [priceRow], prev_page_url: null, next_page_url: null },
            productsList,
            shopsList,
            brandsByProduct: {},
            ...props,
        },
    });
}

beforeEach(() => {
    createdForms.length = 0;
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('Preus/Index', () => {
    test('asks to create products and shops first when there are none', () => {
        const wrapper = mountPage({ shopsList: [] });

        expect(wrapper.find('[data-missing-setup]').text()).toContain('alguna botiga');
        expect(wrapper.findComponent({ name: 'PriceForm' }).exists()).toBe(false);
    });

    test('starts the form with today and the last shop used', () => {
        localStorage.setItem('prices.lastShopId', '11');
        mountPage();

        expect(createdForms[0].date).toBe('2026-10-21');
        expect(createdForms[0].shop_id).toBe(11);
        expect(createdForms[0].pack_count).toBe(1);
    });

    test('saves a price, then keeps shop and date and clears the rest for the next one', async () => {
        const wrapper = mountPage();
        const form = createdForms[0];
        Object.assign(form, { product_name: 'Aigua', product_id: 1, shop_id: 10, brand: 'Bezoya', price: '2', size: 1.5 });

        await wrapper.find('form').trigger('submit');

        expect(form.post).toHaveBeenCalledWith('/preus', expect.any(Object));
        expect(form.transformer({ product_name: 'Aigua', product_id: 1, brand: '' })).toEqual({ product_id: 1, brand: null });
        expect(localStorage.getItem('prices.lastShopId')).toBe('10');
        expect(form.shop_id).toBe(10);
        expect(form.date).toBe('2026-10-21');
        expect(form.product_name).toBe('');
        expect(form.brand).toBe('');
        expect(form.price).toBe('');
    });

    test('lists the latest prices with brand, shop, quantity and price per unit', () => {
        const wrapper = mountPage();
        const row = wrapper.find('[data-price-row="5"]');

        expect(row.text()).toContain('Aigua');
        expect(row.text()).toContain('Hacendado');
        expect(row.text()).toContain('21/10/2026 · Mercadona · 6 × 1,5 l');
        expect(row.find('[data-price-amount]').text()).toMatch(/1,20\s€/);
        expect(row.find('[data-unit-price]').text()).toMatch(/0,13\s€\/l/);
    });

    test('shows the empty state when there are no prices', () => {
        const wrapper = mountPage({ prices: { data: [], prev_page_url: null, next_page_url: null } });

        expect(wrapper.text()).toContain('Encara no hi ha preus apuntats.');
    });

    test('edits a price inline', async () => {
        const wrapper = mountPage();

        await wrapper.find('button[aria-label="Edita preu"]').trigger('click');
        const editForm = createdForms.at(-1);
        expect(editForm.product_name).toBe('Aigua');
        expect(editForm.size).toBe(1.5);

        await wrapper.find('[data-price-row="5"] form').trigger('submit');
        expect(editForm.put).toHaveBeenCalledWith('/preus/5', expect.any(Object));
    });

    test('deletes a price after confirming', async () => {
        const { router } = await import('@inertiajs/vue3');
        const wrapper = mountPage();

        await wrapper.find('button[aria-label="Elimina preu"]').trigger('click');

        expect(window.confirm).toHaveBeenCalledWith('Segur que vols eliminar el preu de "Aigua" a Mercadona?');
        expect(router.delete).toHaveBeenCalledWith('/preus/5', expect.any(Object));
    });

    test('shows the pagination links', () => {
        const wrapper = mountPage({ prices: { data: [priceRow], prev_page_url: null, next_page_url: '/preus?page=2' } });

        expect(wrapper.find('a[href="/preus?page=2"]').text()).toBe('Següent');
    });

    test('shows the prices tabs with "Apuntar preu" active', () => {
        const wrapper = mountPage();

        expect(wrapper.find('a[data-prices-tab="/preus"]').classes()).toContain('active');
    });
});
