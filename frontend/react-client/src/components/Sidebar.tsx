import { Mail, Wand2, CheckCircle, Zap } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const tabs = [
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'generate', label: 'Generate', icon: Wand2 },
    { id: 'review', label: 'Review', icon: CheckCircle },
    { id: 'feed', label: 'Feed', icon: Zap },
  ]

  return (
    <div className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-8 gap-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                : 'text-gray-500 hover:text-orange-500'
            }`}
            title={tab.label}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Sidebar
