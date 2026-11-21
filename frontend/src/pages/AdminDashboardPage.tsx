import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  LogOut,
  Package,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { deleteProduct, getAdminOrders, updateOrderStatus } from '../api/admin';
import { getCategories, getProducts } from '../api/shop';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { OrderDetailDrawer } from '../components/admin/OrderDetailDrawer';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { ProductImage } from '../components/ui/ProductImage';
import { StockBadge } from '../components/ui/StockBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import type { Category, Order, OrderStatus, PaginationMeta, Product } from '../types';
import { formatDateTime, formatRupiah } from '../utils/format';
import { EXPO_OUT, TAB_SPRING } from '../utils/motion';
import { getOrderStatusMeta, ORDER_STATUS_LIST } from '../utils/orderStatus';

type WorkspaceView = 'inventory' | 'orders';
type StockFilter = 'all' | 'low' | 'out';

export function AdminDashboardPage() {
  useSmoothScroll(true);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState<WorkspaceView>('inventory');
  const [categories, setCategories] = useState<Category[]>([]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productMeta, setProductMeta] = useState<PaginationMeta>({});
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [productPage, setProductPage] = useState(1);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderMeta, setOrderMeta] = useState<PaginationMeta>({});
  const [ordersLoadedOnce, setOrdersLoadedOnce] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [orderPage, setOrderPage] = useState(1);
  const [updatingRowId, setUpdatingRowId] = useState<number | null>(null);

  // Modals & Inspector
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [inspectingOrderId, setInspectingOrderId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
      setProductPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setProductLoading(true);
    getProducts({
      search: debouncedSearch || undefined,
      category: productCategory || undefined,
      page: productPage,
      per_page: 25,
    })
      .then((res) => {
        setProducts(res.data);
        setProductMeta(res.meta);
        setProductsLoadedOnce(true);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Gagal memuat inventaris', 'error');
      })
      .finally(() => setProductLoading(false));
  }, [debouncedSearch, productCategory, productPage, showToast]);

  const fetchOrders = useCallback(() => {
    setOrderLoading(true);
    getAdminOrders(orderPage, orderStatusFilter || undefined)
      .then((res) => {
        setOrders(res.data);
        setOrderMeta(res.meta);
        setOrdersLoadedOnce(true);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Gagal memuat pesanan', 'error');
      })
      .finally(() => setOrderLoading(false));
  }, [orderPage, orderStatusFilter, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredProducts = useMemo(() => {
    if (stockFilter === 'out') return products.filter((p) => p.stock <= 0);
    if (stockFilter === 'low') return products.filter((p) => p.stock > 0 && p.stock <= 5);
    return products;
  }, [products, stockFilter]);

  const attentionStockCount = useMemo(
    () => products.filter((p) => p.stock <= 5).length,
    [products],
  );
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders],
  );
  const activeRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
    [orders],
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormModalOpen(true);
  };

  const handleProductSaved = (_saved: Product, mode: 'create' | 'edit') => {
    setFormModalOpen(false);
    setEditingProduct(null);
    showToast(
      mode === 'create' ? 'Produk ditambahkan ke inventaris' : 'Perubahan produk tersimpan',
      'success',
    );
    fetchProducts();
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct || deleteLoading) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(deletingProduct.id);
      showToast(`${deletingProduct.name} dihapus dari inventaris`, 'success');
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus produk', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleInlineStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    if (order.status === nextStatus || updatingRowId === order.id) return;
    setUpdatingRowId(order.id);
    try {
      const res = await updateOrderStatus(order.id, nextStatus);
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: res.data.status } : item,
        ),
      );
      if (nextStatus === 'cancelled') {
        fetchProducts();
      }
      const meta = getOrderStatusMeta(nextStatus);
      showToast(
        nextStatus === 'cancelled'
          ? 'Pesanan dibatalkan & stok dikembalikan'
          : `Status ${order.order_number} → ${meta.label}`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status', 'error');
    } finally {
      setUpdatingRowId(null);
    }
  };

  const handleDrawerOrderUpdated = useCallback(
    (updated: Order) => {
      setOrders((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, status: updated.status } : item,
        ),
      );
      if (updated.status === 'cancelled') {
        fetchProducts();
      }
    },
    [fetchProducts],
  );

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const showProductSkeleton = productLoading && !productsLoadedOnce;
  const isProductRefetching = productLoading && productsLoadedOnce;
  const showOrderSkeleton = orderLoading && !ordersLoadedOnce;
  const isOrderRefetching = orderLoading && ordersLoadedOnce;

  const initials = (user?.name ?? 'AD')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F3EE] lg:flex-row">
      {/* Calm Light Warm-Stone Editorial Sidebar */}
      <aside className="flex shrink-0 flex-col justify-between border-b border-[#1A1A18]/10 bg-[#EBE8E0]/65 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
        <div>
          {/* Brand */}
          <div className="flex h-16 items-center justify-between border-b border-[#1A1A18]/10 px-6">
            <div className="flex items-center gap-2.5">
              <span className="block h-3.5 w-3.5 rounded-[3px] bg-[#1A1A18]" />
              <span className="text-[16px] font-bold tracking-[-0.03em] text-[#1A1A18]">
                MiniShop
              </span>
              <span className="rounded-md border border-[#1A1A18]/12 bg-[#FAF9F6] px-1.5 py-0.5 font-mono text-[9.5px] text-[#63625C] uppercase">
                Admin
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              className="rounded-lg p-1.5 text-[#63625C] transition-colors hover:bg-[#E2DED4] hover:text-[#1A1A18] lg:hidden"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>

          {/* Navigation */}
          <div className="p-3.5">
            <p className="hidden px-3 pb-2 font-mono text-[10px] tracking-[0.1em] text-[#8D8B83] uppercase lg:block">
              Workspace
            </p>
            <nav className="flex gap-1.5 lg:flex-col">
              <button
                type="button"
                onClick={() => setView('inventory')}
                className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-all duration-200 lg:flex-none ${
                  view === 'inventory'
                    ? 'bg-[#FAF9F6] text-[#1A1A18] shadow-[0_1px_2px_rgba(26,26,24,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#63625C] hover:bg-[#FAF9F6]/60 hover:text-[#1A1A18]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Package className="h-4 w-4" strokeWidth={1.25} />
                  <span>Inventaris</span>
                </span>
                <span className="font-mono text-[11px] text-[#63625C] tabular-nums">
                  {productMeta.total ?? products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView('orders')}
                className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-all duration-200 lg:flex-none ${
                  view === 'orders'
                    ? 'bg-[#FAF9F6] text-[#1A1A18] shadow-[0_1px_2px_rgba(26,26,24,0.06)] ring-1 ring-[#1A1A18]/10'
                    : 'text-[#63625C] hover:bg-[#FAF9F6]/60 hover:text-[#1A1A18]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Receipt className="h-4 w-4" strokeWidth={1.25} />
                  <span>Pesanan</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                  {pendingOrdersCount > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#96662E]" />
                  )}
                  <span className="text-[#63625C]">{orderMeta.total ?? orders.length}</span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden border-t border-[#1A1A18]/10 p-4 lg:block">
          <Link
            to="/"
            className="flex items-center justify-between rounded-lg border border-[#1A1A18]/12 bg-[#FAF9F6] px-3.5 py-2 text-[12.5px] font-medium text-[#1A1A18] transition-colors hover:border-[#1A1A18]"
          >
            <span>Lihat Storefront</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#63625C]" strokeWidth={1.25} />
          </Link>

          <div className="mt-4 flex items-center justify-between gap-2.5 px-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1A18] font-mono text-[11px] font-medium text-[#F5F3EE]">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-[#1A1A18]">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="truncate font-mono text-[10px] text-[#63625C]">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Keluar dari backoffice"
              className="rounded-lg p-1.5 text-[#63625C] transition-colors hover:bg-[#F2E1DF] hover:text-[#A1483F]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Editorial Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#1A1A18]/10 bg-[#F5F3EE]/85 px-6 backdrop-blur-md sm:px-8">
          <div>
            <h1 className="font-editorial text-[20px] leading-none text-[#1A1A18]">
              {view === 'inventory' ? 'Inventaris Produk' : 'Manajemen Pesanan'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/15 bg-[#FAF9F6] px-3 py-1.5 text-[12px] font-medium text-[#1A1A18] lg:hidden"
            >
              <span>Toko</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.25} />
            </Link>

            {view === 'inventory' ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A18] px-4 py-2 text-[12.5px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Tambah Produk</span>
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={fetchOrders}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1A1A18]/15 bg-[#FAF9F6] px-3.5 py-2 text-[12.5px] font-medium text-[#1A1A18] transition-colors hover:border-[#1A1A18]"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isOrderRefetching ? 'animate-spin' : ''}`}
                  strokeWidth={1.25}
                />
                <span>Muat Ulang</span>
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 p-6 sm:p-8">
          {/* Refined 4-Card Operational Overview */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setView('inventory');
                setStockFilter('all');
              }}
              className={`rounded-xl border p-5 text-left transition-all duration-200 ${
                view === 'inventory' && stockFilter === 'all'
                  ? 'border-[#1A1A18]/25 bg-[#FAF9F6]'
                  : 'border-[#1A1A18]/10 bg-[#FAF9F6]/70 hover:border-[#1A1A18]/20 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center justify-between text-[#63625C]">
                <span className="text-[12px] font-medium">Total Produk</span>
                <Package className="h-4 w-4" strokeWidth={1.25} />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold text-[#1A1A18] tabular-nums">
                {productMeta.total ?? products.length}
              </p>
              <p className="mt-1 text-[11.5px] text-[#8D8B83]">SKU aktif di katalog</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setView('inventory');
                setStockFilter((prev) => (prev === 'low' ? 'out' : prev === 'out' ? 'all' : 'low'));
              }}
              className={`rounded-xl border p-5 text-left transition-all duration-200 ${
                view === 'inventory' && stockFilter !== 'all'
                  ? 'border-[#96662E]/40 bg-[#F2E7D8]/50'
                  : 'border-[#1A1A18]/10 bg-[#FAF9F6]/70 hover:border-[#1A1A18]/20 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center justify-between text-[#96662E]">
                <span className="text-[12px] font-medium">Stok Menipis / Habis</span>
                <AlertCircle className="h-4 w-4" strokeWidth={1.25} />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold text-[#1A1A18] tabular-nums">
                {attentionStockCount}
              </p>
              <p className="mt-1 text-[11.5px] text-[#8D8B83]">Produk dengan stok ≤ 5</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setView('orders');
                setOrderStatusFilter('pending');
                setOrderPage(1);
              }}
              className={`rounded-xl border p-5 text-left transition-all duration-200 ${
                view === 'orders' && orderStatusFilter === 'pending'
                  ? 'border-[#96662E]/40 bg-[#F2E7D8]/50'
                  : 'border-[#1A1A18]/10 bg-[#FAF9F6]/70 hover:border-[#1A1A18]/20 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center justify-between text-[#63625C]">
                <span className="text-[12px] font-medium">Perlu Diproses</span>
                <Clock className="h-4 w-4 text-[#96662E]" strokeWidth={1.25} />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold text-[#1A1A18] tabular-nums">
                {pendingOrdersCount}
              </p>
              <p className="mt-1 text-[11.5px] text-[#8D8B83]">Order berstatus menunggu</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setView('orders');
                setOrderStatusFilter('');
                setOrderPage(1);
              }}
              className={`rounded-xl border p-5 text-left transition-all duration-200 ${
                view === 'orders' && orderStatusFilter === ''
                  ? 'border-[#4A6B53]/35 bg-[#E4ECE5]/45'
                  : 'border-[#1A1A18]/10 bg-[#FAF9F6]/70 hover:border-[#1A1A18]/20 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center justify-between text-[#3A5641]">
                <span className="text-[12px] font-medium">Nilai Order Aktif</span>
                <Wallet className="h-4 w-4" strokeWidth={1.25} />
              </div>
              <p className="mt-3 font-mono text-xl font-semibold text-[#1A1A18] tabular-nums">
                {formatRupiah(activeRevenue)}
              </p>
              <p className="mt-1 text-[11.5px] text-[#8D8B83]">
                Dari {orderMeta.total ?? orders.length} total pesanan
              </p>
            </button>
          </section>

          {/* Main Tab Content */}
          <AnimatePresence mode="wait">
            {view === 'inventory' ? (
              <motion.section
                key="inventory"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EXPO_OUT }}
                className="relative overflow-hidden rounded-xl border border-[#1A1A18]/10 bg-[#FAF9F6]"
              >
                {/* Toolbar */}
                <div className="relative flex flex-col gap-3 border-b border-[#1A1A18]/8 p-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-[#63625C]"
                      strokeWidth={1.25}
                    />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari nama produk..."
                      className="w-full rounded-lg border border-[#1A1A18]/12 bg-[#F5F3EE]/70 py-2 pr-3 pl-9 text-[13px] text-[#1A1A18] placeholder:text-[#8D8B83] transition-colors focus:border-[#1A1A18]/40 focus:bg-[#FAF9F6] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={productCategory}
                      onChange={(e) => {
                        setProductCategory(e.target.value);
                        setProductPage(1);
                      }}
                      aria-label="Filter kategori"
                      className="rounded-lg border border-[#1A1A18]/12 bg-[#F5F3EE]/70 px-3 py-2 text-[12.5px] text-[#1A1A18] focus:border-[#1A1A18]/40 focus:outline-none"
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                      aria-label="Filter status stok"
                      className="rounded-lg border border-[#1A1A18]/12 bg-[#F5F3EE]/70 px-3 py-2 text-[12.5px] text-[#1A1A18] focus:border-[#1A1A18]/40 focus:outline-none"
                    >
                      <option value="all">Semua Stok</option>
                      <option value="low">Stok Menipis (1–5)</option>
                      <option value="out">Stok Habis (0)</option>
                    </select>
                  </div>

                  {isProductRefetching && (
                    <div className="pointer-events-none absolute right-0 -bottom-px left-0 h-[1.5px] overflow-hidden bg-[#1A1A18]/10">
                      <div className="animate-progress-slide h-full w-1/2 bg-[#1A1A18]" />
                    </div>
                  )}
                </div>

                {/* Table */}
                <div
                  className={`overflow-x-auto transition-opacity duration-200 ${
                    isProductRefetching ? 'opacity-55' : 'opacity-100'
                  }`}
                >
                  <table className="w-full min-w-[700px] text-left text-[13.5px]">
                    <thead className="border-b border-[#1A1A18]/8 bg-[#F5F3EE]/60 text-[11.5px] font-medium text-[#63625C]">
                      <tr>
                        <th className="px-5 py-3">Produk</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                        <th className="px-4 py-3 text-center">Stok</th>
                        <th className="px-5 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A18]/8">
                      {showProductSkeleton ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={5} className="px-5 py-4">
                              <div className="h-10 w-full animate-pulse rounded-lg bg-[#EBE8E0]" />
                            </td>
                          </tr>
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-14 text-center text-[13px] text-[#63625C]">
                            Tidak ada produk yang cocok dengan filter saat ini.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="transition-colors duration-150 hover:bg-[#F5F3EE]/70"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3.5">
                                <ProductImage
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-12 w-10 shrink-0 rounded-lg"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-[#1A1A18]">
                                    {product.name}
                                  </p>
                                  <p className="max-w-sm truncate text-[12px] text-[#63625C]">
                                    {product.description || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-md bg-[#EBE8E0]/80 px-2.5 py-1 text-[11.5px] font-medium text-[#63625C]">
                                {product.category?.name ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                              {formatRupiah(product.price)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <StockBadge stock={product.stock} variant="pill" />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(product)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/15 bg-[#FAF9F6] px-2.5 py-1.5 text-[12px] font-medium text-[#1A1A18] transition-colors hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]"
                                >
                                  <Pencil className="h-3 w-3" strokeWidth={1.25} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingProduct(product)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#A1483F]/25 px-2.5 py-1.5 text-[12px] font-medium text-[#A1483F] transition-colors hover:bg-[#A1483F] hover:text-[#F5F3EE]"
                                >
                                  <Trash2 className="h-3 w-3" strokeWidth={1.25} />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {(productMeta.last_page ?? 1) > 1 && (
                  <div className="flex items-center justify-between border-t border-[#1A1A18]/8 px-5 py-3 font-mono text-[11.5px]">
                    <span className="text-[#63625C] tabular-nums">
                      Halaman {productMeta.current_page} / {productMeta.last_page}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={(productMeta.current_page ?? 1) <= 1}
                        onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-[#1A1A18]/15 p-1 text-[#1A1A18] hover:bg-[#EBE8E0] disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
                      </button>
                      <button
                        type="button"
                        disabled={(productMeta.current_page ?? 1) >= (productMeta.last_page ?? 1)}
                        onClick={() => setProductPage((p) => p + 1)}
                        className="rounded-lg border border-[#1A1A18]/15 p-1 text-[#1A1A18] hover:bg-[#EBE8E0] disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.section>
            ) : (
              <motion.section
                key="orders"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: EXPO_OUT }}
                className="relative overflow-hidden rounded-xl border border-[#1A1A18]/10 bg-[#FAF9F6]"
              >
                {/* Status Filter Bar with layoutId */}
                <div className="no-scrollbar relative flex items-center gap-1 overflow-x-auto border-b border-[#1A1A18]/8 px-4 py-3">
                  {[
                    { value: '', label: 'Semua' },
                    ...ORDER_STATUS_LIST.map((s) => ({ value: s.value, label: s.label })),
                  ].map((tab) => {
                    const active = orderStatusFilter === tab.value;
                    return (
                      <button
                        key={tab.value || 'all'}
                        type="button"
                        onClick={() => {
                          setOrderStatusFilter(tab.value);
                          setOrderPage(1);
                        }}
                        className={`relative shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                          active ? 'text-[#F5F3EE]' : 'text-[#63625C] hover:text-[#1A1A18]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="adminOrderStatusTab"
                            transition={TAB_SPRING}
                            className="absolute inset-0 rounded-lg bg-[#1A1A18]"
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}

                  {isOrderRefetching && (
                    <div className="pointer-events-none absolute right-0 -bottom-px left-0 h-[1.5px] overflow-hidden bg-[#1A1A18]/10">
                      <div className="animate-progress-slide h-full w-1/2 bg-[#1A1A18]" />
                    </div>
                  )}
                </div>

                {/* Orders Table with Inline Status Update */}
                <div
                  className={`overflow-x-auto transition-opacity duration-200 ${
                    isOrderRefetching ? 'opacity-55' : 'opacity-100'
                  }`}
                >
                  <table className="w-full min-w-[820px] text-left text-[13.5px]">
                    <thead className="border-b border-[#1A1A18]/8 bg-[#F5F3EE]/60 text-[11.5px] font-medium text-[#63625C]">
                      <tr>
                        <th className="px-5 py-3">No. Order</th>
                        <th className="px-4 py-3">Pelanggan</th>
                        <th className="px-4 py-3 text-center">Item</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-5 py-3 text-right">Rincian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A18]/8">
                      {showOrderSkeleton ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7} className="px-5 py-4">
                              <div className="h-10 w-full animate-pulse rounded-lg bg-[#EBE8E0]" />
                            </td>
                          </tr>
                        ))
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-14 text-center text-[13px] text-[#63625C]">
                            {orderStatusFilter
                              ? 'Tidak ada pesanan dengan status ini.'
                              : 'Belum ada pesanan masuk.'}
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const meta = getOrderStatusMeta(order.status);
                          const isCancelled = order.status === 'cancelled';
                          const isUpdating = updatingRowId === order.id;

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setInspectingOrderId(order.id)}
                              className="cursor-pointer transition-colors duration-150 hover:bg-[#F5F3EE]/70"
                            >
                              <td className="px-5 py-3.5 font-mono text-[12px] font-medium text-[#1A1A18]">
                                {order.order_number}
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="font-medium text-[#1A1A18]">{order.customer_name}</p>
                                <p className="text-[12px] text-[#63625C]">{order.customer_email}</p>
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-[12px] text-[#63625C] tabular-nums">
                                {order.items_count ?? 0} jenis
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono text-[13px] font-medium text-[#1A1A18] tabular-nums">
                                {formatRupiah(order.total_amount)}
                              </td>
                              <td
                                className="px-4 py-3.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isCancelled ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium ${meta.badgeClass}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                                    {meta.label}
                                  </span>
                                ) : (
                                  <select
                                    aria-label={`Ubah status ${order.order_number}`}
                                    disabled={isUpdating}
                                    value={order.status}
                                    onChange={(e) =>
                                      handleInlineStatusChange(
                                        order,
                                        e.target.value as OrderStatus,
                                      )
                                    }
                                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors focus:outline-none disabled:opacity-50 ${meta.badgeClass}`}
                                  >
                                    {ORDER_STATUS_LIST.map((opt) => (
                                      <option
                                        key={opt.value}
                                        value={opt.value}
                                        className="bg-[#FAF9F6] text-[#1A1A18]"
                                      >
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[11.5px] text-[#63625C] tabular-nums">
                                {formatDateTime(order.created_at)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingOrderId(order.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#1A1A18]/15 bg-[#FAF9F6] px-2.5 py-1.5 text-[12px] font-medium text-[#1A1A18] transition-colors hover:border-[#1A1A18] hover:bg-[#1A1A18] hover:text-[#F5F3EE]"
                                >
                                  <Eye className="h-3.5 w-3.5" strokeWidth={1.25} />
                                  Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {(orderMeta.last_page ?? 1) > 1 && (
                  <div className="flex items-center justify-between border-t border-[#1A1A18]/8 px-5 py-3 font-mono text-[11.5px]">
                    <span className="text-[#63625C] tabular-nums">
                      Halaman {orderMeta.current_page} / {orderMeta.last_page}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={(orderMeta.current_page ?? 1) <= 1}
                        onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-[#1A1A18]/15 p-1 text-[#1A1A18] hover:bg-[#EBE8E0] disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
                      </button>
                      <button
                        type="button"
                        disabled={(orderMeta.current_page ?? 1) >= (orderMeta.last_page ?? 1)}
                        onClick={() => setOrderPage((p) => p + 1)}
                        className="rounded-lg border border-[#1A1A18]/15 p-1 text-[#1A1A18] hover:bg-[#EBE8E0] disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ProductFormModal
        isOpen={formModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setFormModalOpen(false)}
        onSaved={handleProductSaved}
      />

      <DeleteConfirmModal
        product={deletingProduct}
        deleting={deleteLoading}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />

      <OrderDetailDrawer
        orderId={inspectingOrderId}
        onClose={() => setInspectingOrderId(null)}
        onOrderUpdated={handleDrawerOrderUpdated}
      />
    </div>
  );
}
