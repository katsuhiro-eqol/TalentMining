'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, CircleUserRound } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAnalyze = pathname === '/analyze'


  return (
    <>
      {/* ナビゲーション */}
      <nav className="relative z-50 bg-slate-200 backdrop-blur-lg text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
                
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <a href="/">
                <span className="text-xl font-bold">AI</span>
                </a>
              </div>
              <a href="/" className="text-slate-900 text-xl font-bold">Talent Mining</a>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-8">
            <a href="/analyze" className={`px-4 py-1 rounded-lg text-slate-100 transition-colors ${isAnalyze ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'}`}>対話ログ解析を試す</a>
                <a href="/contact" className="text-slate-700 hover:text-slate-900">問い合わせ</a>
                <div>
                <a href="/signIn" className="text-slate-300 hover:text-slate-900"><CircleUserRound color="#0677ef" /></a>
                </div>
                
              </div>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* モバイルメニュー */}
      {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-blue-300 backdrop-blur-lg">
            <div className="flex flex-col items-center justify-center h-full space-y-8 text-2xl">
            <a href="/analyze" className={`px-4 text-lg font--bold border-2 rounded-lg text-slate-100 transition-colors ${isAnalyze ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-500 hover:bg-green-700'}`}>対話ログ解析を試す</a>
            <a href="/contact" className="text-slate-700 hover:text-slate-900">問い合わせ</a>
            <a href="/user" className="text-slate-700 hover:text-slate-900">サインイン</a>
            </div>
          </div>
      )}
    </>
  )
}