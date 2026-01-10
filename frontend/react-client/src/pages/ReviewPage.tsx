import { useState } from 'react'
import { Send } from 'lucide-react'

const ReviewPage = () => {
    const [selectedApprover, setSelectedApprover] = useState('Marketing Manager - Whatsapp')
    const [showApproverDropdown, setShowApproverDropdown] = useState(false)

    const approvers = [
        'Marketing Manager - Whatsapp',
        'Product Manager - Whatsapp',
        'Brand Manager - Whatsapp',
    ]

    return (
        <div className="space-y-4">
            {/* Select Approver */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Select Approver</h2>
                <div className="border-t border-gray-200 mb-4"></div>

                <div className="relative">
                    <button
                        onClick={() => setShowApproverDropdown(!showApproverDropdown)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-left flex items-center justify-between hover:border-orange-500 transition-all"
                    >
                        <span className="text-gray-700 font-medium">Send Design to:</span>
                        <span className="text-gray-900 font-semibold">{selectedApprover}</span>
                    </button>

                    {showApproverDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                            {approvers.map((approver) => (
                                <button
                                    key={approver}
                                    onClick={() => {
                                        setSelectedApprover(approver)
                                        setShowApproverDropdown(false)
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-orange-50 text-gray-700"
                                >
                                    {approver}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview & Send */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Preview & Send</h2>
                <div className="border-t border-gray-200 mb-4"></div>

                <div className="flex gap-4">
                    <div className="flex-1 border-2 border-gray-300 rounded-xl p-8 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">Current</p>
                            <p className="text-2xl font-bold text-gray-900">Canvas</p>
                            <p className="text-2xl font-bold text-gray-900">Preview</p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end">
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/50 flex items-center gap-2">
                            <Send size={18} />
                            Send To WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReviewPage
