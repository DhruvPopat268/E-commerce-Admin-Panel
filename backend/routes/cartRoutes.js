const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/authMiddleware');

// 🛒 Add item to cart (with quantity inside each attribute)
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, name, image, attributes } = req.body;
    const userId = req.userId;

    // Parse attributes if it's a JSON string
    let parsedAttributes = Array.isArray(attributes) ? attributes : JSON.parse(attributes);

    // Check if product with same attributes already exists
    const existing = await Cart.findOne({ userId, productId });

    if (existing) {
      // Merge attributes and update quantities
      parsedAttributes.forEach((newAttr) => {
        const matchIndex = existing.attributes.findIndex(
          (attr) => attr.name === newAttr.name
        );

        if (matchIndex > -1) {
          existing.attributes[matchIndex].quantity += newAttr.quantity || 1;
        } else {
          existing.attributes.push({ ...newAttr, quantity: newAttr.quantity || 1 });
        }
      });

      await existing.save();
      return res.json(existing);
    }

    // New product to cart
    const newItem = await Cart.create({
      userId,
      productId,
      name,
      image,
      attributes: parsedAttributes.map(attr => ({
        ...attr,
        quantity: attr.quantity || 1,
      })),
    });

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛒 Get cart items
router.post('/my-cart', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const cartItems = await Cart.find({ userId });
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛒 Update quantity of a specific attribute inside a cart item
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { productId, attributeName, quantity } = req.body;
    const userId = req.userId;

    const cartItem = await Cart.findOne({ userId, productId });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const attrIndex = cartItem.attributes.findIndex(
      (attr) => attr.name === attributeName
    );

    if (attrIndex === -1) {
      return res.status(404).json({ error: 'Attribute not found in cart item' });
    }

    cartItem.attributes[attrIndex].quantity = quantity;
    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛒 Remove a specific attribute (variation) from cart
router.delete('/remove', verifyToken, async (req, res) => {
  try {
    const { productId, attributeName } = req.body;
    const userId = req.userId;

    const cartItem = await Cart.findOne({ userId, productId });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    cartItem.attributes = cartItem.attributes.filter(
      (attr) => attr.name !== attributeName
    );

    // If no attributes remain, remove the whole cart item
    if (cartItem.attributes.length === 0) {
      await Cart.findOneAndDelete({ userId, productId });
      return res.json({ message: 'Item removed from cart' });
    }

    await cartItem.save();
    res.json({ message: 'Attribute removed from cart item', cartItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛒 Clear entire cart
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    await Cart.deleteMany({ userId });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
