import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { describe, expect, test } from 'vitest';
import ExpenseForm from '../../Pages/Despeses/Partials/ExpenseForm.vue';

const categoriesList = [
    {
        id: 1,
        name: 'Menjar',
        subcategories: [{ id: 10, name: 'Supermercats', category_id: 1 }],
    },
    {
        id: 2,
        name: 'Transport',
        subcategories: [
            { id: 20, name: 'Gasolina', category_id: 2 },
            { id: 21, name: 'Pàrquing públic', category_id: 2 },
        ],
    },
];

const banksList = [
    { id: 100, name: 'Banc A' },
    { id: 101, name: 'Banc B' },
];

function makeForm(overrides = {}) {
    return reactive({
        category_id: '',
        subcategory_id: '',
        bank_id: '',
        amount: '',
        date: '2026-09-19',
        note: '',
        errors: {},
        processing: false,
        ...overrides,
    });
}

describe('ExpenseForm', () => {
    test('only shows subcategories of the selected category', async () => {
        const form = makeForm({ category_id: 2 });
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList } });

        const subcategoryOptions = wrapper.findAll('select')[1].findAll('option');

        expect(subcategoryOptions.map((option) => option.text())).toEqual([
            'Selecciona subcategoria',
            'Gasolina',
            'Pàrquing públic',
        ]);
    });

    test('resets the subcategory when the category changes', async () => {
        const form = makeForm({ category_id: 1, subcategory_id: 10 });
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList } });

        await wrapper.findAll('select')[0].setValue('2');

        expect(form.subcategory_id).toBe('');
    });

    test('emits submit when the form is submitted', async () => {
        const form = makeForm();
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList } });

        await wrapper.find('form').trigger('submit.prevent');

        expect(wrapper.emitted('submit')).toHaveLength(1);
    });

    test('shows validation errors from the form', () => {
        const form = makeForm({ errors: { amount: "L'import ha de ser més gran que 0." } });
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList } });

        expect(wrapper.text()).toContain("L'import ha de ser més gran que 0.");
    });

    test('shows the cancel button only when showCancel is true', () => {
        const form = makeForm();
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList, showCancel: true } });

        expect(wrapper.text()).toContain('Cancel·la');
    });

    test('lists the banks with a "Cap" option for no bank', () => {
        const form = makeForm();
        const wrapper = mount(ExpenseForm, { props: { form, categoriesList, banksList } });

        const bankOptions = wrapper.findAll('select')[2].findAll('option');

        expect(bankOptions.map((option) => option.text())).toEqual(['Cap', 'Banc A', 'Banc B']);
    });
});
