<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name'        => ['required', 'string', 'max:100'],
            'customer_email'       => ['required', 'email', 'max:150'],
            'customer_phone'       => ['nullable', 'string', 'max:20'],
            'items'                => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id'   => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'             => 'Keranjang tidak boleh kosong.',
            'items.min'                  => 'Keranjang tidak boleh kosong.',
            'items.*.product_id.exists'  => 'Produk tidak ditemukan.',
            'items.*.product_id.distinct'=> 'Produk yang sama tidak boleh muncul dua kali.',
            'items.*.quantity.min'       => 'Jumlah minimal 1.',
        ];
    }
}