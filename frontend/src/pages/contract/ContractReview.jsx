import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import axiosClient from '../../services/axiosClient';
import contractService from '../../services/contractService';
import { formatVnd } from '../../utils/currency';

const unwrap = (response) =>
  response?.data?.data ?? response?.data;

const formatCurrency = formatVnd;

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN');
};

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ xem xét',
  REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
  PENDING_SIGNATURE: 'Chờ ký',
  SIGNED: 'Đã ký',
  ACTIVE: 'Đang có hiệu lực',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

export default function ContractReview() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const versionNumber = Number(searchParams.get('version') || 1);

  const [version, setVersion] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [revisionRequests, setRevisionRequests] = useState([]);

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        versionResponse,
        contractResponse,
        userResponse,
        revisionResponse,
      ] = await Promise.all([
        contractService.getVersion(contractId, versionNumber),
        contractService.getContract(contractId),
        axiosClient.get('/users/me'),
        contractService.getRevisionRequests(contractId),
      ]);

      setVersion(unwrap(versionResponse));
      setContract(unwrap(contractResponse));
      setCurrentUser(unwrap(userResponse));

      const revisions = unwrap(revisionResponse);
      setRevisionRequests(Array.isArray(revisions) ? revisions : []);
    } catch (err) {
      console.error('Failed to load contract:', err);

      setError(
        err.response?.data?.message ||
        'Không thể tải thông tin hợp đồng.'
      );
    } finally {
      setLoading(false);
    }
  }, [contractId, versionNumber]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const isRenter =
    currentUser?.id && contract?.renterId &&
    String(currentUser.id) === String(contract.renterId);

  const isOwner =
    currentUser?.id && contract?.ownerId &&
    String(currentUser.id) === String(contract.ownerId);

  const canReview =
    isRenter &&
    version?.current &&
    version?.contractStatus === 'PENDING_REVIEW' &&
    !version?.renterReviewedAt;
  const canSignAsRenter =
  isRenter &&
  version?.current &&
  contract?.status === 'PENDING_SIGNATURE' &&
  !version?.renterSignedAt;

const canSignAsOwner =
  isOwner &&
  version?.current &&
  contract?.status === 'PENDING_SIGNATURE' &&
  !version?.ownerSignedAt;

const isFullySigned =
  version?.current &&
  contract?.status === 'SIGNED' &&
  version?.renterSignedAt &&
  version?.ownerSignedAt;
  const handleAccept = async () => {
    if (!window.confirm('Bạn xác nhận đồng ý với nội dung hợp đồng này?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await contractService.acceptReview(contractId);

      await loadPage();

      setNotice('Bạn đã chấp nhận nội dung hợp đồng. Hai bên có thể tiến hành ký.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể chấp nhận hợp đồng.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do yêu cầu chỉnh sửa.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await contractService.requestChanges(
        contractId,
        reason.trim()
      );

      setReason('');

      await loadPage();

      setNotice('Yêu cầu chỉnh sửa đã được gửi cho Owner.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể gửi yêu cầu chỉnh sửa.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải hợp đồng...
      </div>
    );
  }
  const handleSignAsRenter = async () => {
  const confirmed = window.confirm(
    'Bạn xác nhận ký phiên bản hợp đồng này với tư cách Bên thuê?'
  );

  if (!confirmed) return;

  setSubmitting(true);
  setError('');
  setNotice('');

  try {
    await contractService.signAsRenter(contractId);

    setNotice('Bạn đã ký hợp đồng thành công.');
    await loadPage();
  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Không thể ký hợp đồng.'
    );
  } finally {
    setSubmitting(false);
  }
};

const handleSignAsOwner = async () => {
  const confirmed = window.confirm(
    'Bạn xác nhận ký phiên bản hợp đồng này với tư cách Chủ sở hữu?'
  );

  if (!confirmed) return;

  setSubmitting(true);
  setError('');
  setNotice('');

  try {
    await contractService.signAsOwner(contractId);

    setNotice('Bạn đã ký hợp đồng thành công.');
    await loadPage();
  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Không thể ký hợp đồng.'
    );
  } finally {
    setSubmitting(false);
  }
};
  if (error && !version) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600">
          Quay lại
        </button>
      </div>
    );
  }

  if (!version || !contract) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="mb-5 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  RENTHUB · ELECTRONIC CONTRACT
                </p>

                <h1 className="text-2xl font-bold text-slate-900 mt-2">
                  Hợp đồng thuê thiết bị
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Phiên bản {version.versionNumber}
                </p>
              </div>

              <span className="h-fit rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                {STATUS_LABELS[version.contractStatus] ||
                  version.contractStatus}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {!version.current && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Bạn đang xem phiên bản lịch sử v{version.versionNumber}.
                Phiên bản hiện tại là v{version.currentVersion}.
                Bạn không thể chấp nhận hoặc ký phiên bản cũ.
              </div>
            )}

            {notice && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <section>
              <h2 className="font-semibold text-slate-900 mb-4">
                1. Thông tin thiết bị
              </h2>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">
                  {version.equipmentTitle}
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-4">
                2. Thời gian thuê
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Info label="Ngày bắt đầu" value={formatDate(version.startDate)} />
                <Info label="Ngày kết thúc" value={formatDate(version.endDate)} />
                <Info label="Số ngày thuê" value={`${version.totalDays} ngày`} />
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-4">
                3. Chi phí thuê
              </h2>

              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <Info
                  label="Giá thuê mỗi ngày"
                  value={formatCurrency(version.pricePerDay)}
                />
                <Info
                  label="Tiền thuê"
                  value={formatCurrency(version.rentalAmount)}
                />
                <Info
                  label="Tiền đặt cọc"
                  value={formatCurrency(version.depositAmount)}
                />

                <div className="border-t border-slate-200 pt-3">
                  <Info
                    label="Tổng cộng"
                    value={formatCurrency(version.totalAmount)}
                    strong
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-3">
                4. Điều khoản hợp đồng
              </h2>

              <div className="whitespace-pre-wrap rounded-xl border border-slate-200 p-5 text-sm leading-7 text-slate-700">
                {version.terms || 'Chưa có điều khoản bổ sung.'}
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900 mb-3">
                5. Tình trạng xem xét và chữ ký
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Info
                  label="Renter đã xem xét"
                  value={version.renterReviewedAt ? 'Đã chấp nhận' : 'Chưa chấp nhận'}
                />
                <Info
                  label="Renter ký lúc"
                  value={version.renterSignedAt || 'Chưa ký'}
                />
                <Info
                  label="Owner ký lúc"
                  value={version.ownerSignedAt || 'Chưa ký'}
                />
                <Info
                  label="Phiên bản hiện tại"
                  value={version.current ? 'Có' : 'Không'}
                />
              </div>
            </section>

            {canReview && (
              <section className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Xem xét hợp đồng
                </h2>

                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Kiểm tra toàn bộ thông tin trước khi chấp nhận hoặc yêu cầu Owner chỉnh sửa.
                </p>

                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : 'Chấp nhận hợp đồng'}
                </button>

                <div className="mt-5">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Yêu cầu chỉnh sửa
                  </label>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Mô tả cụ thể nội dung bạn muốn Owner chỉnh sửa..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                  />

                  <p className="text-xs text-slate-400 text-right mt-1">
                    {reason.length}/2000
                  </p>

                  <button
                    onClick={handleRequestChanges}
                    disabled={submitting || !reason.trim()}
                    className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Yêu cầu chỉnh sửa
                  </button>
                </div>
              </section>
            )}
            {(canSignAsRenter || canSignAsOwner) && (
  <section className="border-t border-slate-200 pt-6">
    <h2 className="text-lg font-bold text-slate-900">
      Ký hợp đồng điện tử
    </h2>

    <p className="text-sm text-slate-500 mt-2 mb-4">
      Bạn đang ký phiên bản v{version.versionNumber}.
      Vui lòng kiểm tra lại toàn bộ điều khoản trước khi xác nhận.
    </p>

    {canSignAsRenter && (
      <button
        onClick={handleSignAsRenter}
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Đang xử lý...' : 'Ký với tư cách Bên thuê'}
      </button>
    )}

    {canSignAsOwner && (
      <button
        onClick={handleSignAsOwner}
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Đang xử lý...' : 'Ký với tư cách Chủ sở hữu'}
      </button>
    )}

    <p className="text-xs text-slate-400 mt-3">
      Hệ thống lưu tài khoản đã ký, thời điểm ký và phiên bản hợp đồng tương ứng.
    </p>
  </section>
)}

{isFullySigned && (
  <section className="rounded-xl border border-green-200 bg-green-50 p-5">
    <div className="flex items-center gap-2">
      <span className="text-green-700 text-xl">✓</span>
      <h2 className="font-bold text-green-800">
        Hợp đồng đã được hai bên ký
      </h2>
    </div>

    <p className="text-sm text-green-700 mt-2">
      Phiên bản v{version.versionNumber} đã có đầy đủ chữ ký của Owner và Renter.
      Hợp đồng đang ở trạng thái SIGNED.
    </p>
  </section>
)}

            {!isRenter && isOwner && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                Bạn đang xem hợp đồng với vai trò Owner.
                Các thao tác chỉnh sửa và gửi lại hợp đồng sẽ được thực hiện ở giao diện quản lý hợp đồng.
              </div>
            )}

            <section className="border-t border-slate-200 pt-5">
              <h2 className="font-semibold text-slate-900 mb-3">
                Lịch sử yêu cầu chỉnh sửa
              </h2>

              {revisionRequests.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Chưa có yêu cầu chỉnh sửa.
                </p>
              ) : (
                <div className="space-y-3">
                  {revisionRequests.map((revision) => (
                    <div
                      key={revision.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="text-xs text-slate-500">
                          Phiên bản được yêu cầu: {
                            revision.contractVersionId === version.id
                              ? version.versionNumber
                              : revision.contractVersionId
                          }
                        </span>

                        <span className="text-xs font-semibold">
                          {revision.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-700">
                        {revision.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, strong = false }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm ${strong ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}