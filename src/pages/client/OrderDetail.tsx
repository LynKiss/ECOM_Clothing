import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Shirt,
  LoaderCircle,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  Star,
  Truck,
  XCircle,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useClientSession } from '../../hooks/useClientSession';
import { useToast } from '../../hooks/useToast';
import { resolveMediaUrl } from '../../lib/media-url';
import {
  TRACKING_MODE_LABELS,
  TRACKING_SOURCE_LABELS,
  type OrderTracking,
} from '../../lib/order-tracking';

type OrderItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  sku?: string | null;
  colorName?: string | null;
  sizeName?: string | null;
  imageUrl?: string | null;
  productName: string;
  quantity: number;
  quantityDelivered?: number;
  returnableQuantity?: number;
  returnedQuantity?: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderDetailResponse = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPayment: string;
  totalQuantity: number;
  subtotalAmount: string;
  discountAmount: string;
  deliveryCost: string;
  fullName: string;
  phone: string;
  address: string;
  note: string | null;
  createdAt: string;
  returnWindowDays?: number;
  returnDeadline?: string | null;
  canCreateReturn?: boolean;
  returnBlockedReason?: string | null;
  items: OrderItem[];
  returns?: Array<{
    id: string;
    orderItemId: string;
    returnQuantity: number;
    reason: string;
    status: string;
    inspectionStatus: string;
    refundAmount: string | null;
    maxRefundableAmount: string;
  }>;
};

type PaymentReconcileResponse = {
  orderId: string;
  paymentStatus: string;
  transactionStatus?: string;
  gatewayCode?: string;
  message?: string;
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: FC<{ size?: number; className?: string }>;
  }
> = {
  pending: { label: 'Chờ xử lý', color: '#b45309', bg: '#fef3c7', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: '#1d4ed8', bg: '#dbeafe', icon: CheckCircle2 },
  processing: { label: 'Đang xử lý', color: '#6d28d9', bg: '#ede9fe', icon: Package },
  shipping: { label: 'Đang giao hàng', color: '#0369a1', bg: '#e0f2fe', icon: Truck },
  delivered: { label: 'Đã giao thành công', color: '#15803d', bg: '#dcfce7', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2', icon: XCircle },
  returned: { label: 'Đã trả hàng', color: '#9f1239', bg: '#ffe4e6', icon: AlertCircle },
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  zalopay: 'ZaloPay',
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'Chưa thanh toán', color: '#b45309' },
  paid: { label: 'Đã thanh toán', color: '#15803d' },
  failed: { label: 'Thanh toán thất bại', color: '#dc2626' },
  refunded: { label: 'Đã hoàn tiền', color: '#6d28d9' },
};

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTrackingTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function getMapEmbedUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.03
  },${latitude - 0.03},${longitude + 0.03},${latitude + 0.03}&layer=mapnik&marker=${latitude},${longitude}`;
}

function getReturnBlockedMessage(reason?: string | null) {
  if (reason === 'RETURN_WINDOW_EXPIRED') return 'Đã quá hạn 7 ngày kể từ khi nhận hàng.';
  if (reason === 'RETURN_NOT_DELIVERED_YET') return 'Chỉ tạo trả hàng sau khi đơn đã được giao.';
  return 'Hiện chưa thể tạo yêu cầu trả hàng cho đơn này.';
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useClientSession();
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [paymentReconciling, setPaymentReconciling] = useState(false);
  const [paymentSyncMessage, setPaymentSyncMessage] = useState<string | null>(null);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnItemId, setReturnItemId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const momoVerifiedRef = useRef(false);
  const autoPaymentReconcileRef = useRef<string | null>(null);

  const shouldShowTracking = order?.status === 'shipping' || order?.status === 'delivered';
  const activeMapPoint = tracking?.activeLocation ?? tracking?.manualLocation ?? tracking?.gpsLocation ?? null;

  const refreshOrder = async (orderId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await clientApi.get<OrderDetailResponse>(`/orders/${orderId}`);
      setOrder(data);
    } catch {
      if (!silent) {
        void navigate('/client/orders');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const refreshTracking = async (orderId: string, silent = false) => {
    if (!silent) {
      setTrackingLoading(true);
    }

    try {
      const data = await clientApi.get<OrderTracking>(`/orders/${orderId}/tracking`);
      setTracking(data);
    } catch {
      if (!silent) {
        setTracking(null);
      }
    } finally {
      if (!silent) {
        setTrackingLoading(false);
      }
    }
  };

  const confirmReceived = async () => {
    if (!order || !id) return;
    if (!window.confirm('Xác nhận bạn đã nhận được hàng?')) return;
    setConfirmingReceived(true);
    try {
      await clientApi.patch(`/orders/${id}/confirm-received`);
      await refreshOrder(id, false);
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Không thể xác nhận',
        description:
          error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setConfirmingReceived(false);
    }
  };

  const selectedReturnItem = useMemo(
    () => order?.items.find((item) => item.id === returnItemId) ?? null,
    [order?.items, returnItemId],
  );

  const openReturnModal = (item?: OrderItem) => {
    if (order && !order.canCreateReturn) {
      showToast({
        tone: 'warning',
        title: 'Chưa thể tạo yêu cầu trả hàng',
        description: getReturnBlockedMessage(order.returnBlockedReason),
      });
      return;
    }
    const target =
      item ??
      order?.items.find((entry) => Number(entry.returnableQuantity ?? 0) > 0) ??
      null;
    if (!target) {
      showToast({
        tone: 'warning',
        title: 'Không còn sản phẩm có thể trả',
      });
      return;
    }
    setReturnItemId(target.id);
    setReturnQuantity(1);
    setReturnReason('');
    setReturnDescription('');
    setReturnModalOpen(true);
  };

  const submitReturnRequest = async () => {
    if (!order || !id || !selectedReturnItem) return;
    if (!returnReason.trim()) {
      showToast({ tone: 'warning', title: 'Vui lòng chọn lý do trả hàng' });
      return;
    }
    const maxQty = Number(selectedReturnItem.returnableQuantity ?? 0);
    if (returnQuantity < 1 || returnQuantity > maxQty) {
      showToast({
        tone: 'warning',
        title: 'Số lượng trả không hợp lệ',
        description: `Bạn chỉ có thể trả tối đa ${maxQty} sản phẩm.`,
      });
      return;
    }

    setSubmittingReturn(true);
    try {
      await clientApi.post('/returns', {
        orderId: order.id,
        orderItemId: selectedReturnItem.id,
        returnQuantity,
        reason: returnReason.trim(),
        description: returnDescription.trim() || returnReason.trim(),
      });
      setReturnModalOpen(false);
      await refreshOrder(id, true);
      showToast({
        tone: 'success',
        title: 'Đã gửi yêu cầu trả hàng',
        description: 'Shop sẽ kiểm tra và phản hồi trong trang đơn hàng.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const description = message.includes('RETURN_WINDOW_EXPIRED')
        ? 'Đã quá thời hạn 7 ngày kể từ khi nhận hàng.'
        : message.includes('RETURN_NOT_DELIVERED_YET')
          ? 'Đơn hàng chưa ở trạng thái đã giao nên chưa thể trả hàng.'
          : message.includes('RETURN_QUANTITY_EXCEEDS_AVAILABLE')
            ? 'Số lượng trả vượt quá số lượng còn có thể trả.'
            : message;
      showToast({
        tone: 'error',
        title: 'Không gửi được yêu cầu trả hàng',
        description,
      });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const reconcilePayment = async (orderId: string, showAlert = false) => {
    setPaymentReconciling(true);
    setPaymentSyncMessage(null);
    try {
      const result = await clientApi.post<PaymentReconcileResponse>(
        `/payments/orders/${orderId}/reconcile`,
      );
      setOrder((current) =>
        current && current.id === orderId
          ? { ...current, paymentStatus: result.paymentStatus }
          : current,
      );
      await refreshOrder(orderId, true);
      const message =
        result.paymentStatus === 'paid'
          ? 'Đã xác nhận thanh toán thành công.'
          : result.message || 'Chưa ghi nhận thanh toán từ cổng MoMo.';
      setPaymentSyncMessage(message);
      if (showAlert) {
        showToast({ tone: result.paymentStatus === 'paid' ? 'success' : 'info', title: message });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể kiểm tra thanh toán. Vui lòng thử lại.';
      setPaymentSyncMessage(message);
      if (showAlert) {
        showToast({ tone: 'error', title: message });
      }
    } finally {
      setPaymentReconciling(false);
    }
  };

  useEffect(() => {
    if (!session) {
      void navigate('/client/login');
      return;
    }
    if (!id) return;
    void refreshOrder(id);
  }, [session, id, navigate]);

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const requestId = searchParams.get('requestId');
    if (resultCode === null || !requestId || momoVerifiedRef.current) return;
    momoVerifiedRef.current = true;

    void clientApi
      .post('/payments/momo/verify', {
        orderId: searchParams.get('orderId'),
        requestId,
        resultCode,
        transId: searchParams.get('transId') ?? undefined,
        amount: searchParams.get('amount') ?? undefined,
        message: searchParams.get('message') ?? '',
        partnerCode: searchParams.get('partnerCode') ?? '',
        orderInfo: searchParams.get('orderInfo') ?? '',
        orderType: searchParams.get('orderType') ?? '',
        payType: searchParams.get('payType') ?? '',
        responseTime: searchParams.get('responseTime') ?? '',
        extraData: searchParams.get('extraData') ?? '',
        signature: searchParams.get('signature') ?? '',
      })
      .then(() => {
        if (id) {
          void refreshOrder(id, true);
        }
      })
      .catch(() => {})
      .finally(() => {
        setSearchParams({}, { replace: true });
      });
  }, [id, searchParams, setSearchParams]);

  useEffect(() => {
    if (
      !order ||
      order.paymentMethod !== 'momo' ||
      order.paymentStatus !== 'unpaid' ||
      autoPaymentReconcileRef.current === order.id
    ) {
      return;
    }

    autoPaymentReconcileRef.current = order.id;
    void reconcilePayment(order.id, false);
  }, [order]);

  useEffect(() => {
    if (!id || !shouldShowTracking) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (cancelled) {
        return;
      }
      await Promise.all([refreshTracking(id, true), refreshOrder(id, true)]);
    };

    setTrackingLoading(true);
    void clientApi
      .get<OrderTracking>(`/orders/${id}/tracking`)
      .then((data) => {
        if (!cancelled) {
          setTracking(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTracking(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTrackingLoading(false);
        }
      });

    intervalId = setInterval(() => {
      void tick();
    }, 5_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, shouldShowTracking]);

  const statusInfo = useMemo(() => {
    if (!order) return STATUS_CONFIG.pending;
    return STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  }, [order]);

  if (loading) {
    return (
      <div
        style={{ background: '#F8FAFC', minHeight: '60vh' }}
        className="flex items-center justify-center"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  const StatusIcon = statusInfo.icon;
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';
  const isDelivered = order.status === 'delivered';
  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const shortId = order.id.slice(-8).toUpperCase();
  const paymentStatusInfo = PAYMENT_STATUS_LABELS[order.paymentStatus] ?? {
    label: order.paymentStatus,
    color: '#374151',
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/client/orders"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline"
            >
              <ArrowLeft size={14} /> Lịch sử đơn hàng
            </Link>
            <h1 className="text-2xl font-black text-[#0B0F19]">Đơn hàng #{shortId}</h1>
            <p className="mt-1 text-xs text-gray-400">{formatDate(order.createdAt)}</p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            <StatusIcon size={16} />
            {statusInfo.label}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            {shouldShowTracking && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-400">
                    <Navigation size={13} /> Theo dõi giao hàng realtime
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-on-surface-variant">
                      {tracking ? TRACKING_MODE_LABELS[tracking.mode] : 'No mode'}
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-on-surface-variant">
                      {tracking ? TRACKING_SOURCE_LABELS[tracking.activeSource] : 'No signal'}
                    </span>
                    {tracking?.activeSource === 'gps' && tracking.gpsSignalFresh ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                        Live
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className="relative mx-5 mb-5 overflow-hidden rounded-xl bg-gray-100"
                  style={{ height: 260 }}
                >
                  {trackingLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <LoaderCircle size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : activeMapPoint ? (
                    <iframe
                      title="delivery-map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={getMapEmbedUrl(activeMapPoint.latitude, activeMapPoint.longitude)}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                      <MapPin size={28} />
                      <p className="text-xs">Chưa có vị trí giao hàng</p>
                    </div>
                  )}

                  {activeMapPoint ? (
                    <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#0B0F19] shadow backdrop-blur">
                      <span className="mr-1.5">Lat/Lng:</span>
                      {activeMapPoint.latitude}, {activeMapPoint.longitude}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4">
                  <TrackingStat
                    label="Nguồn"
                    value={tracking ? TRACKING_SOURCE_LABELS[tracking.activeSource] : '-'}
                  />
                  <TrackingStat
                    label="Cập nhật"
                    value={tracking ? formatTrackingTime(tracking.activeLocation?.updatedAt ?? null) : '-'}
                  />
                  <TrackingStat
                    label="Tốc độ"
                    value={
                      tracking?.activeLocation?.speedKph !== null &&
                      tracking?.activeLocation?.speedKph !== undefined
                        ? `${tracking.activeLocation.speedKph} km/h`
                        : '-'
                    }
                  />
                  <TrackingStat
                    label="GPS fresh"
                    value={tracking?.gpsSignalFresh ? 'Yes' : 'No'}
                  />
                </div>

                {tracking?.activeLocation?.note ? (
                  <div className="border-t border-black/5 px-5 py-4 text-sm text-on-surface-variant">
                    {tracking.activeLocation.note}
                  </div>
                ) : null}
              </div>
            )}

            {!isCancelled && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-black uppercase tracking-wider text-gray-400">
                  Trạng thái đơn hàng
                </h3>
                <div className="relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-black/8" />
                  <div className="space-y-5">
                    {STATUS_STEPS.map((step, index) => {
                      const stepInfo = STATUS_CONFIG[step];
                      const StepIcon = stepInfo.icon;
                      const isDone = currentStepIdx >= index;
                      const isCurrent = currentStepIdx === index;
                      return (
                        <div key={step} className="relative flex items-start gap-4 pl-9">
                          <div
                            className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all"
                            style={{
                              background: isDone ? '#2563EB' : 'white',
                              borderColor: isDone ? '#2563EB' : '#e5e7eb',
                            }}
                          >
                            <StepIcon
                              size={14}
                              className={isDone ? 'text-white' : 'text-gray-300'}
                            />
                          </div>
                          <div className={`pb-1 ${!isCurrent ? 'opacity-60' : ''}`}>
                            <p
                              className={`text-sm font-bold ${
                                isDone ? 'text-[#0B0F19]' : 'text-gray-400'
                              }`}
                            >
                              {stepInfo.label}
                            </p>
                            {isCurrent ? (
                              <p className="text-xs text-[#2563EB]">Trạng thái hiện tại</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-400">
                Sản phẩm đã đặt
              </h3>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const imageUrl = resolveMediaUrl(item.imageUrl);
                  const variantText = [item.colorName, item.sizeName, item.sku]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div key={item.id} className="flex items-start gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                        style={{ background: '#DBEAFE' }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Shirt size={20} style={{ color: '#2563EB' }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/client/products/${item.productId}`}
                          className="line-clamp-2 text-sm font-semibold text-[#0B0F19] hover:text-[#2563EB]"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-gray-400">
                          {formatPrice(item.unitPrice)} x {item.quantity}
                        </p>
                        {variantText ? (
                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {variantText}
                          </p>
                        ) : null}
                        {isDelivered || order.status === 'partial_delivered' ? (
                          <p className="mt-1 text-[11px] font-semibold text-gray-500">
                            Có thể trả:{' '}
                            <span className="text-[#2563EB]">
                              {item.returnableQuantity ?? 0}
                            </span>
                            {Number(item.returnedQuantity ?? 0) > 0
                              ? ` · Đã yêu cầu: ${item.returnedQuantity}`
                              : ''}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-black text-[#2563EB]">
                        {formatPrice(item.lineTotal)}
                      </p>
                      {(isDelivered || order.status === 'partial_delivered') &&
                      Number(item.returnableQuantity ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => openReturnModal(item)}
                          className="shrink-0 rounded-full border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          Trả hàng
                        </button>
                      ) : null}
                      {isDelivered ? (
                        <Link
                          to={`/client/products/${item.productId}#reviews`}
                          className="flex shrink-0 items-center gap-1 rounded-full border border-[#2563EB]/20 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] transition hover:bg-[#2563EB]/10"
                        >
                          <Star size={10} /> Đánh giá
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2 border-t border-black/5 pt-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotalAmount)}</span>
                </div>
                {Number(order.discountAmount) > 0 ? (
                  <div className="flex justify-between text-[#c82014]">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span>
                    {Number(order.deliveryCost) === 0
                      ? 'Miễn phí'
                      : formatPrice(order.deliveryCost)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-2 text-base font-black">
                  <span className="text-[#0B0F19]">Tổng thanh toán</span>
                  <span className="text-[#2563EB]">{formatPrice(order.totalPayment)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
                <MapPin size={13} /> Địa chỉ giao hàng
              </h3>
              <p className="text-sm font-semibold text-[#0B0F19]">{order.fullName}</p>
              <p className="text-sm text-gray-500">{order.phone}</p>
              <p className="mt-1 text-sm text-gray-600">{order.address}</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
                <CreditCard size={13} /> Thanh toán
              </h3>
              <p className="text-sm text-[#0B0F19]">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <p className="mt-1 text-xs font-bold" style={{ color: paymentStatusInfo.color }}>
                {paymentStatusInfo.label}
              </p>
              {order.paymentMethod === 'momo' && order.paymentStatus !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => void reconcilePayment(order.id, true)}
                  disabled={paymentReconciling}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#2563EB]/20 py-2 text-xs font-bold text-[#2563EB] transition hover:bg-[#2563EB]/10 disabled:opacity-60"
                >
                  {paymentReconciling ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Kiểm tra thanh toán
                </button>
              ) : null}
              {paymentSyncMessage ? (
                <p className="mt-2 text-xs text-gray-500">{paymentSyncMessage}</p>
              ) : null}
            </div>

            {order.note ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">
                  Ghi chú
                </h3>
                <p className="text-sm text-gray-600">{order.note}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              {order.status === 'shipping' ? (
                <button
                  type="button"
                  onClick={() => void confirmReceived()}
                  disabled={confirmingReceived}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-60"
                  style={{ background: '#15803d' }}
                >
                  {confirmingReceived ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Đã nhận được hàng
                </button>
              ) : null}
              {(isDelivered || order.status === 'partial_delivered') ? (
                <div className="space-y-2">
                  <p className={`rounded-2xl px-4 py-3 text-xs font-semibold ${
                    order.canCreateReturn === false
                      ? 'border border-amber-200 bg-amber-50 text-amber-800'
                      : 'bg-blue-50 text-[#0B0F19]'
                  }`}>
                    {order.canCreateReturn === false
                      ? getReturnBlockedMessage(order.returnBlockedReason)
                      : `Có thể yêu cầu trả hàng đến ${order.returnDeadline ? formatDate(order.returnDeadline) : 'hết thời hạn 7 ngày'}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => openReturnModal()}
                    disabled={order.canCreateReturn === false || !order.items.some((item) => Number(item.returnableQuantity ?? 0) > 0)}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 py-2.5 text-sm font-black text-amber-700 transition hover:bg-amber-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Package size={15} /> Yêu cầu trả hàng
                  </button>
                </div>
              ) : null}
              {order.status === 'pending' ? (
                <button
                  onClick={async () => {
                    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
                    try {
                      await clientApi.patch(`/orders/${order.id}/cancel`);
                      setOrder((current) =>
                        current ? { ...current, status: 'cancelled' } : current,
                      );
                    } catch (error) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'Không thể hủy đơn hàng';
                      showToast({
                        tone:
                          message === 'PAID_ORDER_CANCEL_REQUIRES_REFUND'
                            ? 'warning'
                            : 'error',
                        title:
                          message === 'PAID_ORDER_CANCEL_REQUIRES_REFUND'
                            ? 'Đơn đã thanh toán cần xử lý hoàn tiền'
                            : message,
                        description:
                          message === 'PAID_ORDER_CANCEL_REQUIRES_REFUND'
                            ? 'Vui lòng liên hệ CSKH để shop tạo chứng từ hoàn tiền trước khi hủy.'
                            : undefined,
                      });
                    }
                  }}
                  className="w-full rounded-full border border-red-200 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-95"
                >
                  Hủy đơn hàng
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (id) {
                    void Promise.all([refreshOrder(id, true), refreshTracking(id, true)]);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#2563EB]/20 py-2.5 text-sm font-bold text-[#2563EB] transition hover:bg-[#2563EB]/10"
              >
                <RefreshCw size={15} /> Làm mới tracking
              </button>
              <Link
                to="/client/products"
                className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-white transition active:scale-95"
                style={{ background: '#1D4ED8' }}
              >
                <Shirt size={15} /> Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
      {returnModalOpen && selectedReturnItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#0B0F19]">
                  Yêu cầu trả hàng
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chọn đúng sản phẩm, số lượng và lý do để shop kiểm tra.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">
                  Sản phẩm
                </span>
                <select
                  value={returnItemId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const nextItem = order.items.find((item) => item.id === nextId);
                    setReturnItemId(nextId);
                    setReturnQuantity(
                      Math.min(1, Number(nextItem?.returnableQuantity ?? 1)),
                    );
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#2563EB]"
                >
                  {order.items
                    .filter((item) => Number(item.returnableQuantity ?? 0) > 0)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productName}
                        {item.colorName ? ` - ${item.colorName}` : ''}
                        {item.sizeName ? ` / ${item.sizeName}` : ''}
                      </option>
                    ))}
                </select>
              </label>

              <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-[#0B0F19]">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {resolveMediaUrl(selectedReturnItem.imageUrl) ? (
                    <img
                      src={resolveMediaUrl(selectedReturnItem.imageUrl) ?? ''}
                      alt={selectedReturnItem.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Shirt size={20} className="text-[#2563EB]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-bold">{selectedReturnItem.productName}</p>
                  {(selectedReturnItem.colorName || selectedReturnItem.sizeName || selectedReturnItem.sku) ? (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {[selectedReturnItem.colorName, selectedReturnItem.sizeName, selectedReturnItem.sku]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-500">
                    Đã mua {selectedReturnItem.quantity} · Có thể trả{' '}
                    {selectedReturnItem.returnableQuantity ?? 0}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">
                  Số lượng trả
                </span>
                <input
                  type="number"
                  min={1}
                  max={selectedReturnItem.returnableQuantity ?? 1}
                  value={returnQuantity}
                  onChange={(event) =>
                    setReturnQuantity(
                      Math.max(
                        1,
                        Math.min(
                          Number(selectedReturnItem.returnableQuantity ?? 1),
                          Number(event.target.value) || 1,
                        ),
                      ),
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">
                  Lý do
                </span>
                <select
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                >
                  <option value="">Chọn lý do trả hàng</option>
                  <option value="wrong_size">Sai size / không vừa</option>
                  <option value="defective">Sản phẩm lỗi hoặc hỏng</option>
                  <option value="wrong_item">Shop giao sai sản phẩm</option>
                  <option value="not_as_described">Sản phẩm không đúng mô tả</option>
                  <option value="changed_mind">Đổi ý không còn nhu cầu</option>
                  <option value="other">Lý do khác</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">
                  Mô tả chi tiết
                </span>
                <textarea
                  rows={3}
                  value={returnDescription}
                  onChange={(event) => setReturnDescription(event.target.value)}
                  placeholder="Mô tả tình trạng hàng và mong muốn hỗ trợ..."
                  className="w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                disabled={submittingReturn}
                className="flex-1 rounded-full border border-black/10 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void submitReturnRequest()}
                disabled={submittingReturn}
                className="flex-1 rounded-full bg-[#2563EB] py-3 text-sm font-black text-white hover:bg-[#1D4ED8] disabled:opacity-60"
              >
                {submittingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrackingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-black text-[#0B0F19]">{value}</p>
    </div>
  );
}
