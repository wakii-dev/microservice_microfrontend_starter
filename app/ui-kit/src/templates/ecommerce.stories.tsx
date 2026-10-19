// Templates/E-Commerce — storefront hoàn chỉnh (R11, templategoal): header
// Menubar + Input.Search + Badge giỏ + Avatar · hero Carousel (indicators
// pagination-style + Tag khuyến mãi) · filter bar Segmented + Slider range giá +
// ColorPicker accent + Tag.Checkable hãng · grid sản phẩm Card hoverable
// (Image picsum + Rating + Statistic giá + add → toast + Badge tăng) +
// Pagination + Skeleton demo + EmptyState · Drawer SP chi tiết (Galleria +
// Descriptions + Rating + InputNumber + Popconfirm thêm giỏ + QRCode thanh toán) ·
// Drawer giỏ/checkout (List + Statistic tổng + Coupon validate + Progress freeship
// + Steps 3 bước + Result success + mã đơn CountUp). REF-SPEC typography (label
// 12px/700 tracking 2.4 · CTA sáng). Data VN-flavored (sản phẩm tech, giá ₫).
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar, Badge, Button, Card, ColorPicker, CountUp, Descriptions, Divider,
  Drawer, EmptyState, Field, Galleria, Icon, Input, InputNumber, List, message,
  Menubar, Pagination, Popconfirm, Progress, QRCode, Rating, Result, Segmented,
  Skeleton, Slider, Statistic, Steps, Switch, Tag, Tooltip, UiImage,
} from '../index';
import { Carousel } from '@wakii/ui-kit/carousel';

// ── Data — sản phẩm tech VN-flavored ──
interface Product {
  id: string;
  name: string;
  brand: string;
  cat: 'Phụ kiện' | 'Âm thanh' | 'Màn hình' | 'Lưu trữ';
  price: number; // VNĐ
  rating: number;
  sold: number;
}

const PRODUCTS: Product[] = [
  { id: 'akko5075', name: 'Bàn phím cơ Akko 5075B Plus', brand: 'Akko', cat: 'Phụ kiện', price: 2790000, rating: 4.8, sold: 312 },
  { id: 'gprox', name: 'Chuột Logitech G Pro X Superlight', brand: 'Logitech', cat: 'Phụ kiện', price: 4290000, rating: 4.9, sold: 508 },
  { id: 'dellu27', name: 'Màn hình Dell UltraSharp U2723QE 27" 4K', brand: 'Dell', cat: 'Màn hình', price: 14900000, rating: 4.7, sold: 87 },
  { id: 'xm5', name: 'Tai nghe Sony WH-1000XM5', brand: 'Sony', cat: 'Âm thanh', price: 8490000, rating: 4.9, sold: 641 },
  { id: '990pro', name: 'SSD Samsung 990 Pro 1TB NVMe', brand: 'Samsung', cat: 'Lưu trữ', price: 3690000, rating: 4.8, sold: 415 },
  { id: 'brio', name: 'Webcam Logitech Brio 4K', brand: 'Logitech', cat: 'Phụ kiện', price: 2590000, rating: 4.5, sold: 233 },
  { id: 'mv7', name: 'Micro Shure MV7 podcast', brand: 'Shure', cat: 'Âm thanh', price: 6590000, rating: 4.8, sold: 129 },
  { id: 'baseus8', name: 'Hub Baseus 8-in-1 USB-C', brand: 'Baseus', cat: 'Phụ kiện', price: 890000, rating: 4.4, sold: 720 },
  { id: 'deskmat', name: 'Desk mat Orca XL — dark wave', brand: 'Orca', cat: 'Phụ kiện', price: 490000, rating: 4.6, sold: 1024 },
];

const BRANDS = ['Akko', 'Logitech', 'Dell', 'Sony', 'Samsung', 'Shure', 'Baseus', 'Orca'];
const CATS = ['Tất cả', 'Phụ kiện', 'Âm thanh', 'Màn hình', 'Lưu trữ'] as const;
const FREESHIP = 5_000_000;
const img = (seed: string, w = 480, h = 360) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const vnd = (n: number) => `${n.toLocaleString('vi-VN')}₫`;

const MENUBAR_ITEMS = [
  { key: 'home', label: 'Trang chủ', onClick: () => message.info('Trang chủ (demo)') },
  {
    key: 'cate', label: 'Danh mục',
    children: [
      { key: 'c1', label: 'Phụ kiện' },
      { key: 'c2', label: 'Âm thanh' },
      { key: 'c3', label: 'Màn hình' },
    ],
  },
  { key: 'orders', label: 'Đơn hàng', onClick: () => message.info('Đơn hàng (demo)') },
  { key: 'support', label: 'Hỗ trợ', onClick: () => message.info('Hotline 1900-ORCA') },
];

function EcomStore() {
  // §3 Filters
  const [cat, setCat] = useState<string>('Tất cả');
  const [priceMax, setPriceMax] = useState(15); // triệu
  const [brands, setBrands] = useState<string[]>([]);
  const [accent, setAccent] = useState('#1677ff');
  const [q, setQ] = useState('');
  const [gridLoading, setGridLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Cart + drawers
  const [cart, setCart] = useState<Record<string, number>>({ gprox: 1, xm5: 1 });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [orderId, setOrderId] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [couponOk, setCouponOk] = useState(false);
  const [ship, setShip] = useState({ name: '', phone: '', address: '' });
  const [detail, setDetail] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [confirmAdd, setConfirmAdd] = useState(false);

  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartLines = Object.entries(cart).map(([id, n]) => ({ p: PRODUCTS.find((x) => x.id === id)!, n }));
  const subtotal = cartLines.reduce((s, l) => s + l.p.price * l.n, 0);
  const total = couponOk ? Math.round(subtotal * 0.9) : subtotal;
  const freeshipPct = Math.min(100, Math.round((total / FREESHIP) * 100));

  const filtered = useMemo(() => {
    const maxVnd = priceMax * 1_000_000;
    return PRODUCTS.filter(
      (p) =>
        (cat === 'Tất cả' || p.cat === cat) &&
        (brands.length === 0 || brands.includes(p.brand)) &&
        p.price <= maxVnd &&
        p.name.toLowerCase().includes(q.trim().toLowerCase()),
    );
  }, [cat, brands, priceMax, q]);

  const pageSize = 6;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function addToCart(p: Product, n = 1) {
    setCart((prev) => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + n }));
    message.success(`Đã thêm ${n} × "${p.name}" vào giỏ.`);
  }

  // §7 Checkout đặt hàng → Result + mã đơn CountUp
  function placeOrder() {
    if (!ship.name.trim() || !ship.phone.trim() || !ship.address.trim()) {
      message.error('Điền đủ Họ tên / SĐT / Địa chỉ trước khi đặt.');
      return;
    }
    setOrderId(Math.floor(100000 + Math.random() * 900000));
    setCheckoutStep(2);
  }

  function resetFlow() {
    setCart({});
    setCouponOk(false);
    setCoupon('');
    setCheckoutStep(0);
    setCartOpen(false);
    message.success('Cảm ơn bạn — đơn hàng đang được xử lý!');
  }

  const STEP_ITEMS = [{ title: 'Giỏ hàng' }, { title: 'Thông tin' }, { title: 'Hoàn tất' }];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* §1 Header — Menubar + search + Badge giỏ + Avatar */}
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-7 rounded-lg bg-accent" />
            <span className="text-body font-semibold text-ink">wakii.store</span>
          </span>
          <Menubar items={MENUBAR_ITEMS} className="hidden border-none md:flex" />
          <div className="ml-auto flex items-center gap-3">
            <div className="w-48">
              <Input.Search aria-label="Tìm sản phẩm" placeholder="Tìm bàn phím, chuột…" onSearch={setQ} />
            </div>
            <Badge count={cartCount}>
              <Button type="text" onClick={() => { setCartOpen(true); setCheckoutStep(0); }}>
                Giỏ hàng
              </Button>
            </Badge>
            <Avatar size={28}>A</Avatar>
          </div>
        </div>
      </header>

      {/* §2 Hero — Carousel indicators pagination-style + Tag khuyến mãi */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Card className="overflow-hidden">
          <Carousel
            items={[
              <div key="s1" className="relative grid h-52 place-items-center bg-gradient-to-br from-accent/15 via-accent/5 to-canvas sm:h-64">
                <Tag className="absolute left-4 top-4" icon={<Icon name="star" size={10} />}>SALE — mã WAKII10 giảm 10%</Tag>
                <div className="text-center">
                  <p className="m-0 text-h2 font-light text-ink">Gear gõ phím cho dev</p>
                  <p className="m-0 mt-1 text-label text-ink3">Freeship đơn từ 5.000.000₫</p>
                </div>
              </div>,
              <div key="s2" className="relative grid h-52 place-items-center bg-gradient-to-br from-st-done/15 to-canvas sm:h-64">
                <Tag className="absolute left-4 top-4" icon={<Icon name="check-circle" size={10} />}>Bảo hành 24 tháng</Tag>
                <p className="m-0 text-h2 font-light text-ink">Âm thanh / Màn hình / Lưu trữ</p>
              </div>,
              <div key="s3" className="relative grid h-52 place-items-center bg-gradient-to-br from-st-doing/15 to-canvas sm:h-64">
                <Tag className="absolute left-4 top-4" icon={<Icon name="refresh" size={10} />}>Đổi trả 7 ngày</Tag>
                <p className="m-0 text-h2 font-light text-ink">Trả góp 0% qua thẻ tín dụng</p>
              </div>,
            ]}
            indicators
            autoplay
            pauseOnHover
          />
        </Card>
      </div>

      {/* §3 Filter bar — Segmented + Slider range + ColorPicker + Checkable brands */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <Segmented
              value={cat}
              onChange={(v) => { setCat(String(v)); setPage(1); }}
              options={CATS.map((c) => ({ label: c, value: c }))}
            />
            <div className="w-52">
              <p className="m-0 mb-1 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">
                Giá ≤ {priceMax} tr
              </p>
              <Slider
                range={[0, 15]}
                min={0}
                max={15}
                step={1}
                value={priceMax}
                ariaLabel="Giá tối đa (triệu đồng)"
                onRangeChange={(r) => { setPriceMax(r[1]); setPage(1); }}
              />
            </div>
            <Tooltip title="Màu điểm nhấn giá — demo ColorPicker live">
              <div className="w-40">
                <p className="m-0 mb-1 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">Accent</p>
                <ColorPicker value={accent} onChange={setAccent} />
              </div>
            </Tooltip>
            <div className="flex flex-wrap items-center gap-1.5">
              {BRANDS.map((b) => (
                <Tag.Checkable
                  key={b}
                  checked={brands.includes(b)}
                  onChange={(on) => {
                    setBrands((prev) => (on ? [...prev, b] : prev.filter((x) => x !== b)));
                    setPage(1);
                  }}
                >
                  {b}
                </Tag.Checkable>
              ))}
            </div>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">
              Skeleton demo
              <Switch checked={gridLoading} onChange={setGridLoading} aria-label="Bật demo skeleton" />
            </label>
          </div>
        </Card>
      </div>

      {/* §4 Grid sản phẩm — Card hoverable + Rating + giá + add; Pagination + Empty */}
      <div className="mx-auto mt-4 max-w-6xl px-4">
        {gridLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i}><Skeleton variant="card" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title="Không có sản phẩm khớp bộ lọc"
              description="Thử nới giới hạn giá hoặc bỏ chọn hãng."
              action={<Button onClick={() => { setBrands([]); setPriceMax(15); setCat('Tất cả'); setQ(''); }}>Xoá bộ lọc</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((p) => (
              <div key={p.id} className="cursor-pointer" onClick={() => { setDetail(p); setQty(1); }}>
              <Card hoverable className="group">
                <div className="overflow-hidden rounded-lg">
                  <UiImage src={img(p.id)} alt={p.name} width="100%" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <p className="m-0 text-body font-medium text-ink [overflow-wrap:anywhere]">{p.name}</p>
                  <Tag>{p.brand}</Tag>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Rating value={p.rating} readOnly />
                  <span className="text-meta text-ink3">Đã bán {p.sold.toLocaleString('vi-VN')}</span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <Statistic value={<span style={{ color: accent }} className="tabular-nums">{vnd(p.price)}</span>} />
                  <Button
                    size="small"
                    type="primary"
                    icon={<Icon name="plus" size={12} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                    }}
                  >
                    Thêm
                  </Button>
                </div>
              </Card>
              </div>
            ))}
          </div>
        )}
        {!gridLoading && filtered.length > pageSize && (
          <div className="mt-5 flex justify-center">
            <Pagination current={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
          </div>
        )}
      </div>

      {/* §5 Drawer SP chi tiết — Galleria + Descriptions + qty + Popconfirm + QRCode */}
      <Drawer open={!!detail} title={detail?.name ?? ''} width={520} onClose={() => setDetail(null)}>
        {detail && (
          <div className="grid gap-4">
            <Galleria
              images={[1, 2, 3].map((n) => ({ src: img(`${detail.id}-${n}`, 640, 420), alt: `${detail.name} — ảnh ${n}` }))}
            />
            <Descriptions
              items={[
                { label: 'Thương hiệu', children: detail.brand },
                { label: 'Danh mục', children: detail.cat },
                { label: 'Bảo hành', children: '24 tháng chính hãng' },
                { label: 'Đánh giá', children: <Rating value={detail.rating} readOnly /> },
              ]}
            />
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">Số lượng</span>
              <InputNumber
                ariaLabel={`Số lượng ${detail.name}`}
                value={qty}
                min={1}
                max={9}
                onChange={(v) => setQty(Math.max(1, Math.min(9, v ?? 1)))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Statistic title="Tạm tính" value={<span className="tabular-nums">{vnd(detail.price * qty)}</span>} />
              <QRCode value={`https://pay.wakii.dev/${detail.id}?qty=${qty}`} size={110} icon={<Icon name="check-circle" size={20} className="text-ink" />} />
            </div>
            <Popconfirm
              open={confirmAdd}
              title={`Thêm ${qty} × "${detail.name}"?`}
              okText="Thêm vào giỏ"
              onConfirm={() => {
                addToCart(detail, qty);
                setConfirmAdd(false);
                setDetail(null);
              }}
              onCancel={() => setConfirmAdd(false)}
            >
              <Button block type="primary" onClick={() => setConfirmAdd(true)}>
                Thêm vào giỏ
              </Button>
            </Popconfirm>
          </div>
        )}
      </Drawer>

      {/* §6+§7 Drawer giỏ / checkout — Steps 3 bước */}
      <Drawer
        open={cartOpen}
        title={checkoutStep === 2 ? 'Đặt hàng thành công' : `Giỏ hàng (${cartCount})`}
        width={560}
        onClose={() => { setCartOpen(false); if (checkoutStep === 2) resetFlow(); }}
      >
        <Steps items={STEP_ITEMS} current={checkoutStep} className="mb-5" />

        {checkoutStep === 0 && (
          <div className="grid gap-4">
            {cartLines.length === 0 ? (
              <EmptyState title="Giỏ hàng trống" description="Thêm vài sản phẩm từ grid phía sau nhé." />
            ) : (
              <>
                <List
                  items={cartLines}
                  renderItem={(l) => (
                    <div className="flex items-center gap-3 py-2">
                      <img src={img(l.p.id, 96, 72)} alt={l.p.name} className="h-12 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-label font-medium text-ink">{l.p.name}</p>
                        <p className="m-0 text-meta text-ink3">{l.n} × {vnd(l.p.price)}</p>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        aria-label={`Xoá ${l.p.name}`}
                        icon={<Icon name="times" size={12} />}
                        onClick={() => {
                          setCart((prev) => {
                            const next = { ...prev };
                            delete next[l.p.id];
                            return next;
                          });
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  )}
                />
                <Divider className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold tracking-[2.4px] text-ink3 uppercase">Coupon</span>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Mã giảm giá"
                      placeholder="WAKII10"
                      value={coupon}
                      className="w-36"
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (coupon.trim().toUpperCase() === 'WAKII10') {
                          setCouponOk(true);
                          message.success('Áp dụng giảm 10%.');
                        } else {
                          setCouponOk(false);
                          message.error('Mã không hợp lệ hoặc hết hạn.');
                        }
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-label text-ink2">
                    <span>
                      Freeship từ {vnd(FREESHIP)}
                      {couponOk && <span className="text-st-done"> · đã giảm 10%</span>}
                    </span>
                    <span className="tabular-nums">{freeshipPct}%</span>
                  </div>
                  <Progress percent={freeshipPct} showInfo={false} className="mt-1" status={freeshipPct >= 100 ? 'success' : 'normal'} />
                </div>
                <div className="flex items-center justify-between">
                  <Statistic title="Tạm tính" value={<span className="tabular-nums">{vnd(subtotal)}</span>} />
                  <Statistic title="Thanh toán" value={<span className="tabular-nums" style={{ color: 'var(--accent)' }}>{vnd(total)}</span>} />
                </div>
                <Button block type="primary" size="large" disabled={cartLines.length === 0} onClick={() => setCheckoutStep(1)}>
                  Tiến hành thanh toán
                </Button>
              </>
            )}
          </div>
        )}

        {checkoutStep === 1 && (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
          >
            <Field label="Họ tên" htmlFor="co-name" required>
              <Input id="co-name" value={ship.name} onChange={(e) => setShip((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            <Field label="Số điện thoại" htmlFor="co-phone" required>
              <Input id="co-phone" type="tel" value={ship.phone} onChange={(e) => setShip((s) => ({ ...s, phone: e.target.value }))} />
            </Field>
            <Field label="Địa chỉ" htmlFor="co-addr" required>
              <Input id="co-addr" value={ship.address} onChange={(e) => setShip((s) => ({ ...s, address: e.target.value }))} />
            </Field>
            <div className="mt-2 flex items-center justify-between">
              <Button type="text" onClick={() => setCheckoutStep(0)}>← Giỏ hàng</Button>
              <Button htmlType="submit" type="primary" size="large">Đặt hàng — {vnd(total)}</Button>
            </div>
          </form>
        )}

        {checkoutStep === 2 && (
          <Result
            status="success"
            title="Đơn hàng đã ghi nhận!"
            subTitle={`Mã đơn #ORCA-${orderId || '——'} · Chúng tôi gửi xác nhận qua điện thoại.`}
            extra={
              <div className="grid justify-items-center gap-4">
                <div className="text-[clamp(2rem,6vw,3rem)] font-light tabular-nums text-ink">
                  <CountUp value={orderId} duration={1.4} format={(n) => `#${Math.round(n)}`} />
                </div>
                <QRCode value={`https://pay.wakii.dev/order/${orderId}`} size={130} icon={<Icon name="check-circle" size={20} className="text-ink" />} />
                <Button type="primary" onClick={resetFlow}>Tiếp tục mua sắm</Button>
              </div>
            }
          />
        )}
      </Drawer>
    </div>
  );
}

const meta = { title: 'Templates/E-Commerce', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** ECommerce — storefront đầy đủ: header/cart · hero carousel · filter bar · grid ·
 * product drawer · cart drawer · checkout steps + result. Mọi nút đều thao tác được. */
export const Store: S = {
  render: () => <EcomStore />,
};
