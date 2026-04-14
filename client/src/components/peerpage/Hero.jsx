import React from 'react';

const Hero = () => {
  return (
    <section className="relative min-h-screen w-full bg-[#020617] flex items-center justify-center overflow-hidden">
      
      {/* --- Background Effects --- */}
      {/* Main Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      
      {/* Grid Pattern with Fade */}
      <div className="absolute inset-0 z-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234f46e5' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
        
        {/* 1. Top Badge */}
        <div className="group mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl transition-all hover:border-indigo-500/50 cursor-pointer">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Global Operations Live</span>
          <svg className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </div>

        {/* 2. Headline - The Powerhouse */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.95]">
            Global Talent. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 to-indigo-700">
              Infinite Scale.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium mt-8 leading-relaxed">
            Peerpages is the backbone for high-growth enterprises. We orchestrate 
            <span className="text-white"> Customer Support, Tech Ops, and Data workflows </span> 
            with precision and AI-driven efficiency.
          </p>
        </div>

        {/* 3. CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-5">
          <button className="relative group px-10 py-4 bg-white text-slate-950 rounded-full font-bold text-lg overflow-hidden transition-all hover:pr-12">
            <span className="relative z-10">Scale Your Team</span>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
          </button>
          
          <button className="px-10 py-4 rounded-full border border-slate-700 text-white font-bold text-lg hover:bg-slate-800/50 transition-all backdrop-blur-md">
            Our Solutions
          </button>
        </div>

        {/* 4. The "Proof of Concept" - Modern Dashboard Component */}
        <div className="mt-24 relative w-full max-w-6xl group">
          {/* Main Frame */}
          <div className="rounded-[2rem] p-3 bg-gradient-to-b from-slate-700/50 to-slate-900/50 border border-slate-700/50 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="rounded-[1.5rem] bg-[#0b1120] border border-slate-800 aspect-[16/8] flex flex-col overflow-hidden">
              
              {/* Mock Header for Dashboard */}
              <div className="h-12 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">peerpages_os_v1.0.4</div>
              </div>

              {/* Mock Content - Bento Style */}
              <div className="p-8 grid grid-cols-3 gap-6 h-full">
                <div className="col-span-2 bg-slate-800/20 rounded-2xl border border-slate-700/30 flex items-center justify-center relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                   {/* Abstract Line Chart */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <svg className="w-full h-full p-10" viewBox="0 0 100 20">
                        <path d="M0 15 Q20 5 40 12 T80 8 T100 15" fill="none" stroke="#6366f1" strokeWidth="1" className="animate-[dash_3s_linear_infinite]" />
                      </svg>
                   </div>
                   <div className="relative text-center">
                      <p className="text-3xl font-black text-white">99.8%</p>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Workflow Accuracy</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="h-[45%] bg-indigo-600/10 rounded-2xl border border-indigo-500/20 p-4">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold tracking-tighter italic">P</div>
                        <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                      <p className="mt-4 text-xs font-bold text-slate-300">24/7 Monitoring</p>
                   </div>
                   <div className="h-[45%] bg-slate-800/20 rounded-2xl border border-slate-700/30 p-4">
                      <p className="text-2xl font-black text-white">400+</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Dedicated Experts</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Floating Labels */}
          <div className="absolute -left-12 top-20 bg-white p-4 rounded-2xl shadow-2xl hidden lg:block transform -rotate-6 transition-transform hover:rotate-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">✅</div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500">CLIENT ONBOARDED</p>
                   <p className="text-sm font-black text-slate-900 leading-none">Fortune 500 Co.</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;