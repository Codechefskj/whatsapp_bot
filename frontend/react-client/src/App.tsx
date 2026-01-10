import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import InboxPage from './pages/InboxPage'
import GeneratePage from './pages/GeneratePage'
import ReviewPage from './pages/ReviewPage'
import FeedPage from './pages/FeedPage'

const App = () => {
  const [activeTab, setActiveTab] = useState('inbox')

  const renderPage = () => {
    switch (activeTab) {
      case 'inbox':
        return <InboxPage />
      case 'generate':
        return <GeneratePage />
      case 'review':
        return <ReviewPage />
      case 'feed':
        return <FeedPage />
      default:
        return <InboxPage />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col bg-gray-50">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default App
