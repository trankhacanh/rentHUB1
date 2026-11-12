import { useEffect, useMemo, useState } from 'react';
import { PreferencesContext } from './preferences';

const translations = {
  vi: {
    Home: 'Trang chủ',
    'Cart & Checkout': 'Giỏ hàng & thanh toán',
    'How It Works': 'Cách thức hoạt động',
    'Sign In': 'Đăng nhập',
    Register: 'Đăng ký',
    Search: 'Tìm kiếm',
    Notifications: 'Thông báo',
    Messages: 'Tin nhắn',
    'My Profile': 'Hồ sơ của tôi',
    'My Rentals': 'Đơn thuê của tôi',
    Logout: 'Đăng xuất',
    'Create Equipment': 'Đăng thiết bị',
    'Toggle navigation': 'Mở hoặc đóng menu',
    'Light mode': 'Giao diện sáng',
    'Dark mode': 'Giao diện tối',
    Language: 'Ngôn ngữ',
    English: 'Tiếng Anh',
    Vietnamese: 'Tiếng Việt',
    'View Details': 'Xem chi tiết',
    Available: 'Có sẵn',
    Rented: 'Đang được thuê',
    'Price per day': 'Giá thuê mỗi ngày',
    'Security deposit': 'Tiền đặt cọc',
    Total: 'Tổng cộng',
    Deposit: 'Đặt cọc',
    'Start Date': 'Ngày bắt đầu',
    'End Date': 'Ngày kết thúc',
    'Request to Rent': 'Gửi yêu cầu thuê',
    'Select start date': 'Chọn ngày bắt đầu',
    'Select end date': 'Chọn ngày kết thúc',
    'Price per Day (VND)': 'Giá mỗi ngày (VND)',
    'Security Deposit (VND)': 'Tiền đặt cọc (VND)',
    'How can I list my equipment?': 'Làm thế nào để đăng thiết bị?',
    'Pricing & Availability': 'Giá thuê và lịch trống',
    'Rent What You Need.': 'Thuê thiết bị bạn cần.',
    'Share What You Own.': 'Chia sẻ thiết bị bạn có.',
    'Discover quality equipment near you or turn your unused equipment into extra income with RentHub.':
      'Tìm thiết bị chất lượng gần bạn hoặc biến thiết bị chưa sử dụng thành nguồn thu nhập cùng RentHub.',
    'Explore Equipment': 'Khám phá thiết bị',
    'List Your Equipment': 'Đăng thiết bị của bạn',
    'Explore Popular Categories': 'Khám phá danh mục phổ biến',
    'Find the right equipment for your next project or event.':
      'Tìm thiết bị phù hợp cho dự án hoặc sự kiện sắp tới.',
    'How RentHub Works': 'RentHub hoạt động như thế nào',
    'Why Choose RentHub?': 'Vì sao chọn RentHub?',
    'Browse Equipment': 'Khám phá thiết bị',
    'Find the right equipment for your next project.':
      'Tìm thiết bị phù hợp cho dự án tiếp theo của bạn.',
    'Clear all filters': 'Xóa tất cả bộ lọc',
    'Clear Filters': 'Xóa bộ lọc',
    Filters: 'Bộ lọc',
    Category: 'Danh mục',
    Location: 'Địa điểm',
    Availability: 'Tình trạng sẵn có',
    'Any time': 'Bất kỳ thời gian nào',
    'Available now': 'Có sẵn ngay',
    'Available on selected date': 'Có sẵn vào ngày đã chọn',
    Rating: 'Đánh giá',
    'Any rating': 'Mọi mức đánh giá',
    Condition: 'Tình trạng',
    'Enter location': 'Nhập địa điểm',
    'Previous page': 'Trang trước',
    'Next page': 'Trang sau',
    'Close filters': 'Đóng bộ lọc',
    'Search equipment': 'Tìm thiết bị',
    'Show results': 'Hiển thị kết quả',
    'Unable to load equipment': 'Không thể tải thiết bị',
    'Please login to save equipment to your favorites.':
      'Vui lòng đăng nhập để lưu thiết bị yêu thích.',
    Searching: 'Đang tìm kiếm',
    'equipment found': 'thiết bị được tìm thấy',
    'Complete the payment for your approved rental booking.':
      'Hoàn tất thanh toán cho đơn thuê đã được chấp thuận.',
    Payment: 'Thanh toán',
    Booking: 'Đặt thuê',
    Completed: 'Hoàn tất',
    Equipment: 'Thiết bị',
    'Rental equipment': 'Thiết bị cho thuê',
    'Rental period': 'Thời gian thuê',
    'Rental days': 'Số ngày thuê',
    'Payment ID': 'Mã thanh toán',
    'Total paid': 'Tổng đã thanh toán',
    Status: 'Trạng thái',
    'Payment Method': 'Phương thức thanh toán',
    'Unable to Open Payment': 'Không thể mở thanh toán',
    'Payment Successful': 'Thanh toán thành công',
    'Rental fee': 'Phí thuê',
    'Unable to load rental': 'Không thể tải đơn thuê',
    'Rental booking not found.': 'Không tìm thấy đơn thuê.',
    'Back to My Rentals': 'Quay lại đơn thuê của tôi',
    'Rental Detail': 'Chi tiết đơn thuê',
    'Rental Information': 'Thông tin thuê',
    'Start date': 'Ngày bắt đầu',
    'End date': 'Ngày kết thúc',
    'No equipment image': 'Chưa có ảnh thiết bị',
    day: 'ngày',
    week: 'tuần',
    'Currently unavailable': 'Hiện không có sẵn',
    reviews: 'đánh giá',
    'Equipment Details': 'Chi tiết thiết bị',
    Brand: 'Thương hiệu',
    Model: 'Mẫu',
    Year: 'Năm',
    'Book this equipment': 'Đặt thuê thiết bị này',
    'Security deposit is required.': 'Cần đặt cọc để thuê thiết bị.',
    Profile: 'Hồ sơ',
    'Booking Requests': 'Yêu cầu thuê',
    Favorites: 'Yêu thích',
    Reviews: 'Đánh giá',
    Settings: 'Cài đặt',
    'Sign Out': 'Đăng xuất',
    'Verified User': 'Người dùng đã xác minh',
    'Edit Profile': 'Chỉnh sửa hồ sơ',
    'Change Photo': 'Đổi ảnh',
    'First name': 'Tên',
    'Last name': 'Họ',
    'Phone number': 'Số điện thoại',
    Cancel: 'Hủy',
    'Saving...': 'Đang lưu...',
    'Save Changes': 'Lưu thay đổi',
    Delete: 'Xóa',
    'Share Profile': 'Chia sẻ hồ sơ',
    'Personal Information': 'Thông tin cá nhân',
    'Account Verification': 'Xác minh tài khoản',
    'Verify Identity': 'Xác minh danh tính',
    'My Equipment': 'Thiết bị của tôi',
    'Favorite Equipment': 'Thiết bị yêu thích',
    'My Reviews': 'Đánh giá của tôi',
    'Reviews About Me': 'Đánh giá về tôi',
    'Account Settings': 'Cài đặt tài khoản',
    Privacy: 'Quyền riêng tư',
    Security: 'Bảo mật',
    'Danger Zone': 'Khu vực nguy hiểm',
    'Delete Account': 'Xóa tài khoản',
    'View All Notifications': 'Xem tất cả thông báo',
    'Rental History': 'Lịch sử thuê',
  },
  en: {},
};

function readPreference(key, fallback, allowedValues) {
  try {
    const stored = window.localStorage.getItem(key);
    return allowedValues.includes(stored) ? stored : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key} preference:`, error);
    return fallback;
  }
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    readPreference('renthub-theme', 'light', ['light', 'dark']),
  );
  const [language, setLanguage] = useState(() =>
    readPreference('renthub-language', 'vi', ['vi', 'en']),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem('renthub-theme', theme);
      window.localStorage.setItem('renthub-language', language);
    } catch (error) {
      console.warn('Unable to save display preferences:', error);
    }
  }, [theme, language]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
      t: (text) => translations[language]?.[text] ?? text,
    }),
    [theme, language],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
