import { type ReactNode, useEffect, useMemo, useState, useCallback } from 'react';
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Edit2,
  Eye,
  EyeOff,
  FolderTree,
  ImagePlus,
  LoaderCircle,
  PackageSearch,
  Palette,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';
import Modal from '../components/shared/Modal';
import Pagination from '../components/shared/Pagination';
import RichTextEditor from '../components/shared/RichTextEditor';

type CategoryNode = { categoryId: string; categoryName: string; children: CategoryNode[] };
type Origin = { originId: string; originName: string };
type Subcategory = { subcategoryId: string; subcategoryName: string; categoryId: string };

type ProductColor = { colorId: string; colorName: string; colorCode: string | null };
type ProductSize = { sizeId: string; sizeName: string; sizeCode: string | null; sortOrder: number };
type VariantImage = { imageId: string; imageUrl: string; sortOrder: number };
type ProductVariant = {
  variantId: string;
  productId: string;
  sku: string | null;
  barcode: string | null;
  price: string | null;
  salePrice: string | null;
  stockQuantity: number;
  weightGrams: number | null;
  isActive: boolean;
  color: ProductColor | null;
  size: ProductSize | null;
  images: VariantImage[];
};

type VariantFormState = {
  colorId: string;
  newColorName: string;
  newColorCode: string;
  sizeId: string;
  newSizeName: string;
  newSizeCode: string;
  sku: string;
  barcode: string;
  price: string;
  salePrice: string;
  stockQuantity: string;
  weightGrams: string;
  isActive: boolean;
  imageFiles: File[];
};

type Product = {
  productId: string;
  productName: string;
  productSlug?: string;
  categoryId: string;
  subcategoryId?: string | null;
  originId?: string | null;
  productPrice: string;
  productPriceSale: string | null;
  quantityAvailable: number;
  quantityReserved?: number;
  avgCost?: string | number | null;
  unit: string | null;
  description?: string | null;
  isShow: boolean | number;
  effectivePrice?: string;
  primaryImageUrl?: string | null;
  expiredAt?: string | null;
  barcode?: string | null;
  boxBarcode?: string | null;
  quantityPerBox?: number | null;
  variants?: ProductVariant[];
};

type ProductResponse = {
  items: Product[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

type ProductImage = {
  productImageId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductFormState = {
  productName: string;
  productSlug: string;
  categoryId: string;
  subcategoryId: string;
  originId: string;
  productPrice: string;
  productPriceSale: string;
  quantityAvailable: string;
  quantityPerBox: string;
  unit: string;
  barcode: string;
  boxBarcode: string;
  expiredAt: string;
  description: string;
  isShow: boolean;
};

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

type SortKey = 'product_name' | 'product_price' | 'created_at' | 'quantity_available';
type SortDir = 'ASC' | 'DESC';

const defaultVariantForm: VariantFormState = {
  colorId: '',
  newColorName: '',
  newColorCode: '#2563eb',
  sizeId: '',
  newSizeName: '',
  newSizeCode: '',
  sku: '',
  barcode: '',
  price: '',
  salePrice: '',
  stockQuantity: '0',
  weightGrams: '',
  isActive: true,
  imageFiles: [],
};

const defaultFormState: ProductFormState = {
  productName: '',
  productSlug: '',
  categoryId: '',
  subcategoryId: '',
  originId: '',
  productPrice: '',
  productPriceSale: '',
  quantityAvailable: '0',
  quantityPerBox: '',
  unit: '',
  barcode: '',
  boxBarcode: '',
  expiredAt: '',
  description: '',
  isShow: true,
};

export default function Products() {
  const { language } = useLanguage();
  const isVi = language === 'vi';
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
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'all');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? '24'));
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('DESC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkToggling, setBulkToggling] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantForm, setVariantForm] = useState<VariantFormState>(defaultVariantForm);
  const [variantEditingId, setVariantEditingId] = useState<string | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantBusyId, setVariantBusyId] = useState<string | null>(null);

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
    const p = new URLSearchParams();
    if (search.trim()) p.set('search', search.trim());
    if (selectedCategory !== 'all') p.set('category', selectedCategory);
    if (page > 1) p.set('page', String(page));
    if (limit !== 24) p.set('limit', String(limit));
    setSearchParams(p, { replace: true });
  }, [search, selectedCategory, page, limit, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          includeHidden: 'true',
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder: sortDir,
        });
        if (selectedCategory !== 'all') qs.set('categoryId', selectedCategory);
        if (search.trim()) qs.set('search', search.trim());

        const [categoriesData, productsData, originsData, subcatsData] = await Promise.all([
          apiClient.get<CategoryNode[]>('/categories/admin/tree'),
          apiClient.get<ProductResponse>(`/products?${qs.toString()}`),
          apiClient.get<{ items: Origin[] }>('/origins?limit=500'),
          apiClient.get<{ items: Subcategory[] }>('/subcategories?limit=500'),
        ]);

        if (cancelled) return;
        setCategoriesTree(categoriesData);
        setProducts(productsData.items.map(normalizeProduct));
        setMeta(productsData.meta);
        setOrigins(originsData.items ?? []);
        setSubcategories(subcatsData.items ?? []);
        setSelectedIds(new Set());
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : isVi ? 'Không tải được sản phẩm' : 'Unable to load products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [search, selectedCategory, page, limit, sortBy, sortDir, reloadKey, isVi]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  const categoryPathMap = useMemo(() => {
    const paths = new Map<string, string>();
    function walk(nodes: CategoryNode[], parents: string[]) {
      for (const node of nodes) {
        const path = [...parents, node.categoryName];
        paths.set(node.categoryId, path.join(' › '));
        walk(node.children ?? [], path);
      }
    }
    walk(categoriesTree, []);
    return paths;
  }, [categoriesTree]);

  const categoryOptions = useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);

  function flattenCategories(nodes: CategoryNode[], level = 0): Array<CategoryNode & { level: number }> {
    return nodes.flatMap((node) => [{ ...node, level }, ...flattenCategories(node.children ?? [], level + 1)]);
  }

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(key);
      setSortDir('ASC');
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortBy !== col) return <ArrowUpDown size={13} className="opacity-30" />;
    return sortDir === 'ASC' ? <ChevronUp size={13} className="text-primary" /> : <ChevronDown size={13} className="text-primary" />;
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.productId));
  const someSelected = !allSelected && products.some((p) => selectedIds.has(p.productId));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.productId)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    let failed = 0;
    await Promise.all(
      [...selectedIds].map((id) =>
        apiClient.delete(`/products/${id}`).catch(() => {
          failed++;
        }),
      ),
    );
    setBulkDeleting(false);
    setConfirmBulkDelete(false);
    showToast({
      tone: failed === 0 ? 'success' : 'error',
      title:
        failed === 0
          ? isVi
            ? `Đã xoá ${selectedIds.size} sản phẩm`
            : `Deleted ${selectedIds.size} products`
          : isVi
            ? `Xoá thất bại ${failed} sản phẩm`
            : `Failed to delete ${failed} products`,
    });
    setReloadKey((v) => v + 1);
  }

  const bulkToggleVisibility = useCallback(
    async (targetShow: boolean) => {
      setBulkToggling(true);
      const ids = [...selectedIds];
      let failed = 0;
      await Promise.all(
        ids
          .filter((id) => {
            const p = products.find((x) => x.productId === id);
            return p ? Boolean(p.isShow) !== targetShow : true;
          })
          .map((id) =>
            apiClient.patch(`/products/${id}/toggle-visibility`).catch(() => {
              failed++;
            }),
          ),
      );
      setBulkToggling(false);
      showToast({
        tone: failed === 0 ? 'success' : 'error',
        title:
          failed === 0
            ? isVi
              ? 'Đã cập nhật hiển thị'
              : 'Visibility updated'
            : isVi
              ? `Thất bại ${failed} mục`
              : `Failed ${failed} items`,
      });
      setReloadKey((v) => v + 1);
    },
    [selectedIds, products, isVi, showToast],
  );

  function resetForm() {
    setEditingProductId(null);
    setFormState(defaultFormState);
    setFormErrors({});
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setProductImages([]);
    setImageBusyId(null);
    setProductModalOpen(false);
    setPreviewModalOpen(false);
  }

  function openEditModal(product: Product) {
    setEditingProductId(product.productId);
    setFormErrors({});
    setFormState({
      productName: product.productName,
      productSlug: product.productSlug ?? '',
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId ?? '',
      originId: product.originId ?? '',
      productPrice: product.productPrice,
      productPriceSale: product.productPriceSale ?? '',
      quantityAvailable: String(product.quantityAvailable),
      quantityPerBox: product.quantityPerBox != null ? String(product.quantityPerBox) : '',
      unit: product.unit ?? '',
      barcode: product.barcode ?? '',
      boxBarcode: product.boxBarcode ?? '',
      expiredAt: product.expiredAt ? new Date(product.expiredAt).toISOString().slice(0, 10) : '',
      description: product.description ?? '',
      isShow: Boolean(product.isShow),
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(product.primaryImageUrl ?? '');
    setProductImages([]);
    setProductModalOpen(true);
    void apiClient
      .get<ProductImage[]>(`/products/${product.productId}/images`)
      .then((images) => setProductImages(Array.isArray(images) ? images : []))
      .catch(() => setProductImages([]));
  }

  function validateForm() {
    const errs: ProductFormErrors = {};
    if (!formState.productName.trim()) errs.productName = isVi ? 'Tên sản phẩm là bắt buộc' : 'Product name is required';
    if (!formState.categoryId) errs.categoryId = isVi ? 'Danh mục là bắt buộc' : 'Category is required';
    if (!formState.productPrice.trim()) errs.productPrice = isVi ? 'Giá bán là bắt buộc' : 'Price is required';
    if (formState.quantityAvailable.trim() && (isNaN(Number(formState.quantityAvailable)) || Number(formState.quantityAvailable) < 0)) {
      errs.quantityAvailable = isVi ? 'Số lượng không hợp lệ' : 'Invalid quantity';
    }
    if (
      formState.productPriceSale.trim() &&
      formState.productPrice.trim() &&
      Number(formState.productPriceSale) > Number(formState.productPrice)
    ) {
      errs.productPriceSale = isVi ? 'Giá KM không được cao hơn giá bán' : 'Sale price cannot exceed regular price';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleImageChange(file: File | null) {
    setSelectedImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : '');
  }

  async function uploadExtraImage(file: File | null) {
    if (!file || !editingProductId) return;
    setImageBusyId('upload');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('isPrimary', productImages.length === 0 ? 'true' : 'false');
      await apiClient.postForm(`/products/${editingProductId}/images`, fd);
      const images = await apiClient.get<ProductImage[]>(`/products/${editingProductId}/images`);
      setProductImages(Array.isArray(images) ? images : []);
      setReloadKey((v) => v + 1);
    } finally {
      setSelectedImageFile(null);
      setImagePreviewUrl('');
      setImageBusyId(null);
    }
  }

  async function setPrimaryImage(imageId: string) {
    if (!editingProductId) return;
    setImageBusyId(imageId);
    try {
      await apiClient.patch(`/products/${editingProductId}/images/${imageId}/set-primary`);
      const images = await apiClient.get<ProductImage[]>(`/products/${editingProductId}/images`);
      setProductImages(Array.isArray(images) ? images : []);
      setReloadKey((v) => v + 1);
    } finally {
      setImageBusyId(null);
    }
  }

  async function deleteProductImage(imageId: string) {
    if (!editingProductId) return;
    setImageBusyId(imageId);
    try {
      await apiClient.delete(`/products/${editingProductId}/images/${imageId}`);
      setProductImages((images) => images.filter((image) => image.productImageId !== imageId));
      setReloadKey((v) => v + 1);
    } finally {
      setImageBusyId(null);
    }
  }

  async function saveProduct() {
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        productName: formState.productName.trim(),
        productSlug: formState.productSlug.trim() || undefined,
        categoryId: formState.categoryId,
        subcategoryId: formState.subcategoryId || undefined,
        originId: formState.originId || undefined,
        productPrice: formState.productPrice.trim(),
        productPriceSale: formState.productPriceSale.trim() || undefined,
        quantityAvailable: Number(formState.quantityAvailable || '0'),
        quantityPerBox: formState.quantityPerBox.trim() ? Number(formState.quantityPerBox) : undefined,
        unit: formState.unit.trim() || undefined,
        barcode: formState.barcode.trim() || undefined,
        boxBarcode: formState.boxBarcode.trim() || undefined,
        expiredAt: formState.expiredAt || undefined,
        description: formState.description.trim() || undefined,
        isShow: formState.isShow,
      };
      const saved = await apiClient.patch<Product>(`/products/${editingProductId}`, payload);

      if (selectedImageFile) {
        const fd = new FormData();
        fd.append('file', selectedImageFile);
        fd.append('isPrimary', 'true');
        await apiClient.postForm(`/products/${saved.productId}/images`, fd);
      }

      showToast({
        tone: 'success',
        title: isVi ? 'Cập nhật thành công' : 'Product updated',
        description: payload.productName,
      });
      resetForm();
      setReloadKey((v) => v + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : isVi ? 'Không lưu được sản phẩm' : 'Unable to save product';
      setError(msg);
      showToast({ tone: 'error', title: isVi ? 'Lưu thất bại' : 'Save failed', description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!productPendingDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${productPendingDelete.productId}`);
      showToast({
        tone: 'success',
        title: isVi ? 'Xóa thành công' : 'Product deleted',
        description: productPendingDelete.productName,
      });
      setDeleteModalOpen(false);
      setProductPendingDelete(null);
      setReloadKey((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : isVi ? 'Không xóa được sản phẩm' : 'Unable to delete');
    } finally {
      setDeleting(false);
    }
  }


  async function loadVariantCatalogsAndRows(productId: string) {
    const [colorData, sizeData, variantData] = await Promise.all([
      apiClient.get<ProductColor[]>('/products/colors').catch(() => [] as ProductColor[]),
      apiClient.get<ProductSize[]>('/products/sizes').catch(() => [] as ProductSize[]),
      apiClient.get<ProductVariant[]>(`/products/${productId}/variants`).catch(() => [] as ProductVariant[]),
    ]);
    setColors(Array.isArray(colorData) ? colorData : []);
    setSizes(Array.isArray(sizeData) ? sizeData : []);
    setVariants(Array.isArray(variantData) ? variantData : []);
  }

  function resetVariantForm() {
    setVariantForm(defaultVariantForm);
    setVariantEditingId(null);
  }

  function closeVariantModal() {
    setVariantModalOpen(false);
    setVariantProduct(null);
    setVariants([]);
    resetVariantForm();
  }

  function openVariantModal(product: Product) {
    setVariantProduct(product);
    setVariantModalOpen(true);
    setVariantLoading(true);
    resetVariantForm();
    void loadVariantCatalogsAndRows(product.productId).finally(() => setVariantLoading(false));
  }

  function editVariant(variant: ProductVariant) {
    setVariantEditingId(variant.variantId);
    setVariantForm({
      colorId: variant.color?.colorId ?? '',
      newColorName: '',
      newColorCode: variant.color?.colorCode ?? '#2563eb',
      sizeId: variant.size?.sizeId ?? '',
      newSizeName: '',
      newSizeCode: variant.size?.sizeCode ?? '',
      sku: variant.sku ?? '',
      barcode: variant.barcode ?? '',
      price: variant.price ?? '',
      salePrice: variant.salePrice ?? '',
      stockQuantity: String(variant.stockQuantity ?? 0),
      weightGrams: variant.weightGrams != null ? String(variant.weightGrams) : '',
      isActive: Boolean(variant.isActive),
      imageFiles: [],
    });
  }

  async function resolveVariantColorId() {
    if (variantForm.colorId) return variantForm.colorId;
    if (!variantForm.newColorName.trim()) return undefined;
    const created = await apiClient.post<ProductColor>('/products/colors', {
      colorName: variantForm.newColorName.trim(),
      colorCode: variantForm.newColorCode.trim() || undefined,
    });
    setColors((items) => (items.some((item) => item.colorId === created.colorId) ? items : [...items, created]));
    return created.colorId;
  }

  async function resolveVariantSizeId() {
    if (variantForm.sizeId) return variantForm.sizeId;
    if (!variantForm.newSizeName.trim() && !variantForm.newSizeCode.trim()) return undefined;
    const sizeName = variantForm.newSizeName.trim() || variantForm.newSizeCode.trim();
    const created = await apiClient.post<ProductSize>('/products/sizes', {
      sizeName,
      sizeCode: variantForm.newSizeCode.trim() || sizeName,
      sortOrder: sizes.length,
    });
    setSizes((items) => (items.some((item) => item.sizeId === created.sizeId) ? items : [...items, created]));
    return created.sizeId;
  }

  async function saveVariant() {
    if (!variantProduct) return;
    const hasColor = Boolean(variantForm.colorId || variantForm.newColorName.trim());
    const hasSize = Boolean(variantForm.sizeId || variantForm.newSizeName.trim() || variantForm.newSizeCode.trim());
    if (!hasColor || !hasSize) {
      showToast({ tone: 'error', title: isVi ? 'Cần chọn đủ màu và size' : 'Select both color and size' });
      return;
    }
    const baseVariantPrice = Number(variantForm.price.trim() || variantProduct.productPrice || 0);
    if (variantForm.salePrice.trim() && Number(variantForm.salePrice) > baseVariantPrice) {
      showToast({ tone: 'error', title: isVi ? 'Giá KM biến thể không hợp lệ' : 'Invalid variant sale price' });
      return;
    }

    setVariantSaving(true);
    try {
      const colorId = await resolveVariantColorId();
      const sizeId = await resolveVariantSizeId();
      const payload = {
        colorId,
        sizeId,
        sku: variantForm.sku.trim() || undefined,
        barcode: variantForm.barcode.trim() || undefined,
        price: variantForm.price.trim() || undefined,
        salePrice: variantForm.salePrice.trim() || undefined,
        stockQuantity: Number(variantForm.stockQuantity || 0),
        weightGrams: variantForm.weightGrams.trim() ? Number(variantForm.weightGrams) : undefined,
        isActive: variantForm.isActive,
      };

      const saved = variantEditingId
        ? await apiClient.patch<ProductVariant>(`/products/${variantProduct.productId}/variants/${variantEditingId}`, payload)
        : await apiClient.post<ProductVariant>(`/products/${variantProduct.productId}/variants`, payload);

      for (const file of variantForm.imageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        await apiClient.postForm(`/products/${variantProduct.productId}/variants/${saved.variantId}/images`, fd);
      }

      await loadVariantCatalogsAndRows(variantProduct.productId);
      resetVariantForm();
      setReloadKey((v) => v + 1);
      showToast({ tone: 'success', title: isVi ? 'Đã lưu biến thể' : 'Variant saved' });
    } catch (e) {
      showToast({
        tone: 'error',
        title: isVi ? 'Lưu biến thể thất bại' : 'Unable to save variant',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setVariantSaving(false);
    }
  }

  async function deactivateVariant(variantId: string) {
    if (!variantProduct) return;
    setVariantBusyId(variantId);
    try {
      await apiClient.delete(`/products/${variantProduct.productId}/variants/${variantId}`);
      await loadVariantCatalogsAndRows(variantProduct.productId);
      setReloadKey((v) => v + 1);
    } finally {
      setVariantBusyId(null);
    }
  }

  async function deleteVariantImage(variantId: string, imageId: string) {
    if (!variantProduct) return;
    setVariantBusyId(imageId);
    try {
      await apiClient.delete(`/products/${variantProduct.productId}/variants/${variantId}/images/${imageId}`);
      await loadVariantCatalogsAndRows(variantProduct.productId);
    } finally {
      setVariantBusyId(null);
    }
  }

  const visibleSubcategories = subcategories.filter(
    (s) => !formState.categoryId || s.categoryId === formState.categoryId,
  );

  function getAllocatedVariantStock(product: Product) {
    return (product.variants ?? [])
      .filter((variant) => variant.isActive)
      .reduce((sum, variant) => sum + Number(variant.stockQuantity ?? 0), 0);
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary">{isVi ? 'Quản lý sản phẩm' : 'Products'}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            {isVi ? `${meta.total} sản phẩm trong hệ thống` : `${meta.total} products total`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-on-surface-variant/5 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_260px_auto]">
          <label className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isVi ? 'Tìm tên sản phẩm...' : 'Search product name...'}
              className="w-full rounded-2xl border border-on-surface-variant/10 bg-surface py-3 pl-11 pr-4 text-sm outline-none"
            />
          </label>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-2xl border border-on-surface-variant/10 bg-surface px-4 py-3 text-sm outline-none"
          >
            <option value="all">{isVi ? 'Tất cả danh mục' : 'All categories'}</option>
            {categoryOptions.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {`${'— '.repeat(c.level)}${c.categoryName}`}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => void bulkToggleVisibility(true)}
                  disabled={bulkToggling}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-700"
                >
                  <Eye size={16} />
                  {isVi ? 'Hiện' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => void bulkToggleVisibility(false)}
                  disabled={bulkToggling}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 px-4 py-3 text-sm font-bold text-amber-700"
                >
                  <EyeOff size={16} />
                  {isVi ? 'Ẩn' : 'Hide'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700"
                >
                  <Trash2 size={16} />
                  {isVi ? 'Xoá chọn' : 'Delete selected'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-on-surface-variant/5 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface-variant/5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                <th className="px-4 py-5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-on-surface-variant/20 accent-primary"
                  />
                </th>
                <th className="px-4 py-5">ID</th>
                <th className="px-4 py-5">
                  <button type="button" onClick={() => handleSort('product_name')} className="inline-flex items-center gap-1">
                    {isVi ? 'Tên sản phẩm' : 'Product name'}
                    <SortIcon col="product_name" />
                  </button>
                </th>
                <th className="px-4 py-5">{isVi ? 'Ảnh' : 'Image'}</th>
                <th className="px-4 py-5">
                  <button type="button" onClick={() => handleSort('product_price')} className="inline-flex items-center gap-1">
                    {isVi ? 'Giá' : 'Price'}
                    <SortIcon col="product_price" />
                  </button>
                </th>
                <th className="px-4 py-5">{isVi ? 'Giá giảm' : 'Sale'}</th>
                <th className="px-4 py-5">
                  <button type="button" onClick={() => handleSort('quantity_available')} className="inline-flex items-center gap-1">
                    {isVi ? 'Số lượng' : 'Quantity'}
                    <SortIcon col="quantity_available" />
                  </button>
                </th>
                <th className="px-4 py-5">{isVi ? 'Danh mục' : 'Category'}</th>
                <th className="px-4 py-5">{isVi ? 'Xuất xứ' : 'Origin'}</th>
                <th className="px-4 py-5">{isVi ? 'Hiển thị' : 'Visible'}</th>
                <th className="px-4 py-5 text-right">{isVi ? 'Hành động' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-on-surface-variant">
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={16} className="animate-spin" />
                      {isVi ? 'Đang tải sản phẩm...' : 'Loading products...'}
                    </span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <PackageSearch className="text-primary/60" size={26} />
                      <div>
                        <p className="font-black text-primary">{isVi ? 'Không có sản phẩm phù hợp' : 'No matching products'}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {isVi ? 'Backend không trả về bản ghi nào với bộ lọc hiện tại.' : 'The backend returned no records for the current filters.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.productId} className="group transition-colors hover:bg-on-surface-variant/5">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.productId)}
                        onChange={() => toggleOne(product.productId)}
                        className="h-4 w-4 rounded border-on-surface-variant/20 accent-primary"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-on-surface-variant">{product.productId}</td>
                    <td className="px-4 py-4 font-bold text-on-surface">{product.productName}</td>
                    <td className="px-4 py-4">
                      {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt={product.productName} className="h-11 w-11 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-xs text-on-surface-variant">N/A</div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{currency.format(Number(product.productPrice))}</td>
                    <td className="px-4 py-4 text-on-surface-variant">
                      {product.productPriceSale ? currency.format(Number(product.productPriceSale)) : '-'}
                    </td>
                    <td className="px-4 py-4 text-on-surface">
                      <div className="font-semibold">{product.quantityAvailable}</div>
                      {(product.variants ?? []).length > 0 ? (
                        <div className="text-[10px] font-medium text-on-surface-variant">
                          {isVi ? 'Theo biến thể' : 'Variant stock'}: {getAllocatedVariantStock(product)}
                          {product.quantityAvailable - getAllocatedVariantStock(product) !== 0
                            ? ` · ${isVi ? 'Chưa phân bổ' : 'Unallocated'}: ${product.quantityAvailable - getAllocatedVariantStock(product)}`
                            : ''}
                        </div>
                      ) : null}
                      {product.quantityReserved && product.quantityReserved > 0 ? (
                        <div className="text-[10px] font-medium text-amber-600">
                          {isVi ? 'Đang giữ' : 'Reserved'}: {product.quantityReserved}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-on-surface-variant">{categoryPathMap.get(product.categoryId) ?? product.categoryId}</td>
                    <td className="px-4 py-4 text-on-surface-variant">
                      {origins.find((origin) => origin.originId === product.originId)?.originName ?? '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          Boolean(product.isShow) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {Boolean(product.isShow) ? (isVi ? 'Đang hiển thị' : 'Visible') : isVi ? 'Đã ẩn' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          title={isVi ? 'Sửa sản phẩm' : 'Edit product'}
                          className="rounded-xl p-2 text-on-surface-variant transition hover:bg-primary/5 hover:text-primary"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openVariantModal(product)}
                          title={isVi ? 'Màu, size, ảnh biến thể' : 'Colors, sizes, variant images'}
                          className="rounded-xl p-2 text-on-surface-variant transition hover:bg-primary/5 hover:text-primary"
                        >
                          <Palette size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void apiClient.patch(`/products/${product.productId}/toggle-visibility`).then(() => setReloadKey((v) => v + 1))}
                          className="rounded-xl p-2 text-on-surface-variant transition hover:bg-primary/5 hover:text-primary"
                        >
                          {Boolean(product.isShow) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProductPendingDelete(product);
                            setDeleteModalOpen(true);
                          }}
                          className="rounded-xl p-2 text-on-surface-variant transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          isVietnamese={isVi}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>


      <Modal
        open={variantModalOpen}
        title={isVi ? 'Quản lý biến thể' : 'Manage variants'}
        description={variantProduct ? variantProduct.productName : undefined}
        onClose={closeVariantModal}
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={resetVariantForm} className="rounded-2xl border border-on-surface/10 px-5 py-2.5 text-sm font-bold">
              {isVi ? 'Làm mới form' : 'Reset form'}
            </button>
            <button
              type="button"
              onClick={() => void saveVariant()}
              disabled={variantSaving || !variantProduct}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {variantSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {variantEditingId ? (isVi ? 'Cập nhật biến thể' : 'Update variant') : (isVi ? 'Thêm biến thể' : 'Add variant')}
            </button>
          </div>
        }
      >
        {variantLoading ? (
          <div className="flex items-center justify-center py-12 text-sm font-bold text-on-surface-variant">
            <LoaderCircle size={18} className="mr-2 animate-spin" />
            {isVi ? 'Đang tải biến thể...' : 'Loading variants...'}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-on-surface/8 bg-surface p-4">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
                {variantEditingId ? (isVi ? 'Sửa biến thể' : 'Edit variant') : (isVi ? 'Biến thể mới' : 'New variant')}
              </p>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isVi ? 'Màu có sẵn' : 'Existing color'}>
                    <select
                      value={variantForm.colorId}
                      onChange={(e) => setVariantForm((p) => ({ ...p, colorId: e.target.value }))}
                      className="input-base"
                    >
                      <option value="">{isVi ? 'Không chọn / tạo mới' : 'None / create new'}</option>
                      {colors.map((color) => (
                        <option key={color.colorId} value={color.colorId}>{color.colorName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={isVi ? 'Mã màu mới' : 'New color code'}>
                    <input
                      type="color"
                      value={variantForm.newColorCode || '#2563eb'}
                      onChange={(e) => setVariantForm((p) => ({ ...p, newColorCode: e.target.value }))}
                      className="h-11 w-full rounded-2xl border border-on-surface/10 bg-white px-2"
                    />
                  </Field>
                </div>
                <Field label={isVi ? 'Tên màu mới' : 'New color name'}>
                  <input
                    value={variantForm.newColorName}
                    onChange={(e) => setVariantForm((p) => ({ ...p, newColorName: e.target.value }))}
                    placeholder={isVi ? 'Ví dụ: Xanh navy' : 'Example: Navy blue'}
                    className="input-base"
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isVi ? 'Size có sẵn' : 'Existing size'}>
                    <select
                      value={variantForm.sizeId}
                      onChange={(e) => setVariantForm((p) => ({ ...p, sizeId: e.target.value }))}
                      className="input-base"
                    >
                      <option value="">{isVi ? 'Không chọn / tạo mới' : 'None / create new'}</option>
                      {sizes.map((size) => (
                        <option key={size.sizeId} value={size.sizeId}>{size.sizeName}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={isVi ? 'Mã size mới' : 'New size code'}>
                    <input
                      value={variantForm.newSizeCode}
                      onChange={(e) => setVariantForm((p) => ({ ...p, newSizeCode: e.target.value }))}
                      placeholder="S, M, L, XL"
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label={isVi ? 'Tên size mới' : 'New size name'}>
                  <input
                    value={variantForm.newSizeName}
                    onChange={(e) => setVariantForm((p) => ({ ...p, newSizeName: e.target.value }))}
                    placeholder={isVi ? 'Ví dụ: Size L' : 'Example: Size L'}
                    className="input-base"
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="SKU">
                    <input value={variantForm.sku} onChange={(e) => setVariantForm((p) => ({ ...p, sku: e.target.value }))} className="input-base" />
                  </Field>
                  <Field label="Barcode">
                    <input value={variantForm.barcode} onChange={(e) => setVariantForm((p) => ({ ...p, barcode: e.target.value }))} className="input-base" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isVi ? 'Giá riêng' : 'Variant price'}>
                    <input type="number" value={variantForm.price} onChange={(e) => setVariantForm((p) => ({ ...p, price: e.target.value }))} className="input-base" />
                  </Field>
                  <Field label={isVi ? 'Giá KM riêng' : 'Variant sale price'}>
                    <input type="number" value={variantForm.salePrice} onChange={(e) => setVariantForm((p) => ({ ...p, salePrice: e.target.value }))} className="input-base" />
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isVi ? 'Tồn kho' : 'Stock'}>
                    <input type="number" min={0} value={variantForm.stockQuantity} onChange={(e) => setVariantForm((p) => ({ ...p, stockQuantity: e.target.value }))} className="input-base" />
                  </Field>
                  <Field label={isVi ? 'Khối lượng gram' : 'Weight grams'}>
                    <input type="number" min={0} value={variantForm.weightGrams} onChange={(e) => setVariantForm((p) => ({ ...p, weightGrams: e.target.value }))} className="input-base" />
                  </Field>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-on-surface">
                  <input type="checkbox" checked={variantForm.isActive} onChange={(e) => setVariantForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 accent-primary" />
                  {isVi ? 'Đang bán biến thể này' : 'Variant active'}
                </label>

                <Field label={isVi ? 'Ảnh riêng của biến thể' : 'Variant images'}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setVariantForm((p) => ({ ...p, imageFiles: Array.from(e.target.files ?? []) }))}
                    className="input-base"
                  />
                  {variantForm.imageFiles.length > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-primary">{variantForm.imageFiles.length} ảnh đã chọn</p>
                  ) : null}
                </Field>
              </div>
            </section>

            <section className="space-y-3">
              {variants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-on-surface/15 bg-white p-8 text-center text-sm text-on-surface-variant">
                  {isVi ? 'Chưa có biến thể. Hãy thêm màu/size đầu tiên cho sản phẩm.' : 'No variants yet.'}
                </div>
              ) : (
                variants.map((variant) => (
                  <div key={variant.variantId} className={`rounded-2xl border bg-white p-4 ${variant.isActive ? 'border-on-surface/8' : 'border-red-100 opacity-70'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {variant.color ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-black text-on-surface">
                              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: variant.color.colorCode ?? '#e5e7eb' }} />
                              {variant.color.colorName}
                            </span>
                          ) : null}
                          {variant.size ? <span className="rounded-full bg-surface px-3 py-1 text-xs font-black text-on-surface">{variant.size.sizeName}</span> : null}
                          {!variant.isActive ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">Ngừng bán</span> : null}
                        </div>
                        <p className="mt-2 text-xs text-on-surface-variant">
                          SKU: {variant.sku || '-'} · Tồn: <b>{variant.stockQuantity}</b>
                          {variant.price ? ` · Giá: ${currency.format(Number(variant.price))}` : ''}
                          {variant.salePrice ? ` · KM: ${currency.format(Number(variant.salePrice))}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editVariant(variant)} className="rounded-xl border border-on-surface/10 px-3 py-2 text-xs font-bold hover:border-primary/30 hover:text-primary">
                          {isVi ? 'Sửa' : 'Edit'}
                        </button>
                        <button type="button" disabled={variantBusyId === variant.variantId || !variant.isActive} onClick={() => void deactivateVariant(variant.variantId)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-500 disabled:opacity-50">
                          {isVi ? 'Ngừng bán' : 'Deactivate'}
                        </button>
                      </div>
                    </div>
                    {variant.images.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {variant.images.map((image) => (
                          <div key={image.imageId} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-on-surface/10 bg-surface">
                            <img src={image.imageUrl} alt="Variant" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              disabled={variantBusyId === image.imageId}
                              onClick={() => void deleteVariantImage(variant.variantId, image.imageId)}
                              className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white group-hover:flex"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </Modal>

      <Modal
        open={productModalOpen}
        title={isVi ? 'Chỉnh sửa sản phẩm' : 'Edit product'}
        onClose={resetForm}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-2xl border border-on-surface/10 px-5 py-2.5 text-sm font-bold">
              {isVi ? 'Huỷ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => void saveProduct()}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {isVi ? 'Lưu thay đổi' : 'Save changes'}
            </button>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label={isVi ? 'Tên sản phẩm *' : 'Product name *'} error={formErrors.productName}>
              <input value={formState.productName} onChange={(e) => setFormState((p) => ({ ...p, productName: e.target.value }))} className="input-base" />
            </Field>
            <Field label="Slug">
              <input value={formState.productSlug} onChange={(e) => setFormState((p) => ({ ...p, productSlug: e.target.value }))} className="input-base" />
            </Field>
            <Field label={isVi ? 'Danh mục *' : 'Category *'} error={formErrors.categoryId}>
              <select
                value={formState.categoryId}
                onChange={(e) => setFormState((p) => ({ ...p, categoryId: e.target.value, subcategoryId: '' }))}
                className="input-base"
              >
                <option value="">{isVi ? 'Chọn danh mục' : 'Select category'}</option>
                {categoryOptions.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {`${'— '.repeat(c.level)}${c.categoryName}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={isVi ? 'Danh mục phụ' : 'Subcategory'}>
              <select
                value={formState.subcategoryId}
                onChange={(e) => setFormState((p) => ({ ...p, subcategoryId: e.target.value }))}
                className="input-base"
              >
                <option value="">{isVi ? 'Không chọn' : 'None'}</option>
                {visibleSubcategories.map((s) => (
                  <option key={s.subcategoryId} value={s.subcategoryId}>
                    {s.subcategoryName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={isVi ? 'Xuất xứ' : 'Origin'}>
              <select
                value={formState.originId}
                onChange={(e) => setFormState((p) => ({ ...p, originId: e.target.value }))}
                className="input-base"
              >
                <option value="">{isVi ? 'Không chọn' : 'None'}</option>
                {origins.map((o) => (
                  <option key={o.originId} value={o.originId}>
                    {o.originName}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isVi ? 'Giá bán *' : 'Price *'} error={formErrors.productPrice}>
                <input value={formState.productPrice} onChange={(e) => setFormState((p) => ({ ...p, productPrice: e.target.value }))} className="input-base" />
              </Field>
              <Field label={isVi ? 'Giá khuyến mãi' : 'Sale price'} error={formErrors.productPriceSale}>
                <input value={formState.productPriceSale} onChange={(e) => setFormState((p) => ({ ...p, productPriceSale: e.target.value }))} className="input-base" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isVi ? 'Số lượng' : 'Quantity'} error={formErrors.quantityAvailable}>
                <input value={formState.quantityAvailable} onChange={(e) => setFormState((p) => ({ ...p, quantityAvailable: e.target.value }))} className="input-base" />
              </Field>
              <Field label={isVi ? 'Số lượng / thùng' : 'Quantity / box'}>
                <input value={formState.quantityPerBox} onChange={(e) => setFormState((p) => ({ ...p, quantityPerBox: e.target.value }))} className="input-base" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={isVi ? 'Đơn vị' : 'Unit'}>
                <input value={formState.unit} onChange={(e) => setFormState((p) => ({ ...p, unit: e.target.value }))} className="input-base" />
              </Field>
              <Field label={isVi ? 'Hạn sử dụng' : 'Expired at'}>
                <input type="date" value={formState.expiredAt} onChange={(e) => setFormState((p) => ({ ...p, expiredAt: e.target.value }))} className="input-base" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Barcode">
                <input value={formState.barcode} onChange={(e) => setFormState((p) => ({ ...p, barcode: e.target.value }))} className="input-base" />
              </Field>
              <Field label={isVi ? 'Mã thùng' : 'Box barcode'}>
                <input value={formState.boxBarcode} onChange={(e) => setFormState((p) => ({ ...p, boxBarcode: e.target.value }))} className="input-base" />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <RichTextEditor
              label={isVi ? 'Mô tả' : 'Description'}
              value={formState.description}
              onChange={(value) => setFormState((p) => ({ ...p, description: value }))}
              isVietnamese={isVi}
            />

            <Field label={isVi ? 'Ảnh đại diện' : 'Primary image'}>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-on-surface/15 px-4 py-3 text-sm font-semibold text-on-surface-variant">
                <ImagePlus size={16} />
                <span>{isVi ? 'Chọn ảnh mới' : 'Choose a new image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    handleImageChange(file);
                    void uploadExtraImage(file);
                  }}
                />
              </label>
              {selectedImageFile ? <img src={imagePreviewUrl} alt="" className="h-28 w-28 rounded-2xl object-cover" /> : null}
              {productImages.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {productImages.map((image) => (
                    <div key={image.productImageId} className="overflow-hidden rounded-2xl border border-on-surface/10 bg-surface">
                      <img src={image.imageUrl} alt="" className="h-20 w-full object-cover" />
                      <div className="flex gap-1 p-1">
                        <button
                          type="button"
                          disabled={image.isPrimary || imageBusyId === image.productImageId}
                          onClick={() => void setPrimaryImage(image.productImageId)}
                          className="flex-1 rounded-xl bg-white px-2 py-1 text-[10px] font-bold text-primary disabled:opacity-40"
                        >
                          {image.isPrimary ? 'Chính' : 'Đặt chính'}
                        </button>
                        <button
                          type="button"
                          disabled={imageBusyId === image.productImageId}
                          onClick={() => void deleteProductImage(image.productImageId)}
                          className="rounded-xl bg-red-50 px-2 py-1 text-[10px] font-bold text-red-500 disabled:opacity-40"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Field>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-on-surface/8 bg-surface px-4 py-3">
              <input
                type="checkbox"
                checked={formState.isShow}
                onChange={(e) => setFormState((p) => ({ ...p, isShow: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-semibold text-on-surface">{isVi ? 'Đang hiển thị' : 'Visible'}</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title={isVi ? 'Xác nhận xoá sản phẩm' : 'Confirm product deletion'}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductPendingDelete(null);
        }}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setProductPendingDelete(null);
              }}
              className="rounded-2xl border border-on-surface/10 px-5 py-2.5 text-sm font-bold"
            >
              <X size={14} className="inline-block" /> {isVi ? 'Huỷ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isVi ? 'Xoá' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">
          {isVi
            ? `Bạn có chắc muốn xoá sản phẩm "${productPendingDelete?.productName ?? ''}"?`
            : `Are you sure you want to delete "${productPendingDelete?.productName ?? ''}"?`}
        </p>
      </Modal>

      <Modal
        open={confirmBulkDelete}
        title={isVi ? 'Xoá nhiều sản phẩm' : 'Delete multiple products'}
        onClose={() => setConfirmBulkDelete(false)}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setConfirmBulkDelete(false)} className="rounded-2xl border border-on-surface/10 px-5 py-2.5 text-sm font-bold">
              {isVi ? 'Huỷ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => void bulkDelete()}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
            >
              {bulkDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isVi ? 'Xoá tất cả đã chọn' : 'Delete selected'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">
          {isVi ? `Bạn sắp xoá ${selectedIds.size} sản phẩm đã chọn.` : `You are about to delete ${selectedIds.size} selected products.`}
        </p>
      </Modal>

      {previewModalOpen ? null : null}
    </div>
  );
}

function normalizeProduct(product: Product) {
  return {
    ...product,
    isShow: Boolean(product.isShow),
    quantityAvailable: Number(product.quantityAvailable),
  };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}


