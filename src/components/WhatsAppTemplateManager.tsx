import React, { useState, useEffect } from 'react';
import './WhatsAppTemplateManager.css';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  content: string;
  variables: string[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  description: string;
}

interface WhatsAppTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: WhatsAppTemplate, variables: Record<string, string>) => void;
}

const WhatsAppTemplateManager: React.FC<WhatsAppTemplateManagerProps> = ({
  isOpen,
  onClose,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<WhatsAppTemplate>>({});
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Default templates for e-commerce
  const defaultTemplates: WhatsAppTemplate[] = [
    {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! 🎉 Your order #{{order_id}} has been confirmed for ${{total_amount}}. Expected delivery: {{delivery_date}}. Thank you for choosing us!',
      variables: ['customer_name', 'order_id', 'total_amount', 'delivery_date'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Confirms customer orders with details'
    },
    {
      id: 'shipping_notification',
      name: 'Shipping Notification',
      category: 'UTILITY',
      content: 'Great news {{customer_name}}! 📦 Your order #{{order_id}} has been shipped. Track your package: {{tracking_url}}. Estimated delivery: {{delivery_date}}.',
      variables: ['customer_name', 'order_id', 'tracking_url', 'delivery_date'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Notifies customers when orders are shipped'
    },
    {
      id: 'delivery_confirmation',
      name: 'Delivery Confirmation',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! ✅ Your order #{{order_id}} has been delivered successfully. We hope you love your purchase! Please rate your experience: {{rating_link}}',
      variables: ['customer_name', 'order_id', 'rating_link'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Confirms successful delivery and requests feedback'
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      category: 'UTILITY',
      content: 'Hello {{customer_name}}, this is a friendly reminder that payment for order #{{order_id}} (${{amount}}) is due on {{due_date}}. Pay now: {{payment_link}}',
      variables: ['customer_name', 'order_id', 'amount', 'due_date', 'payment_link'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Reminds customers about pending payments'
    },
    {
      id: 'customer_feedback',
      name: 'Customer Feedback Request',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! 💭 How was your experience with order #{{order_id}}? Your feedback helps us improve. Rate us here: {{feedback_link}}. Thank you!',
      variables: ['customer_name', 'order_id', 'feedback_link'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Requests customer feedback and reviews'
    },
    {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! ⏰ Reminder: You have an appointment scheduled for {{date}} at {{time}}. Location: {{location}}. Need to reschedule? Reply to this message.',
      variables: ['customer_name', 'date', 'time', 'location'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Reminds customers about upcoming appointments'
    },
    {
      id: 'welcome_message',
      name: 'Welcome New Customer',
      category: 'MARKETING',
      content: 'Welcome to {{business_name}}, {{customer_name}}! 🎉 Thanks for joining us. Enjoy {{discount_percent}}% off your first order with code: {{promo_code}}. Shop now: {{shop_link}}',
      variables: ['business_name', 'customer_name', 'discount_percent', 'promo_code', 'shop_link'],
      status: 'PENDING',
      createdAt: new Date(),
      description: 'Welcomes new customers with a discount offer'
    },
    {
      id: 'support_followup',
      name: 'Support Follow-up',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! 🤝 Our support team helped you on {{date}}. Was your issue resolved? Rate our support (1-5): {{rating_link}}. Need more help? Just reply!',
      variables: ['customer_name', 'date', 'rating_link'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Follows up on customer support interactions'
    },
    {
      id: 'order_status_update',
      name: 'Order Status Update',
      category: 'UTILITY',
      content: 'Hello {{customer_name}}, your order #{{order_id}} status has been updated to: {{status}}. {{additional_info}}. Questions? Reply to this message anytime!',
      variables: ['customer_name', 'order_id', 'status', 'additional_info'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Updates customers on order status changes'
    },
    {
      id: 'return_refund_confirmation',
      name: 'Return/Refund Confirmation',
      category: 'UTILITY',
      content: 'Hi {{customer_name}}! ✅ Your return for order #{{order_id}} has been processed. Refund of ${{refund_amount}} will appear in {{refund_timeframe}}. Return tracking: {{tracking_id}}',
      variables: ['customer_name', 'order_id', 'refund_amount', 'refund_timeframe', 'tracking_id'],
      status: 'APPROVED',
      createdAt: new Date(),
      description: 'Confirms return and refund processing'
    }
  ];

  useEffect(() => {
    // Load templates from localStorage or use defaults
    const savedTemplates = localStorage.getItem('whatsapp_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(defaultTemplates);
      localStorage.setItem('whatsapp_templates', JSON.stringify(defaultTemplates));
    }
  }, []);

  const saveTemplates = (newTemplates: WhatsAppTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('whatsapp_templates', JSON.stringify(newTemplates));
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.content) {
      alert('Please fill in all required fields');
      return;
    }

    const variables = extractVariables(editingTemplate.content);
    const template: WhatsAppTemplate = {
      id: editingTemplate.id || `template_${Date.now()}`,
      name: editingTemplate.name,
      category: editingTemplate.category || 'UTILITY',
      content: editingTemplate.content,
      variables,
      status: editingTemplate.status || 'DRAFT',
      createdAt: editingTemplate.createdAt || new Date(),
      description: editingTemplate.description || ''
    };

    const updatedTemplates = editingTemplate.id
      ? templates.map(t => t.id === editingTemplate.id ? template : t)
      : [...templates, template];

    saveTemplates(updatedTemplates);
    setIsEditing(false);
    setEditingTemplate({});
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
    }
  };

  const handleUseTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    // Initialize variable values
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable] = '';
    });
    setVariableValues(initialValues);
  };

  const handleSendTemplate = () => {
    if (!selectedTemplate) return;

    // Check if all variables are filled
    const missingVariables = selectedTemplate.variables.filter(
      variable => !variableValues[variable]?.trim()
    );

    if (missingVariables.length > 0) {
      alert(`Please fill in all variables: ${missingVariables.join(', ')}`);
      return;
    }

    onUseTemplate(selectedTemplate, variableValues);
    setSelectedTemplate(null);
    setVariableValues({});
    onClose();
  };

  const renderTemplate = (content: string, variables: Record<string, string>) => {
    let rendered = content;
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return rendered;
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#4CAF50';
      case 'PENDING': return '#FF9800';
      case 'REJECTED': return '#f44336';
      case 'DRAFT': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UTILITY': return '#2196F3';
      case 'MARKETING': return '#9C27B0';
      case 'AUTHENTICATION': return '#FF5722';
      default: return '#666';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="template-manager-overlay">
      <div className="template-manager">
        <div className="template-header">
          <h2>WhatsApp Template Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {selectedTemplate ? (
          <div className="template-use-section">
            <div className="template-preview">
              <h3>Using Template: {selectedTemplate.name}</h3>
              <div className="template-content">
                <h4>Preview:</h4>
                <div className="preview-message">
                  {renderTemplate(selectedTemplate.content, variableValues)}
                </div>
              </div>

              <div className="template-variables">
                <h4>Fill in Variables:</h4>
                {selectedTemplate.variables.map(variable => (
                  <div key={variable} className="variable-input">
                    <label>{variable.replace(/_/g, ' ').toUpperCase()}:</label>
                    <input
                      type="text"
                      value={variableValues[variable] || ''}
                      onChange={(e) => setVariableValues(prev => ({
                        ...prev,
                        [variable]: e.target.value
                      }))}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>

              <div className="template-actions">
                <button className="btn-secondary" onClick={() => setSelectedTemplate(null)}>
                  Back
                </button>
                <button className="btn-primary" onClick={handleSendTemplate}>
                  Send Template
                </button>
              </div>
            </div>
          </div>
        ) : isEditing ? (
          <div className="template-edit-section">
            <h3>{editingTemplate.id ? 'Edit Template' : 'Create New Template'}</h3>
            
            <div className="edit-form">
              <div className="form-group">
                <label>Template Name:</label>
                <input
                  type="text"
                  value={editingTemplate.name || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>

              <div className="form-group">
                <label>Category:</label>
                <select
                  value={editingTemplate.category || 'UTILITY'}
                  onChange={(e) => setEditingTemplate(prev => ({ 
                    ...prev, 
                    category: e.target.value as 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' 
                  }))}
                >
                  <option value="UTILITY">Utility (Transactional)</option>
                  <option value="MARKETING">Marketing (Promotional)</option>
                  <option value="AUTHENTICATION">Authentication (OTP/Verification)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the template"
                />
              </div>

              <div className="form-group">
                <label>Template Content:</label>
                <textarea
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your template message. Use {{variable_name}} for dynamic content."
                  rows={6}
                />
                <small>Use double curly braces for variables: {'{{customer_name}}, {{order_id}}, etc.'}</small>
              </div>

              {editingTemplate.content && (
                <div className="variables-preview">
                  <h4>Detected Variables:</h4>
                  <div className="variables-list">
                    {extractVariables(editingTemplate.content).map(variable => (
                      <span key={variable} className="variable-tag">{variable}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="edit-actions">
                <button className="btn-secondary" onClick={() => {
                  setIsEditing(false);
                  setEditingTemplate({});
                }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveTemplate}>
                  Save Template
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="template-list-section">
            <div className="template-controls">
              <div className="search-filters">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-filter"
                >
                  <option value="ALL">All Categories</option>
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setIsEditing(true);
                  setEditingTemplate({});
                }}
              >
                + New Template
              </button>
            </div>

            <div className="templates-grid">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-card-header">
                    <h4>{template.name}</h4>
                    <div className="template-badges">
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(template.category) }}
                      >
                        {template.category}
                      </span>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(template.status) }}
                      >
                        {template.status}
                      </span>
                    </div>
                  </div>

                  <div className="template-content">
                    <p className="template-description">{template.description}</p>
                    <div className="template-preview">
                      {template.content.length > 100
                        ? `${template.content.substring(0, 100)}...`
                        : template.content}
                    </div>
                    {template.variables.length > 0 && (
                      <div className="template-variables">
                        <small>Variables: {template.variables.join(', ')}</small>
                      </div>
                    )}
                  </div>

                  <div className="template-card-actions">
                    <button
                      className="btn-use"
                      onClick={() => handleUseTemplate(template)}
                      disabled={template.status !== 'APPROVED'}
                    >
                      Use Template
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setIsEditing(true);
                        setEditingTemplate(template);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="no-templates">
                <p>No templates found matching your criteria.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setIsEditing(true);
                    setEditingTemplate({});
                  }}
                >
                  Create Your First Template
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppTemplateManager;
