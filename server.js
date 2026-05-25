const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
require("dotenv").config();
const nodemailer = require("nodemailer");
const { sql, connectDB } = require("./backend/db");

const app = express();
const reviewUploadDir = path.join(__dirname, "uploads", "reviews");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

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

async function ensureContactsTable() {
    try {
        await sql.query`
            IF OBJECT_ID('Contacts', 'U') IS NULL
            BEGIN
                CREATE TABLE Contacts (
                    Id INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(100),
                    Email NVARCHAR(100),
                    Phone NVARCHAR(20),
                    Content NVARCHAR(MAX),
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    Replied BIT DEFAULT 0
                )
            END
            ELSE IF COL_LENGTH('Contacts', 'Replied') IS NULL
            BEGIN
                ALTER TABLE Contacts ADD Replied BIT DEFAULT 0
            END
        `;
    } catch (err) {
        console.error("Contacts migration error:", err);
    }
}

async function ensureCouponTables() {
    try {
        await sql.query`
            IF OBJECT_ID('Coupons', 'U') IS NULL
            BEGIN
                CREATE TABLE Coupons (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    Code VARCHAR(50) COLLATE Latin1_General_BIN2 NOT NULL UNIQUE,
                    Title NVARCHAR(255) NULL,
                    Description NVARCHAR(MAX) NULL,
                    DiscountType VARCHAR(20) NOT NULL,
                    DiscountValue DECIMAL(18,2) NOT NULL,
                    MaxDiscountAmount DECIMAL(18,2) NULL,
                    MinOrderAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
                    MaxOrderAmount DECIMAL(18,2) NULL,
                    StartDate DATETIME NOT NULL,
                    EndDate DATETIME NOT NULL,
                    MaxTotalUsage INT NOT NULL DEFAULT 1,
                    MaxUsagePerCustomer INT NOT NULL DEFAULT 1,
                    CurrentUsage INT NOT NULL DEFAULT 0,
                    ApplicableTo VARCHAR(20) NOT NULL DEFAULT 'all',
                    ApplicableCategories NVARCHAR(MAX) NULL,
                    IsActive BIT NOT NULL DEFAULT 1,
                    IsVisible BIT NOT NULL DEFAULT 1,
                    CreatedBy INT NULL,
                    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT CK_Coupons_DiscountType CHECK (DiscountType IN ('percentage', 'fixed')),
                    CONSTRAINT CK_Coupons_ApplicableTo CHECK (ApplicableTo IN ('all', 'new_customer')),
                    CONSTRAINT CK_Coupons_Dates CHECK (StartDate < EndDate),
                    CONSTRAINT CK_Coupons_Values CHECK (DiscountValue > 0 AND MaxTotalUsage > 0 AND MaxUsagePerCustomer > 0 AND CurrentUsage >= 0)
                )
                CREATE INDEX IX_Coupons_Code ON Coupons(Code)
                CREATE INDEX IX_Coupons_EndDate ON Coupons(EndDate)
                CREATE INDEX IX_Coupons_ActiveVisible ON Coupons(IsActive, IsVisible)
            END

            IF OBJECT_ID('CustomerCoupons', 'U') IS NULL
            BEGIN
                CREATE TABLE CustomerCoupons (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT NOT NULL,
                    CouponId INT NOT NULL,
                    UsageCount INT NOT NULL DEFAULT 0,
                    ObtainedAt DATETIME NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT UQ_CustomerCoupons_UserCoupon UNIQUE (UserId, CouponId),
                    CONSTRAINT FK_CustomerCoupons_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_CustomerCoupons_Coupon FOREIGN KEY (CouponId) REFERENCES Coupons(Id) ON DELETE CASCADE,
                    CONSTRAINT CK_CustomerCoupons_Usage CHECK (UsageCount >= 0)
                )
                CREATE INDEX IX_CustomerCoupons_UserId ON CustomerCoupons(UserId)
                CREATE INDEX IX_CustomerCoupons_CouponId ON CustomerCoupons(CouponId)
            END

            IF OBJECT_ID('CouponUsage', 'U') IS NULL
            BEGIN
                CREATE TABLE CouponUsage (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    CouponId INT NOT NULL,
                    UserId INT NOT NULL,
                    OrderId INT NOT NULL,
                    DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
                    UsedAt DATETIME NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT FK_CouponUsage_Coupon FOREIGN KEY (CouponId) REFERENCES Coupons(Id),
                    CONSTRAINT FK_CouponUsage_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_CouponUsage_Order FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
                    CONSTRAINT CK_CouponUsage_Discount CHECK (DiscountAmount >= 0)
                )
                CREATE INDEX IX_CouponUsage_CouponUser ON CouponUsage(CouponId, UserId)
                CREATE INDEX IX_CouponUsage_OrderId ON CouponUsage(OrderId)
            END

            IF COL_LENGTH('Orders', 'CouponId') IS NULL
                ALTER TABLE Orders ADD CouponId INT NULL
            IF COL_LENGTH('Orders', 'CouponCode') IS NULL
                ALTER TABLE Orders ADD CouponCode VARCHAR(50) COLLATE Latin1_General_BIN2 NULL
            IF COL_LENGTH('Orders', 'DiscountAmount') IS NULL
                ALTER TABLE Orders ADD DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0
        `;
    } catch (err) {
        console.error("Coupon migration error:", err);
    }
}

connectDB().then(async () => {
    await ensureReviewImageColumn();
    await ensureContactsTable();
    await ensureCouponTables();
});

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

function toMoney(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function calculateDiscount(coupon, orderTotal) {
    const base = Math.max(0, toMoney(orderTotal));
    let discount = 0;
    if (coupon.DiscountType === "percentage") {
        discount = Math.floor(base * toMoney(coupon.DiscountValue) / 100);
        if (coupon.MaxDiscountAmount != null) {
            discount = Math.min(discount, toMoney(coupon.MaxDiscountAmount));
        }
    } else {
        discount = toMoney(coupon.DiscountValue);
    }
    return Math.min(Math.max(0, discount), base);
}

function htmlEscape(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatVnd(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function paymentLabel(method) {
    const map = {
        cod: "COD",
        banking: "Banking",
        momo: "Momo",
        zalopay: "ZaloPay"
    };
    return map[String(method || "").toLowerCase()] || method || "-";
}

function paymentStatus(method) {
    return String(method || "").toLowerCase() === "cod"
        ? "Chưa thanh toán (Trả khi nhận hàng)"
        : "Đã thanh toán ✅";
}

async function validateCouponForUser(request, { code, userId, orderTotal }) {
    const couponResult = await request
        .input("couponCode", sql.VarChar(50), code)
        .query(`
            SELECT TOP 1 *
            FROM Coupons
            WHERE Code = @couponCode
        `);

    if (couponResult.recordset.length === 0) {
        return { valid: false, status: 404, message: "Ma khong ton tai" };
    }

    const coupon = couponResult.recordset[0];
    const now = new Date();
    const total = toMoney(orderTotal);

    if (!coupon.IsActive) return { valid: false, status: 400, message: "Ma da bi vo hieu hoa" };
    if (now < new Date(coupon.StartDate)) return { valid: false, status: 400, message: "Ma chua den thoi gian su dung" };
    if (now > new Date(coupon.EndDate)) return { valid: false, status: 400, message: "Ma da het han" };
    if (coupon.CurrentUsage >= coupon.MaxTotalUsage) return { valid: false, status: 400, message: "Ma da het luot" };
    if (total < toMoney(coupon.MinOrderAmount)) {
        return { valid: false, status: 400, message: `Don hang phai tu ${Number(coupon.MinOrderAmount).toLocaleString("vi-VN")}d` };
    }
    if (coupon.MaxOrderAmount != null && total > toMoney(coupon.MaxOrderAmount)) {
        return { valid: false, status: 400, message: `Don hang khong duoc vuot qua ${Number(coupon.MaxOrderAmount).toLocaleString("vi-VN")}d` };
    }

    const usageResult = await request
        .input("couponIdForUsage", sql.Int, coupon.Id)
        .input("couponUserId", sql.Int, userId)
        .query(`
            SELECT ISNULL(SUM(UsageCount), 0) AS UsedCount
            FROM CustomerCoupons
            WHERE CouponId = @couponIdForUsage AND UserId = @couponUserId
        `);
    const userUsed = usageResult.recordset[0]?.UsedCount || 0;
    if (userUsed >= coupon.MaxUsagePerCustomer) {
        return { valid: false, status: 400, message: "Ban da dung het luot cho ma nay" };
    }

    if (coupon.ApplicableTo === "new_customer") {
        const oldOrders = await request
            .input("newCustomerUserId", sql.Int, userId)
            .query(`SELECT COUNT(*) AS OrderCount FROM Orders WHERE UserId = @newCustomerUserId`);
        if ((oldOrders.recordset[0]?.OrderCount || 0) > 0) {
            return { valid: false, status: 400, message: "Ma chi ap dung cho khach hang moi" };
        }
    }

    return { valid: true, coupon, discountAmount: calculateDiscount(coupon, total) };
}

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

// ==================== COUPONS ====================
app.get("/api/admin/coupons", async (_req, res) => {
    try {
        const r = await sql.query(`
            SELECT c.*,
                   ISNULL(u.TotalDiscount, 0) AS TotalDiscount,
                   ISNULL(u.CustomerCount, 0) AS CustomerCount
            FROM Coupons c
            OUTER APPLY (
                SELECT SUM(DiscountAmount) AS TotalDiscount, COUNT(DISTINCT UserId) AS CustomerCount
                FROM CouponUsage
                WHERE CouponId = c.Id
            ) u
            ORDER BY c.Id DESC
        `);
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/admin/coupons/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const r = await sql.query`
            SELECT c.*,
                   ISNULL((SELECT SUM(DiscountAmount) FROM CouponUsage WHERE CouponId = c.Id), 0) AS TotalDiscount,
                   ISNULL((SELECT COUNT(*) FROM CouponUsage WHERE CouponId = c.Id), 0) AS UsageRows
            FROM Coupons c
            WHERE c.Id = ${id}
        `;
        if (!r.recordset.length) return res.status(404).json({ success: false, message: "Khong tim thay ma" });
        res.json(r.recordset[0]);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/admin/coupons", async (req, res) => {
    try {
        const b = req.body;
        if (!b.code || !b.discount_type || !b.discount_value || !b.start_date || !b.end_date) {
            return res.status(400).json({ success: false, message: "Thieu thong tin bat buoc" });
        }
        if (!["percentage", "fixed"].includes(b.discount_type)) {
            return res.status(400).json({ success: false, message: "Loai giam gia khong hop le" });
        }
        if (new Date(b.start_date) >= new Date(b.end_date)) {
            return res.status(400).json({ success: false, message: "Ngay ket thuc phai sau ngay bat dau" });
        }

        const result = await new sql.Request()
            .input("code", sql.VarChar(50), b.code)
            .input("title", sql.NVarChar(255), b.title || null)
            .input("description", sql.NVarChar(sql.MAX), b.description || null)
            .input("discountType", sql.VarChar(20), b.discount_type)
            .input("discountValue", sql.Decimal(18, 2), toMoney(b.discount_value))
            .input("maxDiscountAmount", sql.Decimal(18, 2), b.max_discount_amount ? toMoney(b.max_discount_amount) : null)
            .input("minOrderAmount", sql.Decimal(18, 2), toMoney(b.min_order_amount))
            .input("maxOrderAmount", sql.Decimal(18, 2), b.max_order_amount ? toMoney(b.max_order_amount) : null)
            .input("startDate", sql.DateTime, new Date(b.start_date))
            .input("endDate", sql.DateTime, new Date(b.end_date))
            .input("maxTotalUsage", sql.Int, Number(b.max_total_usage) || 1)
            .input("maxUsagePerCustomer", sql.Int, Number(b.max_usage_per_customer) || 1)
            .input("applicableTo", sql.VarChar(20), b.applicable_to || "all")
            .input("applicableCategories", sql.NVarChar(sql.MAX), b.applicable_categories ? JSON.stringify(b.applicable_categories) : null)
            .input("isActive", sql.Bit, b.is_active !== false)
            .input("isVisible", sql.Bit, b.is_visible !== false)
            .input("createdBy", sql.Int, b.created_by || null)
            .query(`
                INSERT INTO Coupons
                (Code, Title, Description, DiscountType, DiscountValue, MaxDiscountAmount,
                 MinOrderAmount, MaxOrderAmount, StartDate, EndDate, MaxTotalUsage,
                 MaxUsagePerCustomer, ApplicableTo, ApplicableCategories, IsActive, IsVisible, CreatedBy)
                OUTPUT INSERTED.Id
                VALUES
                (@code, @title, @description, @discountType, @discountValue, @maxDiscountAmount,
                 @minOrderAmount, @maxOrderAmount, @startDate, @endDate, @maxTotalUsage,
                 @maxUsagePerCustomer, @applicableTo, @applicableCategories, @isActive, @isVisible, @createdBy)
            `);
        res.json({ success: true, id: result.recordset[0].Id });
    } catch (err) {
        const status = err.number === 2627 ? 409 : 500;
        res.status(status).json({ success: false, message: err.number === 2627 ? "Ma coupon da ton tai" : err.message });
    }
});

app.put("/api/admin/coupons/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const b = req.body;
        if (new Date(b.start_date) >= new Date(b.end_date)) {
            return res.status(400).json({ success: false, message: "Ngay ket thuc phai sau ngay bat dau" });
        }
        await new sql.Request()
            .input("id", sql.Int, id)
            .input("code", sql.VarChar(50), b.code)
            .input("title", sql.NVarChar(255), b.title || null)
            .input("description", sql.NVarChar(sql.MAX), b.description || null)
            .input("discountType", sql.VarChar(20), b.discount_type)
            .input("discountValue", sql.Decimal(18, 2), toMoney(b.discount_value))
            .input("maxDiscountAmount", sql.Decimal(18, 2), b.max_discount_amount ? toMoney(b.max_discount_amount) : null)
            .input("minOrderAmount", sql.Decimal(18, 2), toMoney(b.min_order_amount))
            .input("maxOrderAmount", sql.Decimal(18, 2), b.max_order_amount ? toMoney(b.max_order_amount) : null)
            .input("startDate", sql.DateTime, new Date(b.start_date))
            .input("endDate", sql.DateTime, new Date(b.end_date))
            .input("maxTotalUsage", sql.Int, Number(b.max_total_usage) || 1)
            .input("maxUsagePerCustomer", sql.Int, Number(b.max_usage_per_customer) || 1)
            .input("applicableTo", sql.VarChar(20), b.applicable_to || "all")
            .input("applicableCategories", sql.NVarChar(sql.MAX), b.applicable_categories ? JSON.stringify(b.applicable_categories) : null)
            .input("isActive", sql.Bit, !!b.is_active)
            .input("isVisible", sql.Bit, !!b.is_visible)
            .query(`
                UPDATE Coupons SET
                    Code = @code, Title = @title, Description = @description,
                    DiscountType = @discountType, DiscountValue = @discountValue,
                    MaxDiscountAmount = @maxDiscountAmount, MinOrderAmount = @minOrderAmount,
                    MaxOrderAmount = @maxOrderAmount, StartDate = @startDate, EndDate = @endDate,
                    MaxTotalUsage = @maxTotalUsage, MaxUsagePerCustomer = @maxUsagePerCustomer,
                    ApplicableTo = @applicableTo, ApplicableCategories = @applicableCategories,
                    IsActive = @isActive, IsVisible = @isVisible, UpdatedAt = GETDATE()
                WHERE Id = @id
            `);
        res.json({ success: true });
    } catch (err) {
        const status = err.number === 2627 ? 409 : 500;
        res.status(status).json({ success: false, message: err.number === 2627 ? "Ma coupon da ton tai" : err.message });
    }
});

app.delete("/api/admin/coupons/:id", async (req, res) => {
    try {
        await sql.query`DELETE FROM Coupons WHERE Id = ${Number(req.params.id)}`;
        res.json({ success: true });
    } catch (_err) {
        res.status(500).json({ success: false, message: "Khong the xoa ma da phat sinh su dung. Hay disable thay vi xoa." });
    }
});

app.get("/api/coupons", async (_req, res) => {
    try {
        const r = await sql.query(`
            SELECT *
            FROM Coupons
            WHERE IsActive = 1
              AND IsVisible = 1
              AND StartDate <= GETDATE()
              AND EndDate >= GETDATE()
              AND CurrentUsage < MaxTotalUsage
            ORDER BY EndDate ASC
        `);
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/coupons/validate", async (req, res) => {
    try {
        const { code, user_id, order_total } = req.body;
        const result = await validateCouponForUser(new sql.Request(), { code, userId: user_id, orderTotal: order_total });
        if (!result.valid) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, coupon: result.coupon, discount_amount: result.discountAmount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/coupons/claim", async (req, res) => {
    try {
        const { user_id, coupon_id } = req.body;
        const available = await sql.query`
            SELECT * FROM Coupons
            WHERE Id = ${Number(coupon_id)}
              AND IsActive = 1
              AND IsVisible = 1
              AND StartDate <= GETDATE()
              AND EndDate >= GETDATE()
              AND CurrentUsage < MaxTotalUsage
        `;
        if (!available.recordset.length) return res.status(400).json({ success: false, message: "Ma khong kha dung" });
        await sql.query`
            INSERT INTO CustomerCoupons (UserId, CouponId)
            VALUES (${Number(user_id)}, ${Number(coupon_id)})
        `;
        res.json({ success: true, message: "Da nhan ma" });
    } catch (err) {
        const status = err.number === 2627 ? 409 : 500;
        res.status(status).json({ success: false, message: err.number === 2627 ? "Ban da nhan ma nay roi" : err.message });
    }
});

app.get("/api/customers/:userId/coupons", async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const r = await sql.query`
            SELECT cc.Id AS CustomerCouponId, cc.UsageCount, cc.ObtainedAt,
                   c.*
            FROM CustomerCoupons cc
            JOIN Coupons c ON c.Id = cc.CouponId
            WHERE cc.UserId = ${userId}
              AND c.IsActive = 1
              AND c.EndDate >= GETDATE()
            ORDER BY cc.ObtainedAt DESC
        `;
        res.json(r.recordset);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
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
    const { userId, items, total, customerName, phone, email, address, paymentMethod, shippingFee, couponCode } = req.body;

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
        const itemsSubtotal = items.reduce((sum, item) => sum + (toMoney(item.price) * toMoney(item.quantity)), 0);
        const ship = Math.max(0, toMoney(shippingFee, Math.max(0, toMoney(total) - itemsSubtotal)));
        let finalTotal = itemsSubtotal + ship;
        let appliedCoupon = null;
        let discountAmount = 0;

        if (couponCode) {
            const validation = await validateCouponForUser(new sql.Request(transaction), {
                code: couponCode,
                userId,
                orderTotal: itemsSubtotal
            });
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            appliedCoupon = validation.coupon;
            discountAmount = validation.discountAmount;
            finalTotal = Math.max(0, itemsSubtotal + ship - discountAmount);
        }

        const orderRequest = new sql.Request(transaction);
        const orderResult = await orderRequest
            .input("userId", sql.Int, userId)
            .input("total", sql.Decimal(18, 2), finalTotal)
            .input("customerName", sql.NVarChar(100), customerName)
            .input("phone", sql.NVarChar(20), phone)
            .input("address", sql.NVarChar(255), address)
            .input("paymentMethod", sql.NVarChar(50), paymentMethod)
            .input("email", sql.NVarChar(100), email)
            .input("couponId", sql.Int, appliedCoupon ? appliedCoupon.Id : null)
            .input("couponCode", sql.VarChar(50), appliedCoupon ? appliedCoupon.Code : null)
            .input("discountAmount", sql.Decimal(18, 2), discountAmount)
            .query(`
                INSERT INTO Orders
                (UserId, OrderDate, Total, Status, CustomerName, Phone, Address, PaymentMethod, Note, Email, CouponId, CouponCode, DiscountAmount)
                OUTPUT INSERTED.Id
                VALUES
                (@userId, GETDATE(), @total, 'Pending', @customerName, @phone, @address, @paymentMethod, NULL, @email, @couponId, @couponCode, @discountAmount)
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

        if (appliedCoupon) {
            await new sql.Request(transaction)
                .input("couponId", sql.Int, appliedCoupon.Id)
                .query(`UPDATE Coupons SET CurrentUsage = CurrentUsage + 1, UpdatedAt = GETDATE() WHERE Id = @couponId`);

            await new sql.Request(transaction)
                .input("userId", sql.Int, userId)
                .input("couponId", sql.Int, appliedCoupon.Id)
                .query(`
                    IF EXISTS (SELECT 1 FROM CustomerCoupons WHERE UserId = @userId AND CouponId = @couponId)
                        UPDATE CustomerCoupons SET UsageCount = UsageCount + 1 WHERE UserId = @userId AND CouponId = @couponId
                    ELSE
                        INSERT INTO CustomerCoupons (UserId, CouponId, UsageCount) VALUES (@userId, @couponId, 1)
                `);

            await new sql.Request(transaction)
                .input("couponId", sql.Int, appliedCoupon.Id)
                .input("userId", sql.Int, userId)
                .input("orderId", sql.Int, orderId)
                .input("discountAmount", sql.Decimal(18, 2), discountAmount)
                .query(`
                    INSERT INTO CouponUsage (CouponId, UserId, OrderId, DiscountAmount)
                    VALUES (@couponId, @userId, @orderId, @discountAmount)
                `);
        }

        await transaction.commit();
        res.json({ success: true, orderId: orderId, total: finalTotal, discountAmount });
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
                   COALESCE(od.ProductName, p.Name) AS ProductName,
                   od.Size,
                   COALESCE(NULLIF(od.Image, ''), p.Image) AS Image
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

app.get("/invoice/:orderId", async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);
        const userId = req.query.userId ? Number(req.query.userId) : null;

        const orderRequest = new sql.Request().input("orderId", sql.Int, orderId);
        let orderQuery = "SELECT * FROM Orders WHERE Id = @orderId";
        if (userId) {
            orderRequest.input("userId", sql.Int, userId);
            orderQuery += " AND UserId = @userId";
        }

        const orderRes = await orderRequest.query(orderQuery);
        if (orderRes.recordset.length === 0) {
            return res.status(404).send("Không tìm thấy hóa đơn");
        }

        const order = orderRes.recordset[0];
        const detailRes = await new sql.Request()
            .input("orderId", sql.Int, orderId)
            .query(`
                SELECT ProductName, Price, Size, Quantity
                FROM OrderDetails
                WHERE OrderId = @orderId
                ORDER BY Id ASC
            `);

        const items = detailRes.recordset;
        const subtotal = items.reduce((sum, item) => sum + Number(item.Price || 0) * Number(item.Quantity || 0), 0);
        const discount = Number(order.DiscountAmount || 0);
        const total = Number(order.Total || 0);
        const shippingFee = Math.max(0, total + discount - subtotal);
        const orderDate = order.OrderDate ? new Date(order.OrderDate).toLocaleString("vi-VN") : "-";
        const couponText = order.CouponCode ? ` (${htmlEscape(order.CouponCode)})` : "";

        const itemRows = items.map(item => {
            const quantity = Number(item.Quantity || 0);
            const price = Number(item.Price || 0);
            return `
                <tr>
                    <td>${htmlEscape(item.ProductName)}</td>
                    <td class="center">${htmlEscape(item.Size || "-")}</td>
                    <td class="center">${quantity}x</td>
                    <td class="right">${formatVnd(price)}</td>
                    <td class="right">${formatVnd(price * quantity)}</td>
                </tr>`;
        }).join("");

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn ORD-${order.Id}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #f4f4f4; font-family: Consolas, "Courier New", monospace; color: #111; }
        .toolbar { position: sticky; top: 0; padding: 12px; background: #fff; border-bottom: 1px solid #ddd; text-align: center; }
        .toolbar button { padding: 10px 16px; border: 0; border-radius: 6px; background: #d71920; color: #fff; font-weight: 700; cursor: pointer; }
        .invoice { width: 620px; max-width: calc(100% - 24px); margin: 20px auto; padding: 26px; background: #fff; border: 1px solid #ddd; }
        .line { border-top: 3px double #111; margin: 10px 0; }
        .thin { border-top: 1px dashed #555; margin: 14px 0; }
        h1, .tagline, .thanks { text-align: center; margin: 0; }
        h1 { font-size: 28px; letter-spacing: 1px; }
        .tagline { font-size: 13px; }
        .meta, .customer { line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
        th, td { padding: 7px 8px; vertical-align: top; }
        th { text-align: left; border-bottom: 1px solid #333; }
        th:first-child, td:first-child { padding-left: 0; }
        th:nth-child(2), td:nth-child(2) { width: 48px; }
        th:nth-child(3), td:nth-child(3) { width: 48px; }
        th:nth-child(4), td:nth-child(4) { width: 118px; padding-right: 18px; white-space: nowrap; }
        th:nth-child(5), td:nth-child(5) { width: 128px; padding-left: 18px; padding-right: 0; white-space: nowrap; }
        .center { text-align: center; }
        .right { text-align: right; }
        .summary-row { display: flex; justify-content: space-between; gap: 16px; margin: 7px 0; }
        .grand { font-size: 18px; font-weight: 800; }
        @media print {
            body { background: #fff; }
            .toolbar { display: none; }
            .invoice { width: 100%; max-width: 100%; margin: 0; border: 0; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button onclick="window.print()">In / lưu PDF</button>
    </div>
    <main class="invoice">
        <div class="line"></div>
        <h1>SHOPMU</h1>
        <p class="tagline">Nơi Tụ Hợp Những Món Hàng Dành Cho Quỷ Đỏ</p>
        <div class="line"></div>

        <section class="meta">
            <div>Ngày: ${htmlEscape(orderDate)}</div>
            <div>Mã đơn: ORD-${order.Id}</div>
        </section>
        <div class="thin"></div>

        <strong>SẢN PHẨM:</strong>
        <table>
            <colgroup>
                <col>
                <col style="width:48px">
                <col style="width:48px">
                <col style="width:118px">
                <col style="width:128px">
            </colgroup>
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th class="center">Size</th>
                    <th class="center">SL</th>
                    <th class="right">Đơn giá</th>
                    <th class="right">Thành tiền</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="thin"></div>
        <div class="summary-row"><span>Tổng tiền hàng:</span><strong>${formatVnd(subtotal)}</strong></div>
        <div class="summary-row"><span>Phí vận chuyển:</span><strong>${formatVnd(shippingFee)}</strong></div>
        <div class="summary-row"><span>Giảm giá${couponText}:</span><strong>-${formatVnd(discount)}</strong></div>
        <div class="line"></div>
        <div class="summary-row grand"><span>TỔNG CỘNG:</span><span>${formatVnd(total)}</span></div>
        <div class="line"></div>

        <section class="customer">
            <div>Khách hàng: ${htmlEscape(order.CustomerName)}</div>
            <div>Địa chỉ: ${htmlEscape(order.Address)}</div>
            <div>SĐT: ${htmlEscape(order.Phone)}</div>
            <br>
            <div>Thanh toán: ${htmlEscape(paymentLabel(order.PaymentMethod))}</div>
            <div>Trạng thái: ${htmlEscape(paymentStatus(order.PaymentMethod))}</div>
        </section>

        <div class="line"></div>
        <p class="thanks">Cảm ơn quý khách!</p>
        <p class="thanks">Liên hệ: 0123456789</p>
    </main>
</body>
</html>`);
    } catch (err) {
        console.error("Invoice error:", err);
        res.status(500).send("Không thể xuất hóa đơn: " + err.message);
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

// ==================== CONTACTS ====================
function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function contactReplyTemplate(name, replyText) {
    const safeName = escapeHtml(name || "quy khach");
    const safeReply = escapeHtml(replyText).replace(/\n/g, "<br>");
    return `
<html>
<body style="font-family:Open Sans,Arial,sans-serif;background:#f5f5f5;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <h2 style="color:#333;margin-bottom:16px">Xin chao ${safeName}!</h2>
    <p style="color:#666;line-height:1.6">Cam on ban da lien he voi <strong>UNITED STORE</strong></p>
    <div style="background:#f9f9f9;border-left:4px solid #C70101;padding:16px;margin:20px 0;border-radius:4px">
      <strong style="color:#C70101">Phan hoi tu UNITED STORE:</strong>
      <p style="margin-top:12px;color:#333;line-height:1.6">${safeReply}</p>
    </div>
    <p style="color:#999;font-size:13px;margin-top:24px">Neu co thac mac khac, vui long reply email nay hoac ghe tham website cua chung toi.</p>
    <p style="color:#999;font-size:13px">Tran trong,<br><strong>UNITED STORE Team</strong></p>
  </div>
</body>
</html>`;
}

app.post("/contacts", async (req, res) => {
    const { name, email, phone, content } = req.body;
    if (!name || !email || !phone || !content) {
        return res.status(400).json({ success: false, message: "Vui long nhap day du thong tin!" });
    }
    try {
        await sql.query`
            INSERT INTO Contacts (Name, Email, Phone, Content, CreatedAt, Replied)
            VALUES (${name}, ${email}, ${phone}, ${content}, GETDATE(), 0)
        `;
        res.json({ success: true, message: "Da gui thac mac thanh cong!" });
    } catch (err) {
        console.error("Create contact error:", err);
        res.status(500).json({ success: false, message: "Khong the gui thac mac!" });
    }
});

app.get("/admin/contacts", async (req, res) => {
    const status = req.query.status || "";
    let where = "";
    if (status === "new") where = "WHERE Replied = 0";
    if (status === "replied") where = "WHERE Replied = 1";

    try {
        const r = await sql.query(`
            SELECT Id, Name, Email, Phone, Content, CreatedAt, Replied
            FROM Contacts
            ${where}
            ORDER BY CreatedAt DESC
        `);
        const count = await sql.query`SELECT COUNT(*) AS PendingCount FROM Contacts WHERE Replied = 0`;
        res.json({
            success: true,
            total: r.recordset.length,
            pendingCount: count.recordset[0].PendingCount,
            contacts: r.recordset
        });
    } catch (err) {
        console.error("Load contacts error:", err);
        res.status(500).json({ success: false, message: err.message, contacts: [] });
    }
});

app.get("/admin/contacts/:id", async (req, res) => {
    try {
        const r = await sql.query`
            SELECT Id, Name, Email, Phone, Content, CreatedAt, Replied
            FROM Contacts
            WHERE Id = ${req.params.id}
        `;
        if (!r.recordset.length) {
            return res.status(404).json({ success: false, message: "Khong tim thay thac mac!" });
        }
        res.json(r.recordset[0]);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/admin/contacts/:id", async (req, res) => {
    try {
        await sql.query`DELETE FROM Contacts WHERE Id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/admin/contacts/:id/reply", async (req, res) => {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
        return res.status(400).json({ success: false, message: "Vui long nhap phan hoi!" });
    }
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD) {
        return res.status(500).json({ success: false, message: "Chua cau hinh GMAIL_EMAIL/GMAIL_PASSWORD trong .env" });
    }

    try {
        const r = await sql.query`
            SELECT Id, Name, Email
            FROM Contacts
            WHERE Id = ${req.params.id}
        `;
        if (!r.recordset.length) {
            return res.status(404).json({ success: false, message: "Khong tim thay thac mac!" });
        }

        const contact = r.recordset[0];
        await transporter.sendMail({
            from: process.env.GMAIL_EMAIL,
            to: contact.Email,
            subject: `Phan hoi tu UNITED STORE: ${contact.Name || ""}`,
            html: contactReplyTemplate(contact.Name, reply.trim())
        });

        await sql.query`UPDATE Contacts SET Replied = 1 WHERE Id = ${req.params.id}`;
        res.json({ success: true, message: "Da gui phan hoi qua email!" });
    } catch (err) {
        console.error("Send contact reply error:", err);
        res.status(500).json({ success: false, message: "Loi gui email. Vui long thu lai" });
    }
});

// ==================== START SERVER ====================
app.listen(8888, () => {
    console.log("🚀 Server running at http://localhost:8888");
});
