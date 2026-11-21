import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Image as ImageIcon, Loader2, Save, X } from 'lucide-react';
import { createProduct, updateProduct } from '../../api/admin';
import { ApiRequestError } from '../../api/client';
import type { Category, Product } from '../../types';
import { EXPO_OUT, MODAL_TRANSITION } from '../../utils/motion';
import { ProductImage } from '../ui/ProductImage';

interface ProductFormModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product, mode: 'create' | 'edit') => void;
}

export function ProductFormModal({
  isOpen,
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);
  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setCategoryId(String(product?.category?.id ?? categories[0]?.id ?? ''));
    setName(product?.name ?? '');
    setDescription(product?.description ?? '');
    setPrice(product ? String(product.price) : '');
    setStock(product ? String(product.stock) : '10');
    setImageUrl(product?.image_url ?? '');
    setGeneralError(null);
    setFieldErrors({});
  }, [isOpen, product, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, submitting, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    const payload = {
      category_id: Number(categoryId),
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      stock: Number(stock),
      image_url: imageUrl.trim() || null,
    };

    try {
      const response =
        isEdit && product
          ? await updateProduct(product.id, payload)
          : await createProduct(payload);

      onSaved(response.data, isEdit ? 'edit' : 'create');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'VALIDATION_ERROR') {
          setFieldErrors(err.getFieldErrors());
          setGeneralError('Periksa kembali kolom yang masih belum valid.');
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Gagal menyimpan produk.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-form-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A18]/35 p-4 backdrop-blur-[2px]"
          onClick={() => !submitting && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={MODAL_TRANSITION}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#1A1A18]/12 bg-[#FAF9F6] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1A1A18]/10 px-6 py-4">
              <div>
                <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#63625C] uppercase">
                  INVENTARIS / {isEdit ? `EDIT #${product?.id}` : 'BARU'}
                </span>
                <h2
                  id="product-form-title"
                  className="font-editorial mt-0.5 text-[24px] leading-none text-[#1A1A18]"
                >
                  {isEdit ? 'Ubah Produk' : 'Tambah Produk'}
                </h2>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                aria-label="Tutup form produk"
                className="flex h-8 w-8 items-center justify-center text-[#63625C] transition-colors hover:text-[#1A1A18]"
              >
                <X className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {generalError && (
                <div className="rounded-[2px] border border-[#A1483F]/30 bg-[#F2E1DF] px-3.5 py-2.5 text-xs font-medium text-[#A1483F]">
                  {generalError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="prod_name"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Nama Produk <span className="text-[#A1483F]">*</span>
                  </label>
                  <input
                    id="prod_name"
                    type="text"
                    required
                    maxLength={150}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Botol Minum Stainless 500 ml"
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="prod_category"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Kategori <span className="text-[#A1483F]">*</span>
                  </label>
                  <select
                    id="prod_category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none"
                  >
                    <option value="" disabled>
                      Pilih kategori
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category_id && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.category_id}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prod_price"
                      className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                    >
                      Harga (Rp) <span className="text-[#A1483F]">*</span>
                    </label>
                    <input
                      id="prod_price"
                      type="number"
                      required
                      min={0}
                      max={1000000000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="150000"
                      className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3 py-2.5 font-mono text-[13.5px] text-[#1A1A18] tabular-nums focus:border-[#1A1A18] focus:outline-none"
                    />
                    {fieldErrors.price && (
                      <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="prod_stock"
                      className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                    >
                      Stok <span className="text-[#A1483F]">*</span>
                    </label>
                    <input
                      id="prod_stock"
                      type="number"
                      required
                      min={0}
                      max={1000000}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3 py-2.5 font-mono text-[13.5px] text-[#1A1A18] tabular-nums focus:border-[#1A1A18] focus:outline-none"
                    />
                    {fieldErrors.stock && (
                      <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.stock}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="prod_image"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    URL Gambar <span className="text-[#8D8B83] lowercase">(opsional)</span>
                  </label>
                  <div className="mt-1.5 flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        id="prod_image"
                        type="url"
                        maxLength={500}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="http://localhost:8000/images/products/..."
                        className="w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[13.5px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none"
                      />
                      {fieldErrors.image_url && (
                        <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.image_url}</p>
                      )}
                    </div>
                    <div className="h-11 w-9 shrink-0 overflow-hidden rounded-[2px] border border-[#1A1A18]/15 bg-[#EAE7DF]">
                      {imageUrl.trim() ? (
                        <ProductImage
                          key={imageUrl}
                          src={imageUrl.trim()}
                          alt="Preview"
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8D8B83]">
                          <ImageIcon className="h-4 w-4" strokeWidth={1.25} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="prod_desc"
                    className="block font-mono text-[11px] tracking-[0.08em] text-[#63625C] uppercase"
                  >
                    Deskripsi
                  </label>
                  <textarea
                    id="prod_desc"
                    rows={3}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tulis deskripsi singkat produk..."
                    className="mt-1.5 w-full rounded-[2px] border border-[#1A1A18]/20 bg-[#FAF9F6] px-3.5 py-2.5 text-[14px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none"
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-xs text-[#A1483F]">{fieldErrors.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#1A1A18]/10 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="rounded-[2px] border border-[#1A1A18]/20 px-4 py-2 text-[12px] font-medium text-[#63625C] transition-colors hover:border-[#1A1A18] hover:text-[#1A1A18]"
                >
                  Batal
                </button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-[2px] bg-[#1A1A18] px-5 py-2 text-[12px] font-medium text-[#F5F3EE] transition-colors hover:bg-[#2F2F2C] disabled:opacity-55"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.25} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" strokeWidth={1.25} />
                      <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
