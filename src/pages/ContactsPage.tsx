import React, { useState, useEffect } from 'react';
import ContactManager from '../components/ContactManager';
import './ContactsPage.css';

interface Contact {
  id: number;
  phone_number: string;
  display_name?: string;
  whatsapp_profile_name?: string;
  saved_name?: string;
  has_susa_suffix: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ContactsPageProps {
  onClose: () => void;
}

const ContactsPage: React.FC<ContactsPageProps> = ({ onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactManager, setShowContactManager] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_URL || (
        import.meta.env.PROD ? '' : 'http://localhost:3000'
      );
      const response = await fetch(`${API_BASE_URL}/api/contacts`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      const data = await response.json();
      // API returns contacts array directly, not wrapped in { contacts: [] }
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.phone_number.includes(searchTerm) ||
      (contact.saved_name && contact.saved_name.toLowerCase().includes(searchLower)) ||
      (contact.display_name && contact.display_name.toLowerCase().includes(searchLower)) ||
      (contact.whatsapp_profile_name && contact.whatsapp_profile_name.toLowerCase().includes(searchLower))
    );
  });

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactManager(true);
  };

  const handleContactSaved = (_updatedContact: any) => {
    // Refresh contacts list
    fetchContacts();
    setShowContactManager(false);
    setSelectedContact(null);
  };

  const handleAddNewContact = () => {
    setSelectedContact(null);
    setShowContactManager(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (contact: Contact) => {
    return contact.saved_name || 
           contact.whatsapp_profile_name || 
           contact.display_name || 
           contact.phone_number;
  };

  return (
    <div className="page-overlay">
      <div className="page-container contacts-page">
        <div className="page-header">
          <h1>📇 Contacts & Customer Profiles</h1>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="page-content">
          {/* Search and Actions */}
          <div className="contacts-controls">
            <div className="search-section">
              <input
                type="text"
                placeholder="🔍 Search contacts by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button 
              className="add-contact-btn"
              onClick={handleAddNewContact}
            >
              ➕ Add New Contact
            </button>
          </div>

          {/* Contacts Stats */}
          <div className="contacts-stats">
            <div className="stat-item">
              <span className="stat-number">{contacts.length}</span>
              <span className="stat-label">Total Contacts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredContacts.length}</span>
              <span className="stat-label">Showing</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading contacts...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={fetchContacts} className="retry-button">
                🔄 Retry
              </button>
            </div>
          )}

          {/* Contacts List */}
          {!loading && !error && (
            <div className="contacts-list">
              {filteredContacts.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No contacts found</p>
                  {searchTerm && (
                    <p>Try adjusting your search term</p>
                  )}
                  <button 
                    className="add-contact-btn"
                    onClick={handleAddNewContact}
                  >
                    ➕ Add Your First Contact
                  </button>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="contact-card"
                    onClick={() => handleContactClick(contact)}
                  >
                    <div className="contact-avatar">
                      <div className="avatar-circle">
                        {getDisplayName(contact).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="contact-info">
                      <h3 className="contact-name">
                        {getDisplayName(contact)}
                        {contact.has_susa_suffix && (
                          <span className="susa-badge">SUSA</span>
                        )}
                      </h3>
                      <p className="contact-phone">{contact.phone_number}</p>
                      {contact.notes && (
                        <p className="contact-notes">📝 {contact.notes}</p>
                      )}
                    </div>
                    
                    <div className="contact-meta">
                      <span className="contact-date">
                        {formatDate(contact.updated_at)}
                      </span>
                      <span className="contact-arrow">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Contact Manager Modal */}
        {showContactManager && (
          <ContactManager
            phoneNumber={selectedContact?.phone_number || ''}
            displayName={selectedContact?.display_name}
            whatsappProfileName={selectedContact?.whatsapp_profile_name}
            onContactSaved={handleContactSaved}
            onClose={() => {
              setShowContactManager(false);
              setSelectedContact(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
