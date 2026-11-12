
import { useEffect, useMemo, useState } from 'react';
import reviewService from '../../../services/reviewService';

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatRating = (rating) => {
  const value = Number(rating);
  return Number.isFinite(value) ? value : 0;
};

const StarRating = ({ rating }) => {
  const value = formatRating(rating);

  return (
    <span
      className="whitespace-nowrap text-amber-500"
      aria-label={`${value} trên 5 sao`}
    >
      {'★'.repeat(Math.max(0, Math.min(5, value)))}
      <span className="text-slate-300">
        {'★'.repeat(5 - Math.max(0, Math.min(5, value)))}
      </span>
      <span className="ml-2 text-sm text-slate-600">{value}/5</span>
    </span>
  );
};

const StatCard = ({ title, value, description }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </div>
);

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [selectedReview, setSelectedReview] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await reviewService.getAllReviewsForAdmin();

      if (!Array.isArray(response.data)) {
        throw new Error('Dữ liệu đánh giá trả về không đúng định dạng.');
      }

      setReviews(response.data);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Phiên đăng nhập đã hết hạn hoặc chưa được xác thực.'
          : err.response?.status === 403
            ? 'Bạn không có quyền truy cập danh sách đánh giá.'
            : err.response?.data?.message ||
              err.message ||
              'Không thể tải danh sách đánh giá.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const ratingSum = reviews.reduce(
      (sum, review) => sum + formatRating(review.rating),
      0
    );
    const average = total > 0 ? ratingSum / total : 0;

    return {
      total,
      average: average.toFixed(1),
      fiveStars: reviews.filter(
        (review) => formatRating(review.rating) === 5
      ).length,
      lowRatings: reviews.filter(
        (review) => formatRating(review.rating) <= 2
      ).length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          review.id,
          review.bookingId,
          review.equipmentId,
          review.equipmentTitle,
          review.reviewerId,
          review.reviewerName,
          review.comment,
        ].some((value) =>
          String(value ?? '').toLowerCase().includes(normalizedKeyword)
        );

      const matchesRating =
        ratingFilter === 'ALL' ||
        formatRating(review.rating) === Number(ratingFilter);

      return matchesKeyword && matchesRating;
    });
  }, [reviews, keyword, ratingFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý đánh giá
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi đánh giá của khách hàng trên RentHub.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadReviews}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng đánh giá"
          value={stats.total}
          description="Số đánh giá đã tải từ hệ thống"
        />
        <StatCard
          title="Điểm trung bình"
          value={`${stats.average}/5`}
          description="Trung bình số sao của tất cả đánh giá"
        />
        <StatCard
          title="Đánh giá 5 sao"
          value={stats.fiveStars}
          description="Số đánh giá đạt mức cao nhất"
        />
        <StatCard
          title="Đánh giá thấp"
          value={stats.lowRatings}
          description="Đánh giá từ 1 đến 2 sao"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Danh sách đánh giá
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tìm theo mã đánh giá, booking, thiết bị, người đánh giá hoặc nội dung.
          </p>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              aria-label="Tìm kiếm đánh giá"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
              aria-label="Lọc theo số sao"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Hiển thị {filteredReviews.length}/{reviews.length} đánh giá
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Đang tải danh sách đánh giá...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-700">
              {error ? 'Chưa thể tải dữ liệu' : 'Không tìm thấy đánh giá'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {error
                ? 'Hãy kiểm tra API và quyền truy cập.'
                : 'Thử thay đổi từ khóa hoặc bộ lọc.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Người đánh giá</th>
                  <th className="px-5 py-3 font-semibold">Thiết bị</th>
                  <th className="px-5 py-3 font-semibold">Số sao</th>
                  <th className="px-5 py-3 font-semibold">Nội dung</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50">
                    <td className="max-w-48 px-5 py-4">
                      <p className="truncate font-medium text-slate-900">
                        {review.reviewerName || 'Người dùng'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {review.reviewerId || '—'}
                      </p>
                    </td>

                    <td className="max-w-56 px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {review.equipmentTitle || 'Thiết bị'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Booking: {review.bookingId || '—'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StarRating rating={review.rating} />
                    </td>

                    <td className="max-w-64 px-5 py-4">
                      <p className="line-clamp-2 text-slate-600">
                        {review.comment || 'Không có nội dung'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(review.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReview(review)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2
                id="review-detail-title"
                className="text-lg font-bold text-slate-900"
              >
                Chi tiết đánh giá
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                aria-label="Đóng chi tiết"
                className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm text-slate-500">Mã đánh giá</p>
                <p className="mt-1 break-all font-medium">
                  {selectedReview.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Mã booking</p>
                <p className="mt-1 break-all">{selectedReview.bookingId}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Thiết bị</p>
                <p className="mt-1 font-medium">
                  {selectedReview.equipmentTitle || '—'}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {selectedReview.equipmentId || '—'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Người đánh giá</p>
                <p className="mt-1 font-medium">
                  {selectedReview.reviewerName || '—'}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {selectedReview.reviewerId || '—'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Đánh giá</p>
                <div className="mt-1">
                  <StarRating rating={selectedReview.rating} />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Nội dung</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">
                  {selectedReview.comment || 'Không có nội dung'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Ngày tạo</p>
                  <p className="mt-1">{formatDate(selectedReview.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cập nhật lần cuối</p>
                  <p className="mt-1">{formatDate(selectedReview.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
