import express from "express";
import "dotenv/config";
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors({
    origin: "*",
    credentials: true,
}))

app.use("/api/v1/users", userRoute);        //http://localhost:4000/api/v1/users/register
app.use("/api/v1/products", productRoute);        //http://localhost:4000/api/v1/products/add
app.use("/api/v1/cart", cartRoute);        //http://localhost:4000/api/v1/cart/add

app.listen(port, () => {
    connectDB();
    console.log(`Server is running on port ${port}`);
});

