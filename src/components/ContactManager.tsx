import React, { useState, useEffect } from 'react';

interface ContactManagerProps {
  phoneNumber: string;
  displayName?: string;
  whatsappProfileName?: string;
  onContactSaved: (contactInfo: any) => void;
  onClose: () => void;
}

const ContactManager: React.FC<ContactManagerProps> = ({
  phoneNumber,
  displayName,
  whatsappProfileName,
  onContactSaved,
  onClose
}) => {
  const [savedName, setSavedName] = useState('');
  const [hasSusaSuffix, setHasSusaSuffix] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-populate name field with WhatsApp profile information
  useEffect(() => {
    if (whatsappProfileName && whatsappProfileName !== phoneNumber) {
      setSavedName(whatsappProfileName);
    } else if (displayName && displayName !== phoneNumber) {
      setSavedName(displayName);
    }
  }, [whatsappProfileName, displayName, phoneNumber]);

  const handleSave = async () => {
    if (!savedName.trim()) {
      alert('Please enter a name for this contact');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/contacts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          displayName,
          whatsappProfileName,
          savedName: savedName.trim(),
          hasSusaSuffix,
          notes: notes.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save contact');
      }

      const result = await response.json();
      
      console.log('✅ Contact saved:', result);
      
      // Call the callback with the saved contact info
      onContactSaved({
        ...result.contact,
        displayName: hasSusaSuffix ? `${savedName.trim()} 🦋Susa` : savedName.trim()
      });

      onClose();
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '12px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>📇 Save Contact</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Contact Info */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>WhatsApp Info:</h4>
            <p style={{ margin: '4px 0', color: '#666' }}>
              <strong>Phone:</strong> {phoneNumber}
            </p>
            {whatsappProfileName && (
              <p style={{ margin: '4px 0', color: '#666' }}>
                <strong>WhatsApp Name:</strong> {whatsappProfileName}
              </p>
            )}
            {displayName && displayName !== whatsappProfileName && (
              <p style={{ margin: '4px 0', color: '#666' }}>
                <strong>Display Name:</strong> {displayName}
              </p>
            )}
          </div>
        </div>

        {/* Save Form */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333'
          }}>
            Contact Name *
          </label>
          <input
            type="text"
            value={savedName}
            onChange={(e) => setSavedName(e.target.value)}
            placeholder="Enter a name for this contact"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Susa Suffix Option */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px solid #e1e5e9'
          }}>
            <input
              type="checkbox"
              checked={hasSusaSuffix}
              onChange={(e) => setHasSusaSuffix(e.target.checked)}
              style={{ marginRight: '12px' }}
            />
            <div>
              <span style={{ fontWeight: '600', color: '#333' }}>
                Add 🦋Susa suffix
              </span>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Display name will show as: "{savedName.trim() || 'Contact Name'} 🦋Susa"
              </div>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333'
          }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this contact..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Preview */}
        {savedName.trim() && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <strong style={{ color: '#2e7d32' }}>Preview:</strong>
            <div style={{ marginTop: '4px', color: '#2e7d32' }}>
              Contact will be saved as: <strong>
                {hasSusaSuffix ? `${savedName.trim()} 🦋Susa` : savedName.trim()}
              </strong>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#666',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!savedName.trim() || isSaving}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: !savedName.trim() || isSaving ? '#ccc' : '#007bff',
              color: 'white',
              cursor: !savedName.trim() || isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactManager;
