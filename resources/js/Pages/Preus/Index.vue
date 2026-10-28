<script setup>
import { ref } from 'vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { IconPencil, IconTrash } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import PricesTabs from '../../Components/PricesTabs.vue';
import PriceForm from './Partials/PriceForm.vue';
import { formatQuantity, formatUnitPrice } from './Partials/priceUnits';

defineProps({
    prices: { type: Object, required: true },
    productsList: { type: Array, required: true },
    shopsList: { type: Array, required: true },
    brandsByProduct: { type: [Object, Array], required: true },
});

const LAST_SHOP_KEY = 'prices.lastShopId';

function readLastShopId() {
    try {
        const stored = Number(localStorage.getItem(LAST_SHOP_KEY));

        return stored > 0 ? stored : '';
    } catch (e) {
        return '';
    }
}

function rememberShop(shopId) {
    try {
        localStorage.setItem(LAST_SHOP_KEY, String(shopId));
    } catch (e) {
        // localStorage not available (private browsing, etc.) — the shop just won't be remembered.
    }
}

function today() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// product_name is only for the search box; the server receives product_id.
function withoutProductName({ product_name: productName, ...data }) {
    return { ...data, brand: data.brand || null };
}

// --- Create: after saving, shop and date stay, so the next price (e.g. a whole receipt) is quick. ---
const createForm = useForm({
    product_name: '',
    product_id: '',
    shop_id: readLastShopId(),
    brand: '',
    price: '',
    pack_count: 1,
    size: '',
    size_unit: '',
    date: today(),
});

function submitCreate() {
    createForm.transform(withoutProductName).post('/preus', {
        preserveScroll: true,
        onSuccess: () => {
            rememberShop(createForm.shop_id);
            createForm.reset('product_name', 'product_id', 'brand', 'price', 'pack_count', 'size', 'size_unit');
        },
    });
}

// --- Edit / delete ---
const editingId = ref(null);
const editForm = ref(null);

function startEdit(price) {
    editingId.value = price.id;
    editForm.value = useForm({
        product_name: price.product.name,
        product_id: price.product_id,
        shop_id: price.shop_id,
        brand: price.brand ?? '',
        price: price.price,
        pack_count: price.pack_count,
        size: Number(price.size),
        size_unit: price.size_unit,
        date: price.date,
    });
}

function cancelEdit() {
    editingId.value = null;
    editForm.value = null;
}

function submitEdit(price) {
    editForm.value.transform(withoutProductName).put(`/preus/${price.id}`, {
        preserveScroll: true,
        onSuccess: () => cancelEdit(),
    });
}

function destroyPrice(price) {
    if (!confirm(`Segur que vols eliminar el preu de "${price.product.name}" a ${price.shop.name}?`)) {
        return;
    }

    router.delete(`/preus/${price.id}`, { preserveScroll: true });
}

function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');

    return `${day}/${month}/${year}`;
}

function formatPrice(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Preus</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <PricesTabs />

        <div v-if="productsList.length === 0 || shopsList.length === 0" class="alert alert-info" data-missing-setup>
            Per apuntar preus cal tenir
            <template v-if="productsList.length === 0"><Link href="/articles">algun article</Link></template>
            <template v-if="productsList.length === 0 && shopsList.length === 0"> i </template>
            <template v-if="shopsList.length === 0"><Link href="/botigues">alguna botiga</Link></template>.
        </div>

        <div v-else class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Apunta un preu</h3>
            </div>
            <div class="card-body">
                <PriceForm
                    :form="createForm"
                    :products-list="productsList"
                    :shops-list="shopsList"
                    :brands-by-product="brandsByProduct"
                    id-prefix="new-price"
                    @submit="submitCreate"
                />
            </div>
        </div>

        <h3 class="mb-2">Últims preus apuntats</h3>

        <div v-if="prices.data.length === 0" class="text-center text-muted py-5">
            Encara no hi ha preus apuntats.
        </div>

        <ul v-else class="list-group mb-3">
            <li v-for="price in prices.data" :key="price.id" class="list-group-item" :data-price-row="price.id">
                <PriceForm
                    v-if="editingId === price.id"
                    :form="editForm"
                    :products-list="productsList"
                    :shops-list="shopsList"
                    :brands-by-product="brandsByProduct"
                    :id-prefix="`edit-price-${price.id}`"
                    submit-label="Desa"
                    show-cancel
                    @submit="submitEdit(price)"
                    @cancel="cancelEdit"
                />
                <div v-else class="d-flex justify-content-between align-items-center gap-2">
                    <div>
                        <div>
                            <span class="fw-semibold">{{ price.product.name }}</span>
                            <span v-if="price.brand" class="text-secondary"> · {{ price.brand }}</span>
                        </div>
                        <div class="text-secondary small">
                            {{ formatDate(price.date) }} · {{ price.shop.name }} ·
                            {{ formatQuantity(price.pack_count, Number(price.size), price.size_unit) }}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <div class="text-end">
                            <div class="fw-semibold" data-price-amount>{{ formatPrice(price.price) }}</div>
                            <div v-if="price.unit_price !== null" class="text-secondary small" data-unit-price>
                                {{ formatUnitPrice(price.unit_price, price.base_unit) }}
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary"
                                aria-label="Edita preu"
                                @click="startEdit(price)"
                            >
                                <IconPencil :size="16" />
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger"
                                aria-label="Elimina preu"
                                @click="destroyPrice(price)"
                            >
                                <IconTrash :size="16" />
                            </button>
                        </div>
                    </div>
                </div>
            </li>
        </ul>

        <div v-if="prices.prev_page_url || prices.next_page_url" class="d-flex justify-content-between">
            <Link v-if="prices.prev_page_url" :href="prices.prev_page_url" class="btn btn-outline-primary" preserve-scroll>
                Anterior
            </Link>
            <span v-else></span>
            <Link v-if="prices.next_page_url" :href="prices.next_page_url" class="btn btn-outline-primary" preserve-scroll>
                Següent
            </Link>
        </div>
    </div>
    </div>
    </AppLayout>
</template>
