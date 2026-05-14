const Cart = require("../models/Cart");

// ➕ ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const { name, price, image, quantity, size } = req.body;

    if (!name || !price) {
      return res.status(400).send("Missing product data");
    }

    if (!size) {
      return res.status(400).send("Size is required");
    }

    // ✅ IMPORTANT: include user
    const existing = await Cart.findOne({
      name,
      size,
      user: req.user.id
    });

    if (existing) {
      existing.quantity += quantity || 1;
      await existing.save();
      return res.send("Quantity updated");
    }

    const newItem = new Cart({
      user: req.user.id,   // ✅ VERY IMPORTANT
      name,
      price,
      image,
      size,
      quantity: quantity || 1
    });

    await newItem.save();

    res.send("Added to cart");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding to cart");
  }
};


// 📦 GET CART ITEMS
exports.getCart = async (req, res) => {
  try {
    const items = await Cart.find({ user: req.user.id }); // ✅ FILTER BY USER
    res.json(items);
  } catch (err) {
    res.status(500).send("Error fetching cart");
  }
};


// ✏️ UPDATE CART
exports.updateCart = async (req, res) => {
  try {
    const { quantity } = req.body;

    const updated = await Cart.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // ✅ IMPORTANT
      { quantity },
      { new: true }
    );

    if (!updated) {
      return res.status(404).send("Item not found");
    }

    res.send("Cart updated");
  } catch (err) {
    res.status(500).send("Error updating cart");
  }
};


// ❌ REMOVE SINGLE ITEM
exports.removeCartItem = async (req, res) => {
  try {
    const deleted = await Cart.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id   // ✅ IMPORTANT
    });

    if (!deleted) {
      return res.status(404).send("Item not found");
    }

    res.send("Item removed");
  } catch (err) {
    res.status(500).send("Error removing item");
  }
};


// 🧹 CLEAR ENTIRE CART
exports.clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ user: req.user.id }); // ✅ FIXED
    res.send("Cart cleared");
  } catch (err) {
    res.status(500).send("Error clearing cart");
  }
};