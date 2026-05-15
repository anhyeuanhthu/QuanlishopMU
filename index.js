// Tác giả: Võ Hoài Thông
// MSSV: B2306587

document.querySelectorAll('.price-filter').forEach(function(selectElement) {
  selectElement.addEventListener('change', function() {
    const thisSection = this.closest('.main');
    const otherSectionSelector = thisSection.classList.contains('main-1')
      ? '.main-3'
      : '.main-1';
    const otherSection = document.querySelector(otherSectionSelector);
    if (otherSection) {
      otherSection.querySelectorAll('.product-card').forEach(c => c.style.display = '');
      const otherFilter = otherSection.querySelector('.price-filter');
      if (otherFilter) otherFilter.value = 'all';
    }

    const selectedValue = this.value;
    thisSection.querySelectorAll('.product-card').forEach(function(card) {
      const priceElem = card.querySelector('.new-price') || card.querySelector('.normal-price');
      if (!priceElem) return;
      const priceText = priceElem.textContent.replace(/\./g, '').replace(/[đ,]/g, '');
      const priceValue = parseInt(priceText);

      let show = false;
      if (selectedValue === 'all') {
        show = true;
      } else if (selectedValue === 'under-100' && priceValue < 100000) {
        show = true;
      } else if (selectedValue === '100-200' && priceValue >= 100000 && priceValue <= 200000) {
        show = true;
      } else if (selectedValue === 'above-200' && priceValue > 200000) {
        show = true;
      }
      card.style.display = show ? '' : 'none';
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const menu = document.getElementById("userMenu");

    if (user && menu) {
        menu.innerHTML = `
            <a href="#">
                ${user.Username}
                <i style="font-size: 20px;" class="fa-solid fa-circle-user"></i>
            </a>
            <ul class="sub-menu">
                <li><a href="/account.html">Account</a></li>
                <li><a href="/giohang/giohang.html">Orders</a></li>
                <li><a href="#" id="logoutBtn">Log Out</a></li>
            </ul>
        `;

        document.getElementById("logoutBtn").addEventListener("click", function () {
            sessionStorage.removeItem("user");
            window.location.href = "/dangnhap/dangnhap.html";
        });
    }
});

if (typeof initSearch === "function") {
    initSearch("");
}