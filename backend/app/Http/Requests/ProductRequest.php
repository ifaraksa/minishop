<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name'        => [$required, 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price'       => [$required, 'integer', 'min:0', 'max:1000000000'],
            'image_url'   => ['nullable', 'url', 'max:500'],
            'stock'       => [$required, 'integer', 'min:0', 'max:1000000'],
        ];
    }
}