import { mount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import { describe, expect, test } from 'vitest';
import PriceForm from '../../Pages/Preus/Partials/PriceForm.vue';

const productsList = [
    { id: 1, name: 'Aigua', unit: 'l' },
    { id: 2, name: 'Arròs', unit: null },
    { id: 3, name: 'Ous', unit: 'u' },
];
const shopsList = [{ id: 10, name: 'Mercadona' }];
const brandsByProduct = { 1: ['Font Vella', 'Hacendado'] };

function makeForm(overrides = {}) {
    return reactive({
        product_name: '',
        product_id: '',
        shop_id: '',
        brand: '',
        price: '',
        pack_count: 1,
        size: '',
        size_unit: '',
        date: '2026-10-21',
        errors: {},
        processing: false,
        ...overrides,
    });
}

function mountForm(form) {
    return mount(PriceForm, { props: { form, productsList, shopsList, brandsByProduct } });
}

describe('PriceForm', () => {
    test('selects the product when the typed name matches, ignoring accents and case', async () => {
        const form = makeForm();
        const wrapper = mountForm(form);

        await wrapper.find('#price-product').setValue('arros');
        expect(form.product_id).toBe(2);

        await wrapper.find('#price-product').setValue('arr');
        expect(form.product_id).toBe('');
    });

    test('offers only the units compatible with the product, picking its own by default', async () => {
        const form = makeForm();
        const wrapper = mountForm(form);

        await wrapper.find('#price-product').setValue('Aigua');

        const unitOptions = wrapper.findAll('select[aria-label="Unitat"] option:not([disabled])').map((option) => option.text());
        expect(unitOptions).toEqual(['ml', 'l']);
        expect(form.size_unit).toBe('l');
    });

    test('offers every unit for a product without unit yet', async () => {
        const form = makeForm();
        const wrapper = mountForm(form);

        await wrapper.find('#price-product').setValue('Arròs');

        expect(wrapper.findAll('select[aria-label="Unitat"] option:not([disabled])')).toHaveLength(5);
    });

    test('suggests the brands already used for the selected product', async () => {
        const form = makeForm();
        const wrapper = mountForm(form);

        expect(wrapper.findAll('#price-brands option')).toHaveLength(0);
        await wrapper.find('#price-product').setValue('Aigua');

        expect(wrapper.findAll('#price-brands option').map((option) => option.attributes('value')))
            .toEqual(['Font Vella', 'Hacendado']);
    });

    test('shows the total quantity and the price per unit while typing', async () => {
        const form = makeForm({ product_name: 'Aigua' });
        const wrapper = mountForm(form);
        await nextTick();

        form.pack_count = 6;
        form.size = 1.5;
        await nextTick();
        expect(wrapper.find('[data-price-preview]').text()).toBe('= 9 l');

        form.price = 1.2;
        await nextTick();
        expect(wrapper.find('[data-price-preview]').text()).toMatch(/^= 9 l · 0,13\s€\/l$/);
    });

    test('shows the server errors under each field', () => {
        const form = makeForm({ errors: { product_id: 'Tria un article de la llista.', size_unit: 'Aquest article es compara per volum (ml o l).' } });
        const wrapper = mountForm(form);

        expect(wrapper.text()).toContain('Tria un article de la llista.');
        expect(wrapper.text()).toContain('Aquest article es compara per volum (ml o l).');
    });

    test('emits submit and cancel', async () => {
        const wrapper = mount(PriceForm, {
            props: { form: makeForm(), productsList, shopsList, brandsByProduct, showCancel: true },
        });

        await wrapper.find('form').trigger('submit');
        await wrapper.findAll('button').find((button) => button.text() === 'Cancel·la').trigger('click');

        expect(wrapper.emitted('submit')).toHaveLength(1);
        expect(wrapper.emitted('cancel')).toHaveLength(1);
    });
});
