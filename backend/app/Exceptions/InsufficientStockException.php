<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(
        public readonly array $details = [],
        string $message = 'Stok tidak mencukupi',
    ) {
        parent::__construct($message);
    }
}