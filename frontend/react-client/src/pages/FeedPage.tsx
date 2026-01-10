const FeedPage = () => {
    const feedbackItems = [
        { manager: 'Manager (WhatsApp)', message: '"Change the yellow to gold"' },
        { manager: 'Manager (WhatsApp)', message: '"Make the logo bigger."' },
        { manager: 'Manager (WhatsApp)', message: '"Change text to \'Big Sale\'"' },
    ]

    const versions = [
        'V1 - Initial Diwali Draft',
        'V2 - Logo resized',
        'V3 - Gold color applied',
        'V4 - Text changed: Big Sale',
    ]

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Changes & Feedback Column */}
            <div className="space-y-4">
                {/* Changes Requested */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-red-600 mb-4">Changes Requested</h3>
                    <div className="border-t border-gray-200 mb-4"></div>
                    <p className="text-green-600 font-semibold">Approved</p>
                </div>

                {/* Feedback from WhatsApp */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Feedback from WhatsApp</h3>
                    <div className="border-t border-gray-200 mb-4"></div>

                    <div className="space-y-4">
                        {feedbackItems.map((item, idx) => (
                            <div key={idx} className="text-sm">
                                <p className="text-gray-600">{item.manager}:</p>
                                <p className="text-gray-900 italic">{item.message}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4">
                        <button className="text-orange-500 hover:text-orange-600 font-semibold text-sm">
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Version History & Actions Column */}
            <div className="space-y-4">
                {/* Version History */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Version History</h3>
                    <div className="border-t border-gray-200 mb-4"></div>

                    <div className="space-y-3">
                        {versions.map((version, idx) => (
                            <p key={idx} className="text-gray-700 text-sm">{version}</p>
                        ))}
                    </div>
                </div>

                {/* Restore Action */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <button className="w-full border-2 border-gray-300 rounded-xl py-8 font-semibold text-gray-900 hover:border-orange-500 hover:text-orange-500 transition-all duration-200">
                        Restore V2
                    </button>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Every WhatsApp approval or action creates a new version snapshot
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-xs text-gray-600">
                        If instruction matches editable layer → show (Apply) to auto-edit text / color / size.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default FeedPage
