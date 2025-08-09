const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

// Save cart data when user clicks "Send Cart" in frontend
router.post('/save', async (req, res) => {
  try {
    const { phoneNumber, cartItems } = req.body;

    if (!phoneNumber || !cartItems) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and cart items are required'
      });
    }

    console.log(`💾 Saving cart for ${phoneNumber}:`, cartItems.length, 'items');

    const success = await cartService.saveCart(phoneNumber, cartItems);

    if (success) {
      res.json({
        success: true,
        message: 'Cart saved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save cart'
      });
    }
  } catch (error) {
    console.error('Error in cart save API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get cart data for a phone number
router.get('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const cartData = await cartService.getCart(phoneNumber);

    res.json({
      success: true,
      data: cartData
    });
  } catch (error) {
    console.error('Error in cart get API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add item to cart via API
router.post('/add', async (req, res) => {
  try {
    const { phoneNumber, product, quantity = 1, selectedOptions = {} } = req.body;

    if (!phoneNumber || !product) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and product are required'
      });
    }

    const success = await cartService.addToCart(phoneNumber, product, quantity, selectedOptions);

    if (success) {
      const cartData = await cartService.getCart(phoneNumber);
      res.json({
        success: true,
        message: 'Item added to cart',
        cart: cartData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart'
      });
    }
  } catch (error) {
    console.error('Error in cart add API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Remove item from cart
router.post('/remove', async (req, res) => {
  try {
    const { phoneNumber, productId, selectedOptions = {} } = req.body;

    if (!phoneNumber || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and product ID are required'
      });
    }

    const success = await cartService.removeFromCart(phoneNumber, productId, selectedOptions);

    if (success) {
      const cartData = await cartService.getCart(phoneNumber);
      res.json({
        success: true,
        message: 'Item removed from cart',
        cart: cartData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart'
      });
    }
  } catch (error) {
    console.error('Error in cart remove API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Clear cart
router.delete('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const success = await cartService.clearCart(phoneNumber);

    if (success) {
      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart'
      });
    }
  } catch (error) {
    console.error('Error in cart clear API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
