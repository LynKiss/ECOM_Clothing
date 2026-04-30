import { clientApi } from './client-api';

export type VirtualTryOnResult = {
  requestId: string;
  status: 'completed';
  provider: string;
  resultImageUrl: string | null;
  resultImageDataUrl: string | null;
  confidence: number | null;
  processingMs: number | null;
  model: {
    version: string | null;
    task: string | null;
  };
  garment: {
    productId: string;
    productName: string;
    variantId: string | null;
    sku: string | null;
    imageUrl: string;
    color: {
      colorId: string;
      colorName: string;
      colorCode: string | null;
    } | null;
    size: {
      sizeId: string;
      sizeName: string;
      sizeCode: string | null;
    } | null;
    stockQuantity: number;
    canPurchase: boolean;
  };
  warnings: string[];
  advisory: {
    headline: string;
    disclaimer: string;
  };
};

export type CreateVirtualTryOnInput = {
  productId: string;
  variantId?: string;
  personImage: File;
  posePreference?: 'front' | 'side' | 'auto';
  note?: string;
};

export function createVirtualTryOnSession(input: CreateVirtualTryOnInput) {
  const formData = new FormData();
  formData.append('productId', input.productId);
  if (input.variantId) formData.append('variantId', input.variantId);
  formData.append('posePreference', input.posePreference ?? 'auto');
  if (input.note?.trim()) formData.append('note', input.note.trim());
  formData.append('personImage', input.personImage);

  return clientApi.postForm<VirtualTryOnResult>('/virtual-try-on/sessions', formData);
}

export function getVirtualTryOnWarningLabel(warning: string) {
  switch (warning) {
    case 'using_product_image_fallback':
      return 'Dang dung anh san pham mac dinh cho mau/size nay';
    case 'garment_out_of_stock':
      return 'Mau/size nay hien dang het hang';
    case 'low_confidence':
      return 'Do tin cay cua ket qua thap';
    case 'person_image_low_quality':
      return 'Anh nguoi mac chua du ro';
    default:
      return warning.replace(/[_-]+/g, ' ');
  }
}

export function getVirtualTryOnErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('unavailable') || normalized.includes('econnrefused')) {
    return 'Dịch vụ AI thử đồ chưa sẵn sàng. Vui lòng kiểm tra VIRTUAL_TRY_ON_SERVICE_URL.';
  }
  if (normalized.includes('replicate_api_token')) {
    return 'Chưa cấu hình REPLICATE_API_TOKEN để tạo ảnh thử đồ thật';
  }
  if (normalized.includes('replicate') && normalized.includes('timed out')) {
    return 'Model thử đồ thật xử lý quá lâu. Hãy thử lại hoặc tăng VIRTUAL_TRY_ON_TIMEOUT_MS.';
  }
  if (normalized.includes('replicate')) {
    return 'Dịch vụ tạo ảnh thử đồ thật đang lỗi. Kiểm tra token, ảnh sản phẩm và kết nối mạng.';
  }
  if (normalized.includes('person image is required')) {
    return 'Vui lòng chọn ảnh của bạn';
  }
  if (normalized.includes('only jpg') || normalized.includes('file type')) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP';
  }
  if (normalized.includes('8mb')) {
    return 'Ảnh không được vượt quá 8MB';
  }
  if (normalized.includes('content does not match')) {
    return 'Nội dung ảnh không khớp với định dạng file';
  }
  if (normalized.includes('product needs at least one garment image')) {
    return 'Sản phẩm cần có ít nhất một ảnh để thử đồ';
  }
  if (normalized.includes('not available for virtual try-on')) {
    return 'Sản phẩm hiện không khả dụng để thử đồ';
  }
  if (normalized.includes('variant is not active')) {
    return 'Màu/size này hiện không khả dụng';
  }
  if (normalized.includes('missing a result image')) {
    return 'Dịch vụ AI chưa trả về ảnh kết quả';
  }
  return message;
}
