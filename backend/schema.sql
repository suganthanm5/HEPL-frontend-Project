-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    product_code VARCHAR(255),
    uim_price DECIMAL(19, 2),
    mrp DECIMAL(19, 2),
    selling_price DECIMAL(19, 2),
    purchase_price DECIMAL(19, 2),
    division_id BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    image LONGTEXT,
    FOREIGN KEY (division_id) REFERENCES divisions(id)
);

-- Outlets Table
CREATE TABLE IF NOT EXISTS outlets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outlet_name VARCHAR(255) NOT NULL,
    outlet_code VARCHAR(255) UNIQUE,
    outlet_type VARCHAR(255),
    owner_name VARCHAR(255),
    address TEXT,
    location_id BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20),
    profile_picture VARCHAR(255),
    outlet_id BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id)
);

-- Outlet Division Products (Mapping Table)
CREATE TABLE IF NOT EXISTS outlet_division_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outlet_id BIGINT NOT NULL,
    division_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Product Batches
CREATE TABLE IF NOT EXISTS product_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    batch_no VARCHAR(255) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    quantity INT NOT NULL,
    purchase_price DECIMAL(19, 2),
    selling_price DECIMAL(19, 2),
    status VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Outlet Stock
CREATE TABLE IF NOT EXISTS outlet_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outlet_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    available_qty INT NOT NULL,
    reserved_qty INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(255) NOT NULL UNIQUE,
    outlet_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    status VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(19, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (batch_id) REFERENCES product_batches(id)
);

-- Stock Transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_type VARCHAR(20) NOT NULL,
    product_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    outlet_id BIGINT,
    quantity INT NOT NULL,
    reference_id BIGINT,
    created_by_user_id BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (batch_id) REFERENCES product_batches(id),
    FOREIGN KEY (outlet_id) REFERENCES outlets(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_outlet ON orders(outlet_id);
CREATE INDEX idx_outlet_stock_outlet ON outlet_stock(outlet_id);
CREATE INDEX idx_outlet_stock_product ON outlet_stock(product_id);
CREATE INDEX idx_product_batches_status ON product_batches(status);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX idx_stock_transactions_outlet ON stock_transactions(outlet_id);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

