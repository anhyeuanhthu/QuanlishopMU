// Tác giả: Tran Nguyen Thanh Dien B2303739
// Điều hướng cho thiết bị di động
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

    burger.addEventListener('click', () => {
      nav.classList.toggle('active');
    });

    // Đóng menu di động khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove('active');
      }
    });

    // Hỗ trợ điều hướng bằng bàn phím
    burger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nav.classList.toggle('active');
      }
    });

    // Mở/đóng submenu trên thiết bị di động
    const submenuLinks = document.querySelectorAll(".sub-menu-item > a");
    submenuLinks.forEach(link => {
      link.addEventListener("click", function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const parent = this.parentElement;
          parent.classList.toggle("open");
        }
      });
    });

    // Kiểm tra và gửi form liên hệ
    function handleSubmit(event) {
      event.preventDefault();
      
      const tel = document.getElementById('tel').value.trim();
      const email = document.getElementById('email').value.trim();
      // Định dạng: bắt đầu bằng 0, có thể có dấu cách, 10 số
      const phoneRegex = /^0\d{3}\s?\d{3}\s?\d{3}$/;

      if (!phoneRegex.test(tel.replace(/\s/g, ''))) {
          showErrorPopup();
          return false;
      }

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          showEmailErrorPopup();
          return false;
      }

      // Nếu hợp lệ, hiện popup thành công
      showSuccessPopup();
      // Có thể reset form nếu muốn: event.target.reset();
      return false;
    }

    function showSuccessPopup() {
      document.getElementById('success-popup').style.display = 'block';
    }
    function closePopup() {
      document.getElementById('success-popup').style.display = 'none';
    }

    function showErrorPopup() {
      document.getElementById('error-popup').style.display = 'block';
    }
    function closeErrorPopup() {
      document.getElementById('error-popup').style.display = 'none';
    }

    function showEmailErrorPopup() {
      document.getElementById('email-error-popup').style.display = 'block';
    }
    function closeEmailErrorPopup() {
      document.getElementById('email-error-popup').style.display = 'none';
    }

    // Cuộn mượt đến anchor khi click vào link
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    const REVIEW_API = "http://localhost:8888";

    function escHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function reviewImageSrc(url) {
      return String(url || "").startsWith("/") ? `${REVIEW_API}${url}` : url;
    }

    function renderAboutReviewStats(reviews) {
      const total = reviews.length;
      const avg = total ? reviews.reduce((sum, item) => sum + Number(item.Rating || 0), 0) / total : 0;
      const happyCount = reviews.filter(item => Number(item.Rating || 0) >= 4).length;
      const happyRate = total ? Math.round((happyCount / total) * 100) : 0;

      const avgEl = document.getElementById("aboutAvgRating");
      const countEl = document.getElementById("aboutReviewCount");
      const happyEl = document.getElementById("aboutHappyRate");

      if (avgEl) avgEl.textContent = avg ? avg.toFixed(1) : "—";
      if (countEl) countEl.textContent = total;
      if (happyEl) happyEl.textContent = total ? `${happyRate}%` : "—";
    }

    function renderAboutReviews(reviews) {
      const grid = document.getElementById("aboutReviewsGrid");
      if (!grid) return;

      if (!reviews.length) {
        grid.innerHTML = `
          <div class="reviews-empty">
            <i class="fa-regular fa-comment-dots"></i>
            Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm!
          </div>
        `;
        return;
      }

      grid.innerHTML = reviews.map(review => {
        const rating = Number(review.Rating || 0);
        const stars = [1, 2, 3, 4, 5].map(i =>
          `<i class="fa-${i <= rating ? "solid" : "regular"} fa-star"></i>`
        ).join("");
        const name = review.Username || review.CustomerName || "Khách hàng";
        const initial = escHtml(name).charAt(0).toUpperCase() || "K";
        const date = review.CreatedAt ? new Date(review.CreatedAt).toLocaleDateString("vi-VN") : "";
        const product = review.ProductName ? `<div class="review-product">${escHtml(review.ProductName)}</div>` : "";
        const image = review.ImageUrl ? `
          <img class="review-attached-image" src="${escHtml(reviewImageSrc(review.ImageUrl))}" alt="Ảnh sản phẩm trong đánh giá">
        ` : "";
        const reply = review.Reply ? `
          <div class="review-reply">
            <strong>UNITED STORE phản hồi:</strong> ${escHtml(review.Reply)}
          </div>
        ` : "";

        return `
          <div class="review-card">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">${initial}</div>
                <div class="reviewer-details">
                  <h4 class="reviewer-name">${escHtml(name)}</h4>
                  ${product}
                  <div class="review-stars">${stars}</div>
                </div>
              </div>
              <div class="review-date">${date}</div>
            </div>
            <div class="review-content">
              <p>${escHtml(review.Content)}</p>
            </div>
            ${image}
            ${reply}
          </div>
        `;
      }).join("");
    }

    function loadAboutReviews() {
      const grid = document.getElementById("aboutReviewsGrid");
      if (!grid) return;

      fetch(`${REVIEW_API}/reviews`)
        .then(response => response.json())
        .then(reviews => {
          const safeReviews = Array.isArray(reviews) ? reviews : [];
          renderAboutReviews(safeReviews);
          renderAboutReviewStats(safeReviews);
        })
        .catch(() => {
          grid.innerHTML = `
            <div class="reviews-empty">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Không thể tải đánh giá. Vui lòng thử lại sau.
            </div>
          `;
          renderAboutReviewStats([]);
        });
    }

    loadAboutReviews();

    const user = JSON.parse(sessionStorage.getItem("user"));
    const userMenu = document.getElementById("userMenu");
    if (user && userMenu) {
      userMenu.innerHTML = `
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

      document.getElementById("logoutBtn").addEventListener("click", function (e) {
        e.preventDefault();
        sessionStorage.removeItem("user");
        window.location.href = "../dangnhap/dangnhap.html";
      });
    }
