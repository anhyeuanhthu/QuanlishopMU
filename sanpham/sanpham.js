
// Tác giả: Nguyễn Tường Vân Anh
// MSSV: B2205329




//Lấy các phần tử giao diện chính
const sortSelect = document.getElementById("sort"); // Ô chọn sắp xếp
const productGrid = document.getElementById("productGrid"); // Khu vực chứa danh sách sản phẩm

//Lưu lại bản gốc tất cả sản phẩm ban đầu (chưa lọc, chưa sắp xếp)
let originalCards = Array.from(productGrid.querySelectorAll(".product-card"));

//Gán lại dữ liệu cần thiết (name, price, type) vào dataset từng sản phẩm
originalCards.forEach(card => {
  const priceText = card.querySelector(".sale-price")?.innerText || card.querySelector("p")?.innerText;
  const price = parseInt(priceText.replace(/[^\d]/g, ""));
  const name = card.querySelector("h3").innerText.trim();
  const type = card.dataset.type || "";

  card.dataset.price = price;
  card.dataset.name = name;
  card.dataset.type = type.toLowerCase();
});

//Biến lưu loại đang được lọc (null nếu không chọn gì)
let currentCategory = null;

//Khi thay đổi lựa chọn sắp xếp → cập nhật giao diện
sortSelect.addEventListener("change", () => {
  updateView();
});

//Khi click vào từng mục trong submenu (lọc loại)
document.querySelectorAll(".sub-menu-item a").forEach(link => {
  link.addEventListener("click", e => {
    if (link.dataset.category) {
      e.preventDefault();
      currentCategory = link.dataset.category.trim().toLowerCase();
      updateView();
    }
  });
});

//Hàm xử lý lọc + sắp xếp và hiển thị lại
function updateView() {
  //Bắt đầu từ danh sách gốc
  let filtered = [...originalCards];

  //Nếu có lọc loại thì lọc theo
  if (currentCategory) {
    filtered = filtered.filter(card =>
      card.dataset.type.includes(currentCategory)
    );
  }

  //Sắp xếp theo lựa chọn
  const sortOption = sortSelect.value;
  filtered.sort((a, b) => {
    const priceA = parseInt(a.dataset.price);
    const priceB = parseInt(b.dataset.price);
    const nameA = a.dataset.name.toLowerCase();
    const nameB = b.dataset.name.toLowerCase();

    switch (sortOption) {
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      case "name":
        return nameA.localeCompare(nameB);
      default:
        return 0;
    }
  });

  //Hiển thị danh sách đã xử lý
  renderProducts(filtered);
}

//Hiển thị danh sách sản phẩm ra giao diện
function renderProducts(cards) {
  productGrid.innerHTML = ""; // Xóa cũ
  cards.forEach(card => productGrid.appendChild(card)); // Thêm lại
}


// Khi nhấn vào nút trái tim → lưu vào localStorage
document.addEventListener("DOMContentLoaded", () => {
  const messageBox = document.createElement("div");
  messageBox.className = "favorite-message";
  document.body.appendChild(messageBox);

  const showMessage = (msg) => {
    messageBox.innerText = msg;
    messageBox.classList.add("show");
    setTimeout(() => {
      messageBox.classList.remove("show");
    }, 2000);
  };

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Xử lý từng nút trái tim
  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const card = btn.closest(".product-card");
    const productId = card.dataset.id;
    const icon = btn.querySelector("i");

  // Hover để preview trái tim
  btn.addEventListener("mouseenter", () => {
    if (!favorites.includes(productId)) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#ff4081"; // màu khi hover chưa thích
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = "#ccc"; // màu khi hover đã thích
    }
  });

  btn.addEventListener("mouseleave", () => {
    if (favorites.includes(productId)) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      icon.style.color = "#e53935"; // màu đỏ khi đã thích
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      icon.style.color = ""; // trở về trạng thái ban đầu
    }
  });  

    // Đánh dấu trái tim nếu đã yêu thích
    if (favorites.includes(productId)) {
      btn.classList.add("active");
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    }

    // Bấm trái tim
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      if (!favorites.includes(productId)) {
        favorites.push(productId);
        btn.classList.add("active");
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        showMessage("Đã thêm vào mục yêu thích!");
      } else {
        favorites = favorites.filter(id => id !== productId);
        btn.classList.remove("active");
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
        showMessage("Đã xóa khỏi mục yêu thích!");
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
    });
  });

// Bấm hiện danh sách yêu thích
// const favFilterBtn = document.querySelector(".favorite-tag");
// if (favFilterBtn) {
//   favFilterBtn.addEventListener("click", (e) => {
//     e.preventDefault();

//     if (favFilterBtn.classList.contains("active")) {
//       return;
//     }
//     favFilterBtn.classList.add("active");
//     const showFavoritesOnly = favFilterBtn.classList.contains("active");
//     const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

//     document.querySelectorAll(".product-card").forEach(card => {
//       const id = card.dataset.id;
//       if (showFavoritesOnly) {
//         card.style.display = favorites.includes(id) ? "block" : "none";
//       }
//     });
//   });
// }
  const favFilterBtn = document.querySelector(".favorite-tag");
  if (favFilterBtn) {
    favFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();

      favFilterBtn.classList.toggle("active");

      const showFavoritesOnly = favFilterBtn.classList.contains("active");
      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

      document.querySelectorAll(".product-card").forEach(card => {
        const id = card.dataset.id;
        if (showFavoritesOnly) {
          card.style.display = favorites.includes(id) ? "block" : "none";
        } else {
          card.style.display = "block";
        }
      });
    });
  }
});



// Giỏ hàng
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        // Tạo đối tượng product, lấy thông tin sản phẩm 
        const product = {
            id: productCard.dataset.id,
            name: productCard.dataset.name,
            price: parseInt(productCard.dataset.price),
            image: productCard.querySelector('img').src,
            quantity: 1
        };
        
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check xem sản phẩm đã có trong giỏ hàng chưa
        const existingItem = cart.find(item => item.id === product.id);
        if(existingItem) {
            existingItem.quantity++; // Nếu có tăng số lượng lên 1
        } else {
            cart.push(product); // Nếu chưa có thì thêm mới
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Đã thêm vào giỏ hàng!');
    });
});

