function initUserMenu() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const menu = document.getElementById("userMenu");

    if (!menu) return;

    if (user) {
        menu.innerHTML = `
            <a href="#">
                ${user.Username}
                <i style="font-size: 24px;" class="fa-solid fa-circle-user"></i>
            </a>

            <ul class="sub-menu">
                <li class="sub-menu-item"><a href="../account.html">Account</a></li>
                <li class="sub-menu-item"><a href="../giohang/giohang.html">Orders</a></li>
                <li class="sub-menu-item">
                    <a href="#" id="logoutBtn">Log Out</a>
                </li>
            </ul>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function (e) {
            e.preventDefault();
            sessionStorage.removeItem("user");
            localStorage.removeItem("user");
            window.location.href = "../dangnhap/dangnhap.html";
        });
    }
}

// ===== SORTING DROPDOWN =====
document.addEventListener('DOMContentLoaded', function() {
    initUserMenu();

    // Xử lý dropdown sorting
    const sortingBtn = document.querySelector('.sorting-btn');
    const sortingDropdown = document.querySelector('.sorting-dropdown');
    
    if (!sortingBtn || !sortingDropdown) {
        console.log('Không tìm thấy sorting dropdown');
        return;
    }
    
    // Toggle dropdown khi click vào nút
    sortingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        sortingDropdown.classList.toggle('active');
        console.log('Dropdown toggled:', sortingDropdown.classList.contains('active'));
    });
    
    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!sortingDropdown.contains(e.target)) {
            sortingDropdown.classList.remove('active');
        }
    });
    
    // Xử lý khi chọn item trong menu
    const sortItems = document.querySelectorAll('.sorting-menu li');
    sortItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const sortValue = this.dataset.sort;
            const sortText = this.textContent;
            
            console.log('Selected:', sortValue, sortText);
            
            // Cập nhật text trên nút
            sortingBtn.querySelector('span').textContent = sortText;
            
            // Xóa class active của tất cả items
            sortItems.forEach(i => i.classList.remove('active'));
            
            // Thêm class active cho item được chọn
            this.classList.add('active');
            
            // Đóng dropdown
            sortingDropdown.classList.remove('active');
            
            // Gọi hàm sắp xếp sản phẩm
            sortProducts(sortValue);
        });
    });
    
    // Hàm sắp xếp sản phẩm
    function sortProducts(sortType) {
        const productGrid = document.querySelector('.product');
        if (!productGrid) return;
        
        const products = Array.from(document.querySelectorAll('.product-card'));
        console.log('Sorting products:', products.length, 'type:', sortType);
        
        // Lấy giá trị giá từ mỗi sản phẩm
        products.forEach(product => {
            // Lấy giá mới (new-price)
            const priceElement = product.querySelector('.price-org');
            if (priceElement) {
                const priceText = priceElement.textContent.replace(/[^\d]/g, '');
                const price = parseInt(priceText) || 0;
                product.dataset.price = price;
            }

            
            
            // Lấy giá cũ (old-price) nếu cần
            const oldPriceElement = product.querySelector('.old-price');
            if (oldPriceElement) {
                const oldPriceText = oldPriceElement.textContent.replace(/[^\d]/g, '');
                product.dataset.oldPrice = parseInt(oldPriceText) || 0;
            }
            
            // Lấy tên sản phẩm
            const titleElement = product.querySelector('.title');
            if (titleElement) {
                product.dataset.name = titleElement.textContent.trim();
            }
            
            // Lấy % giảm giá
            const saleElement = product.querySelector('.sale-percentage');
            if (saleElement) {
                const saleText = saleElement.textContent.replace('%', '');
                product.dataset.sale = parseInt(saleText) || 0;
            }
        });
        
        // Sắp xếp dựa trên loại
        switch(sortType) {
            case 'price-low-high':
                products.sort((a, b) => (parseInt(a.dataset.price) || 0) - (parseInt(b.dataset.price) || 0));
                break;
                
            case 'price-high-low':
                products.sort((a, b) => (parseInt(b.dataset.price) || 0) - (parseInt(a.dataset.price) || 0));
                break;
                
            case 'name-asc':
                products.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || ''));
                break;
                
            case 'name-desc':
                products.sort((a, b) => (b.dataset.name || '').localeCompare(a.dataset.name || ''));
                break;
                
            case 'newest':
                // Sắp xếp theo ID (giả sử ID lớn hơn là mới hơn)
                products.sort((a, b) => {
                    const idA = parseInt(a.dataset.id) || 0;
                    const idB = parseInt(b.dataset.id) || 0;
                    return idB - idA;
                });
                break;
                
            case 'bestsellers':
                // Giữ nguyên thứ tự hoặc sắp xếp theo logic riêng
                // Có thể sắp xếp theo số lượng bán (nếu có dữ liệu)
                break;
                
            case 'sale':
                // Sắp xếp theo % giảm giá cao nhất
                products.sort((a, b) => {
                    const saleA = parseInt(a.dataset.sale) || 0;
                    const saleB = parseInt(b.dataset.sale) || 0;
                    return saleB - saleA;
                });
                break;
                
            case 'recommended':
            default:
                // Trở về thứ tự ban đầu
                products.sort((a, b) => {
                    const indexA = Array.from(productGrid.children).indexOf(a);
                    const indexB = Array.from(productGrid.children).indexOf(b);
                    return indexA - indexB;
                });
                break;
        }
        
        // Xóa và thêm lại sản phẩm theo thứ tự mới
        productGrid.innerHTML = '';
        products.forEach(product => productGrid.appendChild(product));
        
        // Cập nhật lại biến allProducts cho phân trang
        if (typeof allProducts !== 'undefined') {
            window.allProducts = Array.from(document.querySelectorAll('.product-card'));
        }
        
        // Reset về trang 1 sau khi sắp xếp
        if (typeof currentPage !== 'undefined') {
            currentPage = 1;
            if (typeof renderPagination === 'function') {
                renderPagination();
            }
        }
        
        console.log('Sorting completed');
    }
});

// ===== PHÂN TRANG (PAGINATION) =====
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem có đang ở trang có sản phẩm không
    const productContainer = document.querySelector('.product');
    if (!productContainer) return;
    
    // Lấy tất cả sản phẩm
    let allProducts = Array.from(document.querySelectorAll('.product-card'));
    if (allProducts.length === 0) return;
    
    // Lưu vào window để có thể truy cập từ function khác
    window.allProducts = allProducts;
    
    // Các element
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const paginationContainer = document.getElementById('pagination');
    const pageInfo = document.getElementById('pageInfo');
    const totalProductsSpan = document.getElementById('totalProducts');
    
    // Cập nhật tổng số sản phẩm
    if (totalProductsSpan) {
        totalProductsSpan.textContent = allProducts.length;
    }
    
    // Biến trạng thái
    let currentPage = 1;
    window.currentPage = currentPage;
    let itemsPerPage = 15; // Mặc định
    
    // Hàm hiển thị sản phẩm theo trang
    function showPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        
        // Ẩn tất cả sản phẩm trước
        allProducts.forEach(product => {
            product.style.display = 'none';
        });
        
        // Hiện sản phẩm trong trang hiện tại
        for (let i = start; i < end && i < allProducts.length; i++) {
            allProducts[i].style.display = 'block';
        }
        
        // Cập nhật thông tin trang
        if (pageInfo) {
            const startItem = start + 1;
            const endItem = Math.min(end, allProducts.length);
            pageInfo.textContent = `Hiển thị ${startItem}-${endItem} / ${allProducts.length} sản phẩm`;
        }
        
        // Cập nhật active buttons
        updatePaginationButtons(page);
    }
    window.showPage = showPage;
    
    // Hàm tạo các nút phân trang
    function renderPagination() {
        if (!paginationContainer) return;
        
        // Cập nhật allProducts mới nhất
        allProducts = Array.from(document.querySelectorAll('.product-card'));
        window.allProducts = allProducts;
        
        const totalPages = Math.ceil(allProducts.length / itemsPerPage);
        
        // Nếu chỉ có 1 trang thì không hiện phân trang
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            if (pageInfo) pageInfo.textContent = `Hiển thị tất cả ${allProducts.length} sản phẩm`;
            // Hiện tất cả sản phẩm
            allProducts.forEach(product => {
                product.style.display = 'block';
            });
            return;
        }
        
        // Xóa các nút cũ
        paginationContainer.innerHTML = '';
        
        // Nút Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Trước';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
                renderPagination(); // Render lại để cập nhật active
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Tính toán các trang hiển thị
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Trang đầu tiên và dấu ...
        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'page-btn';
            firstBtn.textContent = '1';
            firstBtn.addEventListener('click', () => {
                currentPage = 1;
                showPage(currentPage);
                renderPagination();
            });
            paginationContainer.appendChild(firstBtn);
            
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.className = 'page-btn';
                dots.textContent = '...';
                dots.disabled = true;
                paginationContainer.appendChild(dots);
            }
        }
        
        // Các nút số trang
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                currentPage = i;
                showPage(currentPage);
                renderPagination();
            });
            paginationContainer.appendChild(btn);
        }
        
        // Trang cuối và dấu ...
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.className = 'page-btn';
                dots.textContent = '...';
                dots.disabled = true;
                paginationContainer.appendChild(dots);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.className = 'page-btn';
            lastBtn.textContent = totalPages;
            lastBtn.addEventListener('click', () => {
                currentPage = totalPages;
                showPage(currentPage);
                renderPagination();
            });
            paginationContainer.appendChild(lastBtn);
        }
        
        // Nút Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = 'Sau <i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
                renderPagination();
            }
        });
        paginationContainer.appendChild(nextBtn);
        
        // Hiển thị trang đầu tiên
        showPage(currentPage);
    }
    window.renderPagination = renderPagination;
    
    // Cập nhật trạng thái nút
    function updatePaginationButtons(page) {
        const buttons = document.querySelectorAll('.page-btn:not(.prev):not(.next)');
        buttons.forEach(btn => {
            if (btn.textContent === page.toString()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        const prevBtn = document.querySelector('.page-btn.prev');
        const nextBtn = document.querySelector('.page-btn.next');
        const totalPages = Math.ceil(allProducts.length / itemsPerPage);
        
        if (prevBtn) {
            prevBtn.disabled = page === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = page === totalPages;
        }
    }
    
    // Xử lý thay đổi số lượng sản phẩm mỗi trang
    if (itemsPerPageSelect) {
        // Set giá trị mặc định
        itemsPerPageSelect.value = itemsPerPage;
        
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            renderPagination();
        });
    }
    
    // Khởi tạo phân trang
    renderPagination();
});
// CLICK PRODUCT -> DETAIL PAGE
document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", function () {
        const id = this.dataset.id;
        window.location.href = `../product-detail.html?id=${id}`;
    });
});
