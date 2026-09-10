
/* =====================================================
   AQUAVENTURE - ROUTES MANAGEMENT JS
   jQuery Demo Style
   ===================================================== */

const API_URL = "http://localhost:8080/api/routes";


// =====================================================
// DOM ELEMENTS
// =====================================================

const routeTableBody = $("#routeTableBody");
const loadingState = $("#loadingState");
const emptyState = $("#emptyState");

const searchInput = $("#searchInput");

const totalRoutesEl = $("#totalRoutes");
const avgDurationEl = $("#avgDuration");
const totalStartPointsEl = $("#totalStartPoints");
const topPriceEl = $("#topPrice");


// =====================================================
// LOAD ALL ROUTES
// Similar to demo users GET
// =====================================================

loadingState.show();
emptyState.hide();

$.ajax({

    url: API_URL + "/all",

    type: "GET",

    contentType: "application/json",

    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("JWT")
    },

    success: function (response) {

        console.log("Route Response:", response);

        let html = "";

        for (const responseElement of response.body) {

            const routeId =
                responseElement.routeId;

            const routeName =
                responseElement.routeName;

            const startPoint =
                responseElement.startPoint;

            const destinationPoint =
                responseElement.destinationPoint;

            const duration =
                responseElement.estimatedDurationHours;

            const fee =
                responseElement.baseRouteFee;


            html += `

                <tr>

                    <td>

                        <div class="route-info">

                            <span class="route-title">
                                ${routeName}
                            </span>

                            <span class="route-sub-id">
                                Route #${routeId}
                            </span>

                        </div>

                    </td>


                    <td>

                        <span class="journey-pill">

                            ${startPoint}

                            <span class="journey-arrow">
                                →
                            </span>

                            ${destinationPoint}

                        </span>

                    </td>


                    <td>

                        <strong>
                            ${duration} hrs
                        </strong>

                    </td>


                    <td>

                        <strong>
                            Rs.
                            ${Number(fee)
                                .toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                        </strong>

                    </td>


                    <td>

                        <div class="action-btns">

                            <button
                                type="button"
                                class="action-btn view"
                                onclick="viewRoute(${routeId})">

                                <i class="fa-solid fa-eye"></i>

                            </button>


                            <button
                                type="button"
                                class="action-btn edit"
                                onclick="selectRoute(${routeId})">

                                <i class="fa-solid fa-pen-to-square"></i>

                            </button>


                            <button
                                type="button"
                                class="action-btn delete"
                                onclick="deleteRoute(${routeId})">

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `;
        }


        routeTableBody.html(html);


        // =================================================
        // STATISTICS
        // =================================================

        let total =
            response.body.length;

        let totalDuration = 0;

        let highestFee = 0;

        let startPoints = [];


        for (const route of response.body) {

            totalDuration +=
                Number(
                    route.estimatedDurationHours
                );


            const fee =
                Number(
                    route.baseRouteFee
                );


            if (fee > highestFee) {

                highestFee = fee;

            }


            if (
                route.startPoint &&
                !startPoints.includes(
                    route.startPoint
                )
            ) {

                startPoints.push(
                    route.startPoint
                );

            }

        }


        let averageDuration =
            total > 0
                ? (
                    totalDuration / total
                ).toFixed(1)
                : 0;


        totalRoutesEl.text(total);

        avgDurationEl.text(
            averageDuration + " hrs"
        );

        totalStartPointsEl.text(
            startPoints.length
        );

        topPriceEl.text(
            "Rs. " +
            highestFee.toLocaleString("en-LK")
        );


        if (response.body.length === 0) {

            emptyState.show();

        }

    },

    error: function (xhr) {

        console.error(
            "Failed to load routes:",
            xhr
        );

        routeTableBody.html("");

        emptyState.show();

    },

    complete: function () {

        loadingState.hide();

    }

});


// =====================================================
// SELECT ROUTE
// Similar to demo selectUser()
// =====================================================

function selectRoute(routeId) {

    $.ajax({

        url: API_URL + "/" + routeId,

        type: "GET",

        contentType: "application/json",

        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem("JWT")
        },

        success: function (response) {

            const route =
                response.body;


            $("#routeId").val(
                route.routeId
            );

            $("#routeName").val(
                route.routeName
            );

            $("#startPoint").val(
                route.startPoint
            );

            $("#destinationPoint").val(
                route.destinationPoint
            );

            $("#estimatedDurationHours").val(
                route.estimatedDurationHours
            );

            $("#baseRouteFee").val(
                route.baseRouteFee
            );


            $("#modalTitle").text(
                "Edit Route"
            );

            $("#routeModal").addClass(
                "active"
            );

        },

        error: function (xhr) {

            console.error(
                "Failed to select route:",
                xhr
            );

        }

    });

}


// =====================================================
// ADD ROUTE
// =====================================================

function addRoute() {

    $("#routeForm")[0].reset();

    $("#routeId").val("");

    $("#modalTitle").text(
        "New Route"
    );

    $("#routeModal").addClass(
        "active"
    );

}


// =====================================================
// SAVE / UPDATE ROUTE
// Similar to demo updateUser()
// =====================================================

function saveRoute() {

    let routeId =
        $("#routeId").val();

    let routeName =
        $("#routeName").val();

    let startPoint =
        $("#startPoint").val();

    let destinationPoint =
        $("#destinationPoint").val();

    let estimatedDurationHours =
        $("#estimatedDurationHours").val();

    let baseRouteFee =
        $("#baseRouteFee").val();


    const obj = {

        "routeName":
            routeName,

        "startPoint":
            startPoint,

        "destinationPoint":
            destinationPoint,

        "estimatedDurationHours":
            estimatedDurationHours,

        "baseRouteFee":
            baseRouteFee

    };


    if (routeId) {

        obj.routeId =
            parseInt(routeId);

    }


    const method =
        routeId ? "PUT" : "POST";


    $.ajax({

        url: API_URL,

        type: method,

        contentType: "application/json",

        headers: {
            'Authorization':
                'Bearer ' +
                localStorage.getItem("JWT")
        },

        data: JSON.stringify(obj),

        success: function (response) {

            alert(
                routeId
                    ? "Route updated successfully"
                    : "Route added successfully"
            );


            $("#routeModal")
                .removeClass("active");


            location.reload();

        },

        error: function (xhr) {

            console.error(
                "Save/Update Error:",
                xhr
            );

            alert(
                "Failed to save route"
            );

        }

    });

}


// =====================================================
// DELETE ROUTE
// Similar to demo deleteUser()
// =====================================================

function deleteRoute(routeId) {

    console.log(routeId);


    if (!confirm(
        "Are you sure you want to delete this route?"
    )) {

        return;

    }


    $.ajax({

        url: API_URL + "/" + routeId,

        type: "DELETE",

        contentType: "application/json",

        headers: {
            'Authorization':
                'Bearer ' +
                localStorage.getItem("JWT")
        },

        success: function (response) {

            alert(
                "Route deleted successfully"
            );

            location.reload();

        },

        error: function (xhr) {

            console.error(
                "Delete Error:",
                xhr
            );

            alert(
                "Failed to delete route"
            );

        }

    });

}


// =====================================================
// VIEW ROUTE
// =====================================================

function viewRoute(routeId) {

    $.ajax({

        url: API_URL + "/" + routeId,

        type: "GET",

        contentType: "application/json",

        headers: {
            'Authorization':
                'Bearer ' +
                localStorage.getItem("JWT")
        },

        success: function (response) {

            const route =
                response.body;


            alert(
                "Route: " +
                route.routeName +
                "\n\n" +

                "Start: " +
                route.startPoint +
                "\n" +

                "Destination: " +
                route.destinationPoint +
                "\n" +

                "Duration: " +
                route.estimatedDurationHours +
                " hrs\n" +

                "Base Fee: Rs. " +
                route.baseRouteFee
            );

        },

        error: function (xhr) {

            console.error(
                "View Route Error:",
                xhr
            );

        }

    });

}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeModal() {

    $("#routeModal")
        .removeClass("active");

}


// =====================================================
// SEARCH ROUTES
// Similar to demo searchUsers()
// =====================================================

function searchRoutes() {

    let searchValue =
        $("#searchInput").val();


    let param = {

        routeName:
            searchValue

    };


    let queryParam =
        $.param(param);


    $.ajax({

        url:
            API_URL +
            "/filter-routes?" +
            queryParam,

        type: "GET",

        contentType: "application/json",

        headers: {
            'Authorization':
                'Bearer ' +
                localStorage.getItem("JWT")
        },

        success: function (response) {

            let html = "";


            for (
                const responseElement
                of response.body
            ) {

                html += `

                    <tr>

                        <td>

                            <div class="route-info">

                                <span class="route-title">
                                    ${responseElement.routeName}
                                </span>

                                <span class="route-sub-id">
                                    Route #${responseElement.routeId}
                                </span>

                            </div>

                        </td>


                        <td>

                            <span class="journey-pill">

                                ${responseElement.startPoint}

                                <span class="journey-arrow">
                                    →
                                </span>

                                ${responseElement.destinationPoint}

                            </span>

                        </td>


                        <td>

                            <strong>
                                ${responseElement.estimatedDurationHours}
                                hrs
                            </strong>

                        </td>


                        <td>

                            <strong>
                                Rs.
                                ${Number(
                                    responseElement.baseRouteFee
                                ).toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>

                        </td>


                        <td>

                            <div class="action-btns">

                                <button
                                    type="button"
                                    class="action-btn view"
                                    onclick="viewRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-eye"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn edit"
                                    onclick="selectRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-pen-to-square"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn delete"
                                    onclick="deleteRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }


            routeTableBody.html(html);

        },

        error: function (xhr) {

            console.error(
                "Search Error:",
                xhr
            );

        }

    });

}


// =====================================================
// CLEAR TABLE / REFRESH
// Similar to demo clearTable()
// =====================================================

function clearTable() {

    $.ajax({

        url:
            API_URL + "/all",

        type: "GET",

        contentType: "application/json",

        headers: {
            'Authorization':
                'Bearer ' +
                localStorage.getItem("JWT")
        },

        success: function (response) {

            let html = "";


            for (
                const responseElement
                of response.body
            ) {

                html += `

                    <tr>

                        <td>

                            <div class="route-info">

                                <span class="route-title">
                                    ${responseElement.routeName}
                                </span>

                                <span class="route-sub-id">
                                    Route #${responseElement.routeId}
                                </span>

                            </div>

                        </td>


                        <td>

                            <span class="journey-pill">

                                ${responseElement.startPoint}

                                <span class="journey-arrow">
                                    →
                                </span>

                                ${responseElement.destinationPoint}

                            </span>

                        </td>


                        <td>
                            <strong>
                                ${responseElement.estimatedDurationHours}
                                hrs
                            </strong>
                        </td>


                        <td>

                            <strong>
                                Rs.
                                ${Number(
                                    responseElement.baseRouteFee
                                ).toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>

                        </td>


                        <td>

                            <div class="action-btns">

                                <button
                                    type="button"
                                    class="action-btn view"
                                    onclick="viewRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-eye"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn edit"
                                    onclick="selectRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-pen-to-square"></i>

                                </button>


                                <button
                                    type="button"
                                    class="action-btn delete"
                                    onclick="deleteRoute(${responseElement.routeId})">

                                    <i class="fa-solid fa-trash"></i>

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }


            routeTableBody.html(html);

        }

    });


    $("#searchInput").val("");

}


// =====================================================
// BUTTON EVENTS
// =====================================================

$("#addRouteBtn").click(function () {

    addRoute();

});


$("#closeModalBtn").click(function () {

    closeModal();

});


$("#cancelModalBtn").click(function () {

    closeModal();

});


$("#routeForm").submit(function (e) {

    e.preventDefault();

    saveRoute();

});


$("#refreshBtn").click(function () {

    clearTable();

});


$("#searchInput").on("input", function () {

    searchRoutes();

});

