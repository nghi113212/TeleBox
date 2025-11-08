import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../lib/apiClient.js'

function SignUp() {
  const [formData, setFormData] = useState({
    givenName: '', // Tên (given name)
    familyName: '', // Họ (family name)
    emailOrPhone: '',
    dateOfBirth: '',
    gender: '',
    customPronoun: '', // For custom gender
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [openDropdowns, setOpenDropdowns] = useState({
    day: false,
    month: false,
    year: false
  })
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const dayDropdownRef = useRef(null)
  const monthDropdownRef = useRef(null)
  const yearDropdownRef = useRef(null)

  // Helper function to toggle dropdown
  const toggleDropdown = (type) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const closeDropdown = (type) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [type]: false
    }))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) {
        closeDropdown('day')
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        closeDropdown('month')
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        closeDropdown('year')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      
      // Clear custom pronoun nếu gender không phải custom
      if (name === 'gender' && value !== 'custom') {
        newData.customPronoun = ''
      }
      
      return newData
    })
    
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear custom pronoun error nếu gender thay đổi
    if (name === 'gender' && errors.customPronoun) {
      setErrors(prev => ({
        ...prev,
        customPronoun: ''
      }))
    }
  }

  const genderOptions = useMemo(() => [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'custom', label: 'Tùy chỉnh' }
  ], [])

  const pronounOptions = useMemo(() => [
    { value: 'he/him', label: 'Anh ấy/Ông ấy (he/him)' },
    { value: 'she/her', label: 'Cô ấy/Bà ấy (she/her)' },
    { value: 'they/them', label: 'Họ (they/them)' },
  ], [])

  // Date dropdown options and handlers
  const updateDateOfBirth = (day, month, year) => {
    if (day && month && year) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      setFormData(prev => ({
        ...prev,
        dateOfBirth: dateString
      }))
      
      // Real-time validation
      validateDateOfBirth(new Date(year, month - 1, day))
    } else {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: ''
      }))
      // Clear errors when incomplete
      if (errors.dateOfBirth) {
        setErrors(prev => ({ ...prev, dateOfBirth: '' }))
      }
    }
  }

  const validateDateOfBirth = (birthDate) => {
    const today = new Date()
    
    // Check if date is in the future
    if (birthDate > today) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: 'Ngày sinh không thể trong tương lai. Vui lòng nhập ngày sinh thật của bạn.'
      }))
      return
    }
    
    // Check age (minimum 13 years old)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    if (age < 13) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: 'Bạn phải từ 13 tuổi trở lên để đăng ký.'
      }))
    } else if (age > 120) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: 'Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.'
      }))
    } else {
      // Clear error if valid
      setErrors(prev => ({ ...prev, dateOfBirth: '' }))
    }
  }

  const handleDaySelect = (day) => {
    setSelectedDay(day)
    closeDropdown('day')
    updateDateOfBirth(day, selectedMonth, selectedYear)
  }

  const handleMonthSelect = (month) => {
    setSelectedMonth(month)
    closeDropdown('month')
    
    // Check if selected day is valid for the new month
    const maxDaysInMonth = getDaysInMonth(month, selectedYear)
    const validDay = selectedDay && selectedDay <= maxDaysInMonth ? selectedDay : ''
    if (validDay !== selectedDay) {
      setSelectedDay(validDay)
    }
    
    updateDateOfBirth(validDay, month, selectedYear)
  }

  const handleYearSelect = (year) => {
    setSelectedYear(year)
    closeDropdown('year')
    
    // Check if selected day is valid for the new year (leap year consideration)
    const maxDaysInMonth = getDaysInMonth(selectedMonth, year)
    const validDay = selectedDay && selectedDay <= maxDaysInMonth ? selectedDay : ''
    if (validDay !== selectedDay) {
      setSelectedDay(validDay)
    }
    
    updateDateOfBirth(validDay, selectedMonth, year)
  }

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31
    return new Date(year, month, 0).getDate()
  }

  const getCurrentYear = () => new Date().getFullYear()

  const dayOptions = useMemo(() => {
    return Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1)
  }, [selectedMonth, selectedYear])
  
  const monthOptions = useMemo(() => [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ], [])

  const yearOptions = useMemo(() => {
    const currentYear = getCurrentYear()
    const maxYear = currentYear  // Năm hiện tại
    const minYear = currentYear - 120 // 120 tuổi
    const years = []
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year)
    }
    return years
  }, [])

  const validateForm = () => {
    const newErrors = {}
    
    // Kiểm tra tên (given name)
    if (!formData.givenName.trim()) {
      newErrors.givenName = 'Tên là bắt buộc'
    } else if (formData.givenName.trim().length < 2) {
      newErrors.givenName = 'Tên phải có ít nhất 2 ký tự'
    }
    
    // Kiểm tra họ (family name)  
    if (!formData.familyName.trim()) {
      newErrors.familyName = 'Họ là bắt buộc'
    } else if (formData.familyName.trim().length < 2) {
      newErrors.familyName = 'Họ phải có ít nhất 2 ký tự'
    }
    
    // Kiểm tra ngày sinh
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh là bắt buộc'
    }
    // Real-time validation đã handle các case khác
    
    // Kiểm tra giới tính
    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính'
    }
    
    // Kiểm tra đại từ nhân xưng khi chọn tùy chỉnh
    if (formData.gender === 'custom' && !formData.customPronoun) {
      newErrors.customPronoun = 'Vui lòng chọn đại từ nhân xưng'
    }
    
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
    
    // Kiểm tra password
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsLoading(true);
    setErrors({});
  
    try {
      const payload = {
        username: formData.emailOrPhone,
        password: formData.password,
        familyName: formData.familyName,
        givenName: formData.givenName,
        birthDate: formData.dateOfBirth,
        gender: formData.gender
      };
  
      const res = await apiClient.post('/auth/signup', payload);
  
      console.log("Registration successful:", res.data);

      // Reset form sau khi đăng ký thành công
      setFormData({
        givenName: "",
        familyName: "",
        emailOrPhone: "",
        dateOfBirth: "",
        gender: "",
        customPronoun: "",
        password: ""
      });
      setSelectedDay("");
      setSelectedMonth("");
      setSelectedYear("");

      // Show success message and redirect to signin
      alert("Đăng ký thành công! Chuyển đến trang đăng nhập...");
      navigate('/signin');
  
    } catch (error) {
      console.error("Register error:", error);
      if (error.response && error.response.data.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: "Đăng ký thất bại. Vui lòng thử lại." });
      }
    } finally {
      setIsLoading(false);
    }

    console.log("Form submitted:", formData);
  };
  

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
              Tạo tài khoản mới
            </h2>
            <p className="text-gray-600 text-sm">
              Nhanh chóng và dễ dàng
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-5"></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Given Name & Family Name Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  id="givenName"
                  name="givenName"
                  type="text"
                  value={formData.givenName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.givenName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Tên của bạn"
                />
                {errors.givenName && (
                  <p className="mt-1 text-sm text-red-600">{errors.givenName}</p>
                )}
              </div>
              <div>
                <input
                  id="familyName"
                  name="familyName"
                  type="text"
                  value={formData.familyName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.familyName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Họ của bạn"
                />
                {errors.familyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>
                )}
              </div>
            </div>

            {/* Date of Birth Input */}
            <div>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Ngày sinh:
                </label>
                <div className="ml-1 group relative">
                  <svg className="h-4 w-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Bạn phải từ 13 tuổi trở lên để đăng ký
                  </div>
                </div>
              </div>
              {/* Date of Birth - 3 Dropdowns */}
              <div className="grid grid-cols-3 gap-3">
                {/* Day Dropdown */}
                <div className="relative" ref={dayDropdownRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('day')}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left flex items-center justify-between ${
                      errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${openDropdowns.day ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                  >
                    <span className={selectedDay ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedDay || 'Ngày'}
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        openDropdowns.day ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openDropdowns.day && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {dayOptions.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDaySelect(day)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-gray-900">{day}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Month Dropdown */}
                <div className="relative" ref={monthDropdownRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('month')}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left flex items-center justify-between ${
                      errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${openDropdowns.month ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                  >
                    <span className={selectedMonth ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedMonth ? `T${selectedMonth}` : 'Tháng'}
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        openDropdowns.month ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openDropdowns.month && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {monthOptions.map((month) => (
                        <button
                          key={month.value}
                          type="button"
                          onClick={() => handleMonthSelect(month.value)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-gray-900">{month.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year Dropdown */}
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('year')}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left flex items-center justify-between ${
                      errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${openDropdowns.year ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                  >
                    <span className={selectedYear ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedYear || 'Năm'}
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        openDropdowns.year ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {openDropdowns.year && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleYearSelect(year)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-gray-900">{year}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {errors.dateOfBirth && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-red-700 font-medium">
                        {errors.dateOfBirth}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Gender Input */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2.5 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all ${
                      errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-gray-50'
                    } ${formData.gender === option.value ? 'ring-2 ring-blue-500 border-transparent bg-blue-50' : ''}`}
                  >
                    <span className="text-gray-900 text-sm font-medium">
                      {option.label}
                    </span>
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </label>
                ))}
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Custom Pronoun Selection - Shows when gender is custom */}
            {formData.gender === 'custom' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Chọn đại từ nhân xưng của bạn:</p>
                <div className="grid grid-cols-1 gap-2">
                  {pronounOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between cursor-pointer px-3 py-2.5 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all ${
                        errors.customPronoun ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-gray-50'
                      } ${formData.customPronoun === option.value ? 'ring-2 ring-blue-500 border-transparent bg-blue-50' : ''}`}
                    >
                      <span className="text-gray-900 text-sm">
                        {option.label}
                      </span>
                      <input
                        type="radio"
                        name="customPronoun"
                        value={option.value}
                        checked={formData.customPronoun === option.value}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </label>
                  ))}
                </div>
                {errors.customPronoun && (
                  <p className="mt-1 text-sm text-red-600">{errors.customPronoun}</p>
                )}
              </div>
            )}

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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang đăng ký...
                  </div>
                ) : (
                  'Đăng ký'
                )}
              </button>

              {/* Terms Notice */}
              <p className="mt-2 text-center text-xs text-gray-500">
                Bằng việc bấm "Đăng ký", bạn đồng ý với{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                  Điều khoản sử dụng
                </a>
                {' '}và{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                  Chính sách bảo mật
                </a>
                {' '}của chúng tôi.
              </p>
            </div>
          </form>

          {/* Login link */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <button 
              type="button"
              onClick={() => navigate('/signin')}
              className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp