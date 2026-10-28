<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            // A price only makes sense with its product and shop: deleting either deletes its prices.
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            // Brand or format, e.g. "Font Vella" (optional).
            $table->string('brand')->nullable();
            $table->decimal('price', 10, 2);
            // Quantity as "pack_count × size size_unit", e.g. 6 × 1.5 l.
            $table->unsignedInteger('pack_count')->default(1);
            $table->decimal('size', 10, 3);
            $table->string('size_unit', 2);
            $table->date('date');
            $table->timestamps();

            $table->index(['product_id', 'shop_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};
