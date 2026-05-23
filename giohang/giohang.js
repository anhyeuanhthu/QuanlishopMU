// Tác giả: Võ Hoài Thông
// MSSV: B2306587

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user"));
    } catch (error) {
        return null;
    }
}

function requireCartLogin() {
    if (getCurrentUser()) return true;

    sessionStorage.setItem("redirectAfterLogin", "/giohang/giohang.html");
    alert("Vui lòng đăng nhập để vào giỏ hàng!");
    window.location.replace("../dangnhap/dangnhap.html");
    return false;
}

// Sản phẩm sẽ được lưu trong localStorage (dùng chung giữa các tab)
let cart = getCurrentUser() ? (JSON.parse(localStorage.getItem('cart')) || []) : [];

// Thêm thuộc tính selected cho mỗi sản phẩm nếu chưa có
cart = cart.map(item => ({
    ...item,
    selected: item.selected !== undefined ? item.selected : false
}));

// Hiển thị danh sách giỏ hàng
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    let subtotal = 0;
    let selectedItems = 0;
    
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Giỏ hàng của bạn đang trống. <a href="../sanpham_giohang/sanpham.html">Mua sắm ngay</a></div>';
        if (totalAmount) totalAmount.textContent = '0₫';
        return;
    }
    
    // Thêm header với checkbox chọn tất cả
    const cartHeader = document.createElement('div');
    cartHeader.className = 'cart-header';
    cartHeader.innerHTML = `
        <div class="select-all">
            <input type="checkbox" id="selectAll" ${cart.every(item => item.selected) ? 'checked' : ''}>
            <label for="selectAll">Chọn tất cả (${cart.length} sản phẩm)</label>
        </div>
    `;
    cartItems.appendChild(cartHeader);
    
    cart.forEach((item, index) => {
        if (item.selected) {
            subtotal += item.price * item.quantity;
            selectedItems++;
        }
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-select">
                <input type="checkbox" class="item-checkbox" data-index="${index}" ${item.selected ? 'checked' : ''}>
            </div>
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>Size: ${item.size || "-"}</p>
                <p>Giá: ${item.price.toLocaleString('vi-VN')}₫</p>
                <div class="quantity-control">
                    <button class="quantity-btn minus" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-index="${index}">+</button>
                </div>
            </div>
            <div class="item-total">
                <p>${(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                <button class="remove-btn" data-index="${index}">Xóa</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Hiển thị tổng tiền tạm tính
    if (totalAmount) totalAmount.textContent = subtotal.toLocaleString('vi-VN') + '₫';
    
    // Xử lý checkbox chọn tất cả
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            cart.forEach(item => {
                item.selected = e.target.checked;
            });
            saveCart();
            renderCart();
        });
    }
    
    // Xử lý checkbox từng sản phẩm
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            cart[index].selected = e.target.checked;
            saveCart();
            renderCart();
        });
    });
    
    // Xóa sản phẩm
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            cart.splice(index, 1);
            saveCart();
            renderCart();
        });
    });
    
    // Tăng giảm số lượng
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            if(btn.classList.contains('plus')) {
                cart[index].quantity++;
            } else if(btn.classList.contains('minus') && cart[index].quantity > 1) {
                cart[index].quantity--;
            }
            saveCart();
            renderCart();
        });
    });
}

// Hàm lưu giỏ hàng
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Chuyển sang trang thanh toán
function goToCheckout() {
    const selectedItems = cart.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
        return false;
    }
    
    // Kiểm tra người dùng đã đăng nhập chưa (dùng sessionStorage)
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
        alert('Vui lòng đăng nhập để thanh toán!');
        window.location.href = "../dangnhap/dangnhap.html";
        return false;
    }
    
    // Lưu danh sách sản phẩm đã chọn vào localStorage (dùng chung giữa các tab)
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    
    // Chuyển sang trang thanh toán
    window.location.href = './thanhtoan.html';
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    if (!requireCartLogin()) return;

    renderCart();
    
    // Xử lý nút thanh toán
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToCheckout();
        });
    }
    
    // Xử lý user menu (dùng sessionStorage)
    const user = getCurrentUser();
    const menu = document.getElementById("userMenu");
    if (user && menu) {
        menu.innerHTML = `
            <a href="#">
                ${user.Username} 
                <i style="font-size: 24px;" class="fa-solid fa-circle-user"></i>
            </a>
            <ul class="sub-menu">
                <li class="sub-menu-item"><a href="../account.html">Account</a></li>
                <li class="sub-menu-item"><a href="../account.html?tab=orders">Orders</a></li>
                <li class="sub-menu-item"><a href="#" id="logoutBtn">Log Out</a></li>
            </ul>
        `;
        
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                sessionStorage.removeItem("user");
                window.location.href = "../dangnhap/dangnhap.html";
            });
        }
    }
});
