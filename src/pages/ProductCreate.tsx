import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, LoaderCircle, PackagePlus, Plus, Save, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';
import RichTextEditor from '../components/shared/RichTextEditor';

type CategoryNode = {
  categoryId: string;
  categoryName: string;
  children: CategoryNode[];
};

type Subcategory = {
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
};

type Origin = {
  originId: string;
  originName: string;
};

type Tag = {
  tagId: string;
  tagName: string;
};

type ProductColor = { colorId: string; colorName: string; colorCode: string | null };
type ProductSize = { sizeId: string; sizeName: string; sizeCode: string | null; sortOrder: number };
type ProductVariant = {
  variantId: string;
  sku: string | null;
  barcode: string | null;
  color: ProductColor | null;
  size: ProductSize | null;
};

type VariantDraft = {
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

type ProductCreatePayload = {
  productId: string;
  productName: string;
  productSlug: string;
  categoryId: string;
  subcategoryId: string;
  originId: string;
  productPrice: string;
  productPriceSale: string;
  quantityAvailable: string;
  unit: string;
  description: string;
  isShow: boolean;
  isFeatured: boolean;
  expiredAt: string;
  quantityPerBox: string;
  barcode: string;
  boxBarcode: string;
};

const defaultVariantDraft: VariantDraft = {
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

const defaultPayload: ProductCreatePayload = {
  productId: '',
  productName: '',
  productSlug: '',
  categoryId: '',
  subcategoryId: '',
  originId: '',
  productPrice: '',
  productPriceSale: '',
  quantityAvailable: '0',
  unit: '',
  description: '',
  isShow: true,
  isFeatured: false,
  expiredAt: '',
  quantityPerBox: '',
  barcode: '',
  boxBarcode: '',
};

export default function ProductCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const isVietnamese = language === 'vi';

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [formState, setFormState] = useState<ProductCreatePayload>(defaultPayload);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [cats, origs, tagsData, colorData, sizeData] = await Promise.all([
          apiClient.get<CategoryNode[]>('/categories/admin/tree'),
          apiClient.get<{ items: Origin[] }>('/origins?limit=500').catch(() => ({ items: [] })),
          apiClient.get<Tag[]>('/tags').catch(() => [] as Tag[]),
          apiClient.get<ProductColor[]>('/products/colors').catch(() => [] as ProductColor[]),
          apiClient.get<ProductSize[]>('/products/sizes').catch(() => [] as ProductSize[]),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setOrigins(Array.isArray(origs.items) ? origs.items : []);
          setTags(Array.isArray(tagsData) ? tagsData : []);
          setColors(Array.isArray(colorData) ? colorData : []);
          setSizes(Array.isArray(sizeData) ? sizeData : []);
        }
      } catch (error) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese ? 'Tải dữ liệu thất bại' : 'Unable to load data',
            description: error instanceof Error ? error.message : 'Unexpected error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, [isVietnamese, showToast]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!formState.categoryId) { setSubcategories([]); return; }
    void apiClient
      .get<Subcategory[]>(`/subcategories?categoryId=${formState.categoryId}&limit=100`)
      .then((d) => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => setSubcategories([]));
  }, [formState.categoryId]);

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariantDrafts((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addVariantDraft() {
    setVariantDrafts((rows) => [...rows, { ...defaultVariantDraft }]);
  }

  function removeVariantDraft(index: number) {
    setVariantDrafts((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function buildVariantPayload() {
    return variantDrafts.map((variant) => ({
      colorId: variant.colorId || undefined,
      newColor:
        !variant.colorId && variant.newColorName.trim()
          ? {
              colorName: variant.newColorName.trim(),
              colorCode: variant.newColorCode.trim() || undefined,
            }
          : undefined,
      sizeId: variant.sizeId || undefined,
      newSize:
        !variant.sizeId && variant.newSizeName.trim()
          ? {
              sizeName: variant.newSizeName.trim(),
              sizeCode: variant.newSizeCode.trim() || undefined,
            }
          : undefined,
      sku: variant.sku.trim() || undefined,
      barcode: variant.barcode.trim() || undefined,
      price: variant.price.trim() || undefined,
      salePrice: variant.salePrice.trim() || undefined,
      stockQuantity: Number(variant.stockQuantity || 0),
      weightGrams: variant.weightGrams.trim()
        ? Number(variant.weightGrams)
        : undefined,
      isActive: variant.isActive,
    }));
  }

  function findCreatedVariant(
    variants: ProductVariant[],
    draft: VariantDraft,
  ) {
    if (draft.sku.trim()) {
      const bySku = variants.find((variant) => variant.sku === draft.sku.trim());
      if (bySku) return bySku;
    }
    if (draft.barcode.trim()) {
      const byBarcode = variants.find(
        (variant) => variant.barcode === draft.barcode.trim(),
      );
      if (byBarcode) return byBarcode;
    }

    const colorName =
      colors.find((color) => color.colorId === draft.colorId)?.colorName ??
      draft.newColorName.trim();
    const sizeName =
      sizes.find((size) => size.sizeId === draft.sizeId)?.sizeName ??
      draft.newSizeName.trim();

    return variants.find(
      (variant) =>
        (!colorName || variant.color?.colorName === colorName) &&
        (!sizeName || variant.size?.sizeName === sizeName),
    );
  }

  async function handleSubmit() {
    if (!formState.productName.trim() || !formState.categoryId || !formState.productPrice.trim()) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Thiếu thông tin bắt buộc' : 'Missing required fields',
        description: isVietnamese
          ? 'Cần có tên sản phẩm, danh mục và giá bán.'
          : 'Product name, category, and price are required.',
      });
      return;
    }

    if (formState.productPriceSale && Number(formState.productPriceSale) > Number(formState.productPrice)) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Giá giảm không hợp lệ' : 'Invalid sale price',
        description: isVietnamese ? 'Giá giảm không được cao hơn giá bán.' : 'Sale price cannot exceed regular price.',
      });
      return;
    }

    const invalidVariant = variantDrafts.find((variant) => {
      const hasOption =
        variant.colorId ||
        variant.newColorName.trim() ||
        variant.sizeId ||
        variant.newSizeName.trim() ||
        variant.newSizeCode.trim();
      const invalidSale =
        variant.salePrice.trim() &&
        Number(variant.salePrice) >
          Number(variant.price || formState.productPrice || 0);
      const invalidStock =
        Number.isNaN(Number(variant.stockQuantity)) ||
        Number(variant.stockQuantity) < 0;
      return !hasOption || invalidSale || invalidStock;
    });
    if (invalidVariant) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Biến thể không hợp lệ' : 'Invalid variant',
        description: isVietnamese
          ? 'Mỗi biến thể cần có màu hoặc size, tồn không âm và giá KM không cao hơn giá bán.'
          : 'Each variant needs a color or size, non-negative stock, and valid sale price.',
      });
      return;
    }

    setSaving(true);
    try {
      const created = await apiClient.post<{ productId: string } & Record<string, unknown>>('/products', {
        productId: formState.productId.trim() || undefined,
        productName: formState.productName.trim(),
        productSlug: formState.productSlug.trim() || undefined,
        categoryId: formState.categoryId,
        subcategoryId: formState.subcategoryId || undefined,
        originId: formState.originId || undefined,
        productPrice: formState.productPrice.trim(),
        productPriceSale: formState.productPriceSale.trim() || undefined,
        quantityAvailable: Number(formState.quantityAvailable || 0),
        unit: formState.unit.trim() || undefined,
        description: formState.description.trim() || undefined,
        isShow: formState.isShow,
        isFeatured: formState.isFeatured,
        expiredAt: formState.expiredAt || undefined,
        quantityPerBox: formState.quantityPerBox ? Number(formState.quantityPerBox) : undefined,
        barcode: formState.barcode.trim() || undefined,
        boxBarcode: formState.boxBarcode.trim() || undefined,
        tagIds: selectedTagIds,
        variants: variantDrafts.length > 0 ? buildVariantPayload() : undefined,
      });

      if (imageFiles.length > 0) {
        for (const [index, file] of imageFiles.entries()) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('isPrimary', String(index === primaryImageIndex));
          await apiClient.postForm(`/products/${created.productId}/images`, formData);
        }
      }

      const draftsWithImages = variantDrafts.filter(
        (variant) => variant.imageFiles.length > 0,
      );
      if (draftsWithImages.length > 0) {
        const createdVariants = await apiClient.get<ProductVariant[]>(
          `/products/${created.productId}/variants`,
        );
        for (const draft of draftsWithImages) {
          const createdVariant = findCreatedVariant(createdVariants, draft);
          if (!createdVariant) continue;
          for (const file of draft.imageFiles) {
            const formData = new FormData();
            formData.append('file', file);
            await apiClient.postForm(
              `/products/${created.productId}/variants/${createdVariant.variantId}/images`,
              formData,
            );
          }
        }
      }

      showToast({
        tone: 'success',
        title: isVietnamese ? 'Đã tạo sản phẩm' : 'Product created',
        description: formState.productName,
      });
      navigate('/admin/products');
    } catch (error) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Tạo sản phẩm thất bại' : 'Create product failed',
        description: error instanceof Error ? error.message : 'Unexpected error',
      });
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof ProductCreatePayload) => (value: string | boolean) =>
    setFormState((cur) => ({ ...cur, [key]: value }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-[2.8rem] font-black leading-tight tracking-tight text-primary">
            {isVietnamese ? 'Thêm Sản Phẩm Mới' : 'Create New Product'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
            {isVietnamese
              ? 'Điền đầy đủ thông tin sản phẩm. Sau khi lưu, hệ thống sẽ quay lại danh sách.'
              : 'Fill in all product details. After saving, the system returns to the product list.'}
          </p>
        </div>
        <button type="button" onClick={() => void handleSubmit()} disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-sm shadow-primary/20 disabled:opacity-60">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isVietnamese ? 'Lưu sản phẩm' : 'Save product'}</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left: main info */}
        <div className="space-y-6">
          <section className="rounded-xl border border-on-surface-variant/5 bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              {isVietnamese ? 'Thông tin cơ bản' : 'Basic information'}
            </p>
            <div className="grid gap-5">
              {/* IDs row */}
              <div className="grid gap-5 md:grid-cols-2">
                <FieldInput label={isVietnamese ? 'Mã sản phẩm (tùy chọn)' : 'Product ID (optional)'}
                  value={formState.productId} onChange={set('productId') as (v: string) => void} />
                <FieldInput label={isVietnamese ? 'Slug (tùy chọn)' : 'Slug (optional)'}
                  value={formState.productSlug} onChange={set('productSlug') as (v: string) => void} />
              </div>

              {/* Name */}
              <FieldInput label={isVietnamese ? 'Tên sản phẩm *' : 'Product name *'}
                value={formState.productName} onChange={set('productName') as (v: string) => void} />

              {/* Category + Subcategory */}
              <div className="grid gap-5 md:grid-cols-2">
                <FieldSelect label={isVietnamese ? 'Danh mục *' : 'Category *'}
                  value={formState.categoryId}
                  onChange={(v) => { set('categoryId')(v); set('subcategoryId')(''); }}
                  options={categoryOptions} emptyLabel={isVietnamese ? 'Chọn danh mục' : 'Select category'} />
                <FieldSelect label={isVietnamese ? 'Phân loại' : 'Subcategory'}
                  value={formState.subcategoryId}
                  onChange={set('subcategoryId') as (v: string) => void}
                  options={subcategories.map((s) => ({ value: s.subcategoryId, label: s.subcategoryName }))}
                  emptyLabel={isVietnamese ? (formState.categoryId ? 'Không có / Không chọn' : 'Chọn danh mục trước') : 'Select subcategory'}
                  disabled={!formState.categoryId} />
              </div>

              {/* Origin + Unit */}
              <div className="grid gap-5 md:grid-cols-2">
                <FieldSelect label={isVietnamese ? 'Xuất xứ' : 'Origin'}
                  value={formState.originId}
                  onChange={set('originId') as (v: string) => void}
                  options={origins.map((o) => ({ value: o.originId, label: o.originName }))}
                  emptyLabel={isVietnamese ? 'Không rõ / Không chọn' : 'Not specified'} />
                <FieldInput label={isVietnamese ? 'Đơn vị' : 'Unit (e.g. kg, gói, cái)'}
                  value={formState.unit} onChange={set('unit') as (v: string) => void} />
              </div>

              {/* Price row */}
              <div className="grid gap-5 md:grid-cols-3">
                <FieldInput label={isVietnamese ? 'Giá bán *' : 'Price *'}
                  value={formState.productPrice} onChange={set('productPrice') as (v: string) => void} type="number" />
                <FieldInput label={isVietnamese ? 'Giá khuyến mãi' : 'Sale price'}
                  value={formState.productPriceSale} onChange={set('productPriceSale') as (v: string) => void} type="number" />
                <FieldInput label={isVietnamese ? 'Số lượng ban đầu' : 'Initial quantity'}
                  value={formState.quantityAvailable} onChange={set('quantityAvailable') as (v: string) => void} type="number" />
              </div>

              {/* Barcode row */}
              <div className="grid gap-5 md:grid-cols-3">
                <FieldInput label={isVietnamese ? 'Barcode lẻ' : 'Barcode'}
                  value={formState.barcode} onChange={set('barcode') as (v: string) => void} />
                <FieldInput label={isVietnamese ? 'Barcode thùng' : 'Box barcode'}
                  value={formState.boxBarcode} onChange={set('boxBarcode') as (v: string) => void} />
                <FieldInput label={isVietnamese ? 'Số lượng / thùng' : 'Qty per box'}
                  value={formState.quantityPerBox} onChange={set('quantityPerBox') as (v: string) => void} type="number" />
              </div>

              <div className="rounded-xl border border-on-surface/10 bg-surface p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                      {isVietnamese ? 'Biến thể màu / size' : 'Color / size variants'}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {isVietnamese
                        ? 'Tồn của biến thể sẽ được cộng vào tổng tồn sản phẩm.'
                        : 'Variant stock is added to the product total stock.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantDraft}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white"
                  >
                    <Plus size={14} />
                    {isVietnamese ? 'Thêm biến thể' : 'Add variant'}
                  </button>
                </div>

                {variantDrafts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-on-surface/15 bg-white px-4 py-5 text-center text-sm text-on-surface-variant">
                    {isVietnamese
                      ? 'Chưa có biến thể. Sản phẩm vẫn có thể dùng tồn tổng.'
                      : 'No variants yet. The product can still use product-level stock.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantDrafts.map((variant, index) => (
                      <div key={index} className="rounded-xl border border-on-surface/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-on-surface">
                            {isVietnamese ? `Biến thể ${index + 1}` : `Variant ${index + 1}`}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeVariantDraft(index)}
                            className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                            title={isVietnamese ? 'Xóa biến thể' : 'Remove variant'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <FieldSelect
                            label={isVietnamese ? 'Màu có sẵn' : 'Existing color'}
                            value={variant.colorId}
                            onChange={(value) => updateVariant(index, { colorId: value, newColorName: value ? '' : variant.newColorName })}
                            options={colors.map((color) => ({ value: color.colorId, label: color.colorName }))}
                            emptyLabel={isVietnamese ? 'Không chọn / tạo mới' : 'None / create new'}
                          />
                          <FieldInput
                            label={isVietnamese ? 'Tên màu mới' : 'New color name'}
                            value={variant.newColorName}
                            onChange={(value) => updateVariant(index, { newColorName: value, colorId: value ? '' : variant.colorId })}
                            disabled={!!variant.colorId}
                          />
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <FieldInput
                            label={isVietnamese ? 'Mã màu' : 'Color code'}
                            value={variant.newColorCode}
                            onChange={(value) => updateVariant(index, { newColorCode: value })}
                            type="color"
                            disabled={!!variant.colorId}
                          />
                          <FieldSelect
                            label={isVietnamese ? 'Size có sẵn' : 'Existing size'}
                            value={variant.sizeId}
                            onChange={(value) => updateVariant(index, { sizeId: value, newSizeName: value ? '' : variant.newSizeName, newSizeCode: value ? '' : variant.newSizeCode })}
                            options={sizes.map((size) => ({ value: size.sizeId, label: size.sizeName }))}
                            emptyLabel={isVietnamese ? 'Không chọn / tạo mới' : 'None / create new'}
                          />
                          <FieldInput
                            label={isVietnamese ? 'Tên size mới' : 'New size name'}
                            value={variant.newSizeName}
                            onChange={(value) => updateVariant(index, { newSizeName: value, sizeId: value ? '' : variant.sizeId })}
                            disabled={!!variant.sizeId}
                          />
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-4">
                          <FieldInput label="SKU" value={variant.sku} onChange={(value) => updateVariant(index, { sku: value })} />
                          <FieldInput label="Barcode" value={variant.barcode} onChange={(value) => updateVariant(index, { barcode: value })} />
                          <FieldInput label={isVietnamese ? 'Tồn kho' : 'Stock'} value={variant.stockQuantity} onChange={(value) => updateVariant(index, { stockQuantity: value })} type="number" />
                          <FieldInput label={isVietnamese ? 'Gram' : 'Grams'} value={variant.weightGrams} onChange={(value) => updateVariant(index, { weightGrams: value })} type="number" />
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <FieldInput label={isVietnamese ? 'Giá riêng' : 'Variant price'} value={variant.price} onChange={(value) => updateVariant(index, { price: value })} type="number" />
                          <FieldInput label={isVietnamese ? 'Giá KM riêng' : 'Variant sale price'} value={variant.salePrice} onChange={(value) => updateVariant(index, { salePrice: value })} type="number" />
                          <label className="grid gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                              {isVietnamese ? 'Ảnh biến thể' : 'Variant images'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => updateVariant(index, { imageFiles: Array.from(event.target.files ?? []) })}
                              className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-2.5 text-sm outline-none"
                            />
                          </label>
                        </div>

                        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-on-surface">
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(event) => updateVariant(index, { isActive: event.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          {isVietnamese ? 'Đang bán biến thể này' : 'Variant active'}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date + toggles */}
              <div className="grid gap-5 md:grid-cols-2">
                <FieldInput label={isVietnamese ? 'Ngày hết hạn' : 'Expiration date'}
                  value={formState.expiredAt} onChange={set('expiredAt') as (v: string) => void} type="date" />
                <div className="flex flex-col justify-end gap-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-on-surface">
                    <input type="checkbox" checked={formState.isShow}
                      onChange={(e) => setFormState((cur) => ({ ...cur, isShow: e.target.checked }))}
                      className="h-4 w-4 accent-primary" />
                    {isVietnamese ? '👁 Hiển thị trên cửa hàng' : '👁 Visible on storefront'}
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    <input type="checkbox" checked={formState.isFeatured}
                      onChange={(e) => setFormState((cur) => ({ ...cur, isFeatured: e.target.checked }))}
                      className="h-4 w-4 accent-amber-500" />
                    <Star size={14} className="text-amber-500" />
                    {isVietnamese ? 'Đánh dấu nổi bật (hiển thị carousel trang chủ)' : 'Mark as featured (homepage carousel)'}
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nhãn sản phẩm</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.tagId);
                    return (
                      <button key={tag.tagId} type="button"
                        onClick={() => setSelectedTagIds(prev => selected ? prev.filter(id => id !== tag.tagId) : [...prev, tag.tagId])}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border-2 transition ${selected ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'}`}>
                        # {tag.tagName}
                      </button>
                    );
                  })}
                  {tags.length === 0 && <p className="text-xs text-gray-400">Chưa có nhãn nào</p>}
                </div>
              </div>

              {/* Description */}
              <RichTextEditor label={isVietnamese ? 'Nội dung mô tả' : 'Description'}
                value={formState.description}
                onChange={(v) => setFormState((cur) => ({ ...cur, description: v }))}
                isVietnamese={isVietnamese} />
            </div>
          </section>
        </div>

        {/* Right: image + hints */}
        <aside className="space-y-6">
          {/* Primary image upload */}
          <section className="rounded-xl border border-on-surface-variant/5 bg-white p-6 shadow-sm">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
              {isVietnamese ? 'Ảnh đại diện' : 'Primary image'}
            </p>
            <p className="mb-4 text-xs text-on-surface-variant/60">
              {isVietnamese ? 'Ảnh hiển thị chính trong danh sách và trang chi tiết.' : 'Main image shown in listings and detail page.'}
            </p>
            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-on-surface/15 bg-surface p-4 text-center transition hover:border-primary/40">
              {imagePreviews.length > 0 ? (
                <div className="grid w-full grid-cols-2 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <button
                      key={preview}
                      type="button"
                      onClick={() => setPrimaryImageIndex(index)}
                      className={`overflow-hidden rounded-2xl border-2 ${primaryImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                    >
                      <img src={preview} alt="Preview" className="h-28 w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ImagePlus size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">
                      {isVietnamese ? 'Tải ảnh sản phẩm' : 'Upload product image'}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">JPG, PNG, WebP · Tối đa 5MB</p>
                  </div>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []) as File[];
                  setImageFiles(files);
                  setImagePreviews(files.map((file) => URL.createObjectURL(file)));
                  setPrimaryImageIndex(0);
                }} />
            </label>
            {imagePreviews.length > 0 && (
              <button onClick={() => { setImageFiles([]); setImagePreviews([]); setPrimaryImageIndex(0); }}
                className="mt-3 w-full rounded-xl border border-red-200 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50">
                {isVietnamese ? 'Xóa ảnh' : 'Remove image'}
              </button>
            )}
          </section>

          {/* Price guidance */}
          {formState.productPriceSale && formState.productPrice && (
            <section className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">Xem trước giảm giá</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giá gốc:</span>
                  <span className="font-semibold line-through">{formatVND(Number(formState.productPrice))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giá KM:</span>
                  <span className="font-black text-green-600">{formatVND(Number(formState.productPriceSale))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiết kiệm:</span>
                  <span className="font-black text-red-500">
                    -{Math.round(((Number(formState.productPrice) - Number(formState.productPriceSale)) / Number(formState.productPrice)) * 100)}%
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Hints */}
          <section className="rounded-xl border border-on-surface-variant/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PackagePlus size={22} />
              </div>
              <div>
                <p className="font-black text-on-surface">
                  {isVietnamese ? 'Gợi ý nhập liệu' : 'Input guidance'}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-on-surface-variant">
                  <li>• Mã sản phẩm tự động sinh nếu để trống</li>
                  <li>• Slug tự động tạo từ tên nếu để trống</li>
                  <li>• Giá khuyến mãi phải nhỏ hơn giá bán</li>
                  <li>• Tích "Nổi bật" để hiện trên trang chủ</li>
                </ul>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function flattenCategories(nodes: CategoryNode[], level = 0): Array<{ value: string; label: string }> {
  return nodes.flatMap((node) => [
    { value: node.categoryId, label: `${'— '.repeat(level)}${node.categoryName}` },
    ...flattenCategories(node.children ?? [], level + 1),
  ]);
}

function FieldInput({
  label, value, onChange, type = 'text', disabled = false,
}: {
  label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{label}</span>
      <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none focus:border-primary/40 disabled:opacity-50" />
    </label>
  );
}

function FieldSelect({
  label, value, onChange, options, emptyLabel, disabled = false,
}: {
  label: string; value: string; onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>; emptyLabel: string; disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none focus:border-primary/40 disabled:opacity-50">
        <option value="">{emptyLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}


