<script setup>
import { computed, ref } from 'vue';
import { Link } from '@inertiajs/vue3';
import { IconCircleCheck } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import PricesTabs from '../../Components/PricesTabs.vue';
import { formatQuantity, formatUnitPrice } from './Partials/priceUnits';

const props = defineProps({
    // { id, name, group, unit, options: [{ shop, brand, price, pack_count, size, size_unit, date,
    //   base_unit, unit_price, is_cheapest, difference }] }, options cheapest first.
    comparisonList: { type: Array, required: true },
});

const UNIT_NAMES = { kg: 'per quilo', l: 'per litre', u: 'per unitat' };
// A price older than this is shown greyed out: it may have changed since.
const OLD_PRICE_DAYS = 90;
const NO_GROUP = 'Sense grup';

function normalize(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// --- Filters ---
const searchTerm = ref('');
const groupFilter = ref('');

const groupList = computed(() => [...new Set(props.comparisonList.map((product) => product.group ?? NO_GROUP))]
    .sort((first, second) => first.localeCompare(second, 'ca')));

const filteredList = computed(() => {
    const term = normalize(searchTerm.value.trim());

    return props.comparisonList.filter((product) => (term === '' || normalize(product.name).includes(term))
        && (groupFilter.value === '' || (product.group ?? NO_GROUP) === groupFilter.value));
});

// --- Summary: in how many products each shop is the cheapest (ties count for every tied shop) ---
const cheapestByShop = computed(() => {
    const countByShop = new Map();

    filteredList.value.forEach((product) => {
        const shops = new Set(product.options.filter((option) => option.is_cheapest).map((option) => option.shop));
        shops.forEach((shop) => countByShop.set(shop, (countByShop.get(shop) ?? 0) + 1));
    });

    return [...countByShop.entries()]
        .map(([shop, count]) => ({ shop, count }))
        .sort((first, second) => second.count - first.count || first.shop.localeCompare(second.shop, 'ca'));
});

// --- Formatting ---
function formatPrice(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDifference(difference) {
    return new Intl.NumberFormat('ca-ES', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' })
        .format(difference);
}

function formatShortDate(isoDate) {
    const [, month, day] = isoDate.split('-');

    return `${day}/${month}`;
}

function daysAgo(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const now = new Date();

    return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(year, month - 1, day)) / 86400000);
}

function isOld(isoDate) {
    return daysAgo(isoDate) > OLD_PRICE_DAYS;
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

        <div v-if="comparisonList.length === 0" class="text-center text-muted py-5">
            Encara no hi ha preus per comparar.
            <Link href="/preus">Apunta'n algun</Link>.
        </div>

        <template v-else>
            <div class="card mb-3">
                <div class="card-body">
                    <div class="text-secondary small mb-2">On és més barat (articles en què cada botiga té el millor preu)</div>
                    <div class="d-flex flex-wrap gap-2" data-cheapest-summary>
                        <span
                            v-for="item in cheapestByShop"
                            :key="item.shop"
                            class="badge bg-green-lt fs-5"
                            :data-shop-summary="item.shop"
                        >
                            {{ item.shop }}: {{ item.count }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="row g-2 mb-3 align-items-center">
                <div class="col-12 col-md-5">
                    <input
                        v-model="searchTerm"
                        type="search"
                        class="form-control"
                        placeholder="Cerca un article…"
                        aria-label="Cerca un article"
                    >
                </div>
                <div class="col-12 col-md-4">
                    <select v-model="groupFilter" class="form-select" aria-label="Filtra per grup">
                        <option value="">Tots els grups</option>
                        <option v-for="group in groupList" :key="group" :value="group">{{ group }}</option>
                    </select>
                </div>
                <div class="col text-md-end text-secondary small" data-comparison-count>
                    {{ filteredList.length }} articles amb preus
                </div>
            </div>

            <div v-if="filteredList.length === 0" class="text-center text-muted py-4">
                Cap article coincideix amb la cerca.
            </div>

            <div class="row row-cards">
                <div v-for="product in filteredList" :key="product.id" class="col-12 col-lg-6" :data-comparison-product="product.id">
                    <div class="card h-100">
                        <div class="card-header">
                            <div>
                                <h3 class="card-title">{{ product.name }}</h3>
                                <div class="text-secondary small">
                                    {{ [product.group, UNIT_NAMES[product.unit]].filter(Boolean).join(' · ') }}
                                </div>
                            </div>
                        </div>
                        <div class="list-group list-group-flush">
                            <div
                                v-for="option in product.options"
                                :key="option.price_id"
                                class="list-group-item"
                                :class="{ 'cheapest-option': option.is_cheapest }"
                                :data-option="option.price_id"
                            >
                                <div class="d-flex justify-content-between align-items-start gap-2">
                                    <div>
                                        <div>
                                            <IconCircleCheck
                                                v-if="option.is_cheapest"
                                                :size="18"
                                                class="text-green me-1 align-text-bottom"
                                            />
                                            <span class="fw-semibold">{{ option.shop }}</span>
                                            <span v-if="option.brand" class="text-secondary"> · {{ option.brand }}</span>
                                        </div>
                                        <div class="small text-secondary">
                                            {{ formatPrice(option.price) }} ·
                                            {{ formatQuantity(option.pack_count, Number(option.size), option.size_unit) }} ·
                                            <span
                                                :class="{ 'old-price': isOld(option.date) }"
                                                :title="isOld(option.date) ? `Preu de fa ${daysAgo(option.date)} dies: potser ha canviat` : null"
                                                data-option-date
                                            >{{ formatShortDate(option.date) }}</span>
                                        </div>
                                    </div>
                                    <div class="text-end text-nowrap">
                                        <div class="fw-semibold" data-option-unit-price>
                                            {{ formatUnitPrice(option.unit_price, option.base_unit) }}
                                        </div>
                                        <div v-if="option.is_cheapest" class="small text-green fw-semibold" data-option-cheapest>
                                            més barat
                                        </div>
                                        <div v-else class="small text-secondary" data-option-difference>
                                            {{ formatDifference(option.difference) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
    </div>
    </AppLayout>
</template>

<style scoped>
.cheapest-option {
    background-color: var(--tblr-green-lt);
}

.old-price {
    opacity: 0.55;
    text-decoration: underline dotted;
    cursor: help;
}
</style>
