import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.awt.*;
import java.awt.image.*;
import javax.imageio.*;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

/**
 * QRServer - Java HTTP Server sinh mã QR tượng trưng cho thanh toán
 * Chạy trên port 9000
 * Endpoint: POST /generate-qr
 * Body JSON: { "orderId": "...", "amount": 123456, "method": "momo", "customerName": "..." }
 * Response JSON: { "success": true, "qrBase64": "data:image/png;base64,..." }
 */
public class QRServer {

    public static void main(String[] args) throws Exception {
        int port = 9000;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Endpoint sinh QR
        server.createContext("/generate-qr", new QRHandler());

        // Endpoint health check
        server.createContext("/health", exchange -> {
            String response = "{\"status\":\"ok\",\"message\":\"QR Server running on port 9000\"}";
            sendResponse(exchange, 200, response);
        });

        // CORS preflight
        server.createContext("/", exchange -> {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCORSHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
            } else {
                sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("╔════════════════════════════════════════╗");
        System.out.println("║   QR Payment Server (Java) - Port 9000 ║");
        System.out.println("╚════════════════════════════════════════╝");
        System.out.println("  Endpoint: POST http://localhost:9000/generate-qr");
        System.out.println("  Status  : http://localhost:9000/health");
    }

    static void addCORSHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    static void sendResponse(HttpExchange exchange, int code, String body) throws IOException {
        addCORSHeaders(exchange);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    // Handler sinh QR
    static class QRHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Handle CORS
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                addCORSHeaders(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            try {
                // Đọc body
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                System.out.println("[QRServer] Request: " + body);

                // Parse JSON đơn giản (không dùng thư viện ngoài)
                String orderId    = extractJsonField(body, "orderId");
                String amountStr  = extractJsonField(body, "amount");
                String method     = extractJsonField(body, "method");
                String customerName = extractJsonField(body, "customerName");

                long amount = 0;
                try { amount = Long.parseLong(amountStr.replaceAll("[^0-9]", "")); } catch (Exception ignored) {}

                // Nội dung QR
                String qrContent = buildQRContent(method, orderId, amount, customerName);

                // Sinh ảnh QR
                BufferedImage qrImage = generateQRImage(qrContent, method, orderId, amount, customerName);

                // Chuyển sang Base64
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(qrImage, "PNG", baos);
                String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
                String dataUri = "data:image/png;base64," + base64;

                String methodLabel = getMethodLabel(method);
                String response = String.format(
                    "{\"success\":true,\"qrBase64\":\"%s\",\"orderId\":\"%s\",\"amount\":%d,\"method\":\"%s\",\"methodLabel\":\"%s\",\"qrContent\":\"%s\"}",
                    dataUri, orderId, amount, method, methodLabel,
                    qrContent.replace("\"", "\\\"").replace("\n", "\\n")
                );

                System.out.println("[QRServer] QR generated for order " + orderId + " - " + methodLabel);
                sendResponse(exchange, 200, response);

            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}");
            }
        }

        // Xây dựng nội dung QR theo chuẩn từng ví
        String buildQRContent(String method, String orderId, long amount, String customerName) {
            switch (method.toLowerCase()) {
                case "momo":
                    // Chuẩn MoMo deep link (tượng trưng)
                    return String.format(
                        "2|99|0899123456|SPORTSHOP|%s|0|0|%d|Thanh toan don hang %s",
                        customerName, amount, orderId
                    );
                case "zalopay":
                    // Chuẩn ZaloPay (tượng trưng)
                    return String.format(
                        "zalopay://payment?app_id=2553&order_id=%s&amount=%d&description=Thanh+toan+don+hang+%s",
                        orderId, amount, orderId
                    );
                case "banking":
                default:
                    // VietQR standard (NAPAS 247)
                    return String.format(
                        "000201010212" +
                        "38580010A000000727" +
                        "01220006970436" +
                        "01101234567890" +
                        "0208QRIBFTTA" +
                        "530370454%02d%d" +
                        "5802VN" +
                        "5920SPORTSHOP ONLINE" +
                        "6304ABCD",
                        String.valueOf(amount).length(), amount
                    );
            }
        }

        String getMethodLabel(String method) {
            switch (method.toLowerCase()) {
                case "momo": return "Ví MoMo";
                case "zalopay": return "ZaloPay";
                case "banking": return "Chuyển khoản ngân hàng";
                default: return method;
            }
        }

        // Màu chủ đạo theo từng phương thức
        Color getMethodColor(String method) {
            switch (method.toLowerCase()) {
                case "momo": return new Color(0xAE, 0x17, 0x7B);    // Tím MoMo
                case "zalopay": return new Color(0x00, 0x68, 0xFF);  // Xanh ZaloPay
                case "banking": return new Color(0x00, 0x6C, 0x35);  // Xanh ngân hàng
                default: return new Color(0x1A, 0x1A, 0x2E);
            }
        }

        // Logo text theo từng phương thức  
        String getMethodLogo(String method) {
            switch (method.toLowerCase()) {
                case "momo": return "MoMo";
                case "zalopay": return "ZaloPay";
                case "banking": return "VietQR";
                default: return "PAY";
            }
        }

        /**
         * Sinh ảnh QR code có thiết kế đẹp
         * Thuật toán: dùng QRCodeGenerator thuần Java
         */
        BufferedImage generateQRImage(String content, String method, String orderId,
                                       long amount, String customerName) {
            int imgWidth = 480;
            int imgHeight = 620;

            BufferedImage img = new BufferedImage(imgWidth, imgHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();

            // Antialiasing
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            Color methodColor = getMethodColor(method);
            Color lightColor = lighten(methodColor, 0.92f);

            // ── Nền ──
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, imgWidth, imgHeight);

            // ── Header gradient ──
            GradientPaint headerGrad = new GradientPaint(0, 0, methodColor, imgWidth, 90, darken(methodColor, 0.8f));
            g.setPaint(headerGrad);
            g.fillRect(0, 0, imgWidth, 90);

            // ── Logo text ──
            g.setColor(Color.WHITE);
            g.setFont(new Font("Arial", Font.BOLD, 28));
            String logoText = getMethodLogo(method);
            FontMetrics fm = g.getFontMetrics();
            g.drawString(logoText, (imgWidth - fm.stringWidth(logoText)) / 2, 40);

            // ── Subtitle ──
            g.setFont(new Font("Arial", Font.PLAIN, 13));
            String sub = "Quét mã để thanh toán";
            fm = g.getFontMetrics();
            g.drawString(sub, (imgWidth - fm.stringWidth(sub)) / 2, 68);

            // ── QR matrix ──
            int qrSize = 260;
            int qrX = (imgWidth - qrSize) / 2;
            int qrY = 110;

            // Vẽ nền QR (shadow nhẹ)
            g.setColor(new Color(0, 0, 0, 20));
            g.fillRoundRect(qrX - 2, qrY + 4, qrSize + 14, qrSize + 14, 16, 16);

            // Khung trắng quanh QR
            g.setColor(Color.WHITE);
            g.fillRoundRect(qrX - 5, qrY - 5, qrSize + 20, qrSize + 20, 16, 16);

            // Stroke viền
            g.setColor(new Color(230, 230, 230));
            g.setStroke(new BasicStroke(1.5f));
            g.drawRoundRect(qrX - 5, qrY - 5, qrSize + 20, qrSize + 20, 16, 16);

            // Vẽ QR matrix thực sự
            boolean[][] matrix = SimpleQREncoder.encode(content, 29);
            drawQRMatrix(g, matrix, qrX, qrY, qrSize, methodColor);

            // ── Divider ──
            g.setColor(new Color(240, 240, 240));
            g.setStroke(new BasicStroke(1));
            g.drawLine(40, qrY + qrSize + 30, imgWidth - 40, qrY + qrSize + 30);

            // ── Thông tin đơn hàng ──
            int infoY = qrY + qrSize + 55;
            String amountFormatted = String.format("%,d₫", amount).replace(",", ".");

            // Số tiền
            g.setFont(new Font("Arial", Font.BOLD, 26));
            g.setColor(methodColor);
            fm = g.getFontMetrics();
            g.drawString(amountFormatted, (imgWidth - fm.stringWidth(amountFormatted)) / 2, infoY);

            // Mã đơn hàng
            g.setFont(new Font("Arial", Font.PLAIN, 13));
            g.setColor(new Color(100, 100, 100));
            String orderLabel = "Mã đơn hàng: #" + orderId;
            fm = g.getFontMetrics();
            g.drawString(orderLabel, (imgWidth - fm.stringWidth(orderLabel)) / 2, infoY + 28);

            // Tên khách
            if (customerName != null && !customerName.isEmpty()) {
                g.setFont(new Font("Arial", Font.PLAIN, 12));
                g.setColor(new Color(130, 130, 130));
                String nameLabel = "Khách hàng: " + customerName;
                fm = g.getFontMetrics();
                g.drawString(nameLabel, (imgWidth - fm.stringWidth(nameLabel)) / 2, infoY + 50);
            }

            // ── Footer ──
            g.setColor(lightColor);
            g.fillRect(0, imgHeight - 45, imgWidth, 45);
            g.setFont(new Font("Arial", Font.PLAIN, 11));
            g.setColor(darken(methodColor, 0.7f));
            String footer = "Mã QR có hiệu lực trong 15 phút  •  SportShop";
            fm = g.getFontMetrics();
            g.drawString(footer, (imgWidth - fm.stringWidth(footer)) / 2, imgHeight - 17);

            g.dispose();
            return img;
        }

        void drawQRMatrix(Graphics2D g, boolean[][] matrix, int x, int y, int size, Color color) {
            if (matrix == null) return;
            int n = matrix.length;
            float cell = (float) size / n;

            for (int row = 0; row < n; row++) {
                for (int col = 0; col < n; col++) {
                    if (matrix[row][col]) {
                        int px = x + Math.round(col * cell);
                        int py = y + Math.round(row * cell);
                        int pw = Math.max(1, Math.round(cell) - 1);
                        int ph = Math.max(1, Math.round(cell) - 1);
                        // Màu module: đen hoặc màu chủ đề
                        if (isFinderPattern(row, col, n)) {
                            g.setColor(color);
                        } else {
                            g.setColor(new Color(20, 20, 20));
                        }
                        g.fillRect(px, py, pw, ph);
                    }
                }
            }
        }

        boolean isFinderPattern(int row, int col, int n) {
            return (row < 8 && col < 8) || (row < 8 && col >= n - 8) || (row >= n - 8 && col < 8);
        }

        // Trích xuất field từ JSON thủ công
        String extractJsonField(String json, String field) {
            String key = "\"" + field + "\"";
            int idx = json.indexOf(key);
            if (idx < 0) return "";
            idx += key.length();
            while (idx < json.length() && (json.charAt(idx) == ' ' || json.charAt(idx) == ':')) idx++;
            if (idx >= json.length()) return "";
            char first = json.charAt(idx);
            if (first == '"') {
                int end = json.indexOf('"', idx + 1);
                while (end > 0 && json.charAt(end - 1) == '\\') end = json.indexOf('"', end + 1);
                return end > 0 ? json.substring(idx + 1, end) : "";
            } else {
                int end = idx;
                while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
                return json.substring(idx, end).trim();
            }
        }

        Color lighten(Color c, float factor) {
            int r = Math.min(255, (int)(c.getRed() + (255 - c.getRed()) * factor));
            int g = Math.min(255, (int)(c.getGreen() + (255 - c.getGreen()) * factor));
            int b = Math.min(255, (int)(c.getBlue() + (255 - c.getBlue()) * factor));
            return new Color(r, g, b);
        }

        Color darken(Color c, float factor) {
            return new Color((int)(c.getRed() * factor), (int)(c.getGreen() * factor), (int)(c.getBlue() * factor));
        }
    }
}
