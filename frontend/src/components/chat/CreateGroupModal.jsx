import React, { useState, useEffect } from 'react'

const CreateGroupModal = ({ 
  isOpen, 
  onClose, 
  onCreateGroup,
  searchTerm,
  onSearchTermChange,
  searchResults = [],
  isSearching = false,
}) => {
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupAvatar, setGroupAvatar] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setGroupName('')
      setSelectedUsers([])
      setGroupAvatar('')
      setAvatarPreview(null)
      onSearchTermChange('')
    }
  }, [isOpen, onSearchTermChange])

  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id)
      if (exists) {
        return prev.filter((u) => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB!')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setGroupAvatar(file)
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setGroupAvatar('')
    setAvatarPreview(null)
  }

  const handleCreate = () => {
    if (!groupName.trim() || selectedUsers.length < 2) {
      alert('Vui lòng nhập tên nhóm và chọn ít nhất 2 thành viên!')
      return
    }
    onCreateGroup({
      roomName: groupName.trim(),
      memberIds: selectedUsers.map((u) => u.id),
      groupAvatar: groupAvatar,
    })
  }

  const isUserSelected = (userId) => {
    return selectedUsers.some((u) => u.id === userId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Tạo nhóm mới</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện nhóm
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {groupName.charAt(0).toUpperCase() || 'G'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="ml-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đã chọn ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center space-x-2 text-sm"
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleToggleUser(user)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm thành viên
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder="Tìm theo email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Search Results */}
          <div className="border border-gray-200 rounded-lg min-h-[200px] max-h-[300px] overflow-y-auto">
            {isSearching ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                Đang tìm kiếm...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((user) => {
                  const selected = isUserSelected(user.id)
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleToggleUser(user)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                        selected ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-700 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : searchTerm.trim() ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500 px-4 text-center">
                Không tìm thấy người dùng
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500 px-4 text-center">
                Tìm kiếm để thêm thành viên
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length < 2}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGroupModal

