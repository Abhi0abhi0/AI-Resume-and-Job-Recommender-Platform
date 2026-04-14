import React from 'react'

const Logo = () => {
  return (
    <div className="flex items-center gap-1.5 cursor-pointer">
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-1.5 rounded-lg shadow-sm shadow-emerald-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-800">
        Smart<span className="text-teal-600">CV</span>
      </span>
    </div>
  )
}

export default Logo
