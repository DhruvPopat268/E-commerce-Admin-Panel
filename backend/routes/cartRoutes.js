const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/authMiddleware');
const Product = require('../models/product');

router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, attributeId, quantity } = req.body;
    const userId = req.userId;
    const qty = parseInt(quantity) > 0 ? parseInt(quantity) : 1;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const attribute = product.attributes.find(attr => attr._id.toString() === attributeId);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found in product' });

    // Find existing cart with this product and attribute
    const existing = await Cart.findOne({
      userId,
      productId,
      'attributes._id': attributeId
    });

    if (existing) {
      // Update quantity
      existing.attributes.quantity += qty;
      // Calculate total
      existing.attributes.total = existing.attributes.discountedPrice * existing.attributes.quantity;

      const updated = await existing.save();

      return res.status(200).json(updated);
    }

    // Create new cart entry
    const newCartItem = await Cart.create({
      userId,
      productId,
      productName: product.name,
      image: product.image,
      attributes: {
        _id: attribute._id,
        name: attribute.name,
      
        discountedPrice: attribute.discountedPrice,
        quantity: qty,
        total: attribute.discountedPrice * qty
      },
    });

    res.status(200).json(newCartItem);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// 🛒 Get cart items
router.post('/my-cart', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const cartItems = await Cart.find({ userId });

    // Compute totals
    const cartWithTotals = cartItems.map(cart => {
      const attr = cart.attributes; // single object now

      const total = attr.discountedPrice * attr.quantity;
      // Add total inside attributes object for response
      const attributesWithTotal = {
        ...attr.toObject ? attr.toObject() : attr,
        total
      };

      // productTotal is same as attribute total since only one attribute
      const productTotal = total;

      return {
        ...cart.toObject(),
        attributes: attributesWithTotal,
        productTotal
      };
    });

    // Compute total cart value across all cart items
    const totalCartValue = cartWithTotals.reduce((sum, item) => sum + item.productTotal, 0);

    res.json({ cart: cartWithTotals, totalCartValue });
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
