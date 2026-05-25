package com.shopmu.invoice;

import java.math.BigDecimal;
import java.util.Objects;

public class OrderItem {
    private String productName;
    private String size;
    private int quantity;
    private BigDecimal unitPrice;

    public OrderItem(String productName, String size, int quantity, BigDecimal unitPrice) {
        setProductName(productName);
        setSize(size);
        setQuantity(quantity);
        setUnitPrice(unitPrice);
    }

    public BigDecimal getLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = requireText(productName, "productName");
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = requireText(size, "size");
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be greater than 0");
        }
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = requireNonNegative(unitPrice, "unitPrice");
    }

    private static String requireText(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private static BigDecimal requireNonNegative(BigDecimal value, String fieldName) {
        Objects.requireNonNull(value, fieldName + " is required");
        if (value.signum() < 0) {
            throw new IllegalArgumentException(fieldName + " must be greater than or equal to 0");
        }
        return value;
    }
}
