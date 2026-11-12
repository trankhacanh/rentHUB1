ALTER TABLE contract_versions
    ADD COLUMN renter_first_name VARCHAR(255),
    ADD COLUMN renter_last_name VARCHAR(255),
    ADD COLUMN renter_email VARCHAR(255),
    ADD COLUMN owner_first_name VARCHAR(255),
    ADD COLUMN owner_last_name VARCHAR(255),
    ADD COLUMN owner_email VARCHAR(255);