import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, Plus, Check, ChevronRight, ArrowLeft, Leaf } from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';

type Address = {
  _id: string;
  label?: string;
  recipientName: string;
  phoneNumber: string;
  street: string;
  ward?: string;
  district?: string;
  province: string;
  isDefault: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useClientSession();
  const { cart } = useCart();

  const discountCode = (location.state as { discountCode?: string } | null)?.discountCode;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [note, setNote] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New address form
  const [form, setForm] = useState({
    recipientName: session?.user.fullName ?? session?.user.username ?? '',
    phoneNumber: session?.user.phoneNumber ?? '',
    street: '',
    ward: '',
    district: '',
    province: '',
    label: '',
  });

  useEffect(() => {
    if (!session) { void navigate('/client/login'); return; }
    void clientApi
      .get<Address[]>('/users/me/addresses')
      .then((data) => {
        setAddresses(data ?? []);
        const def = data?.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def._id);
        else if (data?.[0]) setSelectedAddressId(data[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [session, navigate]);

  if (!session || !cart) return null;

  const subtotal = cart.totalAmount;
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  const handleSaveAddress = async () => {
    if (!form.recipientName || !form.phoneNumber || !form.street || !form.province) return;
    try {
      const newAddr = await clientApi.post<Address>('/users/me/addresses', form);
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr._id);
      setAddingAddress(false);
      setForm({ recipientName: '', phoneNumber: '', street: '', ward: '', district: '', province: '', label: '' });
    } catch {}
  };

  const handleContinue = () => {
    if (!selectedAddressId && !addingAddress) return;
    const addr = addresses.find((a) => a._id === selectedAddressId);
    void navigate('/client/payment', {
      state: {
        addressId: selectedAddressId,
        shippingAddress: addr
          ? `${addr.recipientName}, ${addr.phoneNumber}, ${addr.street}, ${addr.ward ? addr.ward + ', ' : ''}${addr.district ? addr.district + ', ' : ''}${addr.province}`
          : '',
        note,
        discountCode,
        cart,
        total,
      },
    });
  };

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-3 text-sm">
          {[
            { label: 'Giỏ hàng', done: true },
            { label: 'Địa chỉ giao', active: true },
            { label: 'Thanh toán' },
            { label: 'Xác nhận' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
              <span
                className={`text-sm font-semibold ${
                  step.done ? 'text-[#006241]' : step.active ? 'text-[#1E3932] font-black' : 'text-gray-400'
                }`}
              >
                {step.done ? <span className="text-[#006241]">✓</span> : null} {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Addresses */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1E3932]">
              <MapPin size={20} className="text-[#006241]" /> Địa chỉ giao hàng
            </h2>

            {loadingAddresses ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#006241] border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => { setSelectedAddressId(addr._id); setAddingAddress(false); }}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                      selectedAddressId === addr._id && !addingAddress
                        ? 'border-[#006241] bg-[#006241]/5'
                        : 'border-transparent bg-white hover:border-[#006241]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1E3932]">{addr.recipientName}</p>
                          {addr.isDefault && (
                            <span className="rounded-full bg-[#006241]/10 px-2 py-0.5 text-[10px] font-black text-[#006241]">
                              Mặc định
                            </span>
                          )}
                          {addr.label && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                              {addr.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">{addr.phoneNumber}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      {selectedAddressId === addr._id && !addingAddress && (
                        <Check size={18} className="shrink-0 text-[#006241]" />
                      )}
                    </div>
                  </button>
                ))}

                {/* Add new address */}
                {!addingAddress ? (
                  <button
                    onClick={() => { setAddingAddress(true); setSelectedAddressId(null); }}
                    className="flex w-full items-center gap-2 rounded-2xl border-2 border-dashed border-[#006241]/20 bg-white px-5 py-4 text-sm font-semibold text-[#006241] transition hover:border-[#006241]/40"
                  >
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                ) : (
                  <div className="rounded-2xl border-2 border-[#006241] bg-white p-5">
                    <h3 className="mb-4 font-bold text-[#1E3932]">Địa chỉ mới</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { key: 'recipientName', label: 'Họ và tên *', placeholder: 'Nguyễn Văn A' },
                        { key: 'phoneNumber', label: 'Số điện thoại *', placeholder: '0901234567' },
                        { key: 'street', label: 'Địa chỉ cụ thể *', placeholder: '123 Đường ABC', span: true },
                        { key: 'ward', label: 'Phường/Xã', placeholder: 'Phường 5' },
                        { key: 'district', label: 'Quận/Huyện', placeholder: 'Quận 12' },
                        { key: 'province', label: 'Tỉnh/Thành phố *', placeholder: 'TP. Hồ Chí Minh' },
                        { key: 'label', label: 'Nhãn (tùy chọn)', placeholder: 'Nhà, Công ty...' },
                      ].map((field) => (
                        <div key={field.key} className={field.span ? 'sm:col-span-2' : ''}>
                          <label className="mb-1 block text-xs font-semibold text-gray-500">{field.label}</label>
                          <input
                            value={form[field.key as keyof typeof form]}
                            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full rounded-xl border border-black/10 bg-[#f2f0eb] px-4 py-2.5 text-sm outline-none focus:border-[#006241]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => void handleSaveAddress()}
                        className="flex-1 rounded-full py-2.5 text-sm font-bold text-white"
                        style={{ background: '#006241' }}
                      >
                        Lưu địa chỉ
                      </button>
                      <button
                        onClick={() => setAddingAddress(false)}
                        className="rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-gray-500"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-[#1E3932]">
                Ghi chú đơn hàng (tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Hướng dẫn giao hàng, yêu cầu đặc biệt..."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#006241]"
              />
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                to="/client/cart"
                className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-gray-500 transition hover:border-[#006241] hover:text-[#006241]"
              >
                <ArrowLeft size={15} /> Quay lại giỏ hàng
              </Link>
              <button
                onClick={handleContinue}
                disabled={!selectedAddressId && !addingAddress}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-50 active:scale-95"
                style={{ background: '#00754A' }}
              >
                Tiếp tục thanh toán <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="rounded-2xl bg-white p-5">
              <p className="mb-4 text-sm font-black uppercase tracking-wider text-gray-400">
                Đơn hàng ({cart.totalItems} sản phẩm)
              </p>
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f2f0eb]">
                      {item.product.images?.[0]?.imageUrl ? (
                        <img
                          src={item.product.images[0].imageUrl}
                          alt={item.product.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf size={18} className="text-[#006241]/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 text-xs font-semibold text-[#1E3932]">
                        {item.product.productName}
                      </p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-xs font-bold text-[#006241]">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vận chuyển</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-[#006241]' : ''}`}>
                    {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-2 text-base">
                  <span className="font-black text-[#1E3932]">Tổng cộng</span>
                  <span className="font-black text-[#006241]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
