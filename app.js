const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const passport = require('./src/auth');
const bcrypt = require('bcrypt');
const { client } = require('./src/db');
const { ensureAdmin, ensureAdminOrSubscriptionActive, ensureSubscriptionActive } = require('./src/authMiddleware');

// Session configuration
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Inventory Management API!");
});

app.get("/admin/allusers", ensureAdmin, async (req, res) => {
  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");
    const users = await usersCollection.find().toArray();

    res.status(200).json(users); // This sends the users array to the client.
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/users/:username", ensureAdminOrSubscriptionActive, async (req, res) => {
  const requestedUsername = req.params.username;
  const loggedInUsername = req.user.username;

  if (requestedUsername !== loggedInUsername && req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ username: requestedUsername });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error retrieving user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/users/:username/inventory", ensureSubscriptionActive, async (req, res) => {
  const username = req.params.username;

  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");

    const userWithInventories = await usersCollection.aggregate([
      { $match: { username } },
      {
        $lookup: {
          from: "inventories",
          localField: "inventory",
          foreignField: "_id",
          as: "inventory",
        },
      },
      { $unwind: "$inventory" },
      {
        $lookup: {
          from: "products",
          localField: "inventory.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $addFields: {
          "product.qty": "$inventory.qty",
        },
      },
      { $replaceRoot: { newRoot: "$product" } },
    ]).toArray();

    if (!userWithInventories || userWithInventories.length === 0) {
      return res.status(404).json({ message: "User or inventories not found" });
    }

    res.json(userWithInventories);
  } catch (err) {
    console.error("Error retrieving inventory:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = client.db('inventory_management');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      role: 'user',
      subscriptionActive: true,
    };

    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'User registered.' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.json(req.user);
});

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
