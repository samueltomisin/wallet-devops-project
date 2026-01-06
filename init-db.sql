-- Create separate databases for each microservice
CREATE DATABASE wallet_db;
CREATE DATABASE bill_payment_db;
CREATE DATABASE notification_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE wallet_db TO wallet_admin;
GRANT ALL PRIVILEGES ON DATABASE bill_payment_db TO wallet_admin;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO wallet_admin;