const express = require('express');
const contactService = require('../services/contactService');
const router = express.Router();

// Check if contact exists
router.get('/check/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const contact = await contactService.isContactSaved(phoneNumber);
    
    res.json({
      exists: !!contact,
      contact: contact || null
    });
  } catch (error) {
    console.error('Error checking contact:', error);
    res.status(500).json({ error: 'Failed to check contact' });
  }
});

// Save a new contact
router.post('/save', async (req, res) => {
  try {
    const {
      phoneNumber,
      displayName,
      whatsappProfileName,
      savedName,
      hasSusaSuffix,
      notes
    } = req.body;

    if (!phoneNumber || !savedName) {
      return res.status(400).json({ 
        error: 'Phone number and saved name are required' 
      });
    }

    const savedContact = await contactService.saveContact({
      phoneNumber,
      displayName,
      whatsappProfileName,
      savedName,
      hasSusaSuffix,
      notes
    });

    res.json({
      success: true,
      contact: savedContact,
      message: 'Contact saved successfully'
    });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});

// Get contact details
router.get('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const contact = await contactService.getContact(phoneNumber);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

// Update contact
router.put('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const updates = req.body;
    
    const updatedContact = await contactService.updateContact(phoneNumber, updates);
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({
      success: true,
      contact: updatedContact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const deletedContact = await contactService.deleteContact(phoneNumber);
    
    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await contactService.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Search contacts
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const contacts = await contactService.searchContacts(term);
    res.json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

module.exports = router;
