CREATE DATABASE IF NOT EXISTS desis_db;
USE desis_db;
CREATE TABLE IF NOT EXISTS currency (
    id VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS store (
    id VARCHAR(15) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS branch (
    id VARCHAR(15) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS store_branch (
    store_id VARCHAR(15),
    branch_id VARCHAR(15),
    PRIMARY KEY (store_id, branch_id),
    FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS material (
    id VARCHAR(15) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS product (
    id VARCHAR(15) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    store_id VARCHAR(15) NOT NULL,
    branch_id VARCHAR(15) NOT NULL,
    currency_id VARCHAR(15) NOT NULL,
    price FLOAT NOT NULL,
    description VARCHAR(1000) NOT NULL,
    FOREIGN KEY (store_id) REFERENCES store(id),
    FOREIGN KEY (branch_id) REFERENCES branch(id),
    FOREIGN KEY (currency_id) REFERENCES currency(id)
);
CREATE TABLE IF NOT EXISTS product_material (
    product_id VARCHAR(15),
    material_id VARCHAR(15),
    PRIMARY KEY (product_id, material_id),
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES material(id) ON DELETE CASCADE
);
INSERT INTO currency
VALUES ("usd", "Dólares"),
    ("clp", "Pesos Chilenos");
INSERT INTO store
VALUES ("str00", "Bodega 0"),
    ("str01", "Bodega 1"),
    ("str02", "Bodega 2"),
    ("str03", "Bodega 3");
INSERT INTO branch
VALUES ("brn00", "Sucursal 0"),
    ("brn01", "Sucursal 1"),
    ("brn02", "Sucursal 2"),
    ("brn03", "Sucursal 3"),
    ("brn04", "Sucursal 4"),
    ("brn05", "Sucursal 5"),
    ("brn06", "Sucursal 6"),
    ("brn07", "Sucursal 7"),
    ("brn08", "Sucursal 8"),
    ("brn09", "Sucursal 9"),
    ("brn10", "Sucursal 10"),
    ("brn11", "Sucursal 11");
INSERT INTO store_branch
VALUES ("str00", "brn00"),
    ("str00", "brn01"),
    ("str00", "brn02"),
    ("str00", "brn06"),
    ("str01", "brn03"),
    ("str01", "brn04"),
    ("str01", "brn05"),
    ("str01", "brn08"),
    ("str02", "brn06"),
    ("str02", "brn07"),
    ("str02", "brn08"),
    ("str02", "brn11"),
    ("str03", "brn09"),
    ("str03", "brn10"),
    ("str03", "brn11"),
    ("str03", "brn02");
INSERT INTO material
VALUES ("plastic", "Plástico"),
    ("metal", "Metal"),
    ("wood", "Madera"),
    ("glass", "Vidrio"),
    ("textile", "Textil");