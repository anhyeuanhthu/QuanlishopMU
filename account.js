// =====================
// KHỞI TẠO
// =====================
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) window.location.href = "./dangnhap/dangnhap.html";

document.getElementById("sidebarName").textContent = user.Username;

// Cập nhật userMenu header
const userMenu = document.getElementById("userMenu");
if (userMenu) {
    userMenu.innerHTML = `
        <a href="#">${user.Username} <i style="font-size:24px" class="fa-solid fa-circle-user"></i></a>
        <ul class="sub-menu">
            <li class="sub-menu-item"><a href="./account.html">Account</a></li>
            <li class="sub-menu-item"><a href="./account.html?tab=orders">Orders</a></li>
            <li class="sub-menu-item"><a href="#" id="headerLogout">Log Out</a></li>
        </ul>`;
    document.getElementById("headerLogout")?.addEventListener("click", e => {
        e.preventDefault(); sessionStorage.removeItem("user"); window.location.href = "./dangnhap/dangnhap.html";
    });
}

// =====================
// TAB SWITCHING
// =====================
let allOrders = [];
let currentFilter = 'all';

function switchTab(tabName) {
    document.querySelectorAll('.acc-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.acc-nav-item').forEach(n => n.classList.remove('active'));

    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.style.display = 'block';
    const navItem = document.querySelector(`.acc-nav-item[data-tab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    if (tabName === 'orders') loadOrders();
    if (tabName === 'profile') loadUserInfo();
}

document.querySelectorAll('.acc-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        switchTab(item.dataset.tab);
    });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", e => {
    e.preventDefault();
    sessionStorage.removeItem("user");
    window.location.href = "./dangnhap/dangnhap.html";
});

// =====================
// HELPERS
// =====================
const STATUS_MAP = {
    Pending:   { text: 'Chờ xác nhận', cls: 'status-pending',   icon: 'fa-clock' },
    Shipping:  { text: 'Đang giao hàng', cls: 'status-shipping', icon: 'fa-truck' },
    Delivered: { text: 'Đã giao hàng',  cls: 'status-delivered', icon: 'fa-circle-check' },
    Cancelled: { text: 'Đã hủy',        cls: 'status-cancelled', icon: 'fa-circle-xmark' },
};
const PAYMENT_MAP = {
    cod:      'Thanh toán khi nhận hàng (COD)',
    banking:  'Chuyển khoản ngân hàng',
    momo:     'Ví MoMo',
    zalopay:  'ZaloPay',
};

function statusInfo(s) { return STATUS_MAP[s] || { text: s, cls: '', icon: 'fa-circle' }; }
function paymentText(p) { return PAYMENT_MAP[p] || p; }
function fmtDate(d) { return d ? new Date(d).toLocaleString('vi-VN') : '-'; }
function fmtMoney(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }

// =====================
// LOAD ORDERS (danh sách)
// =====================
async function loadOrders() {
    const box = document.getElementById("ordersList");
    box.innerHTML = '<div class="acc-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';
    try {
        const res = await fetch(`http://localhost:8888/orders/${user.Id}`);
        allOrders = await res.json();
        renderOrders();
    } catch (err) {
        box.innerHTML = '<div class="acc-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Lỗi tải đơn hàng</p></div>';
    }
}

function renderOrders() {
    const box = document.getElementById("ordersList");
    const filtered = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.Status === currentFilter);

    if (filtered.length === 0) {
        box.innerHTML = `<div class="acc-empty">
            <i class="fa-solid fa-box-open"></i>
            <p>Không có đơn hàng nào</p>
            <a href="./sanpham/sanpham.html" class="acc-btn-primary" style="display:inline-block;margin-top:12px">Mua sắm ngay</a>
        </div>`;
        return;
    }

    box.innerHTML = filtered.map(order => {
        const s = statusInfo(order.Status);
        return `
        <div class="order-card" onclick="viewOrderDetail(${order.Id})">
            <div class="order-card-header">
                <span class="order-card-id"><i class="fa-solid fa-hashtag"></i> Đơn hàng #${order.Id}</span>
                <span class="order-status-badge ${s.cls}"><i class="fa-solid ${s.icon}"></i> ${s.text}</span>
            </div>
            <div class="order-card-body">
                <div class="order-card-info">
                    <span><i class="fa-regular fa-calendar"></i> ${fmtDate(order.OrderDate)}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${order.Address || '-'}</span>
                    <span><i class="fa-solid fa-credit-card"></i> ${paymentText(order.PaymentMethod)}</span>
                </div>
                <div class="order-card-total">
                    <span class="order-total-label">Tổng tiền</span>
                    <span class="order-total-value">${fmtMoney(order.Total)}</span>
                </div>
            </div>
            <div class="order-card-footer">
                <span class="view-detail-hint">Nhấn để xem chi tiết <i class="fa-solid fa-chevron-right"></i></span>
            </div>
        </div>`;
    }).join('');
}

// Filter tabs
document.querySelectorAll('.oft').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.oft').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.status;
        renderOrders();
    });
});

// =====================
// ORDER DETAIL
// =====================
async function viewOrderDetail(orderId) {
    document.getElementById('tab-orders').style.display = 'none';
    const detailTab = document.getElementById('tab-order-detail');
    detailTab.style.display = 'block';
    detailTab.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('orderTimeline').innerHTML = '<div class="acc-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    document.getElementById('detailItems').innerHTML = '';

    try {
        const res = await fetch(`http://localhost:8888/order/${orderId}`);
        const order = await res.json();
        renderOrderDetail(order);
    } catch (err) {
        document.getElementById('orderTimeline').innerHTML = '<p style="color:red">Lỗi tải chi tiết</p>';
    }
}

function renderOrderDetail(order) {
    const s = statusInfo(order.Status);
    document.getElementById('detailOrderTitle').textContent = `Đơn hàng #${order.Id}`;
    const exportInvoiceBtn = document.getElementById('exportInvoiceBtn');
    if (exportInvoiceBtn) {
        exportInvoiceBtn.onclick = () => exportInvoice(order.Id);
    }
    const badge = document.getElementById('detailStatusBadge');
    badge.textContent = s.text;
    badge.className = `detail-status-badge ${s.cls}`;

    const steps = [
        { key: 'ordered',   label: 'Đơn hàng đã đặt',            icon: 'fa-file-invoice',   time: order.OrderDate },
        { key: 'confirmed', label: 'Đã xác nhận & chuẩn bị hàng',icon: 'fa-box-open',        time: order.Status !== 'Pending' ? order.UpdatedAt : null },
        { key: 'shipping',  label: 'Đang giao hàng',              icon: 'fa-truck',           time: order.Status === 'Shipping' || order.Status === 'Delivered' ? order.UpdatedAt : null },
        { key: 'delivered', label: 'Giao hàng thành công',        icon: 'fa-circle-check',    time: order.Status === 'Delivered' ? order.UpdatedAt : null },
    ];

    const statusStepMap = { Pending: 0, Shipping: 2, Delivered: 3, Cancelled: -1 };
    const currentStep = order.Status === 'Cancelled' ? -1 : (statusStepMap[order.Status] ?? 0);

    if (order.Status === 'Cancelled') {
        document.getElementById('orderTimeline').innerHTML = `
            <div class="timeline-cancelled">
                <i class="fa-solid fa-circle-xmark"></i>
                <p>Đơn hàng đã bị hủy</p>
            </div>`;
    } else {
        document.getElementById('orderTimeline').innerHTML = steps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return `
            <div class="tl-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
                <div class="tl-icon-wrap">
                    <div class="tl-icon"><i class="fa-solid ${step.icon}"></i></div>
                    ${i < steps.length - 1 ? '<div class="tl-line"></div>' : ''}
                </div>
                <div class="tl-label">
                    <span class="tl-label-text">${step.label}</span>
                    ${step.time ? `<span class="tl-time">${fmtDate(step.time)}</span>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    document.getElementById('detailAddress').innerHTML = `
        <p><strong>${order.CustomerName}</strong></p>
        <p><i class="fa-solid fa-phone"></i> ${order.Phone}</p>
        <p><i class="fa-solid fa-envelope"></i> ${order.Email || '-'}</p>
        <p><i class="fa-solid fa-map-pin"></i> ${order.Address}</p>`;

    document.getElementById('detailPayment').innerHTML = `
        <p>${paymentText(order.PaymentMethod)}</p>
        <p style="margin-top:8px;color:#888;font-size:13px">Ngày đặt: ${fmtDate(order.OrderDate)}</p>`;

    const items = order.items || [];
    if (items.length === 0) {
        document.getElementById('detailItems').innerHTML = '<p style="color:#aaa;font-size:14px">Không có dữ liệu sản phẩm</p>';
    } else {
        document.getElementById('detailItems').innerHTML = items.map(item => `
            <div class="detail-item-row">
                ${item.Image ? `<img src="${item.Image}" alt="${item.ProductName}" class="detail-item-img">` : '<div class="detail-item-img-placeholder"><i class="fa-solid fa-shirt"></i></div>'}
                <div class="detail-item-info">
                    <p class="detail-item-name">${item.ProductName}</p>
                    ${item.Size ? `<p class="detail-item-meta">Size: ${item.Size}</p>` : ''}
                    <p class="detail-item-meta">Số lượng: ${item.Quantity}</p>
                </div>
                <div class="detail-item-price">${fmtMoney(item.Price * item.Quantity)}</div>
            </div>`).join('');
    }

    document.getElementById('detailTotal').textContent = fmtMoney(order.Total);
}

function backToOrders() {
    document.getElementById('tab-order-detail').style.display = 'none';
    document.getElementById('tab-orders').style.display = 'block';
}

function exportInvoice(orderId) {
    window.open(`http://localhost:8888/invoice/${orderId}?userId=${user.Id}`, '_blank');
}

// =====================
// PROFILE
// =====================
async function loadUserInfo() {
    try {
        const res = await fetch(`http://localhost:8888/user/${user.Id}`);
        const data = await res.json();
        document.getElementById("updateName").value = data.Username || '';
        document.getElementById("updateEmail").value = data.Email || '';
        if (data.Dob) document.getElementById("updateDob").value = data.Dob.split("T")[0];
    } catch (err) { console.error(err); }
}

document.getElementById("updateProfileBtn").addEventListener("click", async () => {
    const username = document.getElementById("updateName").value.trim();
    const email = document.getElementById("updateEmail").value.trim();
    const dob = document.getElementById("updateDob").value;
    if (!username || !email) { alert("Vui lòng điền đầy đủ thông tin!"); return; }
    try {
        const res = await fetch("http://localhost:8888/updateProfile", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.Id, username, email, dob })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            const updated = { ...user, Username: username, Email: email };
            sessionStorage.setItem("user", JSON.stringify(updated));
            document.getElementById("sidebarName").textContent = username;
        }
    } catch (err) { alert("Lỗi kết nối server!"); }
});

// =====================
// CHANGE PASSWORD
// =====================
document.getElementById("changePassBtn").addEventListener("click", async () => {
    const oldPassword = document.getElementById("oldPass").value;
    const newPassword = document.getElementById("newPass").value;
    const confirmPassword = document.getElementById("confirmPass").value;
    if (!oldPassword || !newPassword || !confirmPassword) { alert("Vui lòng điền đầy đủ!"); return; }
    if (newPassword !== confirmPassword) { alert("Mật khẩu mới không khớp!"); return; }
    if (newPassword.length < 6) { alert("Mật khẩu mới phải ít nhất 6 ký tự!"); return; }
    try {
        const res = await fetch("http://localhost:8888/changePassword", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.Id, oldPassword, newPassword })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            document.getElementById("oldPass").value = "";
            document.getElementById("newPass").value = "";
            document.getElementById("confirmPass").value = "";
        }
    } catch (err) { alert("Lỗi kết nối server!"); }
});

// =====================
// KHỞI ĐỘNG
// =====================
const urlParams = new URLSearchParams(window.location.search);
const initTab = urlParams.get('tab') || 'orders';
switchTab(initTab);
