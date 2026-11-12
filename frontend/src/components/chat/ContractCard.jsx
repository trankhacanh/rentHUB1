import React from 'react';

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

export default function ContractCard({ message, onOpen }) {
  const status =
    STATUS_LABELS[message.contractStatus] ||
    message.contractStatus ||
    'Chưa xác định';

  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-xl bg-white"
      style={{
        border: '1px solid #DBE3F0',
        boxShadow: '0 2px 8px rgba(15,27,61,0.06)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: '#F0F5FF' }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: '#DCE8FF', color: '#2F5FE0' }}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M8 13h8M8 17h8" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900">
            Hợp đồng thuê thiết bị
          </p>

          <p className="text-xs text-gray-500 mt-0.5">
            Phiên bản v{message.contractVersionNumber ?? 1}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            Trạng thái hợp đồng
          </span>

          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: '#EFF4FF',
              color: '#2F5FE0',
            }}
          >
            {status}
          </span>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          {message.text || 'Hợp đồng đã được gửi để xem xét.'}
        </p>

        <button
          type="button"
          onClick={onOpen}
          disabled={!message.contractId}
          className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#2F5FE0' }}
        >
          Xem hợp đồng
        </button>
      </div>
    </div>
  );
}