import { Mail } from 'lucide-react'

const Header = () => {
  return (
    <div className="border-b border-gray-200 p-6 bg-white">
      <div className="flex items-center gap-3 mb-2">
        <Mail className="text-orange-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">
          Adobe Express — WhatsApp Creative Automation Add-on
        </h1>
      </div>
      <p className="text-gray-500 text-sm ml-10">
        Manage your creative workflow efficiently
      </p>
    </div>
  )
}

export default Header
