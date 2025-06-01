const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const verifyToken = require('../middleware/authMiddleware');

// Place order
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // userId from token

    console.log(userId)

    const cartItems = await Cart.find({ userId });

    if (!cartItems.length) {
      return res.status(400).json({ message: 'No items in cart to place order' });
    }

    const orderItems = cartItems.map(item => ({
      productId: item.productId?.toString(),
      productName: item.productName,
      image: item.image,
      quantity: item.quantity || 1,
      price: item.price || 0,
      attributes: item.attributes,
    }));

    const newOrder = new Order({
      userId,
      orders: orderItems,
      status: 'pending',
    });

    await newOrder.save();
    await Cart.deleteMany({ userId });

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error placing order' });
  }
});

module.exports = router;
