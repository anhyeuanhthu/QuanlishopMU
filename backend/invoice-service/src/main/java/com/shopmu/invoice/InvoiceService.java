package com.shopmu.invoice;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.printing.PDFPrintable;
import org.apache.pdfbox.printing.Scaling;

import javax.print.PrintService;
import javax.print.PrintServiceLookup;
import javax.print.attribute.HashPrintRequestAttributeSet;
import javax.print.attribute.PrintRequestAttributeSet;
import javax.print.attribute.standard.Copies;
import java.awt.print.PrinterException;
import java.awt.print.PrinterJob;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;

public class InvoiceService {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int LINE_LENGTH = 48;
    private static final String DOUBLE_LINE = repeat("═", LINE_LENGTH);
    private static final String SINGLE_LINE = repeat("─", LINE_LENGTH);

    public void generatePDF(Order order, String outputPath) {
        Objects.requireNonNull(order, "order is required");
        Objects.requireNonNull(outputPath, "outputPath is required");

        try {
            Path path = Path.of(outputPath);
            Path parent = path.toAbsolutePath().getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            try (PdfWriter writer = new PdfWriter(outputPath);
                 PdfDocument pdf = new PdfDocument(writer);
                 Document document = new Document(pdf, PageSize.A5)) {

                document.setMargins(24, 18, 24, 18);
                PdfFont font = loadVietnameseFont();

                addCentered(document, font, DOUBLE_LINE, 10, false);
                addCentered(document, font, "SHOPMU", 16, true);
                addCentered(document, font, "Nơi Tụ Hợp Những Món Hàng Dành Cho Quỷ Đỏ", 9, false);
                addCentered(document, font, DOUBLE_LINE, 10, false);
                addBlank(document, font);

                addLine(document, font, "Ngày: " + DATE_FORMAT.format(order.getOrderDate()));
                addLine(document, font, "Mã đơn: " + order.getOrderCode());
                addLine(document, font, SINGLE_LINE);
                addBlank(document, font);

                addLine(document, font, "SẢN PHẨM:");
                for (OrderItem item : order.getItems()) {
                    addLine(document, font, formatItemLine(item));
                }
                addBlank(document, font);

                addLine(document, font, SINGLE_LINE);
                addLine(document, font, formatSummaryLine("Tổng tiền hàng:", order.getSubtotal(), false));
                addLine(document, font, formatSummaryLine("Phí vận chuyển:", order.getShippingFee(), false));

                String discountLabel = order.getDiscountCode().isEmpty()
                        ? "Giảm giá:"
                        : "Giảm giá (" + order.getDiscountCode() + "):";
                addLine(document, font, formatSummaryLine(discountLabel, order.getDiscountAmount(), true));

                addLine(document, font, DOUBLE_LINE);
                addLine(document, font, formatSummaryLine("TỔNG CỘNG:", order.getTotal(), false));
                addLine(document, font, DOUBLE_LINE);
                addBlank(document, font);

                addLine(document, font, "Khách hàng: " + order.getCustomerName());
                addLine(document, font, "Địa chỉ: " + order.getAddress());
                addLine(document, font, "SDT: " + order.getPhone());
                addBlank(document, font);

                addLine(document, font, "Thanh toán: " + order.getPaymentMethod());
                addLine(document, font, "Trạng thái: " + order.getPaymentStatus());
                addBlank(document, font);

                addCentered(document, font, DOUBLE_LINE, 10, false);
                addCentered(document, font, "Cảm ơn quý khách!", 11, true);
                addCentered(document, font, "Liên hệ: 0123456789", 10, false);
            }
        } catch (Exception e) {
            throw new InvoiceException("Cannot generate invoice PDF: " + e.getMessage(), e);
        }
    }

    public void printPDF(Order order) {
        printPDF(order, 1);
    }

    public void printPDF(Order order, int copies) {
        Objects.requireNonNull(order, "order is required");
        try {
            Path tempFile = Files.createTempFile("shopmu-invoice-", ".pdf");
            generatePDF(order, tempFile.toString());
            printPDF(tempFile.toString(), copies);
        } catch (IOException e) {
            throw new InvoiceException("Cannot create temporary invoice PDF: " + e.getMessage(), e);
        }
    }

    public void printPDF(String pdfPath) {
        printPDF(pdfPath, 1);
    }

    public void printPDF(String pdfPath, int copies) {
        printPDF(pdfPath, null, copies, false);
    }

    public void printPDF(String pdfPath, String printerName, int copies) {
        printPDF(pdfPath, printerName, copies, false);
    }

    public void printPDF(String pdfPath, String printerName, int copies, boolean alwaysShowDialog) {
        Objects.requireNonNull(pdfPath, "pdfPath is required");
        if (copies <= 0) {
            throw new IllegalArgumentException("copies must be greater than 0");
        }

        Path path = Path.of(pdfPath);
        if (!Files.exists(path)) {
            throw new InvoiceException("PDF file does not exist: " + pdfPath);
        }

        try (PDDocument pdf = PDDocument.load(path.toFile())) {
            PrinterJob job = PrinterJob.getPrinterJob();
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            attributes.add(new Copies(copies));

            PrintService printService = resolvePrintService(printerName);
            if (printService != null) {
                job.setPrintService(printService);
            }

            if (alwaysShowDialog || printService == null) {
                boolean accepted = job.printDialog(attributes);
                if (!accepted) {
                    return;
                }
            }

            job.setCopies(copies);
            job.setPrintable(new PDFPrintable(pdf, Scaling.SHRINK_TO_FIT));
            job.print(attributes);
        } catch (IOException | PrinterException e) {
            throw new InvoiceException("Cannot print invoice PDF: " + e.getMessage(), e);
        }
    }

    private PrintService resolvePrintService(String printerName) throws PrinterException {
        if (printerName != null && !printerName.trim().isEmpty()) {
            for (PrintService service : PrinterJob.lookupPrintServices()) {
                if (service.getName().equalsIgnoreCase(printerName.trim())) {
                    return service;
                }
            }
            throw new PrinterException("Printer not found: " + printerName);
        }
        return PrintServiceLookup.lookupDefaultPrintService();
    }

    private static void addLine(Document document, PdfFont font, String text) {
        document.add(new Paragraph(text)
                .setFont(font)
                .setFontSize(9)
                .setFixedLeading(12)
                .setMargin(0));
    }

    private static void addCentered(Document document, PdfFont font, String text, float size, boolean bold) {
        Paragraph paragraph = new Paragraph(text)
                .setFont(font)
                .setFontSize(size)
                .setFixedLeading(size + 3)
                .setTextAlignment(TextAlignment.CENTER)
                .setMargin(0);
        if (bold) {
            paragraph.setBold();
        }
        document.add(paragraph);
    }

    private static void addBlank(Document document, PdfFont font) {
        addLine(document, font, "");
    }

    private static String formatItemLine(OrderItem item) {
        String name = fit(item.getProductName(), 18);
        String unitPrice = formatMoney(item.getUnitPrice());
        String lineTotal = formatMoney(item.getLineTotal());
        return String.format(
                Locale.ROOT,
                "%-18s %3s %2dx %10s = %10s",
                name,
                fit(item.getSize(), 3),
                item.getQuantity(),
                unitPrice,
                lineTotal
        );
    }

    private static String formatSummaryLine(String label, BigDecimal amount, boolean negative) {
        String money = (negative && amount.signum() > 0 ? "-" : "") + formatMoney(amount);
        return String.format(Locale.ROOT, "%-28s %18s", fit(label, 28), money);
    }

    private static String formatMoney(BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.ROOT);
        symbols.setGroupingSeparator('.');
        DecimalFormat formatter = new DecimalFormat("#,##0", symbols);
        return formatter.format(amount) + "đ";
    }

    private static PdfFont loadVietnameseFont() throws IOException {
        String[] fontPaths = {
                "C:/Windows/Fonts/consola.ttf",
                "C:/Windows/Fonts/arial.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
                "/System/Library/Fonts/Menlo.ttc"
        };

        for (String fontPath : fontPaths) {
            if (Files.exists(Path.of(fontPath))) {
                return PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);
            }
        }
        return PdfFontFactory.createFont();
    }

    private static String fit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String text = value.trim();
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, Math.max(0, maxLength - 1)) + ".";
    }

    private static String repeat(String value, int count) {
        return value.repeat(count);
    }

    public static class InvoiceException extends RuntimeException {
        public InvoiceException(String message) {
            super(message);
        }

        public InvoiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
