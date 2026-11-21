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
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
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

    $exceptions->render(fn (\Throwable $e, Request $request) =>
        $request->is('api/*')
            ? ApiResponse::error(config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada server', 'SERVER_ERROR', 500)
            : null);
    })
    ->create();