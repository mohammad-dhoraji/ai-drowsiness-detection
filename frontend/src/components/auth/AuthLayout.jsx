export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
        
        <h1 className="text-2xl font-semibold text-white mb-1 text-center">
          {title}
        </h1>

        <p className="text-gray-400 text-sm mb-6 text-center">
          {subtitle}
        </p>

        {children}

      </div>
    </div>
  );
}
