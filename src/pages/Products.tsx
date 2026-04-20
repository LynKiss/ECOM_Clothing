import { useEffect, useMemo, useState } from 'react';
import {
  Edit2,
  FolderTree,
  ImagePlus,
  LoaderCircle,
  PackageSearch,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';
import Modal from '../components/shared/Modal';
import Pagination from '../components/shared/Pagination';
import RichTextEditor from '../components/shared/RichTextEditor';

type CategoryNode = {
  categoryId: string;
  categoryName: string;
  children: CategoryNode[];
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
  isShow: boolean | number;
  effectivePrice?: string;
  primaryImageUrl?: string | null;
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
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductResponse['meta']>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
  });
  const [categoriesTree, setCategoriesTree] = useState<CategoryNode[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') ?? 'all',
  );
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? '24'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [language],
  );

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (search.trim()) nextParams.set('search', search.trim());
    if (selectedCategory !== 'all') nextParams.set('category', selectedCategory);
    if (page > 1) nextParams.set('page', String(page));
    if (limit !== 24) nextParams.set('limit', String(limit));
    setSearchParams(nextParams, { replace: true });
  }, [search, selectedCategory, page, limit, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [categoriesData, productsData] = await Promise.all([
          apiClient.get<CategoryNode[]>('/categories/admin/tree'),
          apiClient.get<ProductResponse>(
            `/products?includeHidden=true&page=${page}&limit=${limit}${
              selectedCategory !== 'all' ? `&categoryId=${selectedCategory}` : ''
            }${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`,
          ),
        ]);

        if (cancelled) return;
        setCategoriesTree(categoriesData);
        setProducts(productsData.items.map(normalizeProduct));
        setMeta(productsData.meta);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : isVietnamese
                ? 'Không tải được danh sách sản phẩm'
                : 'Unable to load products',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [search, selectedCategory, page, limit, reloadKey, isVietnamese]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  const categoryPathMap = useMemo(() => {
    const paths = new Map<string, string>();

    function walk(nodes: CategoryNode[], parents: string[]) {
      for (const node of nodes) {
        const path = [...parents, node.categoryName];
        paths.set(node.categoryId, path.join(' / '));
        walk(node.children ?? [], path);
      }
    }

    walk(categoriesTree, []);
    return paths;
  }, [categoriesTree]);

  const categoryOptions = useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);

  function flattenCategories(nodes: CategoryNode[], level = 0): Array<CategoryNode & { level: number }> {
    return nodes.flatMap((node) => [
      { ...node, level },
      ...flattenCategories(node.children ?? [], level + 1),
    ]);
  }

  function resetForm() {
    setEditingProductId(null);
    setFormState(defaultFormState);
    setFormErrors({});
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setProductModalOpen(false);
    setPreviewModalOpen(false);
  }

  function openCreateModal() {
    resetForm();
    setProductModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProductId(product.productId);
    setFormErrors({});
    setFormState({
      productName: product.productName,
      productSlug: product.productSlug ?? '',
      categoryId: product.categoryId,
      productPrice: product.productPrice,
      productPriceSale: product.productPriceSale ?? '',
      quantityAvailable: String(product.quantityAvailable),
      unit: product.unit ?? '',
      description: product.description ?? '',
      isShow: Boolean(product.isShow),
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(product.primaryImageUrl ?? '');
    setProductModalOpen(true);
  }

  function validateForm() {
    const nextErrors: ProductFormErrors = {};

    if (!formState.productName.trim()) {
      nextErrors.productName = isVietnamese
        ? 'Tên sản phẩm là bắt buộc'
        : 'Product name is required';
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = isVietnamese
        ? 'Danh mục là bắt buộc'
        : 'Category is required';
    }

    if (!formState.productPrice.trim()) {
      nextErrors.productPrice = isVietnamese ? 'Giá bán là bắt buộc' : 'Price is required';
    }

    if (
      formState.quantityAvailable.trim() &&
      (Number.isNaN(Number(formState.quantityAvailable)) ||
        Number(formState.quantityAvailable) < 0)
    ) {
      nextErrors.quantityAvailable = isVietnamese
        ? 'Số lượng phải là số hợp lệ'
        : 'Quantity must be a valid number';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function requestPreview() {
    if (!validateForm()) {
      return;
    }
    setPreviewModalOpen(true);
  }

  function handleImageChange(file: File | null) {
    setSelectedImageFile(file);
    if (!file) {
      setImagePreviewUrl('');
      return;
    }
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function saveProduct() {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        productName: formState.productName.trim(),
        productSlug: formState.productSlug.trim() || undefined,
        categoryId: formState.categoryId,
        productPrice: formState.productPrice.trim(),
        productPriceSale: formState.productPriceSale.trim() || undefined,
        quantityAvailable: Number(formState.quantityAvailable || '0'),
        unit: formState.unit.trim() || undefined,
        description: formState.description.trim() || undefined,
        isShow: formState.isShow,
      };

      const savedProduct = editingProductId
        ? await apiClient.patch<Product>(`/products/${editingProductId}`, payload)
        : await apiClient.post<Product>('/products', payload);

      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        formData.append('isPrimary', 'true');
        await apiClient.postForm(`/products/${savedProduct.productId}/images`, formData);
      }

      showToast({
        tone: 'success',
        title: editingProductId
          ? isVietnamese
            ? 'Cập nhật sản phẩm thành công'
            : 'Product updated'
          : isVietnamese
            ? 'Tạo sản phẩm thành công'
            : 'Product created',
        description: payload.productName,
      });

      resetForm();
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : isVietnamese
            ? 'Không lưu được sản phẩm'
            : 'Unable to save product';
      setError(message);
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Lưu sản phẩm thất bại' : 'Save failed',
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!productPendingDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await apiClient.delete(`/products/${productPendingDelete.productId}`);
      showToast({
        tone: 'success',
        title: isVietnamese ? 'Xóa sản phẩm thành công' : 'Product deleted',
        description: productPendingDelete.productName,
      });
      setDeleteModalOpen(false);
      setProductPendingDelete(null);
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : isVietnamese
            ? 'Không xóa được sản phẩm'
            : 'Unable to delete product';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">
            {isVietnamese ? 'Quản lý sản phẩm' : 'Product Management'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            {isVietnamese
              ? 'Trang này hỗ trợ tìm kiếm, lọc theo cây danh mục, phân trang và xem trước nội dung trước khi lưu.'
              : 'This page supports search, category tree filtering, pagination, and content preview before saving.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 font-bold text-white shadow-xl shadow-primary/20"
        >
          <Plus size={18} />
          {isVietnamese ? 'Thêm sản phẩm' : 'Add product'}
        </button>
      </div>

      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[2rem] border border-white bg-white/50 p-4">
          <p className="mb-2 ml-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            {isVietnamese ? 'Tìm kiếm sản phẩm' : 'Search products'}
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isVietnamese ? 'Tìm theo tên sản phẩm...' : 'Search by product name...'}
              className="w-full rounded-2xl border border-on-surface/10 bg-white py-3 pl-11 pr-4 text-sm outline-none"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary/10 bg-white p-3">
          <p className="mb-3 ml-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            {isVietnamese ? 'Lọc theo danh mục' : 'Filter by category'}
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface text-on-surface'
            }`}
          >
            <span>{isVietnamese ? 'Tất cả sản phẩm' : 'All products'}</span>
            <FolderTree size={16} />
          </button>
          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {categoryOptions
              .filter((category) => category.level === 0 || category.level === 1)
              .map((category) => (
                <button
                  key={category.categoryId}
                  type="button"
                  onClick={() => setSelectedCategory(category.categoryId)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                    selectedCategory === category.categoryId
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface text-on-surface'
                  }`}
                  style={{ paddingLeft: `${16 + category.level * 16}px` }}
                >
                  <span>{category.categoryName}</span>
                </button>
              ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">
            {isVietnamese ? 'Đang tải sản phẩm từ backend...' : 'Loading products...'}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/8 text-primary">
              <PackageSearch size={28} />
            </div>
            <div>
              <p className="text-lg font-black text-primary">
                {isVietnamese ? 'Chưa có dữ liệu phù hợp' : 'No matching data'}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Không có sản phẩm nào phù hợp với bộ lọc hiện tại.'
                  : 'No products match the current filters.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-on-surface-variant/5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  <th className="pb-4 pl-4">{isVietnamese ? 'Sản phẩm' : 'Product'}</th>
                  <th className="pb-4">{isVietnamese ? 'Danh mục' : 'Category'}</th>
                  <th className="pb-4 text-right">{isVietnamese ? 'Giá' : 'Price'}</th>
                  <th className="pb-4 text-center">{isVietnamese ? 'Tồn kho' : 'Stock'}</th>
                  <th className="pb-4 text-center">{isVietnamese ? 'Hiển thị' : 'Visibility'}</th>
                  <th className="pb-4 pr-4 text-right">{isVietnamese ? 'Tác vụ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface-variant/5">
                {products.map((product) => (
                  <tr key={product.productId} className="group hover:bg-on-surface-variant/5">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface">
                          {product.primaryImageUrl ? (
                            <img
                              src={product.primaryImageUrl}
                              alt={product.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImagePlus size={18} className="text-on-surface-variant/40" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary">{product.productName}</p>
                          <p className="text-[11px] text-on-surface-variant/50">{product.productId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {categoryPathMap.get(product.categoryId) ?? `${isVietnamese ? 'Danh mục' : 'Category'} #${product.categoryId}`}
                    </td>
                    <td className="py-4 text-right font-black text-on-surface">
                      {currency.format(Number(product.effectivePrice ?? product.productPriceSale ?? product.productPrice))}
                    </td>
                    <td className="py-4 text-center">
                      {product.quantityAvailable} {product.unit ?? (isVietnamese ? 'mục' : 'units')}
                    </td>
                    <td className="py-4 text-center">
                      {product.isShow ? (isVietnamese ? 'Hiển thị' : 'Visible') : isVietnamese ? 'Ẩn' : 'Hidden'}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="rounded-xl p-2 text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductPendingDelete(product);
                            setDeleteModalOpen(true);
                          }}
                          className="rounded-xl p-2 text-on-surface-variant hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          isVietnamese={isVietnamese}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          pageSizeOptions={[12, 24, 48, 96]}
        />
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
        footer={
          <>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-on-surface/10 px-5 py-3 text-sm font-bold text-on-surface-variant"
            >
              {isVietnamese ? 'Đóng' : 'Close'}
            </button>
            <button
              type="button"
              onClick={requestPreview}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              <Save size={16} />
              {isVietnamese ? 'Xem trước nội dung' : 'Preview content'}
            </button>
          </>
        }
      >
        <div className="grid gap-3">
          <FieldInput
            label={isVietnamese ? 'Tên sản phẩm' : 'Product name'}
            value={formState.productName}
            onChange={(value) => setFormState((prev) => ({ ...prev, productName: value }))}
          />
          <FieldError message={formErrors.productName} />

          <FieldInput
            label="Slug"
            value={formState.productSlug}
            onChange={(value) => setFormState((prev) => ({ ...prev, productSlug: value }))}
          />

          <FieldSelect
            label={isVietnamese ? 'Danh mục' : 'Category'}
            value={formState.categoryId}
            onChange={(value) => setFormState((prev) => ({ ...prev, categoryId: value }))}
            emptyLabel={isVietnamese ? 'Chọn danh mục' : 'Select category'}
            options={categoryOptions.map((category) => ({
              value: category.categoryId,
              label: `${'-- '.repeat(category.level)}${category.categoryName}`,
            }))}
          />
          <FieldError message={formErrors.categoryId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput
              label={isVietnamese ? 'Giá bán' : 'Price'}
              value={formState.productPrice}
              onChange={(value) => setFormState((prev) => ({ ...prev, productPrice: value }))}
            />
            <FieldInput
              label={isVietnamese ? 'Giá khuyến mãi' : 'Sale price'}
              value={formState.productPriceSale}
              onChange={(value) => setFormState((prev) => ({ ...prev, productPriceSale: value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput
              label={isVietnamese ? 'Số lượng tồn' : 'Stock quantity'}
              value={formState.quantityAvailable}
              onChange={(value) => setFormState((prev) => ({ ...prev, quantityAvailable: value }))}
            />
            <FieldInput
              label={isVietnamese ? 'Đơn vị' : 'Unit'}
              value={formState.unit}
              onChange={(value) => setFormState((prev) => ({ ...prev, unit: value }))}
            />
          </div>
          <FieldError message={formErrors.quantityAvailable} />

          <RichTextEditor
            label={isVietnamese ? 'Mô tả' : 'Description'}
            value={formState.description}
            onChange={(value) => setFormState((prev) => ({ ...prev, description: value }))}
            isVietnamese={isVietnamese}
          />

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
              {isVietnamese ? 'Ảnh sản phẩm' : 'Product image'}
            </span>
            <div className="flex flex-col gap-4 rounded-[1.5rem] border border-on-surface/10 bg-surface p-4">
              <div className="flex h-44 items-center justify-center overflow-hidden rounded-[1.25rem] bg-white">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt={formState.productName || 'Product preview'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">
                    <ImagePlus size={22} />
                    <span className="text-sm font-semibold">
                      {isVietnamese ? 'Chưa chọn ảnh' : 'No image selected'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white">
                  <ImagePlus size={16} />
                  {isVietnamese ? 'Chọn ảnh' : 'Choose image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </label>

          <label className="inline-flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={formState.isShow}
              onChange={(event) => setFormState((prev) => ({ ...prev, isShow: event.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            {isVietnamese ? 'Hiển thị ngoài giao diện bán hàng' : 'Visible on storefront'}
          </label>
        </div>
      </Modal>

      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        size="lg"
        title={isVietnamese ? 'Xem trước sản phẩm' : 'Preview product'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(false)}
              className="rounded-2xl border border-on-surface/10 px-5 py-3 text-sm font-bold text-on-surface-variant"
            >
              {isVietnamese ? 'Quay lại chỉnh sửa' : 'Back to editing'}
            </button>
            <button
              type="button"
              onClick={() => void saveProduct()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {editingProductId
                ? isVietnamese
                  ? 'Xác nhận cập nhật'
                  : 'Confirm update'
                : isVietnamese
                  ? 'Xác nhận tạo mới'
                  : 'Confirm create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-on-surface/10 bg-surface px-5 py-4">
            <h4 className="text-lg font-black text-primary">
              {formState.productName || (isVietnamese ? 'Sản phẩm chưa đặt tên' : 'Untitled product')}
            </h4>
            <p className="mt-1 text-sm text-on-surface-variant">
              {categoryPathMap.get(formState.categoryId) ||
                (isVietnamese ? 'Chưa chọn danh mục' : 'No category selected')}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-on-surface/10 bg-white px-5 py-4">
            {formState.description.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: formState.description }} />
            ) : (
              <p className="text-sm text-on-surface-variant">
                {isVietnamese ? 'Chưa có mô tả để xem trước.' : 'No description to preview yet.'}
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
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
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-2xl border border-on-surface/10 px-5 py-3 text-sm font-bold text-on-surface-variant"
            >
              {isVietnamese ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
            >
              {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isVietnamese ? 'Xóa sản phẩm' : 'Delete product'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-on-surface-variant">
          {isVietnamese
            ? 'Thao tác này không thể hoàn tác. Hãy chắc chắn rằng bạn muốn tiếp tục.'
            : 'This action cannot be undone.'}
        </p>
      </Modal>
    </div>
  );
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    isShow: Boolean(product.isShow),
  };
}

function FieldInput({
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
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  emptyLabel: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
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
