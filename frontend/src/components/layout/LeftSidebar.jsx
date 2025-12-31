import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient.js'

const DEFAULT_ABOUT = 'Hey there! I am using TeleBox.'

const LeftSidebar = ({ activeTab, onTabChange, user }) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const buildBaseline = () => ({
    name: user?.name || '',
    about: user?.about || DEFAULT_ABOUT,
    avatarUrl: user?.avatar || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || '',
  })

  const [baseline, setBaseline] = useState(buildBaseline)
  const [formData, setFormData] = useState({ 
    name: baseline.name, 
    about: baseline.about,
    birthDate: baseline.birthDate,
    gender: baseline.gender,
  })
  const [avatarPreview, setAvatarPreview] = useState(baseline.avatarUrl)
  const [avatarFile, setAvatarFile] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Sync with user prop changes
  useEffect(() => {
    const next = buildBaseline()
    setBaseline(next)
    setFormData({ 
      name: next.name, 
      about: next.about,
      birthDate: next.birthDate,
      gender: next.gender,
    })
    setAvatarFile(null)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return next.avatarUrl
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [user?.name, user?.about, user?.avatar, user?.birthDate, user?.gender])

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => {
      const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
      return apiClient.patch('/auth/profile', payload, config)
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['me'] })

      const profile = data?.profile
      if (profile) {
        const name = [profile.familyName, profile.givenName].filter(Boolean).join(' ').trim()
        const updated = {
          name: name || '',
          about: profile.about || DEFAULT_ABOUT,
          avatarUrl: profile.imageUrl || '',
          birthDate: profile.birthDate || '',
          gender: profile.gender || '',
        }
        setBaseline(updated)
        setFormData({ 
          name: updated.name, 
          about: updated.about,
          birthDate: updated.birthDate,
          gender: updated.gender,
        })
        setAvatarPreview((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
          return updated.avatarUrl
        })
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
      setAvatarFile(null)
      setFeedback({ type: 'success', message: 'Profile updated successfully.' })
    },
    onError: (error) => {
      console.error('Update profile error:', error)
      const message = error?.response?.data?.message || 'Failed to update profile.'
      setFeedback({ type: 'error', message })
    },
  })

  const hasChanges = formData.name !== baseline.name || formData.about !== baseline.about || formData.birthDate !== baseline.birthDate || formData.gender !== baseline.gender || avatarFile !== null

  const resetForm = () => {
    setFormData({ 
      name: baseline.name, 
      about: baseline.about,
      birthDate: baseline.birthDate,
      gender: baseline.gender,
    })
    setAvatarFile(null)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return baseline.avatarUrl
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleToggleMenu = () => {
    if (showProfileMenu) {
      setShowProfileMenu(false)
      setFeedback(null)
      updateProfileMutation.reset()
      resetForm()
    } else {
      setFeedback(null)
      updateProfileMutation.reset()
      resetForm()
      setShowProfileMenu(true)
    }
  }

  const handleCancel = () => {
    resetForm()
    setFeedback(null)
    updateProfileMutation.reset()
  }

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    setFeedback(null)
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image must be smaller than 5MB.' })
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please choose a valid image file.' })
      e.target.value = ''
      return
    }

    setAvatarFile(file)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setFeedback(null)
  }

  const handleRemoveAvatar = () => {
    if (!avatarFile) return
    setAvatarFile(null)
    setAvatarPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return baseline.avatarUrl
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFeedback(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (updateProfileMutation.isPending) return

    const trimmedName = formData.name.trim()
    const trimmedAbout = formData.about.trim()

    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Name cannot be empty.' })
      return
    }

    if (!hasChanges) {
      setFeedback({ type: 'info', message: 'No changes to save.' })
      return
    }

    const payload = new FormData()
    payload.append('name', trimmedName)
    payload.append('about', trimmedAbout)
    payload.append('birthDate', formData.birthDate || '')
    payload.append('gender', formData.gender || '')
    if (avatarFile) payload.append('avatar', avatarFile)

    updateProfileMutation.mutate(payload)
  }

  const handleSignOut = async () => {
    try {
      await apiClient.post('/auth/signout')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      window.location.href = '/signin'
    }
  }

  const displayAvatar = avatarFile ? avatarPreview : avatarPreview || baseline.avatarUrl || ''

  const navItems = [
    {
      id: 'chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Chat',
    },
    {
      id: 'settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Settings',
    },
  ]

  return (
    <div className="w-16 bg-gray-900 flex flex-col h-full relative">
      {/* Logo */}
      <div className="py-4 px-4 border-b border-gray-700 flex items-center justify-center">
        <div className="w-9 h-9 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="24" height="24" rx="6" fill="#059669" />
            <path d="M12 12h12v4h-4v8h-4v-8h-4v-4z" fill="white" />
            <circle cx="27" cy="9" r="2" fill="#047857" />
          </svg>
        </div>
      </div>

      {/* Top Navigation */}
      <div className="pt-4">
        <button
          onClick={() => onTabChange('chat')}
          className={`w-full h-14 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors relative group ${
            activeTab === 'chat' ? 'text-green-400 bg-gray-800' : ''
          }`}
          title="Chat"
        >
          {activeTab === 'chat' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400" />}
          {navItems[0].icon}
          <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Chat
          </div>
        </button>
      </div>

      <div className="flex-1" />

      {/* Search spacer */}
      <div className="py-4 px-4 border-b border-gray-700">
        <div className="h-9" />
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700">
        {/* Settings */}
        <div className="py-2">
          <button
            onClick={() => onTabChange('settings')}
            className={`w-full h-14 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors relative group ${
              activeTab === 'settings' ? 'text-green-400 bg-gray-800' : ''
            }`}
            title="Settings"
          >
            {activeTab === 'settings' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400" />}
            {navItems[1].icon}
            <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          </button>
        </div>

        {/* Profile */}
        <div className="p-4 flex justify-center">
          <div className="relative">
            <button
              onClick={handleToggleMenu}
              className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center group"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full" />
              <div className="absolute left-16 bottom-0 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Profile
              </div>
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={handleToggleMenu} />
                <div className="fixed bottom-4 left-20 w-96 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-600 z-[60] overflow-hidden">
                  <form onSubmit={handleSubmit}>
                    <div className="px-4 py-3 border-b border-gray-700">
                      <h3 className="font-semibold">Profile</h3>
                      <p className="text-xs text-gray-400 mt-1">Update your personal details</p>
                    </div>

                    {feedback && (
                      <div
                        className={`px-4 py-2 text-sm ${
                          feedback.type === 'error' ? 'text-red-400' : feedback.type === 'info' ? 'text-yellow-300' : 'text-green-400'
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}

                    <div className="px-4 py-3 flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-600">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt={formData.name || user?.name || 'Avatar'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {(formData.name || user?.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleAvatarClick}
                          className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full hover:bg-green-600 transition-colors"
                          title="Change avatar"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                      </div>
                      <p className="text-xs text-gray-400">Click to upload a new photo (max 5MB)</p>
                      {avatarFile && (
                        <button type="button" onClick={handleRemoveAvatar} className="text-xs text-gray-300 hover:text-white mt-2 underline">
                          Remove selected photo
                        </button>
                      )}
                    </div>

                    <div className="px-4 py-2">
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="profile-name">
                        Name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={formData.name}
                        onChange={handleFieldChange('name')}
                        className="bg-transparent text-white border border-gray-600/70 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-3 py-2 text-sm w-full outline-none transition-colors"
                        placeholder="Your display name"
                        maxLength={80}
                      />
                    </div>

                    <div className="px-4 py-2">
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="profile-about">
                        About
                      </label>
                      <textarea
                        id="profile-about"
                        value={formData.about}
                        onChange={handleFieldChange('about')}
                        className="bg-transparent text-white border border-gray-600/70 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-3 py-2 text-sm w-full outline-none transition-colors resize-none h-20"
                        rows="3"
                        maxLength={160}
                        placeholder="Share something about yourself"
                      />
                      <p className="text-[11px] text-gray-500 text-right mt-1">{formData.about?.length || 0}/160</p>
                    </div>

                    <div className="px-4 py-2 flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="profile-birthDate">
                          Birth Date
                        </label>
                        <input
                          id="profile-birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={handleFieldChange('birthDate')}
                          className="bg-transparent text-white border border-gray-600/70 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-3 py-2 text-sm w-full outline-none transition-colors [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="profile-gender">
                          Gender
                        </label>
                        <select
                          id="profile-gender"
                          value={formData.gender}
                          onChange={handleFieldChange('gender')}
                          className="bg-gray-800 text-white border border-gray-600/70 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg px-3 py-2 text-sm w-full outline-none transition-colors cursor-pointer"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="px-4 py-3 flex justify-end space-x-2 border-b border-gray-700">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-3 py-2 rounded-lg border border-gray-600 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!hasChanges || updateProfileMutation.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!hasChanges || updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>

                    <div className="p-4">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg transition-colors text-left"
                      >
                        <span className="text-white text-sm">Log out</span>
                        <p className="text-xs text-gray-400 mt-1">Chat history will be cleared when you log out.</p>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeftSidebar
