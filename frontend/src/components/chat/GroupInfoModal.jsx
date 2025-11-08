import React, { useRef } from 'react'

const GroupInfoModal = ({ isOpen, onClose, group, currentUserId, onUpdateAvatar, isUpdatingAvatar = false }) => {
  const fileInputRef = useRef(null)
  
  if (!isOpen || !group) return null

  const members = group.raw?.members || []
  const otherMembers = members.filter((m) => m._id !== currentUserId)

  const formatName = (user) => {
    if (!user) return 'Unknown user'
    const { familyName = '', givenName = '' } = user.profile || {}
    const fullName = `${familyName} ${givenName}`.trim()
    return fullName || user.username || 'Unknown user'
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
      
      if (onUpdateAvatar) {
        onUpdateAvatar(file)
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChangeAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Thông tin nhóm</h2>
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
          {/* Group Avatar & Name */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                {group.raw?.groupAvatar ? (
                  <img src={group.raw.groupAvatar} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  group.name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Change Avatar Button */}
              <button
                onClick={handleChangeAvatarClick}
                disabled={isUpdatingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Thay đổi ảnh đại diện"
              >
                {isUpdatingAvatar ? (
                  <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <h3 className="mt-3 text-xl font-semibold text-gray-900">{group.name}</h3>
            <p className="text-sm text-gray-600">{members.length} thành viên</p>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Thành viên</h4>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {member.profile?.imageUrl ? (
                      <img 
                        src={member.profile.imageUrl} 
                        alt={formatName(member)} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-700 font-bold">
                        {formatName(member).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">{formatName(member)}</h3>
                      {member._id === currentUserId && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Bạn</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">@{member.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupInfoModal

