// ================================================================
//  SEARCH.JS — Live Search Module (dùng cho tất cả các trang)
//  Cách dùng: <script src="../search.js"></script> (điều chỉnh path)
//  Yêu cầu: inject HTML qua initSearch(basePath)
// ================================================================

(function () {

    const API = "http://localhost:8888";

    // ---- Inject CSS ----
    const style = document.createElement("style");
    style.textContent = `
        /* ===== SEARCH WRAPPER ===== */
        .search-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-form {
            display: flex;
            align-items: center;
            background: rgba(255,255,255,0.08);
            border: 1.5px solid rgba(255,255,255,0.18);
            border-radius: 999px;
            padding: 6px 14px;
            gap: 8px;
            transition: all 0.25s ease;
            width: 200px;
        }

        .search-form:focus-within {
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.5);
            width: 280px;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.08);
        }

        .search-input {
            background: none;
            border: none;
            outline: none;
            color: #fff;
            font-size: 13px;
            font-family: 'Montserrat', sans-serif;
            width: 100%;
            letter-spacing: 0.2px;
        }

        .search-input::placeholder {
            color: rgba(255,255,255,0.45);
        }

        .search-icon-btn {
            background: none;
            border: none;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            font-size: 14px;
            flex-shrink: 0;
            transition: color 0.2s;
        }

        .search-icon-btn:hover { color: #fff; }

        /* ===== DROPDOWN ===== */
        .search-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            width: 420px;
            background: #1a1d26;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.6);
            z-index: 9999;
            overflow: hidden;
            display: none;
            animation: searchDrop 0.18s ease;
        }

        @keyframes searchDrop {
            from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .search-dropdown.open { display: block; }

        /* Header của dropdown */
        .sd-header {
            padding: 10px 16px 8px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: rgba(255,255,255,0.3);
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        /* Từng kết quả */
        .sd-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            cursor: pointer;
            transition: background 0.15s;
            text-decoration: none;
            color: inherit;
        }

        .sd-item:hover, .sd-item.focused {
            background: rgba(255,255,255,0.07);
        }

        .sd-thumb {
            width: 46px;
            height: 46px;
            border-radius: 8px;
            object-fit: cover;
            background: rgba(255,255,255,0.05);
            flex-shrink: 0;
            border: 1px solid rgba(255,255,255,0.08);
        }

        .sd-thumb-placeholder {
            width: 46px;
            height: 46px;
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.2);
            font-size: 16px;
        }

        .sd-info { flex: 1; min-width: 0; }

        .sd-name {
            font-size: 13px;
            font-weight: 600;
            color: #e8eaf0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Montserrat', sans-serif;
            margin-bottom: 3px;
        }

        .sd-name mark {
            background: none;
            color: #f0c040;
        }

        .sd-category {
            font-size: 11px;
            color: rgba(255,255,255,0.35);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .sd-price {
            text-align: right;
            flex-shrink: 0;
        }

        .sd-new-price {
            font-size: 13px;
            font-weight: 700;
            color: #4dd9ac;
            font-family: 'Montserrat', sans-serif;
        }

        .sd-old-price {
            font-size: 11px;
            color: rgba(255,255,255,0.3);
            text-decoration: line-through;
        }

        /* Footer "Xem tất cả" */
        .sd-footer {
            padding: 10px 16px;
            border-top: 1px solid rgba(255,255,255,0.07);
            text-align: center;
        }

        .sd-footer a {
            font-size: 12px;
            font-weight: 700;
            color: #8b8fff;
            text-decoration: none;
            letter-spacing: 0.5px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s;
        }

        .sd-footer a:hover { color: #b3b0ff; }

        /* Trạng thái loading / empty */
        .sd-state {
            padding: 24px 16px;
            text-align: center;
            color: rgba(255,255,255,0.3);
            font-size: 13px;
        }

        .sd-spinner {
            display: inline-block;
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: #8b8fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            vertical-align: middle;
            margin-right: 6px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== TRANG KẾT QUẢ TÌM KIẾM ===== */
        .search-results-page {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 24px;
        }

        .sr-header {
            margin-bottom: 28px;
        }

        .sr-header h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #1a1d26;
        }

        .sr-header p {
            color: #666;
            font-size: 14px;
            margin-top: 4px;
        }

        .sr-header p span {
            color: #1a1d26;
            font-weight: 700;
        }

        .sr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
        }

        .sr-empty {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }

        .sr-empty i {
            font-size: 48px;
            display: block;
            margin-bottom: 12px;
            opacity: 0.3;
        }
    `;
    document.head.appendChild(style);

    // ================================================================
    //  INJECT SEARCH HTML VÀO NAVBAR
    // ================================================================
    // Sửa lại phần tìm vị trí trong hàm initSearch
function initSearch(basePath) {
    basePath = basePath || "";

    // Kiểm tra xem đã có thanh tìm kiếm chưa (tránh chèn nhiều lần)
    if (document.querySelector(".search-wrapper")) return;

    // Tìm nav-list cuối cùng (bên phải)
    const navLists = document.querySelectorAll(".nav-list");
    if (!navLists.length) {
        console.warn("Không tìm thấy .nav-list để chèn search");
        return;
    }

    const targetNav = navLists[navLists.length - 1];

    // Tạo thẻ li mới
    const li = document.createElement("li");
    li.className = "nav-item";
    li.style.cssText = "position:relative; margin-right: 15px;";

    li.innerHTML = `
        <div class="search-wrapper">
            <form class="search-form" id="searchForm" autocomplete="off">
                <button type="submit" class="search-icon-btn" id="searchSubmitBtn" title="Tìm kiếm">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <input
                    type="text"
                    class="search-input"
                    id="searchInput"
                    placeholder="Tìm sản phẩm..."
                    maxlength="100"
                    autocomplete="off"
                >
            </form>
            <div class="search-dropdown" id="searchDropdown"></div>
        </div>
    `;

    // Chèn vào đầu nav-list (trước giỏ hàng)
    targetNav.insertBefore(li, targetNav.firstChild);
    
    console.log("Đã chèn thanh tìm kiếm thành công!");
    
    // Gọi bind search sau khi đã chèn
    bindSearch(basePath);
}

    // ================================================================
    //  LOGIC TÌM KIẾM
    // ================================================================
    function bindSearch(basePath) {
        const input    = document.getElementById("searchInput");
        const dropdown = document.getElementById("searchDropdown");
        const form     = document.getElementById("searchForm");

        if (!input || !dropdown) return;

        let debounceTimer = null;
        let currentQuery  = "";
        let focusedIndex  = -1;
        let currentItems  = [];

        // ---- INPUT EVENT ----
        input.addEventListener("input", function () {
            const q = this.value.trim();
            currentQuery = q;
            focusedIndex = -1;

            if (q.length < 2) {
                closeDropdown();
                return;
            }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => doSearch(q), 280);
        });

        // ---- KEYBOARD NAV ----
        input.addEventListener("keydown", function (e) {
            if (!dropdown.classList.contains("open")) return;

            const items = dropdown.querySelectorAll(".sd-item");
            if (!items.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
                updateFocus(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                focusedIndex = Math.max(focusedIndex - 1, 0);
                updateFocus(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (focusedIndex >= 0 && items[focusedIndex]) {
                    items[focusedIndex].click();
                } else {
                    goToResults(currentQuery, basePath);
                }
            } else if (e.key === "Escape") {
                closeDropdown();
                input.blur();
            }
        });

        function updateFocus(items) {
            items.forEach((it, i) => it.classList.toggle("focused", i === focusedIndex));
            if (items[focusedIndex]) items[focusedIndex].scrollIntoView({ block: "nearest" });
        }

        // ---- SUBMIT (Enter / click icon) ----
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const q = input.value.trim();
            if (q.length >= 2) goToResults(q, basePath);
        });

        document.getElementById("searchSubmitBtn").addEventListener("click", function () {
            const q = input.value.trim();
            if (q.length >= 2) goToResults(q, basePath);
        });

        // ---- CLOSE khi click ra ngoài ----
        document.addEventListener("click", function (e) {
            if (!e.target.closest(".search-wrapper")) closeDropdown();
        });

        // ---- FETCH ----
        function doSearch(q) {
            dropdown.innerHTML = `<div class="sd-state"><span class="sd-spinner"></span> Đang tìm...</div>`;
            openDropdown();

            fetch(`${API}/search?q=${encodeURIComponent(q)}`)
                .then(r => r.json())
                .then(data => {
                    if (currentQuery !== q) return; // bỏ kết quả cũ
                    renderDropdown(data, q, basePath);
                })
                .catch(() => {
                    if (currentQuery !== q) return;
                    dropdown.innerHTML = `<div class="sd-state">❌ Không thể kết nối server</div>`;
                });
        }

        function openDropdown()  { dropdown.classList.add("open"); }
        function closeDropdown() { dropdown.classList.remove("open"); focusedIndex = -1; }

        function renderDropdown(results, q, base) {
            if (!results || results.length === 0) {
                dropdown.innerHTML = `
                    <div class="sd-state">
                        <i class="fa-regular fa-face-sad-tear" style="display:block;font-size:24px;margin-bottom:8px"></i>
                        Không tìm thấy sản phẩm nào cho "<strong style="color:#fff">${escHtml(q)}</strong>"
                    </div>`;
                openDropdown();
                return;
            }

            const top = results.slice(0, 6); // Hiện tối đa 6 gợi ý
            const esc = escHtml;

            const itemsHTML = top.map(p => {
                const discount = p.DiscountPercent || 0;
                const newPrice = discount > 0
                    ? Math.round(p.Price * (1 - discount / 100))
                    : p.Price;
                const oldPriceHTML = discount > 0
                    ? `<div class="sd-old-price">${p.Price.toLocaleString("vi-VN")}đ</div>`
                    : "";

                const highlightedName = highlightMatch(esc(p.Name), esc(q));
                const thumb = p.Image
                    ? `<img src="${esc(p.Image)}" class="sd-thumb" onerror="this.style.display='none'" alt="">`
                    : `<div class="sd-thumb-placeholder"><i class="fa-solid fa-shirt"></i></div>`;

                return `
                    <a class="sd-item" href="${base}product-detail.html?id=${p.Id}">
                        ${thumb}
                        <div class="sd-info">
                            <div class="sd-name">${highlightedName}</div>
                            <div class="sd-category">${esc(p.Category || "")}</div>
                        </div>
                        <div class="sd-price">
                            <div class="sd-new-price">${newPrice.toLocaleString("vi-VN")}đ</div>
                            ${oldPriceHTML}
                        </div>
                    </a>
                `;
            }).join("");

            const totalCount = results.length;
            const footerHTML = `
                <div class="sd-footer">
                    <a href="${base}search.html?q=${encodeURIComponent(q)}">
                        Xem tất cả ${totalCount} kết quả
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;

            dropdown.innerHTML = `
                <div class="sd-header">Kết quả tìm kiếm</div>
                ${itemsHTML}
                ${footerHTML}
            `;
            openDropdown();
        }
    }

    // ================================================================
    //  TRANG KẾT QUẢ TÌM KIẾM — search.html
    // ================================================================
    function initResultsPage() {
        const container = document.getElementById("searchResultsContainer");
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const q = params.get("q") || "";

        // Set lại input trên thanh search
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = q;

        if (!q || q.trim().length < 2) {
            container.innerHTML = `
                <div class="sr-empty">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>Nhập từ khóa để tìm kiếm sản phẩm</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="sr-header">
                <h2>Kết quả tìm kiếm</h2>
                <p>Đang tìm <span>"${escHtml(q)}"</span>...</p>
            </div>
            <div class="sd-state"><span class="sd-spinner"></span> Đang tải...</div>
        `;

        fetch(`${API}/search?q=${encodeURIComponent(q)}`)
            .then(r => r.json())
            .then(results => {
                if (!results || results.length === 0) {
                    container.innerHTML = `
                        <div class="sr-header">
                            <h2>Kết quả tìm kiếm</h2>
                            <p>Không tìm thấy kết quả nào cho <span>"${escHtml(q)}"</span></p>
                        </div>
                        <div class="sr-empty">
                            <i class="fa-regular fa-face-sad-tear"></i>
                            <p>Thử tìm với từ khóa khác như tên CLB, loại sản phẩm...</p>
                        </div>`;
                    return;
                }

                const cardsHTML = results.map(p => {
                    const discount = p.DiscountPercent || 0;
                    const newPrice = discount > 0
                        ? Math.round(p.Price * (1 - discount / 100))
                        : p.Price;

                    return `
                        <div class="product-card">
                            <div class="image-container">
                                <div class="product-image" style="background-image:url('${escHtml(p.Image || "")}')">
                                    <div class="like-icon"><i class="fa-regular fa-heart"></i></div>
                                    ${discount > 0 ? `<div class="sale-percentage">${discount}%</div>` : ""}
                                </div>
                                <a class="buy-btn" href="product-detail.html?id=${p.Id}">Mua ngay</a>
                            </div>
                            <div class="product-infor">
                                <p class="title">${escHtml(p.Name)}</p>
                                <div class="price">
                                    ${discount > 0
                                        ? `<p class="old-price">${p.Price.toLocaleString("vi-VN")}đ</p>
                                           <p class="new-price">${newPrice.toLocaleString("vi-VN")}đ</p>`
                                        : `<div class="normal-price">${newPrice.toLocaleString("vi-VN")}đ</div>`
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                }).join("");

                container.innerHTML = `
                    <div class="sr-header">
                        <h2>Kết quả tìm kiếm</h2>
                        <p>Tìm thấy <span>${results.length} sản phẩm</span> cho "<span>${escHtml(q)}</span>"</p>
                    </div>
                    <div class="product sr-grid">${cardsHTML}</div>
                `;
            })
            .catch(() => {
                container.innerHTML = `
                    <div class="sr-empty">
                        <i class="fa-solid fa-circle-xmark"></i>
                        <p>Không thể kết nối server. Vui lòng thử lại sau.</p>
                    </div>`;
            });
    }

    // ================================================================
    //  UTILS
    // ================================================================
    function goToResults(q, basePath) {
        window.location.href = `${basePath}search.html?q=${encodeURIComponent(q)}`;
    }

    function escHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        try {
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
        } catch {
            return text;
        }
    }

    // ================================================================
    //  EXPORT ra global scope
    // ================================================================
    window.initSearch       = initSearch;
    window.initResultsPage  = initResultsPage;

})();
