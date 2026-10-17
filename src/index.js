/**
 * @template T
 * @param {T} data 
 * @param {function(T): {value: boolean, message?: string}} validationFunction
 * @returns {boolean}
 */
const validateData = (data, validationFunction) => {
    const { value, message } = validationFunction(data);
    if (!value && message) alert(message);
    return value;
};

/**
 * @template T
 * @param {T} data 
 * @param {function(T): Promise<{ value: boolean, message?: string }>} validationFunction
 * @returns {Promise<boolean>}
 */
const validateDataAsync = async (data, validationFunction) => {
    const { value, message } = await validationFunction(data);
    if (!value && message) alert(message);
    return value;
};

/**
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
const validateProductId = async (productId) => validateDataAsync(productId, async (id) => {
    if (!id || id.length === 0) return { value: false, message: "El código del producto no puede estar en blanco" };
    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/.test(id)) return { value: false, message: "El código del producto debe contener letras y números" };
    if (id.length < 5 || id.length > 15) return { value: false, message: "El código del producto debe tener entre 5 y 15 caracteres" };
    if(await productIdExists(id)) return { value: false, message: "El código del producto ya está registrado" };
    return { value: true };
});

/**
 * @param {string} productName
 * @returns {boolean}
 */
const validateProductName = (productName) => validateData(productName, (name) => {
    if (!name || name.length === 0) return { value: false, message: "El nombre del producto no puede estar en blanco" };
    if (name.length < 2 || name.length > 50) return { value: false, message: "El nombre del producto debe tener entre 2 y 50 caracteres" };
    return { value: true };
});

/**
 * @param {string} productPrice 
 * @returns {boolean}
 */
const validateProductPrice = (productPrice) => validateData(productPrice, (price) => {
    if (!price || price.length === 0) return { value: false, message: "El precio del producto no puede estar en blanco" };
    if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(price)) return { value: false, message: "El precio del producto debe ser un número positivo con hasta dos decimales" };
    return { value: true };
});

/**
 * @param {{name: string, checked: boolean}[]} productMaterials 
 * @returns {boolean}
 */
const validateProductMaterials = (productMaterials) => validateData(productMaterials, (materials) => {
    if (materials.filter(m => m.checked).length < 2) return { value: false, message: "Debe seleccionar al menos dos materiales para el producto" };
    return { value: true };
});

/**
 * @param {{id: string, name: string}} productStore 
 * @returns {boolean}
 */
const validateProductStore = (productStore) => validateData(productStore, (store) => {
    if (!store || store.id.length === 0) return { value: false, message: "Debe seleccionar una bodega" };
    return { value: true };
});

/**
 * @param {{id: string, name: string}} productBranch 
 * @returns {boolean}
 */
const validateProductBranch = (productBranch) => validateData(productBranch, (branch) => {
    if (!branch || branch.id.length === 0) return { value: false, message: "Debe seleccionar una sucursal para la bodega seleccionada" };
    return { value: true };
});

/**
 * @param {{id: string, name: string}} productCurrency 
 * @returns {boolean}
 */
const validateProductCurrency = (productCurrency) => validateData(productCurrency, (currency) => {
    if (!currency || currency.id.length === 0) return { value: false, message: "Debe seleccionar una moneda para el producto" };
    return { value: true };
});

/**
 * @param {string} productDescription 
 * @returns {boolean}
 */
const validateProductDescription = (productDescription) => validateData(productDescription, (description) => {
    if (!description || description.length === 0) return { value: false, message: "La descripción del producto no puede estar en blanco" };
    if (description.length < 10 || description.length > 1000) return { value: false, message: "La descripción del producto debe tener entre 10 y 1000 caracteres" };
    return { value: true };
});

/**
 * @param {string} productId 
 * @returns {Promise<boolean>}
 */
const productIdExists = async (productId) => {
    try {
        const response = await fetch(`api/desis/product/${productId}`);
        if (response.ok) {
            const data = await response.json();
            return !!data && !!data.id; 
        }
        return false;
    } catch (error) {
        console.error("Error verifying product code:", error);
        return false;
    }
}

/**
 * @returns {Promise<{id: string, name: string}[]>}
 */
const getStores = async () => {
    try {
        const response = await fetch("api/desis/store");
        if (response.ok) return await response.json();
        return [];
    } catch (error) {
        console.error("Error getting stores:", error);
        return [];
    }
};

/**
 * @param {string} storeId 
 * @returns {Promise<{id: string, name: string}[]>}
 */
const getBranches = async (storeId) => {
    if (!storeId) return [];
    try {
        const response = await fetch(`api/desis/branch/?storeId=${storeId}`);
        if (response.ok) return await response.json();
        return [];
    } catch (error) {
        console.error("Error getting branches:", error);
        return [];
    }
};

/**
 * @returns {Promise<{id: string, name: string}[]>}
 */
const getCurrencies = async () => {
    try {
        const response = await fetch("api/desis/currency");
        if (response.ok) return await response.json();
        return [];
    } catch (error) {
        console.error("Error getting currencies:", error);
        return [];
    }
};

getStores().then(stores => {
    const storeSelect = document.getElementById("product-store").getElementsByTagName("select")[0];
    storeSelect.innerHTML = "";
    [{ id: "", name: "Seleccione una Bodega" }, ...stores].forEach(store => {
        const option = document.createElement("option");
        option.value = store.id;
        option.textContent = store.name;
        storeSelect.appendChild(option);
    });
    storeSelect.addEventListener("change", async (event) => {
        const storeId = event.target.value;
        const branchSelect = document.getElementById("product-branch").getElementsByTagName("select")[0];
        branchSelect.innerHTML = "";
        const branches = await getBranches(storeId);
        [{ id: "", name: "Seleccione una Sucursal" }, ...branches].forEach(branch => {
            const option = document.createElement("option");
            option.value = branch.id;
            option.textContent = branch.name;
            branchSelect.appendChild(option);
        });
    });
});

getCurrencies().then(currencies => {
    const currencySelect = document.getElementById("product-currency").getElementsByTagName("select")[0];
    currencySelect.innerHTML = "";
    [{ id: "", name: "Seleccione una Moneda" }, ...currencies].forEach(currency => {
        const option = document.createElement("option");
        option.value = currency.id;
        option.textContent = currency.name;
        currencySelect.appendChild(option);
    });
});

document.getElementById("submit-button").addEventListener("click", async (event) => {
    event.preventDefault();
    const idInput = document.getElementById("product-code").getElementsByTagName("input")[0];
    const nameInput = document.getElementById("product-name").getElementsByTagName("input")[0];
    const priceInput = document.getElementById("product-price").getElementsByTagName("input")[0];
    const descriptionArea = document.getElementById("product-description").getElementsByTagName("textarea")[0];
    const storeSelect = document.getElementById("product-store").getElementsByTagName("select")[0];
    const branchSelect = document.getElementById("product-branch").getElementsByTagName("select")[0];
    const currencySelect = document.getElementById("product-currency").getElementsByTagName("select")[0];
    const storeOptions = storeSelect.getElementsByTagName("option");
    const branchOptions = branchSelect.getElementsByTagName("option");
    const currencyOptions = currencySelect.getElementsByTagName("option");
    const materialCheckboxes = [...document.getElementById("product-material").getElementsByTagName("div")[0].getElementsByTagName("div")].map(d => d.getElementsByTagName("input")[0]);
    const stores = [...storeOptions].map(o => ({ id: o.value, name: o.textContent }));
    const branches = [...branchOptions].map(o => ({ id: o.value, name: o.textContent }));
    const currencies = [...currencyOptions].map(o => ({ id: o.value, name: o.textContent }));
    const materials = materialCheckboxes.map(c => ({ name: c.parentElement.getElementsByTagName("label")[0].textContent, checked: c.checked }));
    if(!await validateProductId(idInput.value)) return;
    if(!validateProductName(nameInput.value)) return;
    if(!validateProductPrice(priceInput.value)) return;
    if(!validateProductStore(stores[storeSelect.selectedIndex])) return;
    if(!validateProductBranch(branches[branchSelect.selectedIndex])) return;
    if(!validateProductCurrency(currencies[currencySelect.selectedIndex])) return;
    if(!validateProductMaterials(materials)) return;
    if(!validateProductDescription(descriptionArea.value)) return;
    const productData = {
        id: idInput.value,
        name: nameInput.value,
        store_id: stores[storeSelect.selectedIndex].id,
        branch_id: branches[branchSelect.selectedIndex].id,
        currency_id: currencies[currencySelect.selectedIndex].id,
        price: parseFloat(priceInput.value),
        description: descriptionArea.value,
        materials: materials.filter(m => m.checked).map(m => m.name)
    };
    try {
        const response = await fetch("api/desis/product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });
        const result = await response.json();
        if (response.ok) alert(`${nameInput.value} guardado exitosamente`);
        else alert("Error: " + result.message);
    } catch (error) {
        console.error("Error saving the product:", error);
        alert("Ocurrió un error al intentar conectarse con el servidor");
    }
});