const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class CartService {
  constructor() {
    // Initialize cart storage tables
    this.initializeTables();
  }

  async initializeTables() {
    try {
      // Create cart table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_carts (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL,
          cart_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(phone_number)
        );
      `);

      console.log('✅ Cart tables initialized');
    } catch (error) {
      console.error('❌ Error initializing cart tables:', error);
    }
  }

  // Save cart data for a phone number
  async saveCart(phoneNumber, cartItems) {
    try {
      console.log(`📥 Attempting to save cart for ${phoneNumber}:`, cartItems);
      
      const cartData = {
        items: cartItems,
        total: this.calculateTotal(cartItems),
        itemCount: cartItems.length,
        updatedAt: new Date().toISOString()
      };

      console.log('📦 Formatted cart data:', cartData);

      const result = await pool.query(`
        INSERT INTO whatsapp_carts (phone_number, cart_data, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (phone_number)
        DO UPDATE SET 
          cart_data = $2,
          updated_at = CURRENT_TIMESTAMP
      `, [phoneNumber, JSON.stringify(cartData)]);

      console.log(`✅ Cart saved for ${phoneNumber} with ${cartItems.length} items, result:`, result);
      return true;
    } catch (error) {
      console.error('❌ Error saving cart:', error);
      return false;
    }
  }

  // Get cart data for a phone number
  async getCart(phoneNumber) {
    try {
      const result = await pool.query(`
        SELECT cart_data FROM whatsapp_carts 
        WHERE phone_number = $1
      `, [phoneNumber]);

      if (result.rows.length > 0) {
        const cartData = result.rows[0].cart_data;
        console.log(`✅ Cart retrieved for ${phoneNumber}: ${cartData.itemCount} items`);
        return cartData;
      } else {
        console.log(`ℹ️ No cart found for ${phoneNumber}`);
        return { items: [], total: 0, itemCount: 0 };
      }
    } catch (error) {
      console.error('❌ Error retrieving cart:', error);
      return { items: [], total: 0, itemCount: 0 };
    }
  }

  // Add item to cart
  async addToCart(phoneNumber, product, quantity = 1, selectedOptions = {}) {
    try {
      const currentCart = await this.getCart(phoneNumber);
      
      // Check if item with same options already exists
      const existingItemIndex = currentCart.items.findIndex(item => {
        if (item.id !== product.id) return false;
        
        // Compare selected options
        const itemOptionsStr = JSON.stringify(item.selectedOptions || {});
        const currentOptionsStr = JSON.stringify(selectedOptions);
        
        return itemOptionsStr === currentOptionsStr;
      });

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        currentCart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        const cartItem = {
          id: product.id,
          title: product.title,
          price: product.variants?.[0]?.price || '0',
          image: product.images?.[0]?.src || product.image?.src,
          quantity: quantity,
          selectedOptions: selectedOptions,
          addedAt: new Date().toISOString()
        };
        currentCart.items.push(cartItem);
      }

      await this.saveCart(phoneNumber, currentCart.items);
      return true;
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return false;
    }
  }

  // Remove item from cart
  async removeFromCart(phoneNumber, productId, selectedOptions = {}) {
    try {
      const currentCart = await this.getCart(phoneNumber);
      
      const filteredItems = currentCart.items.filter(item => {
        if (item.id !== productId) return true;
        
        const itemOptionsStr = JSON.stringify(item.selectedOptions || {});
        const targetOptionsStr = JSON.stringify(selectedOptions);
        
        return itemOptionsStr !== targetOptionsStr;
      });

      await this.saveCart(phoneNumber, filteredItems);
      return true;
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return false;
    }
  }

  // Clear entire cart
  async clearCart(phoneNumber) {
    try {
      await pool.query(`
        DELETE FROM whatsapp_carts WHERE phone_number = $1
      `, [phoneNumber]);

      console.log(`✅ Cart cleared for ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return false;
    }
  }

  // Calculate total price
  calculateTotal(cartItems) {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price || '0');
      return total + (price * item.quantity);
    }, 0);
  }

  // Get cart summary for WhatsApp display
  getCartSummary(cartData) {
    if (cartData.itemCount === 0) {
      return "Your cart is empty.";
    }

    let summary = `🛒 *Your Cart (${cartData.itemCount} item${cartData.itemCount !== 1 ? 's' : ''})*\n\n`;
    
    cartData.items.forEach((item, index) => {
      const optionsText = item.selectedOptions && Object.keys(item.selectedOptions).length > 0
        ? ` (${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')})`
        : '';
      
      summary += `${index + 1}. *${item.title}*${optionsText}\n`;
      summary += `   💰 $${item.price} TTD × ${item.quantity} = $${(parseFloat(item.price) * item.quantity).toFixed(2)} TTD\n\n`;
    });

    summary += `📊 *Total: $${cartData.total.toFixed(2)} TTD*`;
    
    return summary;
  }
}

module.exports = new CartService();
