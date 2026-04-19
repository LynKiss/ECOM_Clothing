import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, PackageSearch, X, Save, LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../hooks/useToast';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import Modal from '../components/shared/Modal';

type Category = {
  categoryId: string;
  categoryName: string;
};

type Product = {
  productId: string;
  productName: string;
  productSlug?: string;
  categoryId: string;
  productPrice: string;
  productPriceSale: string | null;
  quantityAvailable: number;
  unit: string | null;
  description?: string | null;
  isShow: boolean;
  effectivePrice?: string;
};

type ProductResponse = {
  items: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ProductPayload = {
  productName: string;
  productSlug?: string;
  categoryId: string;
  productPrice: string;
  productPriceSale?: string;
  quantityAvailable?: number;
  unit?: string;
  description?: string;
  isShow?: boolean;
};

type ProductFormState = {
  productName: string;
  productSlug: string;
  categoryId: string;
  productPrice: string;
  productPriceSale: string;
  quantityAvailable: string;
  unit: string;
  description: string;
  isShow: boolean;
};

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const defaultFormState: ProductFormState = {
  productName: '',
  productSlug: '',
  categoryId: '',
  productPrice: '',
  productPriceSale: '',
  quantityAvailable: '0',
  unit: '',
  description: '',
  isShow: true,
};

export default function Products() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [language],
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formState, setFormState] = useState<ProductFormState>(defaultFormState);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [categoriesData, productsData] = await Promise.all([
          apiClient.get<Category[]>('/categories/admin'),
          apiClient.get<ProductResponse>(
            `/products?includeHidden=true&limit=24${selectedCategory !== 'all' ? `&categoryId=${selectedCategory}` : ''}${
              search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
            }`,
          ),
        ]);

        if (cancelled) return;
        setCategories(categoriesData);
        setProducts(productsData.items);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : isVietnamese ? 'Không tải được danh sách sản phẩm' : 'Unable to load products');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, search, selectedCategory, isVietnamese]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.categoryId, category.categoryName])),
    [categories],
  );

  function resetForm() {
    setFormState(defaultFormState);
    setEditingProductId(null);
    setFormErrors({});
    setProductModalOpen(false);
  }

  function startEdit(product: Product) {
    setEditingProductId(product.productId);
    setFormErrors({});
    setProductModalOpen(true);
    setFormState({
      productName: product.productName,
      productSlug: product.productSlug ?? '',
      categoryId: product.categoryId,
      productPrice: product.productPrice,
      productPriceSale: product.productPriceSale ?? '',
      quantityAvailable: String(product.quantityAvailable),
      unit: product.unit ?? '',
      description: product.description ?? '',
      isShow: product.isShow,
    });
  }

  function openCreateModal() {
    setEditingProductId(null);
    setFormState(defaultFormState);
    setFormErrors({});
    setProductModalOpen(true);
  }

  function buildPayload(): ProductPayload {
    return {
      productName: formState.productName.trim(),
      ...(formState.productSlug.trim() ? { productSlug: formState.productSlug.trim() } : {}),
      categoryId: formState.categoryId,
      productPrice: formState.productPrice.trim(),
      ...(formState.productPriceSale.trim() ? { productPriceSale: formState.productPriceSale.trim() } : {}),
      quantityAvailable: Number(formState.quantityAvailable || '0'),
      ...(formState.unit.trim() ? { unit: formState.unit.trim() } : {}),
      ...(formState.description.trim() ? { description: formState.description.trim() } : {}),
      isShow: formState.isShow,
    };
  }

  function validateForm() {
    const nextErrors: ProductFormErrors = {};

    if (!formState.productName.trim()) {
      nextErrors.productName = isVietnamese ? 'Tên sản phẩm là bắt buộc' : 'Product name is required';
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = isVietnamese ? 'Danh mục là bắt buộc' : 'Category is required';
    }

    if (!formState.productPrice.trim()) {
      nextErrors.productPrice = isVietnamese ? 'Giá bán là bắt buộc' : 'Price is required';
    } else if (Number.isNaN(Number(formState.productPrice)) || Number(formState.productPrice) < 0) {
      nextErrors.productPrice = isVietnamese ? 'Giá bán phải là số hợp lệ' : 'Price must be a valid number';
    }

    if (formState.productPriceSale.trim()) {
      if (Number.isNaN(Number(formState.productPriceSale)) || Number(formState.productPriceSale) < 0) {
        nextErrors.productPriceSale = isVietnamese ? 'Giá khuyến mãi phải là số hợp lệ' : 'Sale price must be a valid number';
      } else if (!Number.isNaN(Number(formState.productPrice)) && Number(formState.productPriceSale) > Number(formState.productPrice)) {
        nextErrors.productPriceSale = isVietnamese ? 'Giá khuyến mãi không nên lớn hơn giá gốc' : 'Sale price should not exceed base price';
      }
    }

    if (Number.isNaN(Number(formState.quantityAvailable)) || Number(formState.quantityAvailable) < 0) {
      nextErrors.quantityAvailable = isVietnamese ? 'Số lượng phải là số hợp lệ' : 'Quantity must be a valid number';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      if (!validateForm()) {
        showToast({
          tone: 'error',
          title: isVietnamese ? 'Biểu mẫu chưa hợp lệ' : 'Invalid form',
          description: isVietnamese
            ? 'Kiểm tra lại các trường đang bị báo lỗi.'
            : 'Please review the fields with validation errors.',
        });
        return;
      }

      const payload = buildPayload();

      if (editingProductId) {
        await apiClient.patch(`/products/${editingProductId}`, payload);
        showToast({
          tone: 'success',
          title: isVietnamese ? 'Cập nhật sản phẩm thành công' : 'Product updated',
          description: payload.productName,
        });
      } else {
        await apiClient.post('/products', payload);
        showToast({
          tone: 'success',
          title: isVietnamese ? 'Tạo sản phẩm thành công' : 'Product created',
          description: payload.productName,
        });
      }

      resetForm();
      setReloadKey((value) => value + 1);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : isVietnamese ? 'Không lưu được sản phẩm' : 'Unable to save product';
      setError(message);
      showToast({
        tone: 'error',
        title: editingProductId
          ? isVietnamese
            ? 'Cập nhật thất bại'
            : 'Update failed'
          : isVietnamese
            ? 'Tạo sản phẩm thất bại'
            : 'Creation failed',
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!productPendingDelete) {
      return;
    }

    const productId = productPendingDelete.productId;

    setDeletingId(productId);
    setError(null);

    try {
      await apiClient.delete(`/products/${productId}`);

      if (editingProductId === productId) {
        resetForm();
      }

      setReloadKey((value) => value + 1);
      setProductPendingDelete(null);
      showToast({
        tone: 'success',
        title: isVietnamese ? 'Đã xóa sản phẩm' : 'Product deleted',
        description: productId,
      });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : isVietnamese ? 'Không xóa được sản phẩm' : 'Unable to delete product';
      setError(message);
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Xóa sản phẩm thất bại' : 'Delete failed',
        description: message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">{isVietnamese ? 'Quản lý sản phẩm' : 'Product Management'}</h2>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            {isVietnamese
              ? 'Trang này gọi `GET/POST/PATCH/DELETE /api/v1/products` và `GET /api/v1/categories/admin`.'
              : 'This page uses `GET/POST/PATCH/DELETE /api/v1/products` and `GET /api/v1/categories/admin`.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 font-bold text-white shadow-xl shadow-primary/20 transition-all outline-none"
        >
          <Plus size={20} />
          <span>{editingProductId ? (isVietnamese ? 'Tạo sản phẩm mới' : 'Create new product') : isVietnamese ? 'Thêm sản phẩm' : 'Add product'}</span>
        </button>
      </div>

      <section className="grid gap-6">
        <div className="flex flex-wrap items-end gap-4 rounded-[2rem] border border-white bg-white/40 p-4 backdrop-blur-md">
          <div className="min-w-[260px] flex-1">
            <p className="mb-2 ml-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              {isVietnamese ? 'Tìm kiếm sản phẩm' : 'Search products'}
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={isVietnamese ? 'Tìm theo tên sản phẩm...' : 'Search by product name...'}
                className="w-full rounded-2xl border-2 border-primary/5 bg-white py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/20"
              />
            </div>
          </div>
          <div className="min-w-[240px]">
            <p className="mb-2 ml-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              {isVietnamese ? 'Lọc theo danh mục' : 'Filter by category'}
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip label={isVietnamese ? 'Tất cả sản phẩm' : 'All products'} active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} />
              {categories.slice(0, 5).map((category) => (
                <span key={category.categoryId}>
                  <FilterChip
                    label={category.categoryName}
                    active={selectedCategory === category.categoryId}
                    onClick={() => setSelectedCategory(category.categoryId)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-8 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm font-medium text-on-surface-variant">
            {isVietnamese ? 'Đang tải sản phẩm từ backend...' : 'Loading products from backend...'}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/8 text-primary">
              <PackageSearch size={28} />
            </div>
            <div>
              <p className="text-lg font-black text-primary">{isVietnamese ? 'Chưa có dữ liệu phù hợp' : 'No matching data'}</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Backend không trả về sản phẩm nào với bộ lọc hiện tại.'
                  : 'The backend returned no products for the current filters.'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface-variant/5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                <th className="pb-6 pl-4">{isVietnamese ? 'Sản phẩm' : 'Product'}</th>
                <th className="pb-6">{isVietnamese ? 'Danh mục' : 'Category'}</th>
                <th className="pb-6 text-right">{isVietnamese ? 'Giá' : 'Price'}</th>
                <th className="pb-6 text-center">{isVietnamese ? 'Tồn kho' : 'Stock'}</th>
                <th className="pb-6 text-center">{isVietnamese ? 'Hiển thị' : 'Visibility'}</th>
                <th className="pb-6 pr-4 text-right">{isVietnamese ? 'Tác vụ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              {products.map((product, index) => {
                const effectivePrice = Number(product.effectivePrice ?? product.productPriceSale ?? product.productPrice);
                const categoryName = categoriesById.get(product.categoryId) ?? `${isVietnamese ? 'Danh mục' : 'Category'} #${product.categoryId}`;
                const lowStock = product.quantityAvailable <= 10;

                return (
                  <motion.tr
                    key={product.productId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group transition-colors hover:bg-on-surface-variant/5"
                  >
                    <td className="py-6 pl-4">
                      <div>
                        <p className="text-base font-bold text-primary">{product.productName}</p>
                        <p className="mt-0.5 text-[11px] font-bold tracking-wider text-on-surface-variant/40">{product.productId}</p>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="rounded-lg bg-on-surface-variant/5 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
                        {categoryName}
                      </span>
                    </td>
                    <td className="py-6 text-right">
                      <p className="font-black text-on-surface">{currency.format(effectivePrice)}</p>
                      {product.productPriceSale ? (
                        <p className="text-xs text-on-surface-variant/50 line-through">{currency.format(Number(product.productPrice))}</p>
                      ) : null}
                    </td>
                    <td className="py-6 text-center">
                      <span
                        className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ${
                          lowStock ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {product.quantityAvailable} {product.unit ?? (isVietnamese ? 'mục' : 'units')}
                      </span>
                    </td>
                    <td className="py-6 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          product.isShow ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {product.isShow ? (isVietnamese ? 'Hiển thị' : 'Visible') : isVietnamese ? 'Ẩn' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                        <button onClick={() => startEdit(product)} className="rounded-xl p-2 text-on-surface-variant transition-all hover:bg-primary/5 hover:text-primary">
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setProductPendingDelete(product)}
                          disabled={deletingId === product.productId}
                          className="rounded-xl p-2 text-on-surface-variant transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                        >
                          {deletingId === product.productId ? <LoaderCircle size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={productModalOpen}
        onClose={resetForm}
        size="lg"
        title={
          editingProductId
            ? isVietnamese
              ? 'Cập nhật sản phẩm'
              : 'Update product'
            : isVietnamese
              ? 'Tạo sản phẩm'
              : 'Create product'
        }
        description={
          editingProductId
            ? isVietnamese
              ? 'Chỉnh sửa thông tin sản phẩm hiện có.'
              : 'Edit the existing product information.'
            : isVietnamese
              ? 'Nhập thông tin sản phẩm mới để đẩy lên backend.'
              : 'Enter the new product details before sending them to the backend.'
        }
        footer={
          <>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-on-surface/10 px-5 py-3 text-sm font-bold text-on-surface-variant transition hover:border-primary/20 hover:text-primary"
            >
              {isVietnamese ? 'Đóng' : 'Close'}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white transition hover:bg-primary-container disabled:opacity-60"
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {editingProductId ? (isVietnamese ? 'Cập nhật sản phẩm' : 'Update product') : isVietnamese ? 'Tạo sản phẩm' : 'Create product'}
            </button>
          </>
        }
      >
        <div className="grid gap-3">
          <FormInput label={isVietnamese ? 'Tên sản phẩm' : 'Product name'} value={formState.productName} onChange={(value) => setFormState((prev) => ({ ...prev, productName: value }))} />
          <FieldError message={formErrors.productName} />
          <FormInput label="Slug" value={formState.productSlug} onChange={(value) => setFormState((prev) => ({ ...prev, productSlug: value }))} />
          <FormSelect
            label={isVietnamese ? 'Danh mục' : 'Category'}
            value={formState.categoryId}
            onChange={(value) => setFormState((prev) => ({ ...prev, categoryId: value }))}
            options={categories.map((category) => ({ label: category.categoryName, value: category.categoryId }))}
            emptyLabel={isVietnamese ? 'Chọn danh mục' : 'Select category'}
          />
          <FieldError message={formErrors.categoryId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label={isVietnamese ? 'Giá bán' : 'Price'} value={formState.productPrice} onChange={(value) => setFormState((prev) => ({ ...prev, productPrice: value }))} />
            <FormInput label={isVietnamese ? 'Giá khuyến mãi' : 'Sale price'} value={formState.productPriceSale} onChange={(value) => setFormState((prev) => ({ ...prev, productPriceSale: value }))} />
          </div>
          <FieldError message={formErrors.productPrice || formErrors.productPriceSale} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput label={isVietnamese ? 'Số lượng tồn' : 'Stock quantity'} value={formState.quantityAvailable} onChange={(value) => setFormState((prev) => ({ ...prev, quantityAvailable: value }))} />
            <FormInput label={isVietnamese ? 'Đơn vị' : 'Unit'} value={formState.unit} onChange={(value) => setFormState((prev) => ({ ...prev, unit: value }))} />
          </div>
          <FieldError message={formErrors.quantityAvailable} />
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{isVietnamese ? 'Mô tả' : 'Description'}</span>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              rows={4}
              className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary/30"
            />
          </label>
          <label className="mt-1 inline-flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-on-surface">
            <input
              type="checkbox"
              checked={formState.isShow}
              onChange={(event) => setFormState((prev) => ({ ...prev, isShow: event.target.checked }))}
              className="h-4 w-4 rounded border-on-surface/20 accent-primary"
            />
            {isVietnamese ? 'Hiển thị ngoài giao diện bán hàng' : 'Visible on the storefront'}
          </label>
        </div>
      </Modal>

      <Modal
        open={productPendingDelete !== null}
        onClose={() => setProductPendingDelete(null)}
        size="md"
        title={isVietnamese ? 'Xác nhận xóa sản phẩm' : 'Confirm product deletion'}
        description={
          productPendingDelete
            ? isVietnamese
              ? `Sản phẩm "${productPendingDelete.productName}" sẽ bị xóa khỏi hệ thống.`
              : `The product "${productPendingDelete.productName}" will be removed from the system.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setProductPendingDelete(null)}
              className="rounded-2xl border border-on-surface/10 px-5 py-3 text-sm font-bold text-on-surface-variant transition hover:border-primary/20 hover:text-primary"
            >
              {isVietnamese ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deletingId !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deletingId ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isVietnamese ? 'Xóa sản phẩm' : 'Delete product'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-on-surface-variant">
          {isVietnamese
            ? 'Thao tác này không thể hoàn tác. Hãy chắc chắn rằng bạn muốn tiếp tục.'
            : 'This action cannot be undone. Make sure you want to continue.'}
        </p>
      </Modal>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
        active ? 'scale-105 bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-on-surface-variant/70 hover:bg-on-surface-variant/10'
      }`}
    >
      {label}
    </button>
  );
}

function FormInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary/30"
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  emptyLabel: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary/30"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="-mt-1 text-xs font-semibold text-red-600">{message}</p>;
}
