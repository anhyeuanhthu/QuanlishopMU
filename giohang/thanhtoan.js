// Lấy danh sách sản phẩm từ localStorage (dùng chung)
const checkoutUser = JSON.parse(sessionStorage.getItem("user"));
if (!checkoutUser) {
    sessionStorage.setItem("redirectAfterLogin", "/giohang/giohang.html");
    alert("Vui lòng đăng nhập để thanh toán!");
    window.location.replace("../dangnhap/dangnhap.html");
    throw new Error("Login required for checkout");
}

let checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

if (checkoutItems.length === 0) {
    alert("Không có sản phẩm nào để thanh toán!");
    window.location.href = "./giohang.html";
}

const orderItemsDiv = document.getElementById("orderItems");
const itemsTotalSpan = document.getElementById("itemsTotal");
const shippingFeeSpan = document.getElementById("shippingFee");
const grandTotalSpan = document.getElementById("grandTotal");
const couponCodeInput = document.getElementById("couponCodeInput");
const couponMessage = document.getElementById("couponMessage");
const couponSuggestions = document.getElementById("couponSuggestions");
const discountRow = document.getElementById("discountRow");
const discountLabel = document.getElementById("discountLabel");
const discountAmountSpan = document.getElementById("discountAmount");

let subtotal = 0;
let appliedCoupon = null;

// Hiển thị danh sách sản phẩm
checkoutItems.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    const sizeDisplay = item.size ? `(${item.size})` : "";
    orderItemsDiv.innerHTML += `
        <div class="order-item">
            <span>${item.name} ${sizeDisplay} x${item.quantity}</span>
            <span>${itemTotal.toLocaleString('vi-VN')}₫</span>
        </div>
    `;
});

itemsTotalSpan.innerText = subtotal.toLocaleString('vi-VN') + "₫";

// Hàm tính phí ship
function calculateShippingFee(city) {
    const cityLower = (city || '').toLowerCase().trim();
    if (cityLower.includes('hà nội') || cityLower.includes('ha noi') || cityLower === 'hn')
        return { fee: 20000, note: 'Giao hàng tại Hà Nội - Phí ship 20.000đ' };
    if (cityLower.includes('hồ chí minh') || cityLower.includes('ho chi minh') || cityLower.includes('hcm'))
        return { fee: 20000, note: 'Giao hàng tại Hồ Chí Minh - Phí ship 20.000đ' };
    const majorCities = ['đà nẵng','da nang','hải phòng','hai phong','cần thơ','can tho','huế','hue'];
    for (const c of majorCities)
        if (cityLower.includes(c)) return { fee: 35000, note: `Giao hàng tại ${city} - Phí ship 35.000đ` };
    const remote = ['điện biên','lai châu','sơn la','hà giang','cao bằng','cà mau','bạc liêu'];
    for (const c of remote)
        if (cityLower.includes(c)) return { fee: 80000, note: `Giao hàng tại ${city} - Phí ship 80.000đ` };
    if (cityLower) return { fee: 50000, note: `Giao hàng tại ${city} - Phí ship 50.000đ` };
    return { fee: 0, note: 'Vui lòng nhập Tỉnh/Thành phố để tính phí vận chuyển' };
}

function updateShippingFee() {
    const city = document.getElementById('city')?.value || '';
    const shippingInfo = calculateShippingFee(city);
    const shippingNote = document.getElementById('shippingNote');
    shippingFeeSpan.innerText = shippingInfo.fee.toLocaleString('vi-VN') + "₫";
    const discount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
    grandTotalSpan.innerText = Math.max(0, subtotal + shippingInfo.fee - discount).toLocaleString('vi-VN') + "₫";
    if (shippingNote) {
        shippingNote.innerHTML = `<i class="fas fa-truck"></i> ${shippingInfo.note}`;
        shippingNote.style.backgroundColor = city ? '#f8f9fa' : '#fff3cd';
        shippingNote.style.color = city ? '#666' : '#856404';
    }
    return shippingInfo.fee;
}

const cityInput = document.getElementById('city');
if (cityInput) {
    cityInput.addEventListener('input', updateShippingFee);
    cityInput.addEventListener('blur', updateShippingFee);
}
updateShippingFee();

function showCouponMessage(message, type = "") {
    if (!couponMessage) return;
    couponMessage.textContent = message || "";
    couponMessage.className = `coupon-message ${type}`;
}

function renderAppliedCoupon() {
    if (!discountRow || !discountAmountSpan) return;
    if (!appliedCoupon) {
        discountRow.style.display = "none";
        discountAmountSpan.textContent = "-0₫";
        return;
    }
    discountRow.style.display = "flex";
    discountLabel.textContent = `Giảm giá (-${appliedCoupon.code})`;
    discountAmountSpan.textContent = "-" + Number(appliedCoupon.discount_amount || 0).toLocaleString("vi-VN") + "₫";
}

async function applyCoupon(codeFromChip) {
    const code = (codeFromChip || couponCodeInput?.value || "").trim();
    if (!code) {
        showCouponMessage("Vui lòng nhập mã giảm giá", "error");
        return;
    }
    try {
        const res = await fetch("http://localhost:8888/api/coupons/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, user_id: checkoutUser.Id, order_total: subtotal })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Mã không hợp lệ");
        appliedCoupon = {
            id: data.coupon.Id,
            code: data.coupon.Code,
            discount_amount: data.discount_amount
        };
        if (couponCodeInput) couponCodeInput.value = data.coupon.Code;
        renderAppliedCoupon();
        updateShippingFee();
        showCouponMessage(`Áp dụng thành công, giảm ${Number(data.discount_amount).toLocaleString("vi-VN")}₫`, "success");
    } catch (err) {
        appliedCoupon = null;
        renderAppliedCoupon();
        updateShippingFee();
        showCouponMessage(err.message, "error");
    }
}

async function loadMyCouponSuggestions() {
    if (!couponSuggestions || !checkoutUser?.Id) return;
    try {
        const res = await fetch(`http://localhost:8888/api/customers/${checkoutUser.Id}/coupons`);
        const list = await res.json();
        const usable = Array.isArray(list) ? list.filter(c => Number(c.UsageCount || 0) < Number(c.MaxUsagePerCustomer || 1)) : [];
        if (!usable.length) {
            couponSuggestions.innerHTML = "";
            return;
        }
        couponSuggestions.innerHTML = usable.map(c => `
            <button type="button" class="coupon-chip" onclick="applyCoupon('${String(c.Code).replace(/'/g, "\\'")}')">
                ${c.Code} · ${c.DiscountType === "percentage" ? Number(c.DiscountValue) + "%" : Number(c.DiscountValue).toLocaleString("vi-VN") + "₫"}
            </button>
        `).join("");
    } catch (_err) {
        couponSuggestions.innerHTML = "";
    }
}

loadMyCouponSuggestions();

const couponFromUrl = new URLSearchParams(window.location.search).get("coupon");
if (couponFromUrl && couponCodeInput) {
    couponCodeInput.value = couponFromUrl;
    applyCoupon(couponFromUrl);
}

// Điền thông tin user nếu đăng nhập (dùng sessionStorage)
const user = JSON.parse(sessionStorage.getItem("user"));
if (user) {
    const emailInput = document.getElementById('email');
    if (emailInput && user.Email) emailInput.value = user.Email;
    const fullnameInput = document.getElementById('fullname');
    if (fullnameInput && user.Username) fullnameInput.value = user.Username;

    const userMenu = document.getElementById("userMenu");
    if (userMenu) {
        userMenu.innerHTML = `
            <a href="#">
                ${user.Username}
                <i class="fa-solid fa-circle-user"></i>
            </a>
            <ul class="sub-menu">
                <li class="sub-menu-item"><a href="../account.html">Account</a></li>
                <li class="sub-menu-item"><a href="../account.html?tab=orders">Orders</a></li>
                <li class="sub-menu-item"><a href="#" id="logoutBtn">Log Out</a></li>
            </ul>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function (e) {
            e.preventDefault();
            sessionStorage.removeItem("user");
            window.location.href = "../dangnhap/dangnhap.html";
        });
    }
}

// QR MODAL (giữ nguyên, không liên quan đến session)
let qrCountdownInterval = null;
let pendingOrderData = null;
const METHOD_COLORS = {
    momo: '#AE177B',
    zalopay: '#0068FF',
    banking: '#006C35'
};
const METHOD_LABELS = {
    momo: 'Ví MoMo',
    zalopay: 'ZaloPay',
    banking: 'Ngân hàng'
};

function openQRModal(orderId, amount, method, customerName) {
    const overlay = document.getElementById('qrOverlay');
    const badge = document.getElementById('qrMethodBadge');
    const color = METHOD_COLORS[method] || '#e44d2e';

    badge.textContent = METHOD_LABELS[method] || method;
    badge.style.background = color;
    document.getElementById('qrHeader').style.background = color + '12';

    document.getElementById('qrOrderId').textContent = '#' + orderId;
    document.getElementById('qrCustomerName').textContent = customerName;
    document.getElementById('qrAmount').textContent = amount.toLocaleString('vi-VN') + '₫';

    const confirmBtn = document.getElementById('qrConfirmBtn');
    confirmBtn.style.background = `linear-gradient(135deg, ${color}, ${darkenHex(color)})`;

    document.getElementById('qrLoading').style.display = 'flex';
    document.getElementById('qrImage').style.display = 'none';

    overlay.classList.add('active');
    startCountdown(15 * 60);
    fetchQRCode(orderId, amount, method, customerName);
}

async function fetchQRCode(orderId, amount, method, customerName) {
    try {
        const response = await fetch('http://localhost:9000/generate-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount, method, customerName })
        });
        if (!response.ok) throw new Error('QR Server không phản hồi');
        const data = await response.json();
        if (data.success && data.qrBase64) {
            const img = document.getElementById('qrImage');
            img.src = data.qrBase64;
            img.style.display = 'block';
            document.getElementById('qrLoading').style.display = 'none';
        } else {
            throw new Error('Không tạo được mã QR');
        }
    } catch (err) {
        console.error('[QR] Lỗi:', err);
        document.getElementById('qrLoading').innerHTML = `
            <i class="fas fa-qrcode" style="font-size:80px;color:#ccc"></i>
            <p style="color:#999;font-size:13px;margin-top:8px">
                Không kết nối được QR Server<br>
                <small>Hãy chạy: <code>java -cp out QRServer</code></small>
            </p>
        `;
    }
}

function closeQRModal() {
    document.getElementById('qrOverlay').classList.remove('active');
    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
}

function startCountdown(seconds) {
    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
    let remaining = seconds;
    const el = document.getElementById('qrCountdown');
    function update() {
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        el.textContent = `${m}:${s}`;
        if (remaining === 0) {
            clearInterval(qrCountdownInterval);
            el.textContent = 'HẾT HẠN';
            el.style.color = '#ccc';
            document.getElementById('qrConfirmBtn').disabled = true;
            document.getElementById('qrConfirmBtn').style.opacity = '0.5';
        }
        remaining--;
    }
    update();
    qrCountdownInterval = setInterval(update, 1000);
}

async function confirmQRPayment() {
    if (!pendingOrderData) return;
    const confirmBtn = document.getElementById('qrConfirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Đang xử lý...';
    try {
        const res = await fetch("http://localhost:8888/createOrder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pendingOrderData)
        });
        const data = await res.json();
        if (data.success) {
            closeQRModal();
            const method = pendingOrderData.paymentMethod;
            const methodLabel = METHOD_LABELS[method] || method;
            alert(`✅ ĐẶT HÀNG THÀNH CÔNG!\n\n📦 Mã đơn hàng: ${data.orderId}\n💰 Tổng tiền: ${pendingOrderData.total.toLocaleString('vi-VN')}₫\n💳 Thanh toán: ${methodLabel}\n\nCảm ơn bạn đã mua hàng!`);
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const selectedKeys = checkoutItems.map(item => {
                const sk = (item.size && item.size !== 'null' && item.size.trim()) ? item.size : 'nosize';
                return `${item.id}_${sk}`;
            });
            cart = cart.filter(item => {
                const sk = (item.size && item.size !== 'null' && item.size.trim()) ? item.size : 'nosize';
                return !selectedKeys.includes(`${item.id}_${sk}`);
            });
            localStorage.setItem("cart", JSON.stringify(cart));
            localStorage.removeItem("checkoutItems");
            window.location.href = "../account.html?tab=orders";
        } else {
            alert(data.message || "Đặt hàng thất bại! Vui lòng thử lại.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = '✓ Tôi đã thanh toán xong';
        }
    } catch (err) {
        console.error("Lỗi đặt hàng:", err);
        alert("Lỗi kết nối server! Vui lòng thử lại sau.");
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✓ Tôi đã thanh toán xong';
    }
}

function darkenHex(hex) {
    hex = hex.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0,2),16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2,2),16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4,2),16) - 40);
    return `rgb(${r},${g},${b})`;
}

async function placeOrder() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
        alert("Vui lòng đăng nhập để đặt hàng!");
        window.location.href = "../dangnhap/dangnhap.html";
        return;
    }

    const fullname = document.getElementById("fullname").value.trim();
    const phone    = document.getElementById("phone").value.trim();
    const email    = document.getElementById("email").value.trim();
    const address  = document.getElementById("address").value.trim();
    const city     = document.getElementById("city").value.trim();
    const district = document.getElementById("district").value.trim();

    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    if (!paymentRadio) { alert("Vui lòng chọn phương thức thanh toán"); return; }
    const payment = paymentRadio.value;

    if (!fullname) { alert("Vui lòng nhập họ tên!"); document.getElementById("fullname").focus(); return; }
    if (!phone)    { alert("Vui lòng nhập số điện thoại!"); document.getElementById("phone").focus(); return; }
    if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(phone)) {
        alert("Số điện thoại không hợp lệ! Vui lòng nhập số Việt Nam 10 số (03,05,07,08,09)"); return;
    }
    if (!email) { alert("Vui lòng nhập email!"); document.getElementById("email").focus(); return; }
    if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)) { alert("Email không hợp lệ!"); return; }
    if (!address) { alert("Vui lòng nhập địa chỉ chi tiết!"); document.getElementById("address").focus(); return; }
    if (!city)    { alert("Vui lòng nhập Tỉnh/Thành phố!"); document.getElementById("city").focus(); return; }

    const itemsToSend = checkoutItems.map(item => {
        let sizeValue = null;
        if (item.size && item.size !== 'null' && item.size !== 'undefined' && item.size.trim())
            sizeValue = item.size;
        return { id: item.id, name: item.name, price: item.price, size: sizeValue, quantity: item.quantity, image: item.image };
    });
    if (!itemsToSend.length) {
        alert("Không có sản phẩm nào để thanh toán! Vui lòng quay lại giỏ hàng.");
        window.location.href = "./giohang.html";
        return;
    }
    const shippingFee = calculateShippingFee(city).fee;
    const discount = appliedCoupon ? Number(appliedCoupon.discount_amount || 0) : 0;
    const total = Math.max(0, subtotal + shippingFee - discount);
    const fullAddress = `${address}, ${district ? district + ', ' : ''}${city}`;

    const orderData = {
        userId: user.Id,
        items: itemsToSend,
        total,
        shippingFee,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        customerName: fullname,
        phone,
        email,
        address: fullAddress,
        paymentMethod: payment
    };

    if (payment === 'banking' || payment === 'momo' || payment === 'zalopay') {
        pendingOrderData = orderData;
        const tempOrderId = 'TMP' + Date.now().toString().slice(-6);
        openQRModal(tempOrderId, total, payment, fullname);
        return;
    }

    try {
        const res = await fetch("http://localhost:8888/createOrder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        if (data.success) {
            alert(`ĐẶT HÀNG THÀNH CÔNG!\n\n📦 Mã đơn hàng: ${data.orderId}\n💰 Tổng tiền: ${total.toLocaleString('vi-VN')}₫\n🚚 Phí ship: ${shippingFee.toLocaleString('vi-VN')}₫\n\nCảm ơn bạn đã mua hàng!`);
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const selectedKeys = checkoutItems.map(item => {
                const sk = (item.size && item.size !== 'null' && item.size.trim()) ? item.size : 'nosize';
                return `${item.id}_${sk}`;
            });
            cart = cart.filter(item => {
                const sk = (item.size && item.size !== 'null' && item.size.trim()) ? item.size : 'nosize';
                return !selectedKeys.includes(`${item.id}_${sk}`);
            });
            localStorage.setItem("cart", JSON.stringify(cart));
            localStorage.removeItem("checkoutItems");
            window.location.href = "../account.html?tab=orders";
        } else {
            alert(data.message || "Đặt hàng thất bại! Vui lòng thử lại.");
        }
    } catch (err) {
        console.error("Lỗi đặt hàng:", err);
        alert("Lỗi kết nối server! Vui lòng thử lại sau.");
    }
}

document.getElementById('qrOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeQRModal();
});
