<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Exceptions\InsufficientStockException;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        $exceptions->render(fn (ValidationException $e) =>
            ApiResponse::error('Validasi gagal', 'VALIDATION_ERROR', 422, $e->errors()));

        $exceptions->render(fn (InsufficientStockException $e) =>
            ApiResponse::error($e->getMessage(), 'INSUFFICIENT_STOCK', 409, $e->details));

        $exceptions->render(fn (AuthenticationException $e) =>
            ApiResponse::error('Belum login', 'UNAUTHENTICATED', 401));

        $exceptions->render(fn (AccessDeniedHttpException $e) =>
            ApiResponse::error('Tidak punya akses', 'FORBIDDEN', 403));

        $exceptions->render(fn (NotFoundHttpException $e) =>
            ApiResponse::error('Data tidak ditemukan', 'NOT_FOUND', 404));

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $code = match ($status) {
                    403 => 'FORBIDDEN',
                    404 => 'NOT_FOUND',
                    405 => 'METHOD_NOT_ALLOWED',
                    429 => 'TOO_MANY_REQUESTS',
                    default => 'HTTP_ERROR',
                };
                $defaultMessage = match ($status) {
                    403 => 'Tidak punya akses',
                    404 => 'Data tidak ditemukan',
                    405 => 'Method tidak diizinkan',
                    429 => 'Terlalu banyak permintaan, coba lagi sebentar',
                    default => 'Request tidak valid',
                };

                return ApiResponse::error(
                    $e->getMessage() ?: $defaultMessage,
                    $code,
                    $status,
                );
            }

            return ApiResponse::error(
                config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada server',
                'SERVER_ERROR',
                500,
            );
        });
    })
    ->create();