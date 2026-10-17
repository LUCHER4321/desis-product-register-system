# Sistema de Registro de Productos - Evaluación Desis

Este proyecto es un sistema web para el registro de productos que valida y almacena datos utilizando HTML, CSS puro, JavaScript (AJAX) y PHP nativo conectado a una base de datos MySQL/MariaDB.

## Versiones del Entorno

- PHP: 8.2.12

- Base de Datos (MySQL/MariaDB): 10.4.32-MariaDB

## Pasos para instalar y ejecutar el proyecto

1. Clonar el repositorio
   - Clona este repositorio de GitHub en tu máquina local. Si deseas mantenerlo en tu carpeta de GitHub personal, asegúrate de crear un enlace simbólico en XAMPP para que Apache pueda leerlo. (Ejemplo en CMD como administrador: `mklink /D "C:\xampp\htdocs\desis" "C:\Ruta\A\Tu\Repositorio"`)
   - Alternativamente, puedes clonar el proyecto directamente dentro de la carpeta `C:\xampp\htdocs\desis`.

2. Configurar la Base de Datos
   - Abre el Panel de Control de XAMPP e inicia los módulos de "Apache" y "MySQL".
   - Abre tu gestor de base de datos preferido (por ejemplo, phpMyAdmin ingresando a http://localhost/phpmyadmin/ en tu navegador, o VS Code con la extensión SQLTools).
   - Localiza el archivo de la base de datos que se encuentra en la ruta [`src/db/schema.sql`](/src/db/schema.sql).
   - Ejecuta todo el contenido del script [`schema.sql`](/src/db/schema.sql) para crear la base de datos `desis_db` junto con todas sus tablas y registros iniciales (bodegas, sucursales, monedas y materiales).

3. Configurar las Variables de Entorno
   - En la raíz del proyecto, asegúrate de que exista un archivo llamado `.env` (si no existe, créalo basándote en [`.env.example`](/.env.example)).
   - Configura las credenciales de tu base de datos local. Por defecto en XAMPP, suele verse así:

```
HOST=localhost
PORT=3306
DB_NAME=desis_db
USERNAME=root
```

4. Ejecutar la Aplicación
   - Abre tu navegador web y dirígete a la siguiente dirección:
     > http://localhost/desis/index.html
   - El formulario debería cargar correctamente, trayendo los datos dinámicos (Bodegas, Monedas) directamente desde la base de datos.

## Anexo: Arquitectura del Sistema

### Estructura de la Base de Datos (MER)

El modelo relacional garantiza la integridad de los datos y el manejo dinámico de las dependencias entre bodegas y sucursales.

```mermaid
erDiagram
    currency {
        VARCHAR(15) id PK
        VARCHAR(50) name
    }
    store {
        VARCHAR(15) id PK
        VARCHAR(50) name
    }
    branch {
        VARCHAR(15) id PK
        VARCHAR(50) name
    }
    store_branch {
        VARCHAR(15) store_id FK
        VARCHAR(15) branch_id FK
    }
    material {
        VARCHAR(15) id PK
        VARCHAR(50) name
    }
    product {
        VARCHAR(15) id PK
        VARCHAR(50) name
        VARCHAR(15) store_id FK
        VARCHAR(15) branch_id FK
        VARCHAR(15) currency_id FK
        FLOAT price
        VARCHAR(1000) description
    }
    product_material {
        VARCHAR(15) product_id FK
        VARCHAR(15) material_id FK
    }
    store ||--o{ product: store_id
    store_branch }o--|| branch: branch_id
    product }o--|| branch: branch_id
    currency ||--o{ product: currency_id
    store ||--o{ store_branch: store_id
    product ||--o{ product_material: product_id
    product_material }o--|| material: product_id
```

### Endpoints de la API REST (PHP Nativo)

El sistema utiliza un único controlador central mediante [`.htaccess`](/.htaccess) que enruta las peticiones HTTP a sus respectivos recursos.

```mermaid
flowchart LR
    sym0{{USE}} & sym1([GET]) & sym2[/POST/] & sym3[\PATCH\] & sym4(DELETE) ~~~ root
    root{{/api/desis}} --> use0{{/store}} & use1{{/branch}} & use2{{/currency}} & use3{{/material}} & use4{{/product}}
    use0 --> get00([/?productId]) & get01([/:id])
    use1 --> get10([/?storeId&productId]) & get11([/:id])
    use2 --> get20([/?productId]) & get21([/:id])
    use3 --> get30([/?productId]) & get31([/:id])
    use4 --> get40([/?storeId&branchId&currencyId&materialId]) & get41([/:id]) & post0[///]
```
