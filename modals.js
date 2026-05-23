(function () {
    function ensureModalMarkup() {
        if (document.querySelector('.policy-modal-overlay')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="policy-modal-overlay" data-policy-modal="return-policy" id="returnPolicyModal" aria-hidden="true">
                <div class="policy-modal" role="dialog" aria-modal="true" aria-labelledby="returnPolicyTitle">
                    <div class="policy-modal-header">
                        <div class="policy-modal-title"><i class="fa-solid fa-rotate-left"></i><h3 id="returnPolicyTitle">CHÍNH SÁCH ĐỔI TRẢ</h3></div>
                        <button class="policy-modal-close" type="button" aria-label="Đóng" data-close-policy-modal><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="policy-modal-body">
                        <section class="policy-section">
                            <h4 class="policy-section-title"><i class="fa-solid fa-check"></i>Điều kiện đổi trả</h4>
                            <ul class="policy-list">
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Hàng lỗi do nhà sản xuất: đổi 100%.</span></li>
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Hàng đúng kích cỡ nhưng không vừa: đổi 1 lần.</span></li>
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Hàng còn tags, chưa giặt: đổi được.</span></li>
                                <li class="policy-list-item"><i class="fa-solid fa-times"></i><span>Hàng đã sử dụng: không đổi được.</span></li>
                            </ul>
                        </section>
                        <section class="policy-section">
                            <h4 class="policy-section-title"><i class="fa-solid fa-calendar"></i>Thời gian xử lý</h4>
                            <ul class="policy-list">
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Tiếp nhận đơn: trong 3 ngày.</span></li>
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Xác nhận kết quả: trong 7 ngày.</span></li>
                            </ul>
                        </section>
                        <section class="policy-section">
                            <h4 class="policy-section-title"><i class="fa-solid fa-receipt"></i>Yêu cầu hóa đơn</h4>
                            <ul class="policy-list">
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Mang hóa đơn hoặc chứng thực mua hàng.</span></li>
                                <li class="policy-list-item"><i class="fa-solid fa-check"></i><span>Sản phẩm phải còn nguyên bao bì.</span></li>
                            </ul>
                        </section>
                    </div>
                    <div class="policy-modal-footer"><button class="policy-action-btn" type="button" data-close-policy-modal>Đã Hiểu</button></div>
                </div>
            </div>

            <div class="policy-modal-overlay" data-policy-modal="shopping-guide" id="shoppingGuideModal" aria-hidden="true">
                <div class="guide-modal" role="dialog" aria-modal="true" aria-labelledby="shoppingGuideTitle">
                    <div class="policy-modal-header">
                        <div class="policy-modal-title"><i class="fa-solid fa-shopping-bag"></i><h3 id="shoppingGuideTitle">HƯỚNG DẪN MUA HÀNG</h3></div>
                        <button class="policy-modal-close" type="button" aria-label="Đóng" data-close-policy-modal><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="policy-modal-body">
                        <div class="guide-step-list">
                            <article class="guide-step"><span class="step-number">1</span><div class="step-content"><h4><i class="fa-solid fa-search"></i>Duyệt Sản Phẩm</h4><ul><li>Sử dụng mega menu hoặc category.</li><li>Lọc theo price/size.</li><li>Xem chi tiết &amp; review.</li></ul></div></article>
                            <article class="guide-step"><span class="step-number">2</span><div class="step-content"><h4><i class="fa-solid fa-shopping-bag"></i>Thêm Vào Giỏ Hàng</h4><ul><li>Click nút "Thêm Vào Giỏ".</li><li>Chọn kích cỡ/màu sắc.</li><li>Nhập số lượng.</li></ul></div></article>
                            <article class="guide-step"><span class="step-number">3</span><div class="step-content"><h4><i class="fa-solid fa-credit-card"></i>Thanh Toán</h4><ul><li>Vào giỏ hàng (Shopping Cart).</li><li>Kiểm tra địa chỉ giao hàng.</li><li>Chọn phương thức thanh toán.</li></ul></div></article>
                            <article class="guide-step"><span class="step-number">4</span><div class="step-content"><h4><i class="fa-solid fa-check-circle"></i>Xác Nhận Đơn</h4><ul><li>Nhân viên sẽ xác nhận trong 24h.</li><li>Bạn sẽ nhận email/SMS.</li></ul></div></article>
                            <article class="guide-step"><span class="step-number">5</span><div class="step-content"><h4><i class="fa-solid fa-truck"></i>Giao Hàng</h4><ul><li>Theo dõi trạng thái đơn hàng.</li><li>Nhận hàng &amp; kiểm tra chất lượng.</li></ul></div></article>
                        </div>
                    </div>
                    <div class="policy-modal-footer"><button class="policy-action-btn" type="button" data-close-policy-modal>Hoàn tất</button></div>
                </div>
            </div>

            <div class="policy-modal-overlay" data-policy-modal="faq" id="faqModal" aria-hidden="true">
                <div class="faq-modal" role="dialog" aria-modal="true" aria-labelledby="faqTitle">
                    <div class="policy-modal-header">
                        <div class="policy-modal-title"><i class="fa-solid fa-question-circle"></i><h3 id="faqTitle">CÂU HỎI THƯỜNG GẶP</h3></div>
                        <button class="policy-modal-close" type="button" aria-label="Đóng" data-close-policy-modal><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="policy-modal-body">
                        <div class="faq-item"><div class="faq-question">Bạn giao hàng đi đâu?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Chúng tôi giao hàng toàn Việt Nam + quốc tế (giá riêng).</div></div>
                        <div class="faq-item"><div class="faq-question">Phí giao hàng là bao nhiêu?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Miễn phí cho đơn từ 500k. Dưới 500k: 30k-50k tùy khu vực.</div></div>
                        <div class="faq-item"><div class="faq-question">Làm sao kiểm tra kích cỡ?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Xem size chart chi tiết trong mỗi sản phẩm. Liên hệ admin nếu chưa rõ.</div></div>
                        <div class="faq-item"><div class="faq-question">Sản phẩm có hàng không?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Xem status "Còn hàng" trên trang sản phẩm. Out of stock sẽ bị vô hiệu hóa.</div></div>
                        <div class="faq-item"><div class="faq-question">Tôi muốn hủy đơn?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Hủy trong 2 giờ tính từ lúc đặt (miễn phí). Sau đó sẽ bị mất phí 5%.</div></div>
                        <div class="faq-item"><div class="faq-question">Làm sao nhận hóa đơn?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Chọn tùy chọn "Cần hóa đơn" khi thanh toán.</div></div>
                        <div class="faq-item"><div class="faq-question">Bạn nhận thanh toán nào?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">Chuyển khoản, COD, Momo, ZaloPay.</div></div>
                        <div class="faq-item"><div class="faq-question">Bao lâu nhận được hàng?<i class="fa-solid fa-chevron-down"></i></div><div class="faq-answer">2-5 ngày tùy vùng. Nhanh hơn khi chọn giao hàng nhanh (+30k).</div></div>
                    </div>
                    <div class="policy-modal-footer"><button class="policy-action-btn" type="button" data-close-policy-modal>Thoát</button></div>
                </div>
            </div>

            <div class="policy-modal-overlay" data-policy-modal="privacy" id="privacyModal" aria-hidden="true">
                <div class="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacyTitle">
                    <div class="policy-modal-header">
                        <div class="policy-modal-title"><i class="fa-solid fa-shield-halved"></i><h3 id="privacyTitle">CHÍNH SÁCH BẢO MẬT</h3></div>
                        <button class="policy-modal-close" type="button" aria-label="Đóng" data-close-policy-modal><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="policy-modal-body">
                        <section class="privacy-section"><h4 class="privacy-title">1. Giới Thiệu</h4><p class="privacy-text">Cam kết bảo vệ thông tin cá nhân khách hàng và tuân thủ pháp luật Việt Nam.</p></section>
                        <section class="privacy-section"><h4 class="privacy-title">2. Thông Tin Chúng Tôi Thu Thập</h4><ul class="privacy-list"><li>Tên, điện thoại, email, địa chỉ.</li><li>Lịch sử mua hàng.</li><li>Cookies (analytics, tracking).</li><li>Browser/Device info.</li></ul></section>
                        <section class="privacy-section"><h4 class="privacy-title">3. Cách Chúng Tôi Sử Dụng Thông Tin</h4><ul class="privacy-list"><li>Xử lý đơn hàng &amp; giao hàng.</li><li>Marketing/Promotion (nếu đồng ý).</li><li>Phân tích, cải thiện dịch vụ.</li><li>Hỗ trợ khách hàng.</li></ul></section>
                        <section class="privacy-section"><h4 class="privacy-title">4. Bảo Vệ Thông Tin</h4><ul class="privacy-list"><li>SSL encryption cho thanh toán.</li><li>Mật khẩu được hash (bcrypt).</li><li>Chỉ nhân viên cần thiết mới access.</li></ul></section>
                        <section class="privacy-section"><h4 class="privacy-title">5. Quyền Của Bạn</h4><ul class="privacy-list"><li>Yêu cầu xem dữ liệu.</li><li>Yêu cầu xóa tài khoản.</li><li>Hủy subscription.</li><li>Liên hệ: support@shop.com.</li></ul></section>
                    </div>
                    <div class="policy-modal-footer">
                        <label class="privacy-footer-checkbox" for="privacyAgreeCheckbox"><input type="checkbox" id="privacyAgreeCheckbox"><span>Tôi đã đọc và đồng ý</span></label>
                        <button class="policy-action-btn" type="button" id="privacyAgreeButton" data-close-policy-modal disabled>Đồng ý</button>
                    </div>
                </div>
            </div>

            <div class="policy-modal-overlay" data-policy-modal="terms" id="termsModal" aria-hidden="true">
                <div class="terms-modal" role="dialog" aria-modal="true" aria-labelledby="termsTitle">
                    <div class="policy-modal-header">
                        <div class="policy-modal-title"><i class="fa-solid fa-file-contract"></i><h3 id="termsTitle">ĐIỀU KHOẢN SỬ DỤNG</h3></div>
                        <button class="policy-modal-close" type="button" aria-label="Đóng" data-close-policy-modal><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="policy-modal-body">
                        <section class="terms-section"><h4 class="terms-title"><strong>1.</strong> Quy Định Chung</h4><ul class="terms-list"><li><em>•</em> Người dùng phải từ 18 tuổi.</li><li><em>•</em> Có trách nhiệm bảo vệ tài khoản.</li><li><em>•</em> Không được sử dụng cho mục đích bất hợp pháp.</li></ul></section>
                        <section class="terms-section"><h4 class="terms-title"><strong>2.</strong> Tài Khoản &amp; Đăng Nhập</h4><ul class="terms-list"><li><em>•</em> Mật khẩu phải từ 8 ký tự.</li><li><em>•</em> Cấm chia sẻ tài khoản.</li><li><em>•</em> Chịu trách nhiệm mọi hoạt động trong tài khoản.</li></ul></section>
                        <section class="terms-section"><h4 class="terms-title"><strong>3.</strong> Hành Vi Bị Cấm</h4><ul class="terms-list"><li><em>•</em> Spam, harassment, phát tán virus.</li><li><em>•</em> Giả mạo, lừa đảo.</li><li><em>•</em> Scraping, bot automation.</li><li><em>•</em> Phá hoại website.</li></ul></section>
                        <section class="terms-section"><h4 class="terms-title"><strong>4.</strong> Chính Sách Đánh Giá &amp; Review</h4><ul class="terms-list"><li><em>•</em> Review phải trung thực, không spam.</li><li><em>•</em> Không được post NSFW content.</li><li><em>•</em> Violate → Xóa review + cảnh báo.</li><li><em>•</em> Nhiều lần → Ban khỏi review.</li></ul></section>
                        <section class="terms-section"><h4 class="terms-title"><strong>5.</strong> Trách Nhiệm Pháp Lý</h4><ul class="terms-list"><li><em>•</em> Shop không chịu trách nhiệm lỗi kỹ thuật.</li><li><em>•</em> Dữ liệu có thể bị xóa (backup).</li><li><em>•</em> Giữ quyền từ chối dịch vụ.</li></ul></section>
                        <section class="terms-section"><h4 class="terms-title"><strong>6.</strong> Thay Đổi Điều Khoản</h4><p class="terms-text">Có quyền cập nhật điều khoản bất cứ lúc nào. Tiếp tục sử dụng = đồng ý điều khoản mới.</p><div class="terms-highlight">Vui lòng đọc kỹ điều khoản trước khi tiếp tục sử dụng dịch vụ.</div></section>
                    </div>
                    <div class="policy-modal-footer"><button class="policy-action-btn" type="button" data-close-policy-modal>Đồng ý</button></div>
                </div>
            </div>
        `);
    }

    const modalMap = {
        return: 'return-policy',
        'return-policy': 'return-policy',
        'shopping-guide': 'shopping-guide',
        guide: 'shopping-guide',
        faq: 'faq',
        privacy: 'privacy',
        terms: 'terms'
    };

    function getModalId(modalName) {
        return modalMap[modalName] || modalName;
    }

    function getOpenModal() {
        return document.querySelector('.policy-modal-overlay.open');
    }

    window.openModal = function (modalName) {
        const id = getModalId(modalName);
        const modal = document.querySelector(`[data-policy-modal="${id}"]`);
        if (!modal) return;

        closeModal();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('policy-modal-open');

        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus({ preventScroll: true });
    };

    window.closeModal = function () {
        const openModal = getOpenModal();
        if (!openModal) return;

        openModal.classList.remove('open');
        openModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('policy-modal-open');
    };

    window.openPolicyModal = function (type) {
        openModal(type === 'return' ? 'return-policy' : type);
    };

    window.closePolicyModal = function () {
        closeModal();
    };

    window.initAccordion = function () {
        document.querySelectorAll('.faq-item').forEach((item) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            if (!question || !answer) return;

            item.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                document.querySelectorAll('.faq-item.open').forEach((openItem) => {
                    openItem.classList.remove('open');
                    const openAnswer = openItem.querySelector('.faq-answer');
                    if (openAnswer) openAnswer.style.maxHeight = '0px';
                });

                if (!isOpen) {
                    item.classList.add('open');
                    answer.style.maxHeight = `${answer.scrollHeight}px`;
                }
            });
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        ensureModalMarkup();
        initAccordion();

        document.querySelectorAll('a[href*="giohang.html"]').forEach((link) => {
            link.addEventListener('click', function (event) {
                let user = null;
                try {
                    user = JSON.parse(sessionStorage.getItem("user"));
                } catch (error) {
                    user = null;
                }

                if (user) return;

                event.preventDefault();
                sessionStorage.setItem("redirectAfterLogin", "/giohang/giohang.html");
                alert("Vui lòng đăng nhập để vào giỏ hàng!");
                window.location.href = "/dangnhap/dangnhap.html";
            });
        });

        document.querySelectorAll('.policy-modal-overlay').forEach((overlay) => {
            overlay.addEventListener('click', function (event) {
                if (event.target === overlay) closeModal();
            });
        });

        document.querySelectorAll('[data-close-policy-modal]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        const privacyCheckbox = document.getElementById('privacyAgreeCheckbox');
        const privacyButton = document.getElementById('privacyAgreeButton');
        if (privacyCheckbox && privacyButton) {
            privacyCheckbox.addEventListener('change', function () {
                privacyButton.disabled = !this.checked;
            });
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeModal();
    });
})();
