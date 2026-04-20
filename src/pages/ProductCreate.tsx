import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, LoaderCircle, PackagePlus, Save } from 'lucide-react';
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

type ProductCreatePayload = {
  productId: string;
  productName: string;
  productSlug: string;
  categoryId: string;
  productPrice: string;
  productPriceSale: string;
  quantityAvailable: string;
  unit: string;
  description: string;
  isShow: boolean;
  expiredAt: string;
  quantityPerBox: string;
  barcode: string;
  boxBarcode: string;
};

const defaultPayload: ProductCreatePayload = {
  productId: '',
  productName: '',
  productSlug: '',
  categoryId: '',
  productPrice: '',
  productPriceSale: '',
  quantityAvailable: '0',
  unit: '',
  description: '',
  isShow: true,
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
  const [formState, setFormState] = useState<ProductCreatePayload>(defaultPayload);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await apiClient.get<CategoryNode[]>('/categories/admin/tree');
        if (!cancelled) {
          setCategories(data);
        }
      } catch (error) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese ? 'Tải danh mục thất bại' : 'Unable to load categories',
            description: error instanceof Error ? error.message : 'Unexpected error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [isVietnamese, showToast]);

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  async function handleSubmit() {
    if (
      !formState.productName.trim() ||
      !formState.categoryId ||
      !formState.productPrice.trim()
    ) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Thiếu thông tin bắt buộc' : 'Missing required fields',
        description: isVietnamese
          ? 'Cần có tên sản phẩm, danh mục và giá bán.'
          : 'Product name, category, and price are required.',
      });
      return;
    }

    setSaving(true);

    try {
      const created = await apiClient.post<{ productId: string } & Record<string, unknown>>(
        '/products',
        {
          productId: formState.productId.trim() || undefined,
          productName: formState.productName.trim(),
          productSlug: formState.productSlug.trim() || undefined,
          categoryId: formState.categoryId,
          productPrice: formState.productPrice.trim(),
          productPriceSale: formState.productPriceSale.trim() || undefined,
          quantityAvailable: Number(formState.quantityAvailable || 0),
          unit: formState.unit.trim() || undefined,
          description: formState.description.trim() || undefined,
          isShow: formState.isShow,
          expiredAt: formState.expiredAt || undefined,
          quantityPerBox: formState.quantityPerBox
            ? Number(formState.quantityPerBox)
            : undefined,
          barcode: formState.barcode.trim() || undefined,
          boxBarcode: formState.boxBarcode.trim() || undefined,
        },
      );

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('isPrimary', 'true');
        await apiClient.postForm(`/products/${created.productId}/images`, formData);
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-[2.8rem] font-black leading-tight tracking-tight text-primary">
            {isVietnamese ? 'Thêm Sản Phẩm Mới' : 'Create New Product'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
            {isVietnamese
              ? 'Tách riêng một page tạo sản phẩm để thao tác nhanh hơn modal. Sau khi lưu xong hệ thống sẽ quay lại danh sách sản phẩm.'
              : 'Use a dedicated page for product creation. After saving, the interface returns to the main product list.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-black text-white shadow-xl shadow-primary/20 disabled:opacity-60"
        >
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isVietnamese ? 'Lưu sản phẩm' : 'Save product'}</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FieldInput
                label={isVietnamese ? 'Mã sản phẩm (tùy chọn)' : 'Product id (optional)'}
                value={formState.productId}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, productId: value }))
                }
              />
              <FieldInput
                label={isVietnamese ? 'Slug (tùy chọn)' : 'Slug (optional)'}
                value={formState.productSlug}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, productSlug: value }))
                }
              />
            </div>

            <FieldInput
              label={isVietnamese ? 'Tên sản phẩm' : 'Product name'}
              value={formState.productName}
              onChange={(value) =>
                setFormState((current) => ({ ...current, productName: value }))
              }
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FieldSelect
                label={isVietnamese ? 'Danh mục' : 'Category'}
                value={formState.categoryId}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, categoryId: value }))
                }
                options={categoryOptions}
                emptyLabel={isVietnamese ? 'Chọn danh mục' : 'Select category'}
              />
              <FieldInput
                label={isVietnamese ? 'Đơn vị sản phẩm' : 'Unit'}
                value={formState.unit}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, unit: value }))
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FieldInput
                label={isVietnamese ? 'Giá bán' : 'Price'}
                value={formState.productPrice}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, productPrice: value }))
                }
              />
              <FieldInput
                label={isVietnamese ? 'Giá giảm' : 'Sale price'}
                value={formState.productPriceSale}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, productPriceSale: value }))
                }
              />
              <FieldInput
                label={isVietnamese ? 'Số lượng ban đầu' : 'Initial quantity'}
                value={formState.quantityAvailable}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, quantityAvailable: value }))
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FieldInput
                label={isVietnamese ? 'Barcode lẻ' : 'Barcode'}
                value={formState.barcode}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, barcode: value }))
                }
              />
              <FieldInput
                label={isVietnamese ? 'Barcode thùng' : 'Box barcode'}
                value={formState.boxBarcode}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, boxBarcode: value }))
                }
              />
              <FieldInput
                label={isVietnamese ? 'Số lượng / thùng' : 'Quantity per box'}
                value={formState.quantityPerBox}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, quantityPerBox: value }))
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_auto]">
              <FieldInput
                label={isVietnamese ? 'Ngày hết hạn' : 'Expiration date'}
                value={formState.expiredAt}
                type="date"
                onChange={(value) =>
                  setFormState((current) => ({ ...current, expiredAt: value }))
                }
              />
              <label className="flex items-end">
                <span className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={formState.isShow}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        isShow: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  {isVietnamese ? 'Hiển thị sản phẩm' : 'Visible on storefront'}
                </span>
              </label>
            </div>

            <RichTextEditor
              label={isVietnamese ? 'Nội dung mô tả' : 'Description'}
              value={formState.description}
              onChange={(value) =>
                setFormState((current) => ({ ...current, description: value }))
              }
              isVietnamese={isVietnamese}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
              {isVietnamese ? 'Ảnh đại diện' : 'Primary image'}
            </p>
            <label className="mt-4 flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-on-surface/15 bg-surface p-4 text-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-52 rounded-2xl object-cover"
                />
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ImagePlus size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">
                      {isVietnamese ? 'Tải ảnh sản phẩm' : 'Upload product image'}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {isVietnamese
                        ? 'Chọn một ảnh JPG, PNG hoặc WebP.'
                        : 'Choose a JPG, PNG, or WebP file.'}
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : '');
                }}
              />
            </label>
          </section>

          <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PackagePlus size={22} />
              </div>
              <div>
                <p className="font-black text-on-surface">
                  {isVietnamese ? 'Gợi ý nhập liệu' : 'Input guidance'}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {isVietnamese
                    ? 'Nếu không nhập mã sản phẩm, backend sẽ tự sinh productId.'
                    : 'If you skip the product id, the backend will generate one automatically.'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function flattenCategories(
  nodes: CategoryNode[],
  level = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((node) => [
    { value: node.categoryId, label: `${'— '.repeat(level)}${node.categoryName}` },
    ...flattenCategories(node.children ?? [], level + 1),
  ]);
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
        {label}
      </span>
      <input
        type={type}
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
