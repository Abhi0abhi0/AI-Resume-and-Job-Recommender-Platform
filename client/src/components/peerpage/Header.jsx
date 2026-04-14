import React, { useState, useEffect } from 'react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    // Header will change style after scrolling 20px
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Services', isDropdown: true },
    { name: 'Solutions', isDropdown: false },
    { name: 'Global Network', isDropdown: false },
    { name: 'About Us', isDropdown: false },
  ];

  return (
    <nav className={`fixed w-full z-[100] transition-all duration-500 ${
      isScrolled 
        ? 'py-3 bg-[#020617]/80 backdrop-blur-2xl border-b border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Brand Logo - Dark Mode Optimized */}
          <div className="flex items-center group cursor-pointer">
            <div className="relative overflow-hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <span className="relative text-white font-black text-xl italic z-10">P</span>
            </div>
            <div className="ml-3 flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight text-white uppercase">
                Peerpages
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-400">OUTSOURCING</span>
            </div>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-10">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={`#${item.name.toLowerCase().replace(' ', '-')}`}
                className="group relative text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  {item.name}
                  {item.isDropdown && (
                    <svg className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  )}
                </div>
                {/* Glowing Underline for Dark Mode */}
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            <button className="hidden sm:block text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Client Login
            </button>
            
            {/* High-Contrast Button */}
            <button className="relative group overflow-hidden bg-white text-slate-950 px-7 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all active:scale-95">
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">Get a Quote</span>
              <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>

            {/* Mobile Toggle */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 text-white">
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`h-0.5 w-full bg-current rounded transition-all ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current rounded transition-opacity ${mobileMenu ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current rounded transition-all ${mobileMenu ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Dark Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 top-[76px] bg-[#020617]/95 backdrop-blur-2xl border-t border-slate-800 transition-all duration-500 ${mobileMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <div className="p-8 space-y-6">
          {menuItems.map((item) => (
            <a key={item.name} href="#" className="block text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
              {item.name}
            </a>
          ))}
          <hr className="border-slate-800 my-6" />
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-colors">
            Start Your Journey
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;