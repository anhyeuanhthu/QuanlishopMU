package com.shopmu.invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Order {
    private String orderCode;
    private LocalDateTime orderDate;
    private final List<OrderItem> items = new ArrayList<>();
    private BigDecimal shippingFee;
    private String discountCode;
    private BigDecimal discountAmount;
    private String customerName;
    private String address;
    private String phone;
    private String paymentMethod;

    public Order(
            String orderCode,
            LocalDateTime orderDate,
            List<OrderItem> items,
            BigDecimal shippingFee,
            String discountCode,
            BigDecimal discountAmount,
            String customerName,
            String address,
            String phone,
            String paymentMethod
    ) {
        setOrderCode(orderCode);
        setOrderDate(orderDate);
        setItems(items);
        setShippingFee(shippingFee);
        setDiscountCode(discountCode);
        setDiscountAmount(discountAmount);
        setCustomerName(customerName);
        setAddress(address);
        setPhone(phone);
        setPaymentMethod(paymentMethod);
    }

    public BigDecimal getSubtotal() {
        return items.stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotal() {
        return getSubtotal().add(shippingFee).subtract(discountAmount);
    }

    public String getPaymentStatus() {
        if ("COD".equalsIgnoreCase(paymentMethod)) {
            return "Chưa thanh toán (Trả khi nhận hàng)";
        }
        return "Đã thanh toán ✅";
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = requireText(orderCode, "orderCode");
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = Objects.requireNonNull(orderDate, "orderDate is required");
    }

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public void setItems(List<OrderItem> items) {
        Objects.requireNonNull(items, "items is required");
        if (items.isEmpty()) {
            throw new IllegalArgumentException("items must not be empty");
        }
        this.items.clear();
        this.items.addAll(items);
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = requireNonNegative(shippingFee, "shippingFee");
    }

    public String getDiscountCode() {
        return discountCode;
    }

    public void setDiscountCode(String discountCode) {
        this.discountCode = discountCode == null ? "" : discountCode.trim();
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = requireNonNegative(discountAmount, "discountAmount");
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = requireText(customerName, "customerName");
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = requireText(address, "address");
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = requireText(phone, "phone");
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = requireText(paymentMethod, "paymentMethod");
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
