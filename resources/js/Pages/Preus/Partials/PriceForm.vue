<script setup>
import { computed, watch } from 'vue';
import { allowedSizeUnits, baseQuantity, formatBaseQuantity, formatUnitPrice, SIZE_UNITS } from './priceUnits';

const props = defineProps({
    form: { type: Object, required: true },
    productsList: { type: Array, required: true },
    shopsList: { type: Array, required: true },
    // { productId: [brands] }; arrives as [] from the server when there are none yet.
    brandsByProduct: { type: [Object, Array], required: true },
    submitLabel: { type: String, default: 'Desa el preu' },
    showCancel: { type: Boolean, default: false },
    // Prefix for the datalist ids, so a create form and an edit form can live on the same page.
    idPrefix: { type: String, default: 'price' },
});

const emit = defineEmits(['submit', 'cancel']);

function normalize(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// The product is typed with suggestions; it only counts once the text matches a product's name.
const selectedProduct = computed(() => props.productsList
    .find((product) => normalize(product.name) === normalize(props.form.product_name ?? '')) ?? null);

watch(selectedProduct, (product) => {
    props.form.product_id = product ? product.id : '';

    // Pick a compatible unit for the product (kg for a product compared by kg, etc.).
    const unitList = allowedSizeUnits(product?.unit ?? null);
    if (!unitList.includes(props.form.size_unit)) {
        props.form.size_unit = product?.unit ?? '';
    }
}, { immediate: true });

const sizeUnitList = computed(() => allowedSizeUnits(selectedProduct.value?.unit ?? null));

const brandList = computed(() => (selectedProduct.value ? props.brandsByProduct[selectedProduct.value.id] ?? [] : []));

// Live "= 9 l · 0,13 €/l" while typing.
const preview = computed(() => {
    const quantity = baseQuantity(props.form.pack_count, props.form.size, props.form.size_unit);
    const price = Number(props.form.price);

    if (quantity === null) {
        return null;
    }

    const unit = SIZE_UNITS[props.form.size_unit].unit;
    const text = `= ${formatBaseQuantity(quantity, unit)}`;

    return price > 0 ? `${text} · ${formatUnitPrice(price / quantity, unit)}` : text;
});
</script>

<template>
    <form class="row g-2 align-items-start" @submit.prevent="emit('submit')">
        <div class="col-12 col-md-4">
            <label class="form-label" :for="`${idPrefix}-product`">Article</label>
            <input
                :id="`${idPrefix}-product`"
                v-model="form.product_name"
                type="text"
                class="form-control form-control-lg"
                :list="`${idPrefix}-products`"
                placeholder="Escriu per cercar…"
                autocomplete="off"
            >
            <datalist :id="`${idPrefix}-products`">
                <option v-for="product in productsList" :key="product.id" :value="product.name" />
            </datalist>
            <div v-if="form.errors.product_id" class="text-danger small mt-1">{{ form.errors.product_id }}</div>
        </div>

        <div class="col-12 col-md-4">
            <label class="form-label" :for="`${idPrefix}-shop`">Botiga</label>
            <select :id="`${idPrefix}-shop`" v-model="form.shop_id" class="form-select form-select-lg">
                <option value="" disabled>Tria una botiga</option>
                <option v-for="shop in shopsList" :key="shop.id" :value="shop.id">{{ shop.name }}</option>
            </select>
            <div v-if="form.errors.shop_id" class="text-danger small mt-1">{{ form.errors.shop_id }}</div>
        </div>

        <div class="col-12 col-md-4">
            <label class="form-label" :for="`${idPrefix}-brand`">Marca / format <span class="text-secondary">(opcional)</span></label>
            <input
                :id="`${idPrefix}-brand`"
                v-model="form.brand"
                type="text"
                class="form-control form-control-lg"
                :list="`${idPrefix}-brands`"
                placeholder="p. ex. Hacendado"
                autocomplete="off"
            >
            <datalist :id="`${idPrefix}-brands`">
                <option v-for="brand in brandList" :key="brand" :value="brand" />
            </datalist>
        </div>

        <div class="col-6 col-md-2">
            <label class="form-label" :for="`${idPrefix}-price`">Preu (€)</label>
            <input
                :id="`${idPrefix}-price`"
                v-model="form.price"
                type="number"
                step="0.01"
                min="0"
                inputmode="decimal"
                class="form-control form-control-lg"
            >
            <div v-if="form.errors.price" class="text-danger small mt-1">{{ form.errors.price }}</div>
        </div>

        <div class="col-6 col-md-4">
            <span class="form-label d-block">Quantitat</span>
            <div class="d-flex align-items-center gap-1">
                <input
                    v-model="form.pack_count"
                    type="number"
                    step="1"
                    min="1"
                    inputmode="numeric"
                    class="form-control form-control-lg quantity-count"
                    aria-label="Unitats del paquet"
                >
                <span class="text-secondary">×</span>
                <input
                    v-model="form.size"
                    type="number"
                    step="0.001"
                    min="0"
                    inputmode="decimal"
                    class="form-control form-control-lg"
                    aria-label="Mida"
                    placeholder="1,5"
                >
                <select v-model="form.size_unit" class="form-select form-select-lg quantity-unit" aria-label="Unitat">
                    <option value="" disabled>—</option>
                    <option v-for="sizeUnit in sizeUnitList" :key="sizeUnit" :value="sizeUnit">{{ sizeUnit }}</option>
                </select>
            </div>
            <div v-for="field in ['pack_count', 'size', 'size_unit']" :key="field">
                <div v-if="form.errors[field]" class="text-danger small mt-1">{{ form.errors[field] }}</div>
            </div>
        </div>

        <div class="col-12 col-md-3">
            <label class="form-label" :for="`${idPrefix}-date`">Data</label>
            <input :id="`${idPrefix}-date`" v-model="form.date" type="date" class="form-control form-control-lg">
            <div v-if="form.errors.date" class="text-danger small mt-1">{{ form.errors.date }}</div>
        </div>

        <div class="col-12 col-md-3 d-flex flex-column justify-content-end">
            <span class="form-label d-none d-md-block">&nbsp;</span>
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary btn-lg flex-grow-1" :disabled="form.processing">
                    {{ submitLabel }}
                </button>
                <button v-if="showCancel" type="button" class="btn btn-outline-secondary btn-lg" @click="emit('cancel')">
                    Cancel·la
                </button>
            </div>
        </div>

        <div class="col-12">
            <div v-if="preview" class="text-secondary" data-price-preview>{{ preview }}</div>
        </div>
    </form>
</template>

<style scoped>
.quantity-count {
    max-width: 4.5rem;
}

.quantity-unit {
    max-width: 5rem;
}
</style>
