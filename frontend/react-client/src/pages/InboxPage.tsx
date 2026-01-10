import { useEffect, useState } from 'react'
import BriefCard from '../components/BriefCard'

interface Brief {
  id: number
  title: string
  campaign: string
  offer: string
  code: string
  template: string
}

const InboxPage = () => {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://whatsapp-bot-1lmp.onrender.com/whatsapp/inbox')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((msg: any) => ({
          id: msg.id,
          title: `New Brief From Manager (+${msg.from.slice(-4)})`,
          campaign: msg.text,          // ✅ REAL WhatsApp message
          offer: '-',                  // placeholder
          code: '-',                   // placeholder
          template: 'Not detected yet' // placeholder
        }))

        setBriefs(formatted)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading inbox...</div>

  return (
    <div className="space-y-4">
      {briefs.map((brief) => (
        <BriefCard
          key={brief.id}
          title={brief.title}
          campaign={brief.campaign}
          offer={brief.offer}
          code={brief.code}
          template={brief.template}
          onOpenTemplate={() =>
            console.log('Opening brief:', brief.id)
          }
        />
      ))}
    </div>
  )
}

export default InboxPage
