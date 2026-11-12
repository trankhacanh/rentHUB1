import React, { useEffect, useState } from 'react';
import axiosClient from '../../services/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/currency';

export default function ManageEquipments() {
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState([]); // State lưu danh sách danh mục
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerDay: '',
    address: '',
    status: 'AVAILABLE',
    categoryId: '' // Thêm trường categoryId vào form
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipments();
    fetchCategories(); // Gọi API lấy danh mục khi component load
  }, []);

  const fetchEquipments = async () => {
    try {
      const res = await axiosClient.get('/equipments');
      setEquipments(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách thiết bị", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/equipments/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Lỗi tải danh mục", err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosClient.put(`/equipments/${currentId}`, formData);
        alert('Cập nhật thiết bị thành công!');
      } else {
        await axiosClient.post('/equipments', formData);
        alert('Thêm thiết bị mới thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchEquipments();
    } catch (err) {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  // Chuẩn bị form để Sửa (Update)
  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item.id);
    
    // Tìm ID danh mục dựa trên tên danh mục trả về từ item, hoặc lấy trực tiếp nếu item có categoryId/category
    let matchedCategoryId = '';
    if (item.categoryId) {
      matchedCategoryId = item.categoryId;
    } else if (item.category && item.category.id) {
      matchedCategoryId = item.category.id;
    } else if (item.categoryName) {
      const found = categories.find(cat => cat.name === item.categoryName);
      if (found) matchedCategoryId = found.id;
    }

    setFormData({
      title: item.title,
      description: item.description,
      pricePerDay: item.pricePerDay,
      address: item.address || '',
      status: item.status || 'AVAILABLE',
      categoryId: matchedCategoryId
    });
    setShowModal(true);
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này không?')) {
      try {
        await axiosClient.delete(`/equipments/${id}`);
        alert('Đã xóa thành công!');
        fetchEquipments();
      } catch (err) {
        alert('Xóa thất bại.');
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ title: '', description: '', pricePerDay: '', address: '', status: 'AVAILABLE', categoryId: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Thiết Bị Cho Thuê</h1>
          <div className="flex gap-4">
            <Link to="/admin" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm">Về trang chủ</Link>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              + Đăng thiết bị mới
            </button>
          </div>
        </div>

        {/* Bảng hiển thị danh sách */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá/ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipments.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{formatVnd(item.pricePerDay)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Thêm / Sửa */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">{isEditing ? 'Sửa thông tin thiết bị' : 'Thêm thiết bị mới'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full border px-3 py-2 rounded" required />
                </div>

                {/* Ô chọn danh mục */}
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Danh mục</label>
                  <select 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleInputChange} 
                    className="w-full border px-3 py-2 rounded"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full border px-3 py-2 rounded" rows="3" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giá thuê theo ngày (VNĐ)</label>
                  <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleInputChange} className="w-full border px-3 py-2 rounded" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border px-3 py-2 rounded" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border px-3 py-2 rounded">
                    <option value="AVAILABLE">Available</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded text-sm">Hủy</button>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold">{isEditing ? 'Lưu thay đổi' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}