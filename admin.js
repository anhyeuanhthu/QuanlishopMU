// // ================================================================
// //  ADMIN DASHBOARD — admin.js
// //  Compatible với backend Express + MSSQL đã có
// // ================================================================

// const API = "http://localhost:8888";

// // ---- AUTH CHECK ----
// const user = JSON.parse(sessionStorage.getItem("user"));
// if (!user || !user.isAdmin) {
//     window.location.href = "./index.html";
// }

// if (user && user.Name) {
//     const el = document.getElementById("adminName");
//     if (el) el.textContent = user.Name;
// }

// // ================================================================
// //  UTILS
// // ================================================================
// function fmt(n) {
//     if (n == null || n === "" || n === "—") return "—";
//     return Number(n).toLocaleString("vi-VN") + "₫";
// }

// function statusBadge(s) {
//     const map = {
//         "Pending":   ["badge-pending",   "Chờ xác nhận"],
//         "Shipping":  ["badge-shipping",  "Đang giao"],
//         "Delivered": ["badge-delivered", "Đã giao"],
//         "Cancelled": ["badge-cancelled", "Đã huỷ"],
//     };
//     const [cls, label] = map[s] || ["badge-pending", s];
//     return `<span class="badge ${cls}">${label}</span>`;
// }

// function paymentLabel(p) {
//     const map = { "COD": "Tiền mặt", "Banking": "Chuyển khoản", "Momo": "MoMo" };
//     return map[p] || p || "—";
// }

// // ---- TOAST ----
// function toast(msg, type = "success") {
//     const icon = type === "success" ? "fa-circle-check" : "fa-circle-xmark";
//     const div = document.createElement("div");
//     div.className = `toast ${type}`;
//     div.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
//     document.getElementById("toastContainer").appendChild(div);
//     setTimeout(() => div.remove(), 3500);
// }

// // ---- MODAL ----
// function openModal(id) {
//     document.getElementById(id).classList.add("open");
// }

// function closeModal(id) {
//     document.getElementById(id).classList.remove("open");
// }

// // Close modal on overlay click
// document.querySelectorAll(".modal-overlay").forEach(overlay => {
//     overlay.addEventListener("click", function (e) {
//         if (e.target === this) closeModal(this.id);
//     });
// });

// // ---- TABS ----
// function switchTab(name, btn) {
//     document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
//     document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
//     document.getElementById("tab-" + name).classList.add("active");
//     if (btn) btn.classList.add("active");

//     const titles = { overview: "Dashboard", orders: "Đơn hàng", products: "Sản phẩm" };
//     document.getElementById("topbarTitle").textContent = titles[name] || name;
// }

// function logout() {
//     localStorage.removeItem("user");
//     window.location.href = "./dangnhap/dangnhap.html";
// }

// // ================================================================
// //  DATA CACHE
// // ================================================================
// let allOrders = [];
// let allProducts = [];

// // ================================================================
// //  REVENUE
// // ================================================================
// function loadRevenue() {
//     fetch(`${API}/admin/revenue`)
//         .then(r => r.json())
//         .then(d => {
//             document.getElementById("today").textContent = fmt(d.today);
//             document.getElementById("week").textContent  = fmt(d.week);
//             document.getElementById("month").textContent = fmt(d.month);
//             document.getElementById("year").textContent  = fmt(d.year);
//         })
//         .catch(() => {
//             ["today","week","month","year"].forEach(id => {
//                 const el = document.getElementById(id);
//                 if (el) el.textContent = "Lỗi";
//             });
//         });
// }

// // ================================================================
// //  ORDERS
// // ================================================================
// function loadOrders() {
//     fetch(`${API}/admin/orders`)
//         .then(r => r.json())
//         .then(list => {
//             allOrders = list;

//             // pending badge
//             const pending = list.filter(o => o.Status === "Pending").length;
//             const badge = document.getElementById("pendingBadge");
//             if (badge) {
//                 badge.textContent = pending;
//                 badge.style.display = pending > 0 ? "inline-flex" : "none";
//             }

//             const countEl = document.getElementById("orderCount");
//             if (countEl) countEl.textContent = `${list.length} đơn hàng`;

//             renderRecentOrders(list.slice(0, 10));
//             renderOrders(list);
//         })
//         .catch(() => {
//             document.getElementById("ordersBody").innerHTML =
//                 `<tr class="loading-row"><td colspan="7">❌ Không thể tải dữ liệu đơn hàng</td></tr>`;
//             document.getElementById("recentOrdersBody").innerHTML =
//                 `<tr class="loading-row"><td colspan="6">❌ Lỗi kết nối</td></tr>`;
//         });
// }

// function renderRecentOrders(list) {
//     const tbody = document.getElementById("recentOrdersBody");
//     if (!list || !list.length) {
//         tbody.innerHTML = `<tr class="loading-row"><td colspan="6">Chưa có đơn hàng nào</td></tr>`;
//         return;
//     }
//     tbody.innerHTML = list.map(o => `
//         <tr>
//             <td><strong>#${o.Id}</strong></td>
//             <td>${o.CustomerName || "—"}</td>
//             <td style="color:var(--red);font-weight:700">${fmt(o.Total)}</td>
//             <td><span style="font-size:12px;font-weight:600">${paymentLabel(o.PaymentMethod)}</span></td>
//             <td>${statusBadge(o.Status)}</td>
//             <td>
//                 <button class="btn btn-info btn-sm" onclick="viewOrder(${o.Id})">
//                     <i class="fas fa-eye"></i> Chi tiết
//                 </button>
//             </td>
//         </tr>
//     `).join("");
// }

// function renderOrders(list) {
//     const tbody = document.getElementById("ordersBody");
//     if (!list || !list.length) {
//         tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Không có đơn hàng nào</td></tr>`;
//         return;
//     }
//     tbody.innerHTML = list.map(o => `
//         <tr>
//             <td><strong>#${o.Id}</strong></td>
//             <td>${o.CustomerName || "—"}</td>
//             <td style="color:var(--text2)">${o.Phone || "—"}</td>
//             <td style="color:var(--red);font-weight:700">${fmt(o.Total)}</td>
//             <td><span style="font-size:12px;font-weight:600">${paymentLabel(o.PaymentMethod)}</span></td>
//             <td>${statusBadge(o.Status)}</td>
//             <td>
//                 <div style="display:flex;gap:6px;flex-wrap:wrap">
//                     <button class="btn btn-info btn-sm" onclick="viewOrder(${o.Id})">
//                         <i class="fas fa-eye"></i> Chi tiết
//                     </button>
//                     ${o.Status === "Pending" ? `
//                     <button class="btn btn-warning btn-sm" onclick="quickStatus(${o.Id},'Shipping')">
//                         <i class="fas fa-truck"></i>
//                     </button>` : ""}
//                     ${o.Status === "Shipping" ? `
//                     <button class="btn btn-success btn-sm" onclick="quickStatus(${o.Id},'Delivered')">
//                         <i class="fas fa-check"></i>
//                     </button>` : ""}
//                     ${(o.Status === "Pending") ? `
//                     <button class="btn btn-danger btn-sm" onclick="quickStatus(${o.Id},'Cancelled')">
//                         <i class="fas fa-ban"></i>
//                     </button>` : ""}
//                 </div>
//             </td>
//         </tr>
//     `).join("");
// }

// function filterOrders() {
//     const q = (document.getElementById("orderSearch").value || "").toLowerCase();
//     const st = document.getElementById("orderStatusFilter").value;
//     const filtered = allOrders.filter(o => {
//         const matchQ = !q || String(o.Id).includes(q) ||
//             (o.CustomerName || "").toLowerCase().includes(q) ||
//             (o.Phone || "").includes(q);
//         const matchSt = !st || o.Status === st;
//         return matchQ && matchSt;
//     });
//     renderOrders(filtered);
//     document.getElementById("orderCount").textContent = `${filtered.length} / ${allOrders.length} đơn hàng`;
// }

// // ---- VIEW ORDER DETAIL ----
// function viewOrder(id) {
//     const o = allOrders.find(x => x.Id === id);
//     if (!o) return;

//     document.getElementById("modalOrderId").textContent = `#${id}`;

//     // Fetch order items from server
//     fetch(`${API}/admin/orderDetail/${id}`)
//         .then(r => r.json())
//         .then(items => {
//             buildOrderModal(o, items);
//         })
//         .catch(() => {
//             // Fallback: hiển thị thông tin đơn không có items
//             buildOrderModal(o, []);
//         });

//     openModal("orderModal");
// }

// function buildOrderModal(o, items) {
//     const body = document.getElementById("orderModalBody");
//     const footer = document.getElementById("orderModalFooter");

//     // Tính phí ship (reverse từ total nếu cần)
//     const itemsSubtotal = items.reduce((s, i) => s + (i.Price * i.Quantity), 0);
//     const shippingFee = (items.length > 0 && o.Total > itemsSubtotal)
//         ? o.Total - itemsSubtotal : 0;

//     const itemsHTML = items.length > 0 ? items.map(item => `
//         <div class="order-item-row">
//             ${item.Image
//                 ? `<img src="${item.Image}" class="order-item-img" onerror="this.style.display='none'">`
//                 : `<div class="order-item-img" style="display:flex;align-items:center;justify-content:center;color:var(--text3)"><i class="fas fa-image"></i></div>`
//             }
//             <div class="order-item-info">
//                 <div class="name">${item.Name || item.ProductName || "Sản phẩm"}</div>
//                 <div class="meta">${item.Size ? `Size: ${item.Size} · ` : ""}Số lượng: ${item.Quantity}</div>
//             </div>
//             <div class="order-item-price">${fmt(item.Price * item.Quantity)}</div>
//         </div>
//     `).join("") : `<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">Không có dữ liệu sản phẩm</div>`;

//     body.innerHTML = `
//         <div class="order-detail-grid">
//             <div class="info-card">
//                 <div class="info-card-title">Thông tin khách hàng</div>
//                 <div class="info-row"><span class="label">Họ tên</span><span class="value">${o.CustomerName || "—"}</span></div>
//                 <div class="info-row"><span class="label">SĐT</span><span class="value">${o.Phone || "—"}</span></div>
//                 <div class="info-row"><span class="label">Email</span><span class="value">${o.Email || "—"}</span></div>
//                 <div class="info-row"><span class="label">Địa chỉ</span><span class="value" style="max-width:180px">${o.Address || "—"}</span></div>
//             </div>
//             <div class="info-card">
//                 <div class="info-card-title">Thông tin đơn hàng</div>
//                 <div class="info-row"><span class="label">Mã đơn</span><span class="value" style="color:var(--accent)">#${o.Id}</span></div>
//                 <div class="info-row"><span class="label">Thanh toán</span><span class="value">${paymentLabel(o.PaymentMethod)}</span></div>
//                 <div class="info-row"><span class="label">Trạng thái</span><span class="value">${statusBadge(o.Status)}</span></div>
//                 <div class="info-row"><span class="label">Ngày đặt</span><span class="value">${o.CreatedAt ? new Date(o.CreatedAt).toLocaleDateString("vi-VN") : "—"}</span></div>
//             </div>
//         </div>

//         <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:10px">
//             Sản phẩm đặt mua
//         </div>
//         <div class="order-items-list">${itemsHTML}</div>

//         <div class="total-summary">
//             ${items.length > 0 ? `
//             <div class="row"><span>Tiền hàng</span><span>${fmt(itemsSubtotal)}</span></div>
//             ${shippingFee > 0 ? `<div class="row"><span>Phí vận chuyển</span><span>${fmt(shippingFee)}</span></div>` : ""}
//             ` : ""}
//             <div class="row"><span>Tổng thanh toán</span><span>${fmt(o.Total)}</span></div>
//         </div>

//         ${o.Status !== "Delivered" && o.Status !== "Cancelled" ? `
//         <div>
//             <div class="status-actions-title">Cập nhật trạng thái đơn hàng</div>
//             <div class="status-action-grid">
//                 ${o.Status === "Pending" ? `
//                 <button class="btn btn-warning" onclick="updateOrderStatus(${o.Id},'Shipping')">
//                     <i class="fas fa-truck"></i> Xác nhận giao hàng
//                 </button>
//                 <button class="btn btn-danger" onclick="updateOrderStatus(${o.Id},'Cancelled')">
//                     <i class="fas fa-ban"></i> Huỷ đơn
//                 </button>
//                 ` : ""}
//                 ${o.Status === "Shipping" ? `
//                 <button class="btn btn-success" onclick="updateOrderStatus(${o.Id},'Delivered')">
//                     <i class="fas fa-check-circle"></i> Đã giao thành công
//                 </button>
//                 <button class="btn btn-danger" onclick="updateOrderStatus(${o.Id},'Cancelled')">
//                     <i class="fas fa-ban"></i> Huỷ đơn
//                 </button>
//                 ` : ""}
//             </div>
//         </div>
//         ` : `
//         <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:13px;color:var(--text3);text-align:center">
//             <i class="fas ${o.Status === 'Delivered' ? 'fa-circle-check' : 'fa-circle-xmark'}" style="margin-right:6px;color:${o.Status === 'Delivered' ? 'var(--accent2)' : 'var(--accent3)'}"></i>
//             Đơn hàng đã ${o.Status === "Delivered" ? "được giao thành công" : "bị huỷ"}
//         </div>
//         `}
//     `;

//     footer.innerHTML = `<button class="btn btn-ghost" onclick="closeModal('orderModal')">Đóng</button>`;
// }

// function updateOrderStatus(id, status) {
//     fetch(`${API}/admin/updateOrder`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id, status })
//     })
//     .then(r => r.json())
//     .then(() => {
//         closeModal("orderModal");
//         toast(`Đã cập nhật trạng thái đơn #${id} → ${statusLabel(status)}`);
//         loadOrders();
//     })
//     .catch(() => toast("Lỗi khi cập nhật trạng thái!", "error"));
// }

// function quickStatus(id, status) {
//     fetch(`${API}/admin/updateOrder`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id, status })
//     })
//     .then(() => {
//         toast(`Đơn #${id}: ${statusLabel(status)}`);
//         loadOrders();
//     })
//     .catch(() => toast("Lỗi khi cập nhật!", "error"));
// }

// function statusLabel(s) {
//     const map = { Pending: "Chờ xác nhận", Shipping: "Đang giao", Delivered: "Đã giao", Cancelled: "Đã huỷ" };
//     return map[s] || s;
// }

// // ================================================================
// //  PRODUCTS
// // ================================================================
// function loadProducts() {
//     fetch(`${API}/admin/products`)
//         .then(r => r.json())
//         .then(list => {
//             // Group by product id
//             const grouped = {};
//             list.forEach(p => {
//                 if (!grouped[p.Id]) {
//                     grouped[p.Id] = {
//                         id: p.Id,
//                         name: p.Name,
//                         price: p.Price,
//                         category: p.Category,
//                         image: p.Image,
//                         description: p.Description,
//                         isClothing: p.IsClothing,
//                         quantity: p.Quantity,
//                         sizes: []
//                     };
//                 }
//                 if (p.Size) {
//                     grouped[p.Id].sizes.push({ size: p.Size, quantity: p.SizeQuantity });
//                 }
//             });
//             allProducts = Object.values(grouped);
//             const countEl = document.getElementById("productCount");
//             if (countEl) countEl.textContent = `${allProducts.length} sản phẩm`;
//             renderProducts(allProducts);
//         })
//         .catch(() => {
//             document.getElementById("productsBody").innerHTML =
//                 `<tr class="loading-row"><td colspan="6">❌ Không thể tải sản phẩm</td></tr>`;
//         });
// }

// function renderProducts(list) {
//     const tbody = document.getElementById("productsBody");
//     if (!list || !list.length) {
//         tbody.innerHTML = `<tr class="loading-row"><td colspan="6">Không có sản phẩm nào</td></tr>`;
//         return;
//     }
//     tbody.innerHTML = list.map(p => {
//         let stock = "";
//         if (p.isClothing == 1 && p.sizes.length > 0) {
//             const chips = p.sizes.map(s =>
//                 `<span style="display:inline-block;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:1px 7px;font-size:11px;color:var(--text2);margin:1px">${s.size}:${s.quantity}</span>`
//             ).join("");
//             stock = `<div style="display:flex;flex-wrap:wrap;gap:2px">${chips}</div>`;
//         } else {
//             const qty = p.quantity || 0;
//             const color = qty <= 5 ? "var(--red)" : qty <= 20 ? "var(--gold-dark)" : "#059669";
//             stock = `<span style="color:${color};font-weight:600">${qty}</span>`;
//         }

//         const catLabel = { ao: "Áo", quan: "Quần", mu: "Mũ", giay: "Giày", phu_kien: "Phụ kiện" };
//         const cat = catLabel[p.category] || p.category || "—";

//         return `
//             <tr>
//                 <td style="color:var(--text3);font-weight:700">#${p.id}</td>
//                 <td>
//                     <div style="display:flex;align-items:center;gap:10px">
//                         ${p.image ? `<img src="${p.image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display='none'">` : ""}
//                         <strong>${p.name}</strong>
//                     </div>
//                 </td>
//                 <td style="color:var(--red);font-weight:700">${fmt(p.price)}</td>
//                 <td><span style="font-size:12px;color:var(--text2)">${cat}</span></td>
//                 <td>${stock}</td>
//                 <td>
//                     <div style="display:flex;gap:6px">
//                         <button class="btn btn-warning btn-sm" onclick="openEditProduct(${p.id})">
//                             <i class="fas fa-pen"></i> Sửa
//                         </button>
//                         <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct(${p.id},'${p.name.replace(/'/g,"\\'")}')">
//                             <i class="fas fa-trash"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `;
//     }).join("");
// }

// function filterProducts() {
//     const q = (document.getElementById("productSearch").value || "").toLowerCase();
//     const filtered = allProducts.filter(p =>
//         p.name.toLowerCase().includes(q) || String(p.id).includes(q)
//     );
//     renderProducts(filtered);
//     document.getElementById("productCount").textContent = `${filtered.length} / ${allProducts.length} sản phẩm`;
// }

// // ---- ADD PRODUCT ----
// function openAddProduct() {
//     document.getElementById("productModalTitle").textContent = "Thêm sản phẩm mới";
//     document.getElementById("pEditId").value = "";
//     document.getElementById("pName").value = "";
//     document.getElementById("pPrice").value = "";
//     document.getElementById("pCategory").value = "ao";
//     document.getElementById("pIsClothing").value = "1";
//     document.getElementById("pQuantity").value = "";
//     document.getElementById("pS").value = "";
//     document.getElementById("pM").value = "";
//     document.getElementById("pL").value = "";
//     document.getElementById("pXL").value = "";
//     document.getElementById("pXXL").value = "";
//     document.getElementById("pImage").value = "";
//     document.getElementById("pDesc").value = "";
//     toggleSizeFields();
//     openModal("productModal");
// }

// // ---- EDIT PRODUCT ----
// function openEditProduct(id) {
//     const p = allProducts.find(x => x.id === id);
//     if (!p) return;

//     document.getElementById("productModalTitle").textContent = "Chỉnh sửa sản phẩm";
//     document.getElementById("pEditId").value = id;
//     document.getElementById("pName").value = p.name || "";
//     document.getElementById("pPrice").value = p.price || "";
//     document.getElementById("pCategory").value = p.category || "ao";
//     document.getElementById("pIsClothing").value = p.isClothing != null ? String(p.isClothing) : "1";
//     document.getElementById("pQuantity").value = p.quantity || "";
//     document.getElementById("pImage").value = p.image || "";
//     document.getElementById("pDesc").value = p.description || "";

//     // Fill sizes
//     const sizeMap = {};
//     p.sizes.forEach(s => sizeMap[s.size] = s.quantity);
//     document.getElementById("pS").value = sizeMap["S"] || "";
//     document.getElementById("pM").value = sizeMap["M"] || "";
//     document.getElementById("pL").value = sizeMap["L"] || "";
//     document.getElementById("pXL").value = sizeMap["XL"] || "";
//     document.getElementById("pXXL").value = sizeMap["XXL"] || "";

//     toggleSizeFields();
//     openModal("productModal");
// }

// function toggleSizeFields() {
//     const isClothing = document.getElementById("pIsClothing").value === "1";
//     document.getElementById("pSizesGroup").style.display = isClothing ? "block" : "none";
//     document.getElementById("pQuantityGroup").style.display = isClothing ? "none" : "block";
// }

// function saveProduct() {
//     const editId = document.getElementById("pEditId").value;
//     const name = document.getElementById("pName").value.trim();
//     const price = Number(document.getElementById("pPrice").value);
//     const category = document.getElementById("pCategory").value;
//     const isClothing = Number(document.getElementById("pIsClothing").value);
//     const image = document.getElementById("pImage").value.trim();
//     const description = document.getElementById("pDesc").value.trim();

//     if (!name) { toast("Vui lòng nhập tên sản phẩm!", "error"); return; }
//     if (!price || price <= 0) { toast("Vui lòng nhập giá hợp lệ!", "error"); return; }

//     let payload = { name, price, category, isClothing, image, description };

//     if (isClothing === 1) {
//         payload.sizes = [
//             { size: "S",   quantity: Number(document.getElementById("pS").value)   || 0 },
//             { size: "M",   quantity: Number(document.getElementById("pM").value)   || 0 },
//             { size: "L",   quantity: Number(document.getElementById("pL").value)   || 0 },
//             { size: "XL",  quantity: Number(document.getElementById("pXL").value)  || 0 },
//             { size: "XXL", quantity: Number(document.getElementById("pXXL").value) || 0 },
//         ];
//     } else {
//         payload.quantity = Number(document.getElementById("pQuantity").value) || 0;
//     }

//     const isEdit = editId !== "";
//     const url = isEdit ? `${API}/admin/updateProduct` : `${API}/admin/addProduct`;
//     if (isEdit) payload.id = Number(editId);

//     fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//     })
//     .then(r => r.json())
//     .then(data => {
//         if (data.success || data.ok || !data.error) {
//             closeModal("productModal");
//             toast(isEdit ? "Đã cập nhật sản phẩm thành công!" : "Đã thêm sản phẩm mới!");
//             loadProducts();
//         } else {
//             toast(data.message || "Có lỗi xảy ra!", "error");
//         }
//     })
//     .catch(() => toast("Lỗi kết nối server!", "error"));
// }

// // ---- DELETE PRODUCT ----
// function confirmDeleteProduct(id, name) {
//     document.getElementById("confirmText").innerHTML =
//         `Bạn có chắc muốn xoá sản phẩm<br><strong>"${name}"</strong>?<br><br>Hành động này không thể hoàn tác.`;
//     const btn = document.getElementById("confirmOkBtn");
//     btn.onclick = () => deleteProduct(id, name);
//     openModal("confirmModal");
// }

// function deleteProduct(id, name) {
//     fetch(`${API}/admin/deleteProduct`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id })
//     })
//     .then(r => r.json())
//     .then(data => {
//         if (data.success || data.ok || !data.error) {
//             closeModal("confirmModal");
//             toast(`Đã xoá sản phẩm "${name}"!`);
//             loadProducts();
//         } else {
//             toast(data.message || "Không thể xoá sản phẩm!", "error");
//         }
//     })
//     .catch(() => toast("Lỗi kết nối server!", "error"));
// }

// // ================================================================
// //  REVIEWS
// // ================================================================
// let allReviews = [];
// let currentReplyId = null;

// function loadReviews() {
//     fetch(`${API}/admin/reviews`)
//         .then(r => r.json())
//         .then(list => {
//             allReviews = list;

//             // Badge: chưa phản hồi
//             const unread = list.filter(r => !r.Reply).length;
//             const badge = document.getElementById("reviewBadge");
//             if (badge) {
//                 badge.textContent = unread;
//                 badge.style.display = unread > 0 ? "inline-flex" : "none";
//             }

//             const countEl = document.getElementById("reviewCount");
//             if (countEl) countEl.textContent = `${list.length} đánh giá · ${unread} chưa phản hồi`;

//             renderReviews(list);
//         })
//         .catch(() => {
//             const el = document.getElementById("reviewsBody");
//             if (el) el.innerHTML = `<tr class="loading-row"><td colspan="7">❌ Không thể tải đánh giá</td></tr>`;
//         });
// }

// function starsHtml(rating) {
//     return [1,2,3,4,5].map(i =>
//         `<i class="fas fa-star" style="color:${i <= rating ? '#f4a61e' : 'var(--border)'};font-size:12px"></i>`
//     ).join("");
// }

// function renderReviews(list) {
//     const tbody = document.getElementById("reviewsBody");
//     if (!list || !list.length) {
//         tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Chưa có đánh giá nào</td></tr>`;
//         return;
//     }

//     tbody.innerHTML = list.map(r => {
//         const date = r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString("vi-VN") : "—";
//         const hasReply = !!r.Reply;
//         const statusBadgeHtml = hasReply
//             ? `<span class="badge badge-delivered">Đã phản hồi</span>`
//             : `<span class="badge badge-pending">Chưa phản hồi</span>`;

//         const replyPreview = hasReply
//             ? `<div style="margin-top:5px;font-size:11px;color:var(--red);font-style:italic;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
//                 <i class="fas fa-store" style="margin-right:3px"></i>${escAdminHtml(r.Reply)}
//                </div>`
//             : "";

//         return `
//             <tr>
//                 <td>
//                     <div style="font-weight:600;font-size:13px">${escAdminHtml(r.Username || "Khách")}</div>
//                 </td>
//                 <td style="max-width:160px">
//                     <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${escAdminHtml(r.ProductName || "—")}</div>
//                 </td>
//                 <td>
//                     <div style="display:flex;gap:2px">${starsHtml(r.Rating)}</div>
//                 </td>
//                 <td style="max-width:220px">
//                     <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px">${escAdminHtml(r.Content)}</div>
//                     ${replyPreview}
//                 </td>
//                 <td style="color:var(--text3);font-size:12px;white-space:nowrap">${date}</td>
//                 <td>${statusBadgeHtml}</td>
//                 <td>
//                     <button class="btn btn-info btn-sm" onclick="openReplyModal(${r.Id})">
//                         <i class="fas fa-${hasReply ? 'pen' : 'reply'}"></i>
//                         ${hasReply ? "Sửa" : "Phản hồi"}
//                     </button>
//                 </td>
//             </tr>
//         `;
//     }).join("");
// }

// function filterReviews() {
//     const rating = document.getElementById("reviewRatingFilter").value;
//     const replied = document.getElementById("reviewReplyFilter").value;

//     const filtered = allReviews.filter(r => {
//         const matchRating = !rating || r.Rating === parseInt(rating);
//         const matchReply  = replied === "" ? true
//             : replied === "0" ? !r.Reply
//             : !!r.Reply;
//         return matchRating && matchReply;
//     });

//     renderReviews(filtered);
//     document.getElementById("reviewCount").textContent =
//         `${filtered.length} / ${allReviews.length} đánh giá`;
// }

// function openReplyModal(id) {
//     const r = allReviews.find(x => x.Id === id);
//     if (!r) return;

//     currentReplyId = id;

//     document.getElementById("replyReviewerName").textContent = r.Username || "Khách hàng";
//     document.getElementById("replyReviewStars").innerHTML = starsHtml(r.Rating);
//     document.getElementById("replyReviewContent").textContent = r.Content;
//     document.getElementById("replyReviewProduct").textContent = r.ProductName ? `Sản phẩm: ${r.ProductName}` : "";
//     document.getElementById("replyContent").value = r.Reply || "";
//     document.getElementById("replyCharCount").textContent = (r.Reply || "").length;

//     openModal("replyModal");
// }

// document.getElementById("replyContent").addEventListener("input", function() {
//     document.getElementById("replyCharCount").textContent = this.value.length;
// });

// function submitReply() {
//     const reply = document.getElementById("replyContent").value.trim();
//     if (!reply) { toast("Vui lòng nhập nội dung phản hồi!", "error"); return; }

//     const btn = document.querySelector("#replyModal .btn-primary");
//     btn.disabled = true;

//     fetch(`${API}/admin/replyReview`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id: currentReplyId, reply })
//     })
//     .then(r => r.json())
//     .then(() => {
//         btn.disabled = false;
//         closeModal("replyModal");
//         toast("Đã gửi phản hồi từ ShopMU!");
//         loadReviews();
//     })
//     .catch(() => {
//         btn.disabled = false;
//         toast("Lỗi kết nối server!", "error");
//     });
// }

// function escAdminHtml(s) {
//     return String(s || "")
//         .replace(/&/g,"&amp;").replace(/</g,"&lt;")
//         .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
// }

// // ================================================================
// //  INIT
// // ================================================================
// function loadAll() {
//     loadRevenue();
//     loadOrders();
//     loadProducts();
//     loadReviews();
// }

// loadAll();
// ================================================================
//  ADMIN DASHBOARD — admin.js (ĐÃ SỬA)
//  - Sửa lỗi hiển thị giá sản phẩm
//  - Đồng bộ sessionStorage, isAdmin
//  - Sửa endpoint lấy chi tiết đơn hàng
//  - Ánh xạ đúng phương thức thanh toán
// ================================================================

// ================================================================
//  ADMIN DASHBOARD — ĐÃ CẬP NHẬT THÊM/SỬA/XÓA SẢN PHẨM
// ================================================================

const API = "http://localhost:8888";

// ---- AUTH CHECK ----
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || !user.isAdmin) {
    window.location.href = "./index.html";
}
if (user && user.Username) {
    const el = document.getElementById("adminName");
    if (el) el.textContent = user.Username;
}

// ========== UTILS ==========
function fmt(n) {
    if (n == null || n === "" || n === "—") return "—";
    return Number(n).toLocaleString("vi-VN") + "₫";
}

function statusBadge(s) {
    const map = {
        "Pending":   ["badge-pending",   "Chờ xác nhận"],
        "Shipping":  ["badge-shipping",  "Đang giao"],
        "Delivered": ["badge-delivered", "Đã giao"],
        "Cancelled": ["badge-cancelled", "Đã huỷ"],
    };
    const [cls, label] = map[s] || ["badge-pending", s];
    return `<span class="badge ${cls}">${label}</span>`;
}

function paymentLabel(p) {
    const map = {
        "cod": "COD (Tiền mặt)",
        "banking": "Chuyển khoản",
        "momo": "Ví MoMo",
        "zalopay": "ZaloPay"
    };
    return map[p?.toLowerCase()] || p || "—";
}

function toast(msg, type = "success") {
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-xmark";
    const div = document.createElement("div");
    div.className = `toast ${type}`;
    div.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    document.getElementById("toastContainer").appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", function (e) {
        if (e.target === this) closeModal(this.id);
    });
});

function switchTab(name, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    if (btn) btn.classList.add("active");
    const titles = { overview: "Dashboard", orders: "Đơn hàng", products: "Sản phẩm", reviews: "Đánh giá", contacts: "Thắc mắc & Liên hệ" };
    document.getElementById("topbarTitle").textContent = titles[name] || name;
}

function logout() {
    sessionStorage.removeItem("user");
    window.location.href = "./dangnhap/dangnhap.html";
}

// ========== REVENUE ==========
function loadRevenue() {
    fetch(`${API}/admin/revenue`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("today").textContent = fmt(d.today);
            document.getElementById("week").textContent  = fmt(d.week);
            document.getElementById("month").textContent = fmt(d.month);
            document.getElementById("year").textContent  = fmt(d.year);
        })
        .catch(() => console.error("Revenue load failed"));
}

// ========== ORDERS (giữ nguyên) ==========
let allOrders = [];
function loadOrders() {
    fetch(`${API}/admin/orders`)
        .then(r => r.json())
        .then(list => {
            allOrders = list;
            const pending = list.filter(o => o.Status === "Pending").length;
            const badge = document.getElementById("pendingBadge");
            if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? "inline-flex" : "none"; }
            document.getElementById("orderCount").textContent = `${list.length} đơn hàng`;
            renderRecentOrders(list.slice(0, 10));
            renderOrders(list);
        })
        .catch(() => { /* lỗi bỏ qua */ });
}

function renderRecentOrders(list) {
    const tbody = document.getElementById("recentOrdersBody");
    if (!list.length) { tbody.innerHTML = `<tr class="loading-row"><td colspan="6">Chưa có đơn hàng nào</td></tr>`; return; }
    tbody.innerHTML = list.map(o => `
        <tr>
            <td><strong>#${o.Id}</strong></td>
            <td>${o.CustomerName || "—"}</td>
            <td style="color:var(--red);font-weight:700">${fmt(o.Total)}</td>
            <td><span style="font-size:12px;font-weight:600">${paymentLabel(o.PaymentMethod)}</span></td>
            <td>${statusBadge(o.Status)}</td>
            <td><button class="btn btn-info btn-sm" onclick="viewOrder(${o.Id})"><i class="fas fa-eye"></i> Chi tiết</button></td>
        </tr>
    `).join("");
}

function renderOrders(list) {
    const tbody = document.getElementById("ordersBody");
    if (!list.length) { tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Không có đơn hàng nào</td></tr>`; return; }
    tbody.innerHTML = list.map(o => `
        <tr>
            <td><strong>#${o.Id}</strong></td>
            <td>${o.CustomerName || "—"}</td>
            <td>${o.Phone || "—"}</td>
            <td style="color:var(--red);font-weight:700">${fmt(o.Total)}</td>
            <td>${paymentLabel(o.PaymentMethod)}</td>
            <td>${statusBadge(o.Status)}</td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn btn-info btn-sm" onclick="viewOrder(${o.Id})"><i class="fas fa-eye"></i> Chi tiết</button>
                    ${o.Status === "Pending" ? `<button class="btn btn-warning btn-sm" onclick="quickStatus(${o.Id},'Shipping')"><i class="fas fa-truck"></i></button>` : ""}
                    ${o.Status === "Shipping" ? `<button class="btn btn-success btn-sm" onclick="quickStatus(${o.Id},'Delivered')"><i class="fas fa-check"></i></button>` : ""}
                    ${(o.Status === "Pending" || o.Status === "Shipping") ? `<button class="btn btn-danger btn-sm" onclick="quickStatus(${o.Id},'Cancelled')"><i class="fas fa-ban"></i></button>` : ""}
                </div>
            </td>
        </tr>
    `).join("");
}

function filterOrders() {
    const q = (document.getElementById("orderSearch").value || "").toLowerCase();
    const st = document.getElementById("orderStatusFilter").value;
    const filtered = allOrders.filter(o => {
        const matchQ = !q || String(o.Id).includes(q) || (o.CustomerName || "").toLowerCase().includes(q) || (o.Phone || "").includes(q);
        const matchSt = !st || o.Status === st;
        return matchQ && matchSt;
    });
    renderOrders(filtered);
    document.getElementById("orderCount").textContent = `${filtered.length} / ${allOrders.length} đơn hàng`;
}

function viewOrder(id) {
    const o = allOrders.find(x => x.Id === id);
    if (!o) return;
    document.getElementById("modalOrderId").textContent = `#${id}`;
    fetch(`${API}/order/${id}`).then(r => r.json()).then(orderWithItems => buildOrderModal(o, orderWithItems.items || [])).catch(() => buildOrderModal(o, []));
    openModal("orderModal");
}

function buildOrderModal(o, items) {
    const body = document.getElementById("orderModalBody");
    const footer = document.getElementById("orderModalFooter");
    const itemsSubtotal = items.reduce((s, i) => s + (i.Price * i.Quantity), 0);
    const shippingFee = (items.length && o.Total > itemsSubtotal) ? o.Total - itemsSubtotal : 0;
    const itemsHTML = items.length ? items.map(item => `
        <div class="order-item-row">
            ${item.Image ? `<img src="${item.Image}" class="order-item-img" onerror="this.style.display='none'">` : `<div class="order-item-img" style="display:flex;align-items:center;justify-content:center;color:var(--text3)"><i class="fas fa-image"></i></div>`}
            <div class="order-item-info">
                <div class="name">${item.ProductName || "Sản phẩm"}</div>
                <div class="meta">${item.Size ? `Size: ${item.Size} · ` : ""}Số lượng: ${item.Quantity}</div>
            </div>
            <div class="order-item-price">${fmt(item.Price * item.Quantity)}</div>
        </div>
    `).join("") : `<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">Không có dữ liệu sản phẩm</div>`;
    body.innerHTML = `
        <div class="order-detail-grid">
            <div class="info-card">
                <div class="info-card-title"><i class="fas fa-user"></i> Thông tin khách hàng</div>
                <div class="info-row"><span class="label">Họ tên</span><span class="value">${o.CustomerName || "—"}</span></div>
                <div class="info-row"><span class="label">SĐT</span><span class="value">${o.Phone || "—"}</span></div>
                <div class="info-row"><span class="label">Email</span><span class="value">${o.Email || "—"}</span></div>
                <div class="info-row"><span class="label">Địa chỉ</span><span class="value" style="max-width:180px;text-align:right">${o.Address || "—"}</span></div>
            </div>
            <div class="info-card">
                <div class="info-card-title"><i class="fas fa-file-invoice"></i> Thông tin đơn hàng</div>
                <div class="info-row"><span class="label">Mã đơn</span><span class="value" style="color:var(--red);font-weight:800">#${o.Id}</span></div>
                <div class="info-row"><span class="label">Thanh toán</span><span class="value">${paymentLabel(o.PaymentMethod)}</span></div>
                <div class="info-row"><span class="label">Trạng thái</span><span class="value">${statusBadge(o.Status)}</span></div>
                <div class="info-row"><span class="label">Ngày đặt</span><span class="value">${o.OrderDate ? new Date(o.OrderDate).toLocaleDateString("vi-VN") : "—"}</span></div>
            </div>
        </div>

        <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:10px">
            Sản phẩm đặt mua
        </div>
        <div class="order-items-list">${itemsHTML}</div>

        <div class="total-summary">
            ${items.length ? `
            <div class="row"><span>Tiền hàng</span><span>${fmt(itemsSubtotal)}</span></div>
            ${shippingFee > 0 ? `<div class="row"><span>Phí vận chuyển</span><span>${fmt(shippingFee)}</span></div>` : ""}
            ` : ""}
            <div class="row"><span>Tổng thanh toán</span><span>${fmt(o.Total)}</span></div>
        </div>

        ${o.Status !== "Delivered" && o.Status !== "Cancelled" ? `
        <div>
            <div class="status-actions-title">Cập nhật trạng thái đơn hàng</div>
            <div class="status-action-grid">
                ${o.Status === "Pending" ? `
                <button class="btn btn-warning" onclick="updateOrderStatus(${o.Id},'Shipping')">
                    <i class="fas fa-truck"></i> Xác nhận giao hàng
                </button>
                <button class="btn btn-danger" onclick="updateOrderStatus(${o.Id},'Cancelled')">
                    <i class="fas fa-ban"></i> Huỷ đơn
                </button>
                ` : ""}
                ${o.Status === "Shipping" ? `
                <button class="btn btn-success" onclick="updateOrderStatus(${o.Id},'Delivered')">
                    <i class="fas fa-check-circle"></i> Đã giao thành công
                </button>
                <button class="btn btn-danger" onclick="updateOrderStatus(${o.Id},'Cancelled')">
                    <i class="fas fa-ban"></i> Huỷ đơn
                </button>
                ` : ""}
            </div>
        </div>
        ` : `
        <div style="background:var(--off-white);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:13px;color:var(--text2);text-align:center;font-weight:600">
            <i class="fas ${o.Status === 'Delivered' ? 'fa-circle-check' : 'fa-circle-xmark'}" style="margin-right:6px;color:${o.Status === 'Delivered' ? '#059669' : 'var(--red)'}"></i>
            Đơn hàng đã ${o.Status === "Delivered" ? "được giao thành công" : "bị huỷ"}
        </div>
        `}
    `;
    footer.innerHTML = `<button class="btn btn-ghost" onclick="closeModal('orderModal')">Đóng</button>`;
}

function updateOrderStatus(id, status) {
    fetch(`${API}/admin/updateOrder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
        .then(() => { closeModal("orderModal"); toast(`Đã cập nhật đơn #${id}`); loadOrders(); })
        .catch(() => toast("Lỗi!", "error"));
}
function quickStatus(id, status) { updateOrderStatus(id, status); }
function statusLabel(s) { return { Pending:"Chờ", Shipping:"Đang giao", Delivered:"Đã giao", Cancelled:"Đã huỷ" }[s] || s; }

// ========== PRODUCTS (quản lý sản phẩm) ==========
let allProducts = [];
let categories = [];

function loadCategories() {
    fetch(`${API}/categories`)
        .then(r => r.json())
        .then(data => {
            categories = data;
            const catSelect = document.getElementById("pCategory");
            if (catSelect) {
                catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
                categories.forEach(c => {
                    catSelect.innerHTML += `<option value="${c.Id}">${c.Name}</option>`;
                });
            }
        })
        .catch(() => console.error("Không thể tải categories"));
}

function loadProducts() {
    fetch(`${API}/admin/products`)
        .then(r => r.json())
        .then(list => {
            const grouped = {};
            list.forEach(p => {
                if (!grouped[p.Id]) {
                    grouped[p.Id] = {
                        id: p.Id, name: p.Name, price: p.Price, category: p.Category, categoryId: p.CategoryId,
                        isClothing: p.IsClothing, quantity: p.Quantity, image: p.Image, description: p.Description, sizes: []
                    };
                }
                if (p.Size) grouped[p.Id].sizes.push({ size: p.Size, quantity: p.SizeQuantity });
            });
            allProducts = Object.values(grouped);
            document.getElementById("productCount").textContent = `${allProducts.length} sản phẩm`;
            renderProducts(allProducts);
        })
        .catch(() => {
            document.getElementById("productsBody").innerHTML = `<tr class="loading-row"><td colspan="6">❌ Không thể tải sản phẩm</td></tr>`;
        });
}

function renderProducts(list) {
    const tbody = document.getElementById("productsBody");
    if (!list.length) { tbody.innerHTML = `<tr class="loading-row"><td colspan="6">Không có sản phẩm nào</td></tr>`; return; }
    tbody.innerHTML = list.map(p => {
        let stock = "";
        if (p.isClothing == 1 && p.sizes.length) {
            stock = `<div style="display:flex;flex-wrap:wrap;gap:2px">${p.sizes.map(s => `<span style="background:var(--off-white);border:1px solid var(--border);border-radius:4px;padding:1px 7px;font-size:11px;margin:1px;font-weight:600">${s.size}:${s.quantity}</span>`).join("")}</div>`;
        } else {
            const qty = p.quantity || 0;
            const color = qty <= 5 ? "var(--red)" : qty <= 20 ? "var(--gold-dark)" : "#059669";
            stock = `<span style="color:${color};font-weight:600">${qty}</span>`;
        }
        const cat = p.category || "—";
        return `
            <tr>
                <td style="color:var(--text3);font-weight:700">#${p.id}</td>
                <td><div style="display:flex;align-items:center;gap:10px">${p.image ? `<img src="${p.image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display='none'">` : ""}<strong>${p.name}</strong></div></td>
                <td style="color:var(--red);font-weight:700">${fmt(p.price)}</td>
                <td><span style="font-size:12px;color:var(--text2)">${cat}</span></td>
                <td>${stock}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-warning btn-sm" onclick="openEditProduct(${p.id})"><i class="fas fa-pen"></i> Sửa</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct(${p.id},'${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function filterProducts() {
    const q = (document.getElementById("productSearch").value || "").toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) || String(p.id).includes(q));
    renderProducts(filtered);
    document.getElementById("productCount").textContent = `${filtered.length} / ${allProducts.length} sản phẩm`;
}

function openAddProduct() {
    document.getElementById("productModalTitle").textContent = "Thêm sản phẩm mới";
    document.getElementById("pEditId").value = "";
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pCategory").value = "";
    document.getElementById("pIsClothing").value = "1";
    document.getElementById("pQuantity").value = "";
    document.getElementById("pS").value = ""; document.getElementById("pM").value = ""; document.getElementById("pL").value = "";
    document.getElementById("pXL").value = ""; document.getElementById("pXXL").value = "";
    document.getElementById("pImage").value = "";
    document.getElementById("pDesc").value = "";
    toggleSizeFields();
    if (categories.length === 0) loadCategories();
    openModal("productModal");
}

function openEditProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById("productModalTitle").textContent = "Chỉnh sửa sản phẩm";
    document.getElementById("pEditId").value = id;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pCategory").value = p.categoryId || "";
    document.getElementById("pIsClothing").value = p.isClothing != null ? String(p.isClothing) : "1";
    document.getElementById("pQuantity").value = p.quantity || "";
    document.getElementById("pImage").value = p.image || "";
    document.getElementById("pDesc").value = p.description || "";
    const sizeMap = {};
    p.sizes.forEach(s => sizeMap[s.size] = s.quantity);
    document.getElementById("pS").value = sizeMap["S"] || "";
    document.getElementById("pM").value = sizeMap["M"] || "";
    document.getElementById("pL").value = sizeMap["L"] || "";
    document.getElementById("pXL").value = sizeMap["XL"] || "";
    document.getElementById("pXXL").value = sizeMap["XXL"] || "";
    toggleSizeFields();
    if (categories.length === 0) loadCategories();
    openModal("productModal");
}

function toggleSizeFields() {
    const isClothing = document.getElementById("pIsClothing").value === "1";
    document.getElementById("pSizesGroup").style.display = isClothing ? "block" : "none";
    document.getElementById("pQuantityGroup").style.display = isClothing ? "none" : "block";
}

function saveProduct() {
    const editId = document.getElementById("pEditId").value;
    const name = document.getElementById("pName").value.trim();
    const price = Number(document.getElementById("pPrice").value);
    const categoryId = document.getElementById("pCategory").value;
    const isClothing = Number(document.getElementById("pIsClothing").value);
    const image = document.getElementById("pImage").value.trim();
    const description = document.getElementById("pDesc").value.trim();

    if (!name) { toast("Vui lòng nhập tên sản phẩm!", "error"); return; }
    if (!price || price <= 0) { toast("Vui lòng nhập giá hợp lệ!", "error"); return; }

    let payload = { name, price, categoryId: categoryId ? Number(categoryId) : null, isClothing, image, description };
    if (isClothing === 1) {
        payload.sizes = [
            { size: "S",   quantity: Number(document.getElementById("pS").value)   || 0 },
            { size: "M",   quantity: Number(document.getElementById("pM").value)   || 0 },
            { size: "L",   quantity: Number(document.getElementById("pL").value)   || 0 },
            { size: "XL",  quantity: Number(document.getElementById("pXL").value)  || 0 },
            { size: "XXL", quantity: Number(document.getElementById("pXXL").value) || 0 },
        ];
    } else {
        payload.quantity = Number(document.getElementById("pQuantity").value) || 0;
    }

    const isEdit = editId !== "";
    const url = isEdit ? `${API}/admin/updateProduct` : `${API}/admin/addProduct`;
    if (isEdit) payload.id = Number(editId);

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeModal("productModal");
            toast(isEdit ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm mới!");
            loadProducts();
        } else {
            toast(data.message || "Có lỗi xảy ra!", "error");
        }
    })
    .catch(() => toast("Lỗi kết nối server!", "error"));
}

function confirmDeleteProduct(id, name) {
    document.getElementById("confirmText").innerHTML = `Bạn có chắc muốn xoá sản phẩm<br><strong>"${name}"</strong>?<br><br>Hành động này không thể hoàn tác.`;
    const btn = document.getElementById("confirmOkBtn");
    btn.onclick = () => deleteProduct(id, name);
    openModal("confirmModal");
}

function deleteProduct(id, name) {
    fetch(`${API}/admin/deleteProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeModal("confirmModal");
            toast(`Đã xoá sản phẩm "${name}"!`);
            loadProducts();
        } else {
            toast(data.message || "Không thể xoá sản phẩm!", "error");
        }
    })
    .catch(() => toast("Lỗi kết nối server!", "error"));
}

// ========== COUPONS ==========
let allCoupons = [];

function couponDiscountLabel(c) {
    if (c.DiscountType === "percentage") {
        const cap = c.MaxDiscountAmount ? `, tối đa ${fmt(c.MaxDiscountAmount)}` : "";
        return `${Number(c.DiscountValue)}%${cap}`;
    }
    return fmt(c.DiscountValue);
}

function couponStatusBadge(c) {
    const expired = new Date(c.EndDate) < new Date();
    if (!c.IsActive) return '<span class="badge badge-cancelled">Đã tắt</span>';
    if (expired) return '<span class="badge badge-cancelled">Hết hạn</span>';
    return '<span class="badge badge-delivered">Đang hoạt động</span>';
}

function dateInputValue(value) {
    if (!value) return "";
    const d = new Date(value);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function loadCoupons() {
    fetch(`${API}/api/admin/coupons`)
        .then(r => r.json())
        .then(list => {
            allCoupons = Array.isArray(list) ? list : [];
            const active = allCoupons.filter(c => c.IsActive).length;
            const totalDiscount = allCoupons.reduce((sum, c) => sum + Number(c.TotalDiscount || 0), 0);
            const best = [...allCoupons].sort((a, b) => Number(b.CurrentUsage || 0) - Number(a.CurrentUsage || 0))[0];
            document.getElementById("couponTotal").textContent = allCoupons.length;
            document.getElementById("couponActive").textContent = active;
            document.getElementById("couponDiscountTotal").textContent = fmt(totalDiscount);
            document.getElementById("couponBest").textContent = best ? best.Code : "-";
            document.getElementById("couponCount").textContent = `${allCoupons.length} mã`;
            renderCoupons(allCoupons);
        })
        .catch(() => {
            const body = document.getElementById("couponsBody");
            if (body) body.innerHTML = `<tr class="loading-row"><td colspan="7">Không thể tải mã giảm giá</td></tr>`;
        });
}

function renderCoupons(list) {
    const tbody = document.getElementById("couponsBody");
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Chưa có mã giảm giá</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong style="font-family:monospace;font-size:14px;color:var(--red)">${escHtml(c.Code)}</strong><div style="font-size:11px;color:var(--text3);margin-top:3px">${escHtml(c.Title || "")}</div></td>
            <td>${couponDiscountLabel(c)}</td>
            <td>${fmt(c.MinOrderAmount)}</td>
            <td>${c.EndDate ? new Date(c.EndDate).toLocaleDateString("vi-VN") : "-"}</td>
            <td><strong>${c.CurrentUsage || 0}</strong> / ${c.MaxTotalUsage || 0}</td>
            <td>${couponStatusBadge(c)}</td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn btn-warning btn-sm" onclick="openEditCoupon(${c.Id})"><i class="fas fa-pen"></i> Sửa</button>
                    <button class="btn btn-${c.IsActive ? "info" : "success"} btn-sm" onclick="toggleCoupon(${c.Id})"><i class="fas fa-power-off"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteCoupon(${c.Id}, '${String(c.Code).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join("");
}

function filterCoupons() {
    const q = (document.getElementById("couponSearch").value || "").toLowerCase();
    const st = document.getElementById("couponStatusFilter").value;
    const filtered = allCoupons.filter(c => {
        const matchQ = !q || String(c.Code || "").toLowerCase().includes(q) || String(c.Title || "").toLowerCase().includes(q);
        const matchSt = !st || (st === "active" ? c.IsActive : !c.IsActive);
        return matchQ && matchSt;
    });
    renderCoupons(filtered);
    document.getElementById("couponCount").textContent = `${filtered.length} / ${allCoupons.length} mã`;
}

function openAddCoupon() {
    document.getElementById("couponModalTitle").textContent = "Tạo mã giảm giá";
    document.getElementById("cEditId").value = "";
    document.getElementById("cCode").value = "";
    document.getElementById("cTitle").value = "";
    document.getElementById("cDescription").value = "";
    document.getElementById("cDiscountType").value = "percentage";
    document.getElementById("cDiscountValue").value = "";
    document.getElementById("cMaxDiscount").value = "";
    document.getElementById("cMinOrder").value = "0";
    document.getElementById("cMaxOrder").value = "";
    document.getElementById("cMaxTotalUsage").value = "100";
    document.getElementById("cMaxUsagePerCustomer").value = "1";
    document.getElementById("cApplicableTo").value = "all";
    document.getElementById("cIsActive").checked = true;
    document.getElementById("cIsVisible").checked = true;
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    document.getElementById("cStartDate").value = dateInputValue(now);
    document.getElementById("cEndDate").value = dateInputValue(end);
    openModal("couponModal");
}

function openEditCoupon(id) {
    const c = allCoupons.find(x => x.Id === id);
    if (!c) return;
    document.getElementById("couponModalTitle").textContent = "Sửa mã giảm giá";
    document.getElementById("cEditId").value = c.Id;
    document.getElementById("cCode").value = c.Code || "";
    document.getElementById("cTitle").value = c.Title || "";
    document.getElementById("cDescription").value = c.Description || "";
    document.getElementById("cDiscountType").value = c.DiscountType || "percentage";
    document.getElementById("cDiscountValue").value = c.DiscountValue || "";
    document.getElementById("cMaxDiscount").value = c.MaxDiscountAmount || "";
    document.getElementById("cMinOrder").value = c.MinOrderAmount || 0;
    document.getElementById("cMaxOrder").value = c.MaxOrderAmount || "";
    document.getElementById("cStartDate").value = dateInputValue(c.StartDate);
    document.getElementById("cEndDate").value = dateInputValue(c.EndDate);
    document.getElementById("cMaxTotalUsage").value = c.MaxTotalUsage || 1;
    document.getElementById("cMaxUsagePerCustomer").value = c.MaxUsagePerCustomer || 1;
    document.getElementById("cApplicableTo").value = c.ApplicableTo || "all";
    document.getElementById("cIsActive").checked = !!c.IsActive;
    document.getElementById("cIsVisible").checked = !!c.IsVisible;
    openModal("couponModal");
}

function couponPayload() {
    return {
        code: document.getElementById("cCode").value.trim(),
        title: document.getElementById("cTitle").value.trim(),
        description: document.getElementById("cDescription").value.trim(),
        discount_type: document.getElementById("cDiscountType").value,
        discount_value: Number(document.getElementById("cDiscountValue").value),
        max_discount_amount: document.getElementById("cMaxDiscount").value ? Number(document.getElementById("cMaxDiscount").value) : null,
        min_order_amount: Number(document.getElementById("cMinOrder").value) || 0,
        max_order_amount: document.getElementById("cMaxOrder").value ? Number(document.getElementById("cMaxOrder").value) : null,
        start_date: document.getElementById("cStartDate").value,
        end_date: document.getElementById("cEndDate").value,
        max_total_usage: Number(document.getElementById("cMaxTotalUsage").value) || 1,
        max_usage_per_customer: Number(document.getElementById("cMaxUsagePerCustomer").value) || 1,
        applicable_to: document.getElementById("cApplicableTo").value,
        is_active: document.getElementById("cIsActive").checked,
        is_visible: document.getElementById("cIsVisible").checked,
        created_by: user?.Id || null
    };
}

function saveCoupon() {
    const editId = document.getElementById("cEditId").value;
    const payload = couponPayload();
    if (!payload.code || !payload.discount_value || payload.discount_value <= 0) {
        toast("Vui lòng nhập mã và giá trị giảm hợp lệ", "error");
        return;
    }
    if (!payload.start_date || !payload.end_date || new Date(payload.start_date) >= new Date(payload.end_date)) {
        toast("Ngày kết thúc phải sau ngày bắt đầu", "error");
        return;
    }
    const url = editId ? `${API}/api/admin/coupons/${editId}` : `${API}/api/admin/coupons`;
    fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(async r => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.message || "Không lưu được mã");
        closeModal("couponModal");
        toast(editId ? "Đã cập nhật mã" : "Đã tạo mã giảm giá");
        loadCoupons();
    })
    .catch(err => toast(err.message, "error"));
}

function toggleCoupon(id) {
    const c = allCoupons.find(x => x.Id === id);
    if (!c) return;
    const payload = {
        code: c.Code,
        title: c.Title,
        description: c.Description,
        discount_type: c.DiscountType,
        discount_value: c.DiscountValue,
        max_discount_amount: c.MaxDiscountAmount,
        min_order_amount: c.MinOrderAmount,
        max_order_amount: c.MaxOrderAmount,
        start_date: dateInputValue(c.StartDate),
        end_date: dateInputValue(c.EndDate),
        max_total_usage: c.MaxTotalUsage,
        max_usage_per_customer: c.MaxUsagePerCustomer,
        applicable_to: c.ApplicableTo,
        is_active: !c.IsActive,
        is_visible: c.IsVisible
    };
    fetch(`${API}/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => { toast("Đã cập nhật trạng thái mã"); loadCoupons(); })
      .catch(() => toast("Không thể cập nhật mã", "error"));
}

function confirmDeleteCoupon(id, code) {
    document.getElementById("confirmText").innerHTML = `Bạn có chắc muốn xóa mã<br><strong>${escHtml(code)}</strong>?`;
    document.getElementById("confirmOkBtn").onclick = () => deleteCoupon(id);
    openModal("confirmModal");
}

function deleteCoupon(id) {
    fetch(`${API}/api/admin/coupons/${id}`, { method: "DELETE" })
        .then(async r => {
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Không thể xóa mã");
            closeModal("confirmModal");
            toast("Đã xóa mã");
            loadCoupons();
        })
        .catch(err => toast(err.message, "error"));
}

// ========== REVIEWS (giữ nguyên) ==========
let allReviews = [];
let currentReplyId = null;

function loadReviews() {
    fetch(`${API}/admin/reviews`)
        .then(r => r.json())
        .then(list => {
            allReviews = list;
            const unread = list.filter(r => !r.Reply).length;
            const badge = document.getElementById("reviewBadge");
            if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? "inline-flex" : "none"; }
            document.getElementById("reviewCount").textContent = `${list.length} đánh giá · ${unread} chưa phản hồi`;
            renderReviews(list);
        })
        .catch(() => { /* lỗi */ });
}

function starsHtml(rating) {
    return [1,2,3,4,5].map(i => `<i class="fas fa-star" style="color:${i <= rating ? '#f4a61e' : 'var(--border)'};font-size:12px"></i>`).join("");
}

function renderReviews(list) {
    const tbody = document.getElementById("reviewsBody");
    if (!list.length) { tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Chưa có đánh giá nào</td></tr>`; return; }
    tbody.innerHTML = list.map(r => {
        const hasReply = !!r.Reply;
        const replyPreview = hasReply ? `<div style="margin-top:5px;font-size:11px;color:var(--red);font-style:italic;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><i class="fas fa-store"></i> ${escHtml(r.Reply)}</div>` : "";
        return `
            <tr>
                <td><div style="font-weight:600;font-size:13px">${escHtml(r.Username || "Khách")}</div></td>
                <td><div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${escHtml(r.ProductName || "—")}</div></td>
                <td><div style="display:flex;gap:2px">${starsHtml(r.Rating)}</div></td>
                <td style="max-width:220px;"><div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(r.Content)}</div>${replyPreview}</td>
                <td>${r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString("vi-VN") : "—"}</td>
                <td>${hasReply ? '<span class="badge badge-delivered">Đã phản hồi</span>' : '<span class="badge badge-pending">Chưa phản hồi</span>'}</td>
                <td><button class="btn btn-info btn-sm" onclick="openReviewReplyModal(${r.Id})"><i class="fas fa-${hasReply ? 'pen' : 'reply'}"></i> ${hasReply ? "Sửa" : "Phản hồi"}</button></td>
            </tr>
        `;
    }).join("");
}

function filterReviews() {
    const rating = document.getElementById("reviewRatingFilter").value;
    const replied = document.getElementById("reviewReplyFilter").value;
    const filtered = allReviews.filter(r => {
        const matchRating = !rating || r.Rating === parseInt(rating);
        const matchReply = replied === "" ? true : replied === "0" ? !r.Reply : !!r.Reply;
        return matchRating && matchReply;
    });
    renderReviews(filtered);
    document.getElementById("reviewCount").textContent = `${filtered.length} / ${allReviews.length} đánh giá`;
}

function openReviewReplyModal(id) {
    const r = allReviews.find(x => x.Id === id);
    if (!r) return;
    currentReplyId = id;
    document.getElementById("replyReviewerName").textContent = r.Username || "Khách hàng";
    document.getElementById("replyReviewStars").innerHTML = starsHtml(r.Rating);
    document.getElementById("replyReviewContent").textContent = r.Content;
    document.getElementById("replyReviewProduct").textContent = r.ProductName ? `Sản phẩm: ${r.ProductName}` : "";
    document.getElementById("replyContent").value = r.Reply || "";
    document.getElementById("replyCharCount").textContent = (r.Reply || "").length;
    openModal("replyModal");
}

document.getElementById("replyContent")?.addEventListener("input", function() {
    document.getElementById("replyCharCount").textContent = this.value.length;
});

function submitReply() {
    const reply = document.getElementById("replyContent").value.trim();
    if (!reply) { toast("Vui lòng nhập nội dung phản hồi!", "error"); return; }
    const btn = document.querySelector("#replyModal .btn-primary");
    btn.disabled = true;
    fetch(`${API}/admin/replyReview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentReplyId, reply })
    })
    .then(() => { closeModal("replyModal"); toast("Đã gửi phản hồi!"); loadReviews(); })
    .catch(() => toast("Lỗi kết nối!", "error"))
    .finally(() => btn.disabled = false);
}

function escHtml(s) {
    return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ========== CONTACTS ==========
let currentContactId = null;

function contactStatusBadge(replied) {
    return replied
        ? '<span class="badge badge-delivered">Đã trả</span>'
        : '<span class="badge badge-cancelled">Chưa trả</span>';
}

function loadContacts(status = "") {
    const selectedStatus = status || document.getElementById("contactStatusFilter")?.value || "";
    fetch(`${API}/admin/contacts?status=${encodeURIComponent(selectedStatus)}`)
        .then(r => r.json())
        .then(data => {
            const contacts = Array.isArray(data.contacts) ? data.contacts : [];
            const unanswered = Number(data.pendingCount ?? contacts.filter(c => !c.Replied).length);
            const badge = document.getElementById("contactCount");
            if (badge) {
                badge.textContent = unanswered;
                badge.style.display = unanswered > 0 ? "inline-flex" : "none";
            }
            const summary = document.getElementById("contactSummary");
            if (summary) {
                summary.textContent = `${contacts.length} thắc mắc${selectedStatus ? "" : ` · ${unanswered} chưa trả lời`}`;
            }
            renderContacts(contacts);
        })
        .catch(() => {
            const tbody = document.getElementById("contactsBody");
            if (tbody) tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Không thể tải danh sách thắc mắc</td></tr>`;
        });
}

function renderContacts(contacts) {
    const tbody = document.getElementById("contactsBody");
    if (!tbody) return;
    if (!contacts.length) {
        tbody.innerHTML = `<tr class="loading-row"><td colspan="7">Chưa có thắc mắc nào</td></tr>`;
        return;
    }
    tbody.innerHTML = contacts.map(contact => {
        const content = String(contact.Content || "");
        const preview = content.length > 50 ? `${content.slice(0, 50)}...` : content;
        return `
            <tr>
                <td><strong>${escHtml(contact.Name || "Khách")}</strong></td>
                <td>${escHtml(contact.Email || "—")}</td>
                <td>${escHtml(contact.Phone || "—")}</td>
                <td style="max-width:240px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text2)">${escHtml(preview)}</div></td>
                <td>${contact.CreatedAt ? new Date(contact.CreatedAt).toLocaleDateString("vi-VN") : "—"}</td>
                <td>${contactStatusBadge(contact.Replied)}</td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-info btn-sm" onclick="openReplyModal(${contact.Id})"><i class="fas fa-reply"></i> Xem & Trả lời</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteContact(${contact.Id})"><i class="fas fa-trash"></i> Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function openReplyModal(contactId) {
    currentContactId = contactId;
    fetch(`${API}/admin/contacts/${contactId}`)
        .then(r => r.json())
        .then(contact => {
            if (contact.success === false) {
                toast(contact.message || "Không tìm thấy thắc mắc", "error");
                return;
            }
            document.getElementById("replyContactName").textContent = contact.Name || "Khách";
            document.getElementById("replyContactEmail").textContent = contact.Email || "—";
            document.getElementById("replyContactEmailDisplay").textContent = contact.Email || "—";
            document.getElementById("replyContactPhone").textContent = contact.Phone || "—";
            document.getElementById("replyContactContent").textContent = contact.Content || "";
            document.getElementById("replyContactText").value = "";
            openModal("replyContactModal");
        })
        .catch(() => toast("Không thể tải chi tiết thắc mắc", "error"));
}

function sendReplyContact() {
    const replyText = document.getElementById("replyContactText").value.trim();
    if (!replyText) {
        alert("Vui lòng nhập phản hồi!");
        return;
    }
    const btn = document.querySelector("#replyContactModal .btn-primary");
    if (btn) btn.disabled = true;
    fetch(`${API}/admin/contacts/${currentContactId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast("Phản hồi đã được gửi qua email!", "success");
            closeModal("replyContactModal");
            loadContacts();
        } else {
            toast(data.message || "Lỗi gửi phản hồi", "error");
        }
    })
    .catch(() => toast("Lỗi gửi phản hồi", "error"))
    .finally(() => { if (btn) btn.disabled = false; });
}

function deleteContact(contactId) {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    fetch(`${API}/admin/contacts/${contactId}`, { method: "DELETE" })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                toast("Đã xóa");
                loadContacts();
            } else {
                toast(data.message || "Không thể xóa thắc mắc", "error");
            }
        })
        .catch(() => toast("Không thể xóa thắc mắc", "error"));
}

document.getElementById("contactStatusFilter")?.addEventListener("change", function(e) {
    loadContacts(e.target.value);
});

// ========== INIT ==========
function loadAll() {
    loadRevenue();
    loadOrders();
    loadProducts();
    loadCoupons();
    loadReviews();
    loadContacts();
}
loadAll();
setInterval(() => loadContacts(), 30000);
