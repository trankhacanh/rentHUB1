const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(value) {
  const amount = Number(value ?? 0);
  return VND_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
}
