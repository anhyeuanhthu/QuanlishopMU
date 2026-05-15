const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let selectedSize = null;
let selectedStock = 0;
let isClothing = false;
let productSizes = []; // Lưu lại danh sách size để dùng khi mở modal

fetch(`http://localhost:8888/product/${id}`)
.then(res => res.json())
.then(data => {

    const p = data.product;
    isClothing = p.IsClothing == 1;

    document.getElementById("img1").src = p.Image;
    document.getElementById("img2").src = p.Image2;

    document.getElementById("name").innerText = p.Name;
    document.getElementById("description").innerText = p.Description;

    const oldPrice = p.Price;
    const discount = p.DiscountPercent || 0;

    if (discount > 0) {
        const newPrice = oldPrice - (oldPrice * discount / 100);
        document.getElementById("sale").innerHTML = `-${discount}%`;
        document.getElementById("oldPrice").innerHTML = `<s>${oldPrice.toLocaleString()} đ</s>`;
        document.getElementById("newPrice").innerHTML = `${newPrice.toLocaleString()} đ`;
    } else {
        document.getElementById("oldPrice").innerHTML = "";
        document.getElementById("newPrice").innerHTML = `${oldPrice.toLocaleString()} đ`;
    }

    // Xử lý SIZE nếu là quần áo
    if (isClothing) {
        productSizes = data.sizes;

        const sizeDiv = document.getElementById("sizes");
        data.sizes.forEach(s => {
            const sizeBtn = document.createElement("button");
            sizeBtn.innerText = s.Size;
            if (s.Quantity === 0) {
                sizeBtn.disabled = true;
                sizeBtn.style.opacity = "0.4";
                sizeBtn.style.cursor = "not-allowed";
            }
            sizeBtn.onclick = () => {
                document.querySelectorAll("#sizes button").forEach(b => b.classList.remove("active"));
                sizeBtn.classList.add("active");
                selectedSize = s.Size;
                selectedStock = s.Quantity;
            };
            sizeDiv.appendChild(sizeBtn);
        });
    } else {
        document.getElementById("sizes").style.display = "none";
        const sizeLabel = document.querySelector(".size-box");
        if (sizeLabel) {
            const noSizeMsg = document.createElement("p");
            noSizeMsg.innerText = "Sản phẩm không yêu cầu chọn size";
            noSizeMsg.style.color = "#666";
            noSizeMsg.style.fontSize = "14px";
            noSizeMsg.style.marginTop = "10px";
            sizeLabel.appendChild(noSizeMsg);
        }
        selectedStock = p.Quantity;
    }

    // Xử lý user menu (dùng sessionStorage)
    const user = JSON.parse(sessionStorage.getItem("user"));
    const menu = document.getElementById("userMenu");

    if (user && menu) {
        menu.innerHTML = `
            <a href="#">
                ${user.Username} 
                <i style="font-size: 24px;" class="fa-solid fa-circle-user"></i>
            </a>
            <ul class="sub-menu">
                <li class="sub-menu-item"><a href="./account.html">Account</a></li>
                <li class="sub-menu-item"><a href="./giohang/giohang.html">Orders</a></li>
                <li class="sub-menu-item">
                    <a href="#" id="logoutBtn">Log Out</a>
                </li>
            </ul>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function () {
            sessionStorage.removeItem("user");
            window.location.href = "./dangnhap/dangnhap.html";
        });
    }
});

// ================================================================
//  MODAL & ADD TO CART
// ================================================================
const addBtn      = document.getElementById("addToCart");
const modal       = document.getElementById("sizeModal");
const modalSizes  = document.getElementById("modalSizes");
const stockInfo   = document.getElementById("stockInfo");
const quantityInput = document.getElementById("buyQuantity");

// Hàm kiểm tra đăng nhập trước khi thêm vào giỏ
function checkLoginAndProceed(callback) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        window.location.href = "./dangnhap/dangnhap.html";
        return false;
    }
    if (callback) callback();
    return true;
}

addBtn.addEventListener("click", () => {
    if (!checkLoginAndProceed()) return;

    // Sản phẩm không có size → thêm thẳng vào giỏ
    if (!isClothing) {
        addToCartDirectly();
        return;
    }

    // ---- RENDER SIZE VÀO MODAL ----
    modalSizes.innerHTML = "";
    selectedSize  = null;
    selectedStock = 0;
    stockInfo.innerText = "";
    quantityInput.value = 1;

    productSizes.forEach(s => {
        const btn = document.createElement("button");
        btn.innerText = s.Size;

        if (s.Quantity === 0) {
            btn.disabled = true;
            btn.style.opacity = "0.4";
            btn.style.cursor  = "not-allowed";
            btn.title = "Hết hàng";
        }

        btn.onclick = () => {
            modalSizes.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedSize  = s.Size;
            selectedStock = s.Quantity;
            stockInfo.innerText = `Còn lại: ${s.Quantity} sản phẩm`;
            quantityInput.max = s.Quantity;
        };

        modalSizes.appendChild(btn);
    });

    modal.style.display = "flex";
});

document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
};

// ---- THÊM TRỰC TIẾP (không size) ----
function addToCartDirectly() {
    const quantity = parseInt(quantityInput?.value || 1);

    const productName = document.getElementById("name").innerText;
    const priceText   = document.getElementById("newPrice").innerText;
    const price       = parseInt(priceText.replace(/\D/g, ''));
    const imageSrc    = document.getElementById("img1").src;

    if (quantity < 1) {
        alert("Số lượng phải ít nhất là 1!");
        return;
    }

    if (quantity > selectedStock) {
        alert(`Số lượng vượt quá tồn kho! Chỉ còn ${selectedStock} sản phẩm.`);
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = cart.find(item => item.id == id && !item.size);

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > selectedStock) {
            alert(`Số lượng vượt quá tồn kho! Chỉ còn ${selectedStock} sản phẩm.`);
            return;
        }
        existingItem.quantity = newQty;
    } else {
        cart.push({ id, name: productName, price, image: imageSrc, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Đã thêm vào giỏ hàng!");

    if (confirm("Bạn có muốn đến giỏ hàng để thanh toán không?")) {
        window.location.href = "./giohang/giohang.html";
    }
}

// ---- XÁC NHẬN THÊM VÀO GIỎ (có size) ----
if (document.getElementById("confirmAdd")) {
    document.getElementById("confirmAdd").onclick = function () {
        if (!selectedSize) {
            alert("Vui lòng chọn size!");
            return;
        }

        const quantity = parseInt(quantityInput?.value || 1);

        if (quantity < 1) {
            alert("Số lượng phải ít nhất là 1!");
            return;
        }

        if (quantity > selectedStock) {
            alert(`Số lượng vượt quá tồn kho! Chỉ còn ${selectedStock} sản phẩm.`);
            return;
        }

        const productName = document.getElementById("name").innerText;
        const priceText   = document.getElementById("newPrice").innerText;
        const price       = parseInt(priceText.replace(/\D/g, ''));
        const imageSrc    = document.getElementById("img1").src;

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingItem = cart.find(item => item.id == id && item.size === selectedSize);

        if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (newQty > selectedStock) {
                alert(`Số lượng vượt quá tồn kho! Chỉ còn ${selectedStock} sản phẩm.`);
                return;
            }
            existingItem.quantity = newQty;
        } else {
            cart.push({ id, name: productName, price, image: imageSrc, size: selectedSize, quantity });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        modal.style.display = "none";
        alert("Đã thêm vào giỏ hàng!");

        if (confirm("Bạn có muốn đến giỏ hàng để thanh toán không?")) {
            window.location.href = "./giohang/giohang.html";
        }
    };
}