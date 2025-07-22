import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ActionBar from './components/ActionBar'
import WhatsAppPage from './components/WhatsAppPage'
import OptInOutPage from './components/OptInOutPage'
import OrderConfirmationPage from './components/OrderConfirmationPage'
import ChatPage from './components/ChatPage'
import HomePage from './components/HomePage'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showOptInOut, setShowOptInOut] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleHomeClick = () => {
    console.log('Home button clicked!')
    setCount(0)
    // Close all other pages and return to main view
    setShowWhatsApp(false)
    setShowOptInOut(false)
    setShowOrderConfirmation(false)
    setShowChat(false)
    setShowLogin(false)
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
    setShowChat(true)
  }

  const handleWhatsAppClick = () => {
    console.log('WhatsApp button clicked!')
    setShowWhatsApp(true)
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

  const handleCloseLogin = () => {
    setShowLogin(false)
  }

  return (
    <>
      <ActionBar 
        onHomeClick={handleHomeClick}
        onWhatsAppClick={handleWhatsAppClick}
        onOtpClick={handleOtpClick}
        onOcClick={handleOcClick}
        onChatClick={handleChatClick}
        onLoginClick={handleLoginClick}
      />
      <div className="main-content">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>✨ Stella</h1>
      <p className="subtitle">Modern React Frontend Application</p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="features">
        <div className="feature-item">
          <h3>⚡ Vite</h3>
          <p>Lightning-fast development with HMR</p>
        </div>
        <div className="feature-item">
          <h3>⚛️ React 18</h3>
          <p>Modern React with TypeScript</p>
        </div>
        <div className="feature-item">
          <h3>🔧 TypeScript</h3>
          <p>Type-safe development experience</p>
        </div>
      </div>
      <p className="read-the-docs">
        Ready to build something amazing? Start editing the components!
      </p>
      
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
        <ChatPage onClose={handleCloseChat} />
      )}

      {showLogin && (
        <HomePage onClose={handleCloseLogin} />
      )}
    </>
  )
}

export default App
