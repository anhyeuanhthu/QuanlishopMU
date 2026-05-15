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


    