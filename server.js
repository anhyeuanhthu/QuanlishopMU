const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { sql, connectDB } = require("./backend/db");

const app = express();
const reviewUploadDir = path.join(__dirname, "uploads", "reviews");

fs.mkdirSync(reviewUploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(__dirname));

async function ensureReviewImageColumn() {
    try {
        await sql.query`
            IF COL_LENGTH('Reviews', 'ImageUrl') IS NULL
            BEGIN
                ALTER TABLE Reviews ADD ImageUrl VARCHAR(255) NULL
            END
        `;
    } catch (err) {
        console.error("Review ImageUrl migration error:", err);
    }
}

connectDB().then(ensureReviewImageColumn);

const reviewImageUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, reviewUploadDir),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const random = crypto.randomBytes(6).toString("hex");
            cb(null, `review_${Date.now()}_${random}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP!"));
        }
        cb(null, true);
    }
}).single("reviewImage");

// ==================== AUTH ====================
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const result = await sql.query`
        SELECT * FROM Users
        WHERE Username = ${username} AND Password = ${password}
    `;

    if (result.recordset.length === 0)
        return res.json({ success: false });

    const user = result.recordset[0];

    res.json({
        success: true,
        user: user,
        isAdmin: user.Role === "admin"
    });
});

app.post("/register", async (req, res) => {
    const { username, email, password, gender, dob } = req.body;

    try {
        const check = await sql.query`
            SELECT * FROM Users WHERE Email = ${email}
        `;

        if (check.recordset.length > 0) {
            return res.json({ success: false, message: "Email đã tồn tại!" });
        }

        await sql.query`
            INSERT INTO Users (Username, Email, Password, Gender, Dob)
            VALUES (${username}, ${email}, ${password}, ${gender}, CONVERT(date, ${dob}))
        `;

        res.json({ success: true, message: "Đăng ký thành công!" });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
});

// ==================== USER PROFILE ====================
app.get("/user/:id", async (req, res) => {
    try {
        const result = await sql.query`
            SELECT Id, Username, Email, Gender, Dob
            FROM Users
            WHERE Id = ${req.params.id}
        `;
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.put("/user/update", async (req, res) => {
    const { id, username, email, gender, dob } = req.body;

    try {
        await sql.query`
            UPDATE Users
            SET 
                Username = ${username},
                Email = ${email},
                Gender = ${gender},
                Dob = CONVERT(date, ${dob})
            WHERE Id = ${id}
        `;
        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.put("/user/change-password", async (req, res) => {
    const { id, oldPass, newPass } = req.body;

    try {
        const check = await sql.query`
            SELECT * FROM Users
            WHERE Id = ${id} AND Password = ${oldPass}
        `;

        if (check.recordset.length === 0) {
            return res.json({ success: false, message: "Sai mật khẩu cũ" });
        }

        await sql.query`
            UPDATE Users
            SET Password = ${newPass}
            WHERE Id = ${id}
        `;

        res.json({ success: true });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get("/user/:id", async (req, res) => {
    const id = req.params.id;
    const result = await sql.query`
        SELECT * FROM Users WHERE Id = ${id}
    `;
    res.json(result.recordset[0]);
});

app.post("/updateProfile", async (req, res) => {
    const { id, username, email, dob } = req.body;

    try {
        await sql.query`
            UPDATE Users
            SET Username = ${username},
                Email = ${email},
                Dob = ${dob}
            WHERE Id = ${id}
        `;
        res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

app.post("/changePassword", async (req, res) => {
    const { id, oldPassword, newPassword } = req.body;

    try {
        const check = await sql.query`
            SELECT * FROM Users
            WHERE Id = ${id} AND Password = ${oldPassword}
        `;

        if (check.recordset.length === 0)
            return res.json({ success: false, message: "Mật khẩu cũ sai!" });

        await sql.query`
            UPDATE Users
            SET Password = ${newPassword}
            WHERE Id = ${id}
        `;

        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ==================== ORDERS (USER) ====================
app.get("/orders/:userId", async (req, res) => {
    const id = req.params.userId;
    const result = await sql.query`
        SELECT * FROM Orders WHERE UserId = ${id}
        ORDER BY OrderDate DESC
    `;
    res.json(result.recordset);
});

// ==================== ADMIN DASHBOARD ====================
app.get("/admin/revenue", async (req, res) => {
    const r = await sql.query`
        SELECT
            SUM(CASE WHEN DATEDIFF(day,OrderDate,GETDATE())=0 THEN Total ELSE 0 END) today,
            SUM(CASE WHEN DATEDIFF(week,OrderDate,GETDATE())=0 THEN Total ELSE 0 END) week,
            SUM(CASE WHEN DATEDIFF(month,OrderDate,GETDATE())=0 THEN Total ELSE 0 END) month,
            SUM(CASE WHEN DATEDIFF(year,OrderDate,GETDATE())=0 THEN Total ELSE 0 END) year
        FROM Orders
    `;
    res.json(r.recordset[0]);
});

app.get("/admin/orders", async (req, res) => {
    const r = await sql.query`SELECT * FROM Orders ORDER BY Id DESC`;
    res.json(r.recordset);
});

app.post("/admin/updateOrder", async (req, res) => {
    const { id, status } = req.body;
    await sql.query`UPDATE Orders SET Status=${status}, UpdatedAt=GETDATE() WHERE Id=${id}`;
    res.json({ ok: true });
});

// ==================== PRODUCTS MANAGEMENT ====================
app.get("/categories", async (req, res) => {
    try {
        const result = await sql.query`SELECT Id, Name FROM Categories ORDER BY Name`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/admin/products", async (req, res) => {
    try {
        const r = await sql.query(`
            SELECT 
                p.Id,
                p.Name,
                p.Price,
                c.Name AS Category,
                p.CategoryId,
                p.IsClothing,
                p.Quantity,
                p.Image,
                p.Description,
                ps.Size,
                ps.Quantity AS SizeQuantity
            FROM Products p
            LEFT JOIN Categories c ON p.CategoryId = c.Id
            LEFT JOIN ProductSizes ps ON p.Id = ps.ProductId
            ORDER BY p.Id
        `);
        res.json(r.recordset);
    } catch (err) {
        console.error("Lỗi /admin/products:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/admin/addProduct", async (req, res) => {
    const { name, price, categoryId, isClothing, image, description, quantity, sizes } = req.body;
    if (!name || !price) {
        return res.json({ success: false, message: "Thiếu tên hoặc giá sản phẩm!" });
    }

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        const insertResult = await request
            .input("name", sql.NVarChar(200), name)
            .input("price", sql.Float, price)
            .input("categoryId", sql.Int, categoryId || null)
            .input("isClothing", sql.Bit, isClothing || 0)
            .input("image", sql.NVarChar(255), image || '')
            .input("description", sql.NVarChar(sql.MAX), description || '')
            .input("quantity", sql.Int, quantity || 0)
            .query(`
                INSERT INTO Products (Name, Price, CategoryId, IsClothing, Image, Description, Quantity, DiscountPercent)
                OUTPUT INSERTED.Id
                VALUES (@name, @price, @categoryId, @isClothing, @image, @description, @quantity, 0)
            `);
        const productId = insertResult.recordset[0].Id;

        if (isClothing == 1 && sizes && Array.isArray(sizes)) {
            for (let s of sizes) {
                if (s.quantity > 0) {
                    await new sql.Request(transaction)
                        .input("productId", sql.Int, productId)
                        .input("size", sql.NVarChar(10), s.size)
                        .input("qty", sql.Int, s.quantity)
                        .query(`
                            INSERT INTO ProductSizes (ProductId, Size, Quantity)
                            VALUES (@productId, @size, @qty)
                        `);
                }
            }
        }
        await transaction.commit();
        res.json({ success: true, message: "Thêm sản phẩm thành công!", productId });
    } catch (err) {
        await transaction.rollback();
        console.error("Add product error:", err);
        res.json({ success: false, message: err.message });
    }
});

app.post("/admin/updateProduct", async (req, res) => {
    const { id, name, price, categoryId, isClothing, image, description, quantity, sizes } = req.body;
    if (!id || !name || !price) {
        return res.json({ success: false, message: "Thiếu thông tin sản phẩm!" });
    }

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        await request
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar(200), name)
            .input("price", sql.Float, price)
            .input("categoryId", sql.Int, categoryId || null)
            .input("isClothing", sql.Bit, isClothing || 0)
            .input("image", sql.NVarChar(255), image || '')
            .input("description", sql.NVarChar(sql.MAX), description || '')
            .input("quantity", sql.Int, quantity || 0)
            .query(`
                UPDATE Products
                SET Name = @name,
                    Price = @price,
                    CategoryId = @categoryId,
                    IsClothing = @isClothing,
                    Image = @image,
                    Description = @description,
                    Quantity = @quantity
                WHERE Id = @id
            `);

        await new sql.Request(transaction)
            .input("productId", sql.Int, id)
            .query(`DELETE FROM ProductSizes WHERE ProductId = @productId`);

        if (isClothing == 1 && sizes && Array.isArray(sizes)) {
            for (let s of sizes) {
                if (s.quantity > 0) {
                    await new sql.Request(transaction)
                        .input("productId", sql.Int, id)
                        .input("size", sql.NVarChar(10), s.size)
                        .input("qty", sql.Int, s.quantity)
                        .query(`
                            INSERT INTO ProductSizes (ProductId, Size, Quantity)
                            VALUES (@productId, @size, @qty)
                        `);
                }
            }
        }
        await transaction.commit();
        res.json({ success: true, message: "Cập nhật sản phẩm thành công!" });
    } catch (err) {
        await transaction.rollback();
        console.error("Update product error:", err);
        res.json({ success: false, message: err.message });
    }
});

app.post("/admin/deleteProduct", async (req, res) => {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "Thiếu ID sản phẩm!" });

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();

        // Xóa các size liên quan (nếu có) – dùng request riêng
        const req1 = new sql.Request(transaction);
        await req1.input("id", sql.Int, id).query(`DELETE FROM ProductSizes WHERE ProductId = @id`);

        // Xóa sản phẩm – dùng request riêng
        const req2 = new sql.Request(transaction);
        await req2.input("id", sql.Int, id).query(`DELETE FROM Products WHERE Id = @id`);

        await transaction.commit();
        res.json({ success: true, message: "Đã xóa sản phẩm!" });
    } catch (err) {
        await transaction.rollback();
        console.error("Delete product error:", err);
        res.json({ success: false, message: err.message });
    }
});

// ==================== PRODUCT DETAIL ====================
app.get("/product/:id", async (req, res) => {
    const id = req.params.id;
    const product = await sql.query`SELECT * FROM Products WHERE Id = ${id}`;
    const sizes = await sql.query`SELECT Size, Quantity FROM ProductSizes WHERE ProductId = ${id}`;
    res.json({
        product: product.recordset[0],
        sizes: sizes.recordset
    });
});

// ==================== CREATE ORDER ====================
app.post("/createOrder", async (req, res) => {
    const { userId, items, total, customerName, phone, email, address, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        console.error("❌ Order rejected: no items");
        return res.json({ success: false, message: "Giỏ hàng trống, không thể đặt hàng!" });
    }
    for (const item of items) {
        if (!item.id || !item.name || !item.price || !item.quantity) {
            console.error("❌ Invalid item:", item);
            return res.json({ success: false, message: "Dữ liệu sản phẩm không hợp lệ!" });
        }
    }

    const transaction = new sql.Transaction();
    try {
        await transaction.begin();
        const orderRequest = new sql.Request(transaction);
        const orderResult = await orderRequest
            .input("userId", sql.Int, userId)
            .input("total", sql.Decimal(18, 2), total)
            .input("customerName", sql.NVarChar(100), customerName)
            .input("phone", sql.NVarChar(20), phone)
            .input("address", sql.NVarChar(255), address)
            .input("paymentMethod", sql.NVarChar(50), paymentMethod)
            .input("email", sql.NVarChar(100), email)
            .query(`
                INSERT INTO Orders
                (UserId, OrderDate, Total, Status, CustomerName, Phone, Address, PaymentMethod, Note, Email)
                OUTPUT INSERTED.Id
                VALUES
                (@userId, GETDATE(), @total, 'Pending', @customerName, @phone, @address, @paymentMethod, NULL, @email)
            `);
        const orderId = orderResult.recordset[0].Id;

        for (let item of items) {
            const sizeVal = (item.size && item.size !== 'null' && item.size.trim()) ? item.size : null;
            await new sql.Request(transaction)
                .input("orderId", sql.Int, orderId)
                .input("productId", sql.Int, item.id)
                .input("productName", sql.NVarChar(255), item.name)
                .input("price", sql.Decimal(18, 2), item.price)
                .input("size", sql.NVarChar(10), sizeVal)
                .input("quantity", sql.Int, item.quantity)
                .input("image", sql.NVarChar(500), item.image || '')
                .query(`
                    INSERT INTO OrderDetails (OrderId, ProductId, ProductName, Price, Size, Quantity, Image)
                    VALUES (@orderId, @productId, @productName, @price, @size, @quantity, @image)
                `);
        }

        for (let item of items) {
            const hasSize = item.size && item.size !== 'null' && item.size !== 'undefined' && item.size.trim() !== '';
            if (hasSize) {
                const stockCheck = await new sql.Request(transaction)
                    .input("pid", sql.Int, item.id)
                    .input("size", sql.NVarChar(10), item.size)
                    .query(`SELECT Quantity FROM ProductSizes WHERE ProductId = @pid AND Size = @size`);
                if (stockCheck.recordset.length === 0) {
                    throw new Error(`Sản phẩm ${item.name} size ${item.size} không tồn tại trong kho!`);
                }
                const currentStock = stockCheck.recordset[0].Quantity;
                if (currentStock < item.quantity) {
                    throw new Error(`Sản phẩm ${item.name} size ${item.size} chỉ còn ${currentStock} sản phẩm!`);
                }
                await new sql.Request(transaction)
                    .input("pid", sql.Int, item.id)
                    .input("size", sql.NVarChar(10), item.size)
                    .input("qty", sql.Int, item.quantity)
                    .query(`UPDATE ProductSizes SET Quantity = Quantity - @qty WHERE ProductId = @pid AND Size = @size`);
            } else {
                const stockCheck = await new sql.Request(transaction)
                    .input("pid", sql.Int, item.id)
                    .query(`SELECT Quantity FROM Products WHERE Id = @pid`);
                if (stockCheck.recordset.length === 0) {
                    throw new Error(`Sản phẩm ${item.name} không tồn tại trong kho!`);
                }
                const currentStock = stockCheck.recordset[0].Quantity;
                if (currentStock < item.quantity) {
                    throw new Error(`Sản phẩm ${item.name} chỉ còn ${currentStock} sản phẩm!`);
                }
                await new sql.Request(transaction)
                    .input("pid", sql.Int, item.id)
                    .input("qty", sql.Int, item.quantity)
                    .query(`UPDATE Products SET Quantity = Quantity - @qty WHERE Id = @pid`);
            }
        }

        await transaction.commit();
        res.json({ success: true, orderId: orderId });
    } catch (err) {
        await transaction.rollback();
        console.error("CreateOrder error:", err);
        res.json({ success: false, message: err.message });
    }
});

// ==================== ORDER DETAIL ====================
app.get("/order/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orderRes = await sql.query`SELECT * FROM Orders WHERE Id = ${orderId}`;
        if (orderRes.recordset.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
        const order = orderRes.recordset[0];
        const detailRes = await sql.query`
            SELECT od.Id, od.OrderId, od.ProductId, od.Quantity, od.Price,
                   p.Name AS ProductName, p.Image AS Image
            FROM OrderDetails od
            LEFT JOIN Products p ON od.ProductId = p.Id
            WHERE od.OrderId = ${orderId}
        `;
        order.items = detailRes.recordset;
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== SEARCH ====================
app.get("/search", async (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) return res.json([]);
    try {
        const result = await sql.query`
            SELECT TOP 20
                p.Id, p.Name, p.Price, p.Image, p.DiscountPercent, p.CategoryId, p.IsClothing,
                c.Name AS Category
            FROM Products p
            LEFT JOIN Categories c ON p.CategoryId = c.Id
            WHERE p.Name LIKE ${"%" + q + "%"}
            ORDER BY CASE WHEN p.Name LIKE ${q + "%"} THEN 0 ELSE 1 END, p.Name ASC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

// ==================== REVIEWS ====================
app.get("/products/list", async (req, res) => {
    try {
        const r = await sql.query`SELECT Id, Name FROM Products ORDER BY Name ASC`;
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/reviews", async (req, res) => {
    try {
        const r = await sql.query`
            SELECT rv.Id, rv.Rating, rv.Content, rv.Reply, rv.ImageUrl, rv.CreatedAt, u.Username, p.Name AS ProductName
            FROM Reviews rv
            LEFT JOIN Users u ON rv.UserId = u.Id
            LEFT JOIN Products p ON rv.ProductId = p.Id
            ORDER BY rv.CreatedAt DESC
        `;
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/reviews", (req, res) => {
    reviewImageUpload(req, res, async (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ success: false, message: uploadErr.message });
        }

        const { userId, productId, rating, content } = req.body;
        const ratingNum = Number(rating);
        const productIdNum = Number(productId);
        const userIdNum = Number(userId);
        const imageUrl = req.file ? `/uploads/reviews/${req.file.filename}` : null;

        if (!userIdNum || !productIdNum || !ratingNum || !content) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.json({ success: false, message: "Thiếu thông tin đánh giá!" });
        }
        if (ratingNum < 1 || ratingNum > 5) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.json({ success: false, message: "Số sao không hợp lệ!" });
        }
        try {
            const existing = await sql.query`
                SELECT Id FROM Reviews WHERE UserId = ${userIdNum} AND ProductId = ${productIdNum}
            `;
            if (existing.recordset.length > 0) {
                if (req.file) fs.unlink(req.file.path, () => {});
                return res.json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi!" });
            }
            await sql.query`
                INSERT INTO Reviews (UserId, ProductId, Rating, Content, ImageUrl, CreatedAt)
                VALUES (${userIdNum}, ${productIdNum}, ${ratingNum}, ${content}, ${imageUrl}, GETDATE())
            `;
            res.json({ success: true, imageUrl });
        } catch (err) {
            if (req.file) fs.unlink(req.file.path, () => {});
            console.error("Review error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    });
});

app.get("/admin/reviews", async (req, res) => {
    try {
        const r = await sql.query`
            SELECT rv.Id, rv.Rating, rv.Content, rv.Reply, rv.ImageUrl, rv.CreatedAt, u.Username, p.Name AS ProductName
            FROM Reviews rv
            LEFT JOIN Users u ON rv.UserId = u.Id
            LEFT JOIN Products p ON rv.ProductId = p.Id
            ORDER BY rv.CreatedAt DESC
        `;
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/admin/replyReview", async (req, res) => {
    const { id, reply } = req.body;
    if (!id || !reply) {
        return res.status(400).json({ ok: false, message: "Thiếu id hoặc nội dung!" });
    }
    try {
        await sql.query`
            UPDATE Reviews SET Reply = ${reply}, RepliedAt = GETDATE() WHERE Id = ${id}
        `;
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

// ==================== START SERVER ====================
app.listen(8888, () => {
    console.log("🚀 Server running at http://localhost:8888");
});
