const express = require("express");
const app = express();
const port = 3000;
const { client } = require("./src/db");


app.get("/", (req, res) => {
  res.send("Welcome to the Inventory Management API!");
});

app.get("/admin/allusers", async (req, res) => {
  try {
    const db = client.db("inventory_management");
    const usersCollection = db.collection("users");
    const users = await usersCollection.find().toArray();

    res.status(200).json(users);  // This sends the users array to the client.
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/api/users/:email", async (req, res) => {
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

app.get("/api/users/:email/inventory", async (req, res) => {
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
