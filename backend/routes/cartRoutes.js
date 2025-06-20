const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/authMiddleware');
const Product = require('../models/product');
const Village = require('../models/village')

// ✅ Make sure this import exists

router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, attributeId, quantity } = req.body;
    const userId = req.userId;
    const qty = parseInt(quantity) > 0 ? parseInt(quantity) : 1;

    // Check if product exists
    const product = await Product.findById(productId);
    console.log(product)
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if the specific attribute exists in the product
    const attribute = product.attributes.find(attr => attr._id.toString() === attributeId);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found in product' });

    // Check if the exact same product with the same attribute already exists in cart
    const existingCartItem = await Cart.findOne({
      userId,
      productId,
      'attributes._id': attributeId
    });

    let result;

    if (existingCartItem) {
      // Same product with same attribute exists - update quantity
      existingCartItem.attributes.quantity += qty;
      existingCartItem.attributes.total = existingCartItem.attributes.discountedPrice * existingCartItem.attributes.quantity;
      result = await existingCartItem.save();
    } else {
      // Either product doesn't exist in cart OR same product with different attribute
      // Create new cart document
      result = await Cart.create({
        userId,
        productId,
        productName: product.name,
        images: product.images?.[0] ? [product.images[0]] : [],

        attributes: {
          _id: attributeId,
          name: attribute.name,
          discountedPrice: attribute.discountedPrice,
          quantity: qty,
          total: attribute.discountedPrice * qty
        },
      });
    }

    // ✅ Count total cart items for the user
    const productsCount = await Cart.countDocuments({ userId });

    // ✅ Calculate total cart value
    const cartItems = await Cart.find({ userId });
    const totalCartValue = cartItems.reduce((sum, item) => sum + (item.attributes.total || 0), 0);

    return res.status(200).json({
      message: 'Cart updated successfully',
      cartItem: result,
      productsCount,
      totalCartValue
    });

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
    const { productId, attributeId, quantity } = req.body;
    const userId = req.userId;

    const cartItem = await Cart.findOne({
      userId,
      productId,
      'attributes._id': attributeId
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Update quantity
    if (parseInt(quantity) === 0) {
      await Cart.deleteOne({ _id: cartItem._id });
      return res.status(200).json({ message: 'Cart item removed successfully' });
    }

    cartItem.attributes.quantity = parseInt(quantity);
    cartItem.attributes.total = cartItem.attributes.discountedPrice * cartItem.attributes.quantity;
    cartItem.productTotal = cartItem.attributes.total;

    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    console.error(err);
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