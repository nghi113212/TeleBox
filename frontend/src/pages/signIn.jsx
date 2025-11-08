import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import apiClient from '../lib/apiClient.js'

function SignIn() {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Load remembered login data on component mount
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe')
    const savedUsername = localStorage.getItem('username')
    
    if (rememberMe === 'true' && savedUsername) {
      setFormData(prev => ({
        ...prev,
        emailOrPhone: savedUsername,
        rememberMe: true
      }))
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Kiểm tra email hoặc số điện thoại
    if (!formData.emailOrPhone) {
      newErrors.emailOrPhone = 'Email hoặc số điện thoại là bắt buộc'
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrPhone)
      // Improved Vietnam phone validation: supports 0x, +84x, and mobile numbers
      const cleanPhone = formData.emailOrPhone.replace(/[\s\-().]/g, '')
      const isPhone = /^(\+84|84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])\d{7}$/.test(cleanPhone)
      
      if (!isEmail && !isPhone) {
        newErrors.emailOrPhone = 'Vui lòng nhập email hợp lệ hoặc số điện thoại Việt Nam (VD: 0987654321)'
      }
    }
    
    // Kiểm tra mật khẩu
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous submit errors
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }))
    }
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const payload = {
        username: formData.emailOrPhone,
        password: formData.password
      }

      await apiClient.post('/auth/signin', payload)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      // Save remember me preference (only username hint)
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('username', formData.emailOrPhone)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('username')
      }
      navigate('/chat')
      
    } catch (error) {
      console.error('Login error:', error)
      if (error.response && error.response.data.message) {
        setErrors({ submit: error.response.data.message })
      } else {
        setErrors({ submit: 'Đăng nhập thất bại. Vui lòng thử lại.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            TeleBox
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Chào mừng trở lại
            </h2>
            <p className="text-gray-600 text-sm">
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-5"></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Phone Input */}
            <div>
              <input
                id="emailOrPhone"
                name="emailOrPhone"
                type="text"
                value={formData.emailOrPhone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  errors.emailOrPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Nhập email hoặc số điện thoại"
                autoComplete="username"
              />
              {errors.emailOrPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.emailOrPhone}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield'
                  }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.76 7.76m0 0L5.64 5.64m0 0L12 12m-6.36-6.36L12 12" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <button 
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
                onClick={() => alert('Tính năng quên mật khẩu sẽ được cập nhật sớm!')}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <button 
              type="button"
              onClick={() => navigate('/signup')}
              className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn