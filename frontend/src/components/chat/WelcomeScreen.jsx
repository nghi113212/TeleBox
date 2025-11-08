import React from 'react'

const WelcomeScreen = ({ onOpenSidebar }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      {/* Mobile Menu Button for Welcome Screen */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to TeleBox</h3>
        <p className="text-gray-600">Select a conversation to start chatting</p>
      </div>
    </div>
  )
}

export default WelcomeScreen
