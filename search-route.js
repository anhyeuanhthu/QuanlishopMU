// ================================================================
//  BACKEND — Route tìm kiếm sản phẩm
//  Thêm đoạn này vào file server.js / app.js của bạn
// ================================================================

const { sql, connectDB } = require("./db");

// GET /search?q=manchester
app.get("/search", async (req, res) => {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 2) {
        return res.json([]);
    }

    try {
        const result = await sql.query`
            SELECT TOP 20
                p.Id,
                p.Name,
                p.Price,
                p.Image,
                p.DiscountPercent,
                p.CategoryId,
                p.IsClothing
            FROM Products p
            WHERE
                p.Name        LIKE ${"%" + q + "%"}
             OR p.Description LIKE ${"%" + q + "%"}
             OR p.Category    LIKE ${"%" + q + "%"}
            ORDER BY
                -- Ưu tiên kết quả khớp đầu tên sản phẩm trước
                CASE WHEN p.Name LIKE ${q + "%"} THEN 0 ELSE 1 END,
                p.Name ASC
        `;

        res.json(result.recordset);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});
