const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect("mongodb+srv://spark:spark@cluster0.zfvaz.mongodb.net/oee");
    console.log("Connected to MongoDB");
  } catch (e) {
    console.log("Connection error:", e);
  }
};

connection();
