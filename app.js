const express = require("express");
const app = express();
const port = 3000;
const { client } = require("./src/db");

// Route handler to get a user by email

app.get("/", (req, res) => {
  res.send("Welcome to the Inventory Management API!");
});

app.get("/users/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error retrieving user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users/:email/inventory", async (req, res) => {
  const email = req.params.email;

  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");

    const userWithInventories = await usersCollection.aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: "inventories",
          localField: "inventory",
          foreignField: "_id",
          as: "inventory"
        }
      },
      { $unwind: "$inventory" },
      {
        $lookup: {
          from: "products",
          localField: "inventory.product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { 
        $addFields: {
          "product.qty": "$inventory.qty"
        } 
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




app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
