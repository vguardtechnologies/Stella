import { useState, useEffect } from 'react'
import ActionBar from './components/ActionBar'
import WhatsAppPage from './components/WhatsAppPage'
import OptInOutPage from './components/OptInOutPage'
import OrderConfirmationPage from './components/OrderConfirmationPage'
import ChatPage from './components/ChatPage'
import HomePage from './components/HomePage'
import ContactsPage from './pages/ContactsPage'
import MetaIntegrationPage from './components/MetaIntegrationPage'
import './App.css'

function App() {
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showOptInOut, setShowOptInOut] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showContacts, setShowContacts] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showFacebook, setShowFacebook] = useState(false)
  const [shopifyStore, setShopifyStore] = useState<{ shop: string; domain: string; connected: boolean } | undefined>(undefined)

  // Load saved Shopify connection on app start
  useEffect(() => {
    const savedShopifyStore = localStorage.getItem('shopifyStore')
    if (savedShopifyStore) {
      try {
        const store = JSON.parse(savedShopifyStore)
        setShopifyStore(store)
        console.log('✅ Loaded saved Shopify connection:', store.name)
      } catch (error) {
        console.error('Error loading saved Shopify store:', error)
        localStorage.removeItem('shopifyStore')
      }
    }
  }, [])

  const handleHomeClick = () => {
    console.log('Home button clicked!')
    // Close all other pages and return to main view
    setShowWhatsApp(false)
    setShowOptInOut(false)
    setShowOrderConfirmation(false)
    setShowChat(false)
    setShowContacts(false)
    setShowLogin(false)
    setShowFacebook(false)
  }

  const handleLoginClick = () => {
    console.log('Login button clicked!')
    setShowLogin(true)
  }

  const handleOtpClick = () => {
    console.log('Opt-In/Opt-Out button clicked!')
    setShowOptInOut(true)
  }

  const handleOcClick = () => {
    console.log('Order Confirmation button clicked!')
    setShowOrderConfirmation(true)
  }

  const handleChatClick = () => {
    console.log('Chat button clicked!')
    setShowChat(true) // Show ChatPage with integrated WhatsApp features
  }

  const handleShopifyClick = () => {
    console.log('Shopify button clicked!')
    setShowChat(true)
  }

  const handleContactsClick = () => {
    console.log('Contacts button clicked!')
    setShowContacts(true)
  }

  const handleWhatsAppClick = () => {
    console.log('WhatsApp button clicked!')
    setShowWhatsApp(true)
  }

  const handleFacebookClick = () => {
    console.log('Facebook button clicked!')
    setShowFacebook(true)
  }

  const handleCloseWhatsApp = () => {
    setShowWhatsApp(false)
  }

  const handleCloseOptInOut = () => {
    setShowOptInOut(false)
  }

  const handleCloseChat = () => {
    setShowChat(false)
  }

  const handleCloseContacts = () => {
    setShowContacts(false)
  }

  const handleCloseLogin = () => {
    setShowLogin(false)
  }

  const handleCloseFacebook = () => {
    setShowFacebook(false)
  }

  return (
    <>
      <ActionBar 
        onHomeClick={handleHomeClick}
        onWhatsAppClick={handleWhatsAppClick}
        onOtpClick={handleOtpClick}
        onOcClick={handleOcClick}
        onChatClick={handleChatClick}
        onContactsClick={handleContactsClick}
        onLoginClick={handleLoginClick}
        onShopifyClick={handleShopifyClick}
        onFacebookClick={handleFacebookClick}
      />
      <div className="simple-main">
        <h1 className="stella-main-title">Stella</h1>
      </div>
      
      {showWhatsApp && (
        <WhatsAppPage onClose={handleCloseWhatsApp} />
      )}
      
      {showOptInOut && (
        <OptInOutPage onClose={handleCloseOptInOut} />
      )}

      {showOrderConfirmation && (
        <OrderConfirmationPage onClose={() => setShowOrderConfirmation(false)} />
      )}

      {showChat && (
        <ChatPage onClose={handleCloseChat} shopifyStore={shopifyStore} />
      )}

      {showContacts && (
        <ContactsPage onClose={handleCloseContacts} />
      )}

      {showLogin && (
        <HomePage onClose={handleCloseLogin} />
      )}

      {showFacebook && (
        <MetaIntegrationPage onClose={handleCloseFacebook} />
      )}
    </>
  )
}

export default App
