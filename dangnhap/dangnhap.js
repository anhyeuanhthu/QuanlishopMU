document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const messageDiv = document.getElementById("message") || (() => {
        const div = document.createElement("div");
        div.id = "message";
        div.style.marginTop = "10px";
        this.parentNode.appendChild(div);
        return div;
    })();

    try {
        const res = await fetch("http://localhost:8888/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            // ✅ Thêm isAdmin vào object user trước khi lưu
            const userWithRole = { ...data.user, isAdmin: data.isAdmin };
            sessionStorage.setItem("user", JSON.stringify(userWithRole));

            if (data.isAdmin) {
                window.location.href = "../admin.html";
            } else {
                const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
                sessionStorage.removeItem("redirectAfterLogin");
                window.location.href = redirectAfterLogin || "../index.html";
            }
        } else {
            messageDiv.textContent = "Sai tên đăng nhập hoặc mật khẩu!";
            messageDiv.style.color = "red";
            messageDiv.style.display = "block";
        }
    } catch (err) {
        messageDiv.textContent = "Lỗi kết nối server!";
        messageDiv.style.color = "red";
        messageDiv.style.display = "block";
        console.error(err);
    }
});
