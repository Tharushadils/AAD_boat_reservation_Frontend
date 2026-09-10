
/* =====================================================
   AQUAVENTURE BOAT MANAGEMENT JS
   jQuery Demo Style
   ===================================================== */

const API_BASE_URL = "http://localhost:8080/api/boats";
const DOCKS_API_URL = "http://localhost:8080/api/docks/all";
const CATEGORIES_API_URL = "http://localhost:8080/api/boat-categories/all";


/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const boatTableBody = $("#boatTableBody");
const loadingState = $("#loadingState");
const emptyState = $("#emptyState");

const searchInput = $("#searchInput");
const statusFilter = $("#statusFilter");
const categoryFilter = $("#categoryFilter");
const dockFilter = $("#dockFilter");

const totalBoatsEl = $("#totalBoats");
const availableBoatsEl = $("#availableBoats");
const reservedBoatsEl = $("#reservedBoats");
const maintenanceBoatsEl = $("#maintenanceBoats");


/* =====================================================
   LOAD BOATS
   ===================================================== */

function loadBoats() {

    loadingState.show();
    emptyState.hide();

    $.ajax({

        url: API_BASE_URL + "/all",

        type: "GET",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " + localStorage.getItem("JWT")
        },

        success: function (response) {

            console.log("Boat Response:", response);

            let html = "";

            for (const responseElement of response.body) {

                html += `
                    <tr>

                        <td>
                            <strong>#${responseElement.boatId}</strong>
                        </td>

                        <td>
                            <div class="boat-name-cell">

                                <div class="boat-avatar">
                                    <i class="fa-solid fa-sailboat"></i>
                                </div>

                                <div class="boat-meta">
                                    <strong>
                                        ${responseElement.boatName}
                                    </strong>
                                </div>

                            </div>
                        </td>

                        <td>
                            ${responseElement.categoryName || ""}
                        </td>

                        <td>
                            ${responseElement.dockName || ""}
                        </td>

                        <td>
                            <span class="capacity-badge">

                                <i class="fa-solid fa-users"></i>

                                ${responseElement.passengerCapacity}
                                Pass

                            </span>
                        </td>

                        <td>

                            <span class="rate-tag">

                                Rs.
                                ${Number(
                                    responseElement.baseHourlyRate
                                ).toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}

                            </span>

                        </td>

                        <td>

                            <span class="status-badge
                                ${getStatusBadgeClass(
                                    responseElement.status
                                )}">

                                ${responseElement.status}

                            </span>

                        </td>

                        <td>

                            <div class="action-btns">

                                <button
                                    type="button"
                                    class="action-btn"
                                    onclick="viewBoatDetails(
                                        ${responseElement.boatId}
                                    )">

                                    <i class="fa-solid fa-eye"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn edit"
                                    onclick="selectBoat(
                                        ${responseElement.boatId}
                                    )">

                                    <i class="fa-solid fa-pen-to-square"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn delete"
                                    onclick="deleteBoat(
                                        ${responseElement.boatId}
                                    )">

                                    <i class="fa-solid fa-trash-can"></i>

                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            }


            /* =================================================
               INSERT BOATS INTO TABLE
               ================================================= */

            boatTableBody.html(html);


            /* =================================================
               DEFAULT STATUS FILTER
               ================================================= */

            $("#statusFilter").val("AVAILABLE");

            filterBoats();


            /* =================================================
               STATISTICS
               ================================================= */

            let total = response.body.length;
            let available = 0;
            let reserved = 0;
            let maintenance = 0;

            for (const boat of response.body) {

                if (boat.status === "AVAILABLE") {
                    available++;
                }

                if (boat.status === "RESERVED") {
                    reserved++;
                }

                if (boat.status === "MAINTENANCE") {
                    maintenance++;
                }
            }


            totalBoatsEl.text(total);
            availableBoatsEl.text(available);
            reservedBoatsEl.text(reserved);
            maintenanceBoatsEl.text(maintenance);


            /* =================================================
               EMPTY STATE
               ================================================= */

            if (response.body.length === 0) {
                emptyState.show();
            }

        },


        error: function (xhr) {

            console.error(
                "Failed to load boats:",
                xhr
            );

            boatTableBody.html("");

            emptyState.show();

        },


        complete: function () {

            loadingState.hide();

        }

    });
}


/* =====================================================
   LOAD DOCKS
   ===================================================== */

function loadDocks() {

    $.ajax({

        url: DOCKS_API_URL,

        type: "GET",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " + localStorage.getItem("JWT")
        },

        success: function (response) {

            console.log("Dock Response:", response);

            let html =
                '<option value="ALL">All Docks</option>';

            for (const responseElement of response.body) {

                html += `
                    <option value="${responseElement.dockId}">
                        ${responseElement.dockName}
                    </option>
                `;
            }

            $("#dockFilter").html(html);


            let formHtml =
                '<option value="">Select Dock</option>';

            for (const responseElement of response.body) {

                formHtml += `
                    <option value="${responseElement.dockId}">
                        ${responseElement.dockName}
                    </option>
                `;
            }

            $("#dockSelect").html(formHtml);

        },


        error: function (xhr) {

            console.error(
                "Failed to load docks:",
                xhr
            );

        }

    });
}


/* =====================================================
   LOAD CATEGORIES
   ===================================================== */

function loadCategories() {

    $.ajax({

        url: CATEGORIES_API_URL,

        type: "GET",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " + localStorage.getItem("JWT")
        },

        success: function (response) {

            console.log(
                "Category Response:",
                response
            );

            let html =
                '<option value="ALL">All Categories</option>';

            for (const responseElement of response.body) {

                html += `
                    <option value="${responseElement.categoryId}">
                        ${responseElement.categoryName}
                    </option>
                `;
            }

            $("#categoryFilter").html(html);


            let formHtml =
                '<option value="">Select Category</option>';

            for (const responseElement of response.body) {

                formHtml += `
                    <option value="${responseElement.categoryId}">
                        ${responseElement.categoryName}
                    </option>
                `;
            }

            $("#categorySelect").html(formHtml);

        },


        error: function (xhr) {

            console.error(
                "Failed to load categories:",
                xhr
            );

        }

    });
}


/* =====================================================
   SELECT BOAT
   ===================================================== */

function selectBoat(boatId) {

    $.ajax({

        url: API_BASE_URL + "/" + boatId,

        type: "GET",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " + localStorage.getItem("JWT")
        },

        success: function (response) {

            const boat = response.body;

            $("#boatId").val(boat.boatId);

            $("#boatName").val(boat.boatName);

            $("#passengerCapacity")
                .val(boat.passengerCapacity);

            $("#baseHourlyRate")
                .val(boat.baseHourlyRate);

            $("#boatStatus")
                .val(boat.status);


            $("#dockSelect")
                .val(boat.dockId);


            $("#categorySelect")
                .val(boat.categoryId);


            $("#modalTitle")
                .text("Edit Boat");

            $("#boatModal")
                .addClass("active");

        },


        error: function (xhr) {

            console.error(
                "Failed to select boat:",
                xhr
            );

        }

    });
}


/* =====================================================
   ADD BOAT
   ===================================================== */

function addBoat() {

    $("#boatForm")[0].reset();

    $("#boatId").val("");

    $("#modalTitle")
        .text("Add Boat");

    $("#boatStatus")
        .val("AVAILABLE");

    $("#boatModal")
        .addClass("active");
}


/* =====================================================
   SAVE / UPDATE BOAT
   ===================================================== */

function saveBoat() {

    let boatId =
        $("#boatId").val();

    let boatName =
        $("#boatName").val();

    let passengerCapacity =
        $("#passengerCapacity").val();

    let baseHourlyRate =
        $("#baseHourlyRate").val();

    let status =
        $("#boatStatus").val();

    let dockId =
        $("#dockSelect").val();

    let categoryId =
        $("#categorySelect").val();


    const obj = {

        "boatName":
            boatName,

        "passengerCapacity":
            passengerCapacity,

        "baseHourlyRate":
            baseHourlyRate,

        "status":
            status,

        "dockId":
            parseInt(dockId),

        "categoryId":
            parseInt(categoryId)

    };


    if (boatId) {

        obj.boatId =
            parseInt(boatId);

    }


    const method =
        boatId ? "PUT" : "POST";


    $.ajax({

        url: API_BASE_URL,

        type: method,

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " +
                localStorage.getItem("JWT")
        },

        data: JSON.stringify(obj),


        success: function (response) {

            alert(
                boatId
                    ? "Boat updated successfully"
                    : "Boat saved successfully"
            );

            $("#boatModal")
                .removeClass("active");

            location.reload();

        },


        error: function (xhr) {

            console.error(
                "Save/Update Error:",
                xhr.responseText
            );

            alert(
                "Failed to save boat"
            );

        }

    });
}


/* =====================================================
   DELETE BOAT
   ===================================================== */

function deleteBoat(boatId) {

    if (!confirm(
        "Are you sure you want to delete this boat?"
    )) {
        return;
    }


    $.ajax({

        url:
            API_BASE_URL +
            "/" +
            boatId,

        type: "DELETE",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " +
                localStorage.getItem("JWT")
        },


        success: function (response) {

            alert(
                "Boat deleted successfully"
            );

            location.reload();

        },


        error: function (xhr) {

            console.error(
                "Delete Error:",
                xhr.responseText
            );

            alert(
                "Failed to delete boat"
            );

        }

    });
}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeBoatModal() {

    $("#boatModal")
        .removeClass("active");

}


/* =====================================================
   SEARCH BOATS
   ===================================================== */

function searchBoats() {

    filterBoats();

}


/* =====================================================
   FILTER BOATS
   ===================================================== */

function filterBoats() {

    let searchValue =
        $("#searchInput")
            .val()
            .toLowerCase()
            .trim();

    let statusValue =
        $("#statusFilter").val();

    let categoryValue =
        $("#categoryFilter").val();

    let dockValue =
        $("#dockFilter").val();


    $("#boatTableBody tr").each(function () {

        let row =
            $(this);


        /* ---------------------------------------------
           SEARCH
           --------------------------------------------- */

        let rowText =
            row.text()
                .toLowerCase();


        let matchesSearch =
            rowText.includes(searchValue);


        /* ---------------------------------------------
           STATUS
           --------------------------------------------- */

        let status =
            row.find(".status-badge")
                .text()
                .trim();

        let matchesStatus =
            statusValue === "ALL" ||
            status === statusValue;


        /* ---------------------------------------------
           CATEGORY
           --------------------------------------------- */

        let category =
            row.find("td")
                .eq(2)
                .text()
                .trim();


        let matchesCategory =
            categoryValue === "ALL" ||
            category ===
            $("#categoryFilter option:selected")
                .text()
                .trim();


        /* ---------------------------------------------
           DOCK
           --------------------------------------------- */

        let dock =
            row.find("td")
                .eq(3)
                .text()
                .trim();


        let matchesDock =
            dockValue === "ALL" ||
            dock ===
            $("#dockFilter option:selected")
                .text()
                .trim();


        /* ---------------------------------------------
           FINAL RESULT
           --------------------------------------------- */

        if (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesDock
        ) {

            row.show();

        } else {

            row.hide();

        }

    });
}


/* =====================================================
   BUTTON EVENTS
   ===================================================== */

$("#addBoatBtn").click(function () {

    addBoat();

});


$("#closeModalBtn").click(function () {

    closeBoatModal();

});


$("#cancelModalBtn").click(function () {

    closeBoatModal();

});


$("#boatForm").submit(function (e) {

    e.preventDefault();

    saveBoat();

});


$("#refreshBtn").click(function () {

    loadBoats();

});


$("#searchInput").on(
    "input",
    function () {

        searchBoats();

    }
);


$("#statusFilter").change(function () {

    filterBoats();

});


$("#categoryFilter").change(function () {

    filterBoats();

});


$("#dockFilter").change(function () {

    filterBoats();

});


/* =====================================================
   STATUS BADGE
   ===================================================== */

function getStatusBadgeClass(status) {

    if (status === "AVAILABLE") {
        return "available";
    }

    if (status === "RESERVED") {
        return "reserved";
    }

    if (status === "MAINTENANCE") {
        return "maintenance";
    }

    if (status === "INACTIVE") {
        return "inactive";
    }

    return "available";
}


/* =====================================================
   VIEW BOAT DETAILS
   ===================================================== */

function viewBoatDetails(boatId) {

    $.ajax({

        url:
            API_BASE_URL +
            "/" +
            boatId,

        type: "GET",

        contentType: "application/json",

        headers: {
            "Authorization":
                "Bearer " +
                localStorage.getItem("JWT")
        },


        success: function (response) {

            const boat =
                response.body;


            $("#detailsBoatName")
                .text(boat.boatName);


            $("#detailsBoatSub")
                .text(
                    "Boat ID: #" +
                    boat.boatId
                );


            $("#detailsDock")
                .text(
                    boat.dockName || ""
                );


            $("#detailsCategory")
                .text(
                    boat.categoryName || ""
                );


            $("#detailsCapacity")
                .text(
                    boat.passengerCapacity +
                    " Persons"
                );


            $("#detailsRate")
                .text(
                    "Rs. " +
                    Number(
                        boat.baseHourlyRate
                    ).toLocaleString(
                        "en-LK",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    ) +
                    " / hr"
                );


            $("#detailsStatusBadge")
                .html(`
                    <span class="status-badge
                        ${getStatusBadgeClass(
                            boat.status
                        )}">

                        ${boat.status}

                    </span>
                `);


            $("#detailsModal")
                .addClass("active");

        },


        error: function (xhr) {

            console.error(
                "Details Error:",
                xhr
            );

        }

    });
}


/* =====================================================
   CLOSE DETAILS MODAL
   ===================================================== */

$("#closeDetailsBtn").click(function () {

    $("#detailsModal")
        .removeClass("active");

});


$("#closeDetailsFooterBtn").click(function () {

    $("#detailsModal")
        .removeClass("active");

});


/* =====================================================
   INITIAL LOAD
   ===================================================== */

$(document).ready(function () {

    // Default status = AVAILABLE
    $("#statusFilter")
        .val("AVAILABLE");

    loadBoats();
    loadDocks();
    loadCategories();

});

