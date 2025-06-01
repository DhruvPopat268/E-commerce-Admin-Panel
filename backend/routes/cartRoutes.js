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

    // ✅ Fetch product and attribute
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const attribute = product.attributes.find(attr => attr._id.toString() === attributeId);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found in product' });

    // ✅ Find existing cart entry for user + product
    const existing = await Cart.findOne({ userId, productId });

    if (existing) {
      const matchIndex = existing.attributes.findIndex(
        attr => attr._id?.toString() === attributeId
      );

      if (matchIndex > -1) {
        // ✅ Update quantity if same attribute exists
        existing.attributes[matchIndex].quantity += qty;
      } else {
        // ✅ Else push new attribute
        existing.attributes.push({
          _id: attribute._id,
          name: attribute.name,
          price: attribute.price,
          discountedPrice: attribute.discountedPrice,
          quantity: qty,
        });
      }

      const updated = await existing.save();

      // ✅ Add totals dynamically
      const response = updated.toObject();
      let productTotal = 0;

      response.attributes = response.attributes.map(attr => {
        const total = attr.discountedPrice * attr.quantity;
        productTotal += total;
        return {
          ...attr,
          total,
        };
      });

      response.productTotal = productTotal;

      return res.status(200).json(response);
    }

    // ✅ If not exists, create new cart item
    const newCartItem = await Cart.create({
      userId,
      productId,
      productName: product.name,
      image: product.image,
      attributes: [
        {
          _id: attribute._id,
          name: attribute.name,
          price: attribute.price,
          discountedPrice: attribute.discountedPrice,
          quantity: qty,
        },
      ],
    });

    // ✅ Add totals dynamically
    const response = newCartItem.toObject();
    let productTotal = 0;

    response.attributes = response.attributes.map(attr => {
      const total = attr.discountedPrice * attr.quantity;
      productTotal += total;
      return {
        ...attr,
        total,
      };
    });

    response.productTotal = productTotal;

    res.status(200).json(response);
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
      let productTotal = 0;

      const attributes = cart.attributes.map(attr => {
        const total = attr.discountedPrice * attr.quantity;
        productTotal += total;

        return {
          ...attr.toObject(), // convert mongoose subdoc to plain object
          total
        };
      });

      return {
        ...cart.toObject(), // convert entire cart doc to plain object
        attributes,
        productTotal
      };
    });

    // Compute total cart value
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
