-- Bill providers (e.g., PHCN, DSTV, GOTV, MTN, Airtel)
CREATE TABLE IF NOT EXISTS bill_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('electricity', 'water', 'cable_tv', 'internet', 'insurance')),
    description TEXT,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill payments history
CREATE TABLE IF NOT EXISTS bill_payments (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES bill_providers(id),
    username VARCHAR(50) NOT NULL, -- User who made payment
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    account_number VARCHAR(50) NOT NULL, -- Customer's account with the provider
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(100), -- From wallet service
    metadata JSONB, -- Extra info (meter number, customer name, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airtime purchases
CREATE TABLE IF NOT EXISTS airtime_purchases (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    network VARCHAR(20) NOT NULL CHECK (network IN ('MTN', 'Airtel', 'Glo', '9mobile')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bill_payments_username ON bill_payments(username);
CREATE INDEX idx_bill_payments_status ON bill_payments(status);
CREATE INDEX idx_bill_payments_created_at ON bill_payments(created_at DESC);
CREATE INDEX idx_airtime_username ON airtime_purchases(username);
CREATE INDEX idx_airtime_created_at ON airtime_purchases(created_at DESC);

-- Insert sample bill providers
INSERT INTO bill_providers (name, category, description) VALUES
    ('EKEDC (Eko Electricity)', 'electricity', 'Eko Electricity Distribution Company'),
    ('IKEDC (Ikeja Electric)', 'electricity', 'Ikeja Electric Distribution Company'),
    ('DSTV', 'cable_tv', 'Digital Satellite Television'),
    ('GOTV', 'cable_tv', 'GO Television'),
    ('Startimes', 'cable_tv', 'StarTimes Cable TV'),
    ('Lagos Water Corporation', 'water', 'Lagos State Water Corporation'),
    ('Spectranet', 'internet', 'Spectranet Internet Service')
ON CONFLICT DO NOTHING;