/* =====================================================
   AQUAVENTURE ADD-ON SERVICES MANAGEMENT JS
   ===================================================== */

const API_URL = "http://localhost:8080/api/add-ons";

const tableBody = document.getElementById("serviceTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addServiceBtn = document.getElementById("addServiceBtn");

const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const serviceForm = document.getElementById("serviceForm");
const modalTitle = document.getElementById("modalTitle");

const serviceIdInput = document.getElementById("serviceId");
const serviceNameInput = document.getElementById("serviceName");
const priceInput = document.getElementById("price");
const descriptionInput = document.getElementById("description");
const statusSelect = document.getElementById("status");

// Stats
const totalServicesEl = document.getElementById("totalServices");
const activeServicesEl = document.getElementById("activeServices");
const averagePriceEl = document.getElementById("averagePrice");
const premiumCountEl = document.getElementById("premiumCount");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const backToTop = document.getElementById("backToTop");

const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");

let services = [];


/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadServices();
    setupEventListeners();
});


/* =====================================================
   EVENT LISTENERS
   ===================================================== */

function setupEventListeners() {

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterAndRenderServices
        );
    }


    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterAndRenderServices
        );
    }


    if (refreshBtn) {
        refreshBtn.addEventListener(
            "click",
            loadServices
        );
    }


    if (addServiceBtn) {
        addServiceBtn.addEventListener(
            "click",
            openAddModal
        );
    }


    if (closeModalBtn) {
        closeModalBtn.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelModalBtn) {
        cancelModalBtn.addEventListener(
            "click",
            closeModal
        );
    }


    if (serviceForm) {
        serviceForm.addEventListener(
            "submit",
            handleFormSubmit
        );
    }


    /* Table Actions */

    if (tableBody) {

        tableBody.addEventListener("click", (e) => {

            const actionBtn =
                e.target.closest(".action-btn");

            if (!actionBtn) return;


            const id =
                Number(actionBtn.dataset.id);

            const action =
                actionBtn.dataset.action;


            if (action === "edit") {

                openEditModal(id);

            } else if (action === "delete") {

                deleteService(id);

            } else if (action === "view") {

                viewServiceDetails(id);

            }

        });

    }


    /* Mobile Menu */

    if (mobileMenuBtn && sidebar) {

        mobileMenuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("active");

        });

    }


    /* Back To Top */

    window.addEventListener("scroll", () => {

        if (!backToTop) return;


        if (window.scrollY > 300) {

            backToTop.classList.add("visible");

        } else {

            backToTop.classList.remove("visible");

        }

    });


    if (backToTop) {

        backToTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }


    /* Logout */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            localStorage.removeItem("JWT");

            showToast(
                "Logged Out",
                "Redirecting..."
            );


            setTimeout(() => {

                window.location.href = "index.html";

            }, 1000);

        });

    }

}


/* =====================================================
   AUTHORIZATION
   ===================================================== */

function getAuthorization() {

    const token =
        localStorage.getItem("JWT");


    if (token) {

        return `Bearer ${token}`;

    }


    return null;

}


/* =====================================================
   LOAD SERVICES
   ===================================================== */

async function loadServices() {

    showLoading(true);


    try {

        const token =
            getAuthorization();


        const headers = {
            "Content-Type": "application/json"
        };


        if (token) {

            headers["Authorization"] =
                token;

        }


        console.log("=================================");
        console.log("LOADING ADD-ON SERVICES");
        console.log(
            "API URL:",
            `${API_URL}/all`
        );
        console.log(
            "JWT:",
            token
                ? "Token exists"
                : "No token"
        );


        const response =
            await fetch(
                `${API_URL}/all`,
                {
                    method: "GET",
                    headers: headers
                }
            );


        console.log(
            "Response Status:",
            response.status
        );


        console.log(
            "Response OK:",
            response.ok
        );


        const responseText =
            await response.text();


        console.log(
            "Raw Response:",
            responseText
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${responseText}`
            );

        }


        const data =
            JSON.parse(responseText);


        console.log(
            "Parsed Response:",
            data
        );


        services =
            extractData(data);


        console.log(
            "Final Services Array:",
            services
        );


    } catch (error) {

        console.error(
            "LOAD SERVICES ERROR:",
            error
        );


        services = [];


        showToast(
            "Error",
            error.message
        );

    } finally {

        showLoading(false);

        filterAndRenderServices();

    }

}


/* =====================================================
   EXTRACT DATA
   ===================================================== */

function extractData(response) {

    /*
       Backend CommonResponse format:

       {
           "body": [
               {
                   "serviceId": 1,
                   "serviceName": "...",
                   "price": 1000,
                   "description": "...",
                   "status": "ACTIVE"
               }
           ],
           "message": "Operation Successful...",
           "status": 0
       }
    */


    /* CommonResponse.body */

    if (
        response &&
        Array.isArray(response.body)
    ) {

        return response.body;

    }


    /* Direct Array */

    if (Array.isArray(response)) {

        return response;

    }


    /* data */

    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;

    }


    /* result */

    if (
        response &&
        Array.isArray(response.result)
    ) {

        return response.result;

    }


    return [];

}


/* =====================================================
   FILTER SERVICES
   ===================================================== */

function filterAndRenderServices() {

    const term =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const statusValue =
        statusFilter
            ? statusFilter.value
            : "ALL";


    const filtered =
        services.filter(service => {

            const name =
                (
                    service.serviceName ||
                    service.name ||
                    ""
                ).toLowerCase();


            const description =
                (
                    service.description ||
                    ""
                ).toLowerCase();


            const status =
                (
                    service.status ||
                    "ACTIVE"
                ).toUpperCase();


            const matchesTerm =
                name.includes(term) ||
                description.includes(term);


            const matchesStatus =
                statusValue === "ALL" ||
                status === statusValue;


            return (
                matchesTerm &&
                matchesStatus
            );

        });


    renderServices(filtered);

    updateStats(services);

}


/* =====================================================
   RENDER SERVICES
   ===================================================== */

function renderServices(data) {

    if (!tableBody) return;


    tableBody.innerHTML = "";


    if (!data || data.length === 0) {

        if (emptyState) {
            emptyState.style.display = "flex";
        }

        return;

    }


    if (emptyState) {
        emptyState.style.display = "none";
    }


    data.forEach(service => {

        const row =
            document.createElement("tr");


        const status =
            (
                service.status ||
                "ACTIVE"
            ).toUpperCase();


        const price =
            Number(
                service.price || 0
            ).toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2
                }
            );


        const name =
            service.serviceName ||
            service.name ||
            "Add-on Service";


        const id =
            service.serviceId ||
            service.id ||
            0;


        row.innerHTML = `

            <td>

                <div>

                    <span class="service-title">
                        ${escapeHtml(name)}
                    </span>

                    <span class="service-sub-id">
                        SERVICE #${id}
                    </span>

                </div>

            </td>


            <td>

                ${escapeHtml(
            service.description ||
            "No description provided."
        )}

            </td>


            <td>

                <strong>
                    Rs. ${price}
                </strong>

            </td>


            <td>

                <span
                    class="status-badge ${status.toLowerCase()}"
                >

                    <i class="fa-solid ${status === "ACTIVE"
                ? "fa-circle-check"
                : "fa-circle-xmark"
            }"></i>

                    ${escapeHtml(status)}

                </span>

            </td>


            <td>

                <div class="action-btns">

                    <button
                        class="action-btn view"
                        data-id="${id}"
                        data-action="view"
                        title="View Service"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>


                    <button
                        class="action-btn edit"
                        data-id="${id}"
                        data-action="edit"
                        title="Edit Service"
                    >

                        <i class="fa-solid fa-pen-to-square"></i>

                    </button>


                    <button
                        class="action-btn delete"
                        data-id="${id}"
                        data-action="delete"
                        title="Delete Service"
                    >

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =====================================================
   UPDATE STATS
   ===================================================== */

function updateStats(list) {

    let activeCount = 0;

    let totalPrice = 0;

    let premiumCount = 0;


    list.forEach(service => {

        const price =
            Number(
                service.price || 0
            );


        const status =
            (
                service.status ||
                "ACTIVE"
            ).toUpperCase();


        totalPrice += price;


        if (status === "ACTIVE") {

            activeCount++;

        }


        if (price >= 5000) {

            premiumCount++;

        }

    });


    const averagePrice =
        list.length > 0
            ? totalPrice / list.length
            : 0;


    if (totalServicesEl) {

        totalServicesEl.textContent =
            list.length;

    }


    if (activeServicesEl) {

        activeServicesEl.textContent =
            activeCount;

    }


    if (averagePriceEl) {

        averagePriceEl.textContent =
            `Rs. ${averagePrice.toLocaleString(
                "en-US",
                {
                    maximumFractionDigits: 0
                }
            )}`;

    }


    if (premiumCountEl) {

        premiumCountEl.textContent =
            premiumCount;

    }

}


/* =====================================================
   OPEN ADD MODAL
   ===================================================== */

function openAddModal() {

    if (serviceForm) {

        serviceForm.reset();

    }


    if (serviceIdInput) {

        serviceIdInput.value = "";

    }


    if (modalTitle) {

        modalTitle.textContent =
            "New Add-on Service";

    }


    if (modalOverlay) {

        modalOverlay.classList.add(
            "active"
        );

    }

}


/* =====================================================
   OPEN EDIT MODAL
   ===================================================== */

function openEditModal(id) {

    const service =
        services.find(
            item =>
                Number(
                    item.serviceId ||
                    item.id
                ) === Number(id)
        );


    if (!service) {

        showToast(
            "Error",
            "Service not found."
        );

        return;

    }


    if (serviceIdInput) {

        serviceIdInput.value =
            service.serviceId ||
            service.id;

    }


    if (serviceNameInput) {

        serviceNameInput.value =
            service.serviceName ||
            service.name ||
            "";

    }


    if (priceInput) {

        priceInput.value =
            service.price ||
            "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            service.description ||
            "";

    }


    if (statusSelect) {

        statusSelect.value =
            (
                service.status ||
                "ACTIVE"
            ).toUpperCase();

    }


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Add-on Service";

    }


    if (modalOverlay) {

        modalOverlay.classList.add(
            "active"
        );

    }

}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeModal() {

    if (modalOverlay) {

        modalOverlay.classList.remove(
            "active"
        );

    }

}


/* =====================================================
   VIEW SERVICE
   ===================================================== */

function viewServiceDetails(id) {

    const service =
        services.find(
            item =>
                Number(
                    item.serviceId ||
                    item.id
                ) === Number(id)
        );


    if (!service) return;


    const name =
        service.serviceName ||
        service.name ||
        "Add-on Service";


    const price =
        Number(
            service.price || 0
        ).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2
            }
        );


    showToast(
        "Service Details",
        `${name} - Rs. ${price}`
    );

}


/* =====================================================
   CREATE / UPDATE
   ===================================================== */

async function handleFormSubmit(e) {

    e.preventDefault();


    const id =
        serviceIdInput &&
            serviceIdInput.value
            ? Number(serviceIdInput.value)
            : null;


    const payload = {

        serviceName:
            serviceNameInput.value.trim(),

        price:
            Number(priceInput.value),

        description:
            descriptionInput.value.trim(),

        status:
            statusSelect.value

    };


    /* =================================================
       UPDATE
       ================================================= */

    if (id) {

        payload.serviceId = id;


        try {

            const token =
                getAuthorization();


            const headers = {
                "Content-Type":
                    "application/json"
            };


            if (token) {

                headers["Authorization"] =
                    token;

            }


            const response =
                await fetch(
                    API_URL,
                    {
                        method: "PUT",
                        headers: headers,
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const responseText =
                await response.text();


            console.log(
                "UPDATE RESPONSE:",
                response.status,
                responseText
            );


            if (!response.ok) {

                throw new Error(
                    `Update failed: HTTP ${response.status}`
                );

            }


            showToast(
                "Service Updated",
                `Service ${payload.serviceName} updated successfully.`
            );


            closeModal();


            await loadServices();


        } catch (error) {

            console.error(
                "UPDATE SERVICE ERROR:",
                error
            );


            showToast(
                "Error",
                error.message
            );

        }


        return;

    }


    /* =================================================
       CREATE
       ================================================= */

    try {

        const token =
            getAuthorization();


        const headers = {
            "Content-Type":
                "application/json"
        };


        if (token) {

            headers["Authorization"] =
                token;

        }


        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",
                    headers: headers,
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const responseText =
            await response.text();


        console.log(
            "CREATE RESPONSE:",
            response.status,
            responseText
        );


        if (!response.ok) {

            throw new Error(
                `Create failed: HTTP ${response.status}`
            );

        }


        showToast(
            "Service Added",
            `Add-on service ${payload.serviceName} created successfully.`
        );


        closeModal();


        await loadServices();


    } catch (error) {

        console.error(
            "CREATE SERVICE ERROR:",
            error
        );


        showToast(
            "Error",
            error.message
        );

    }

}


/* =====================================================
   DELETE SERVICE
   ===================================================== */

async function deleteService(id) {

    if (
        !confirm(
            "Are you sure you want to remove this add-on service?"
        )
    ) {

        return;

    }


    try {

        const token =
            getAuthorization();


        const headers = {};


        if (token) {

            headers["Authorization"] =
                token;

        }


        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE",
                    headers: headers
                }
            );


        const responseText =
            await response.text();


        console.log(
            "DELETE RESPONSE:",
            response.status,
            responseText
        );


        if (!response.ok) {

            throw new Error(
                `Delete failed: HTTP ${response.status}`
            );

        }


        showToast(
            "Service Deleted",
            "Add-on service removed successfully."
        );


        await loadServices();


    } catch (error) {

        console.error(
            "DELETE SERVICE ERROR:",
            error
        );


        showToast(
            "Error",
            error.message
        );

    }

}


/* =====================================================
   LOADING
   ===================================================== */

function showLoading(isLoading) {

    if (!loadingState) return;


    loadingState.style.display =
        isLoading
            ? "flex"
            : "none";

}


/* =====================================================
   TOAST
   ===================================================== */

function showToast(title, message) {

    if (!toast) return;


    if (toastTitle) {

        toastTitle.textContent =
            title;

    }


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}