interface BriefCardProps {
  title: string
  campaign: string
  offer: string
  code: string
  template: string
  onOpenTemplate?: () => void
}

const BriefCard = ({ title, campaign, offer, code, template, onOpenTemplate }: BriefCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-400 transition-all duration-200 hover:shadow-lg hover:shadow-orange-400/20">
      <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
        {title}
      </h3>
      <div className="border-t border-gray-200 mb-4"></div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Campaign</span>
          <span className="text-gray-900 font-medium">{campaign}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Offer</span>
          <span className="text-orange-500 font-semibold">{offer}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Code</span>
          <span className="text-gray-900 font-mono">{code}</span>
        </div>
      </div>
      <div className="border-t border-gray-200 mb-4"></div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 mb-1">Detected Template</p>
          <p className="text-sm text-gray-900 font-medium">{template}</p>
        </div>
        <button 
          onClick={onOpenTemplate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/50"
        >
          Open Template
        </button>
      </div>
    </div>
  )
}

export default BriefCard
