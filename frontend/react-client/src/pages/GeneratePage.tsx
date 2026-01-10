
const GeneratePage = () => {
  const languages = ['Hindi', 'Marathi', 'Spanish']

  return (
    <div className="space-y-4">
      {/* Smart Localization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Smart Localization</h2>
        <div className="border-t border-gray-200 mb-4"></div>
        
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">
            Select Languages:
          </label>
          <div className="space-y-2">
            {languages.map((lang) => (
              <label key={lang} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={lang === 'Hindi'}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-gray-700">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/50">
          Generate Variants
        </button>
      </div>

      {/* Format Adapter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Format Adapter</h2>
        <div className="border-t border-gray-200 mb-4"></div>
        
        <p className="text-gray-700 mb-6">Convert current design into:</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="border-2 border-gray-300 rounded-xl p-6 hover:border-orange-500 transition-all duration-200 text-center group">
            <p className="text-gray-900 font-semibold group-hover:text-orange-500">
              Convert to Story
            </p>
            <p className="text-sm text-gray-500 mt-2">9 : 16</p>
          </button>
          <button className="border-2 border-gray-300 rounded-xl p-6 hover:border-orange-500 transition-all duration-200 text-center group">
            <p className="text-gray-900 font-semibold group-hover:text-orange-500">
              Convert to Banner
            </p>
            <p className="text-sm text-gray-500 mt-2">16 : 9</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default GeneratePage
