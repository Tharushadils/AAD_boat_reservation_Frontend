/* =====================================================
   AQUAVENTURE DOCK MANAGEMENT JS
   jQuery Demo Style
   ===================================================== */

const API_URL = "http://localhost:8080/api/docks";


/* =====================================================
   LOAD ALL DOCKS
   ===================================================== */

$('#loadingState').show();
$('#emptyState').hide();

$.ajax({
    url: API_URL + "/all",
    type: "GET",
    contentType: "application/json",
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("JWT")
    },
    success: function (response) {

        console.log("Dock Response:", response);

        let html = "";

        for (const responseElement of response.body) {

            let status = responseElement.status || "ACTIVE";
            let capacity = responseElement.maxCapacity || 0;

            html += `
                <div class="dock-card">

                    <div>

                        <div class="dock-card-head">

                            <div class="dock-icon-box">
                                <i class="fa-solid fa-anchor"></i>
                            </div>

                            <span class="dock-status-tag ${status.toLowerCase()}">
                                ${status}
                            </span>

                        </div>

                        <h3 class="dock-title">
                            ${responseElement.dockName}
                        </h3>

                        <p class="dock-location">
                            <i class="fa-solid fa-location-dot"></i>
                            ${responseElement.locationAddress}
                        </p>

                        <div class="occupancy-box">

                            <div class="occupancy-header">

                                <span>
                                    Mooring Capacity
                                </span>

                                <span>
                                    ${capacity} Boats Capacity
                                </span>

                            </div>

                        </div>

                    </div>

                    <div class="dock-actions">

                        <button
                            class="action-btn edit"
                            onclick="selectDock(${responseElement.dockId})">

                            <i class="fa-solid fa-pen-to-square"></i>
                            Edit

                        </button>

                        <button
                            class="action-btn delete"
                            onclick="deleteDock(${responseElement.dockId})">

                            <i class="fa-solid fa-trash-can"></i>
                            Delete

                        </button>

                    </div>

                </div>
            `;
        }

        $('#dockGrid').html(html);


        /* =================================================
           UPDATE STATS
           ================================================= */

        let totalCapacity = 0;
        let activeDocks = 0;
        let maintenanceDocks = 0;

        for (const dock of response.body) {

            totalCapacity += Number(dock.maxCapacity || 0);

            if (dock.status === "ACTIVE") {
                activeDocks++;
            }

            if (dock.status === "MAINTENANCE") {
                maintenanceDocks++;
            }
        }

        $('#totalDocks').text(response.body.length);
        $('#totalCapacity').text(totalCapacity);
        $('#activeDocks').text(activeDocks);
        $('#maintenanceDocks').text(maintenanceDocks);


        if (response.body.length === 0) {
            $('#emptyState').show();
        } else {
            $('#emptyState').hide();
        }

    },

    error: function (xhr) {

        console.error("Failed to load docks:", xhr);

        $('#dockGrid').html("");
        $('#emptyState').show();

    },

    complete: function () {

        /* Stop buffering */
        $('#loadingState').hide();

    }
});


/* =====================================================
   SELECT DOCK
   ===================================================== */

function selectDock(dockId) {

    $.ajax({
        url: API_URL + "/" + dockId,
        type: "GET",
        contentType: "application/json",
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem("JWT")
        },
        success: function (response) {

            let dock = response.body;

            $('#dockId').val(dock.dockId);
            $('#dockName').val(dock.dockName);
            $('#locationAddress').val(dock.locationAddress);
            $('#maxCapacity').val(dock.maxCapacity);
            $('#dockStatus').val(dock.status);

            $('#modalTitle').text("Edit Dock Station");

            $('#modalOverlay').addClass("active");

        },

        error: function (xhr) {

            console.error("Failed to load dock:", xhr);

        }
    });
}


/* =====================================================
   ADD DOCK
   ===================================================== */

function addDock() {

    $('#dockForm')[0].reset();

    $('#dockId').val("");

    $('#modalTitle').text("New Dock Station");

    $('#modalOverlay').addClass("active");

}


/* =====================================================
   SAVE / UPDATE DOCK
   ===================================================== */

function saveDock() {

    let dockId = $('#dockId').val();

    let dockName = $('#dockName').val();

    let locationAddress = $('#locationAddress').val();

    let maxCapacity = $('#maxCapacity').val();

    let status = $('#dockStatus').val();


    const obj = {

        "dockName": dockName,

        "locationAddress": locationAddress,

        "maxCapacity": parseInt(maxCapacity),

        "status": status

    };


    /* =================================================
       UPDATE
       ================================================= */

    if (dockId) {

        obj.dockId = parseInt(dockId);

        $.ajax({
            url: API_URL,
            type: "PUT",
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("JWT")
            },
            data: JSON.stringify(obj),

            success: function (response) {

                alert("Dock updated successfully");

                $('#modalOverlay').removeClass("active");

                location.reload();

            },

            error: function (xhr) {

                console.error("Update Dock Error:", xhr);

                alert("Failed to update dock");

            }
        });

    }


    /* =================================================
       CREATE
       ================================================= */

    else {

        $.ajax({
            url: API_URL,
            type: "POST",
            contentType: "application/json",
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("JWT")
            },
            data: JSON.stringify(obj),

            success: function (response) {

                alert("Dock added successfully");

                $('#modalOverlay').removeClass("active");

                location.reload();

            },

            error: function (xhr) {

                console.error("Save Dock Error:", xhr);

                alert("Failed to add dock");

            }
        });

    }
}


/* =====================================================
   DELETE DOCK
   ===================================================== */

function deleteDock(dockId) {

    console.log(dockId);

    if (!confirm("Are you sure you want to remove this dock?")) {
        return;
    }

    $.ajax({
        url: API_URL + "/" + dockId,
        type: "DELETE",
        contentType: "application/json",
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem("JWT")
        },

        success: function (response) {

            alert("Dock deleted successfully");

            location.reload();

        },

        error: function (xhr) {

            console.error("Delete Dock Error:", xhr);

            alert("Failed to delete dock");

        }
    });
}


/* =====================================================
   CLOSE MODAL
   ===================================================== */

function closeModal() {

    $('#modalOverlay').removeClass("active");

}


/* =====================================================
   SEARCH DOCKS
   ===================================================== */

function searchDocks() {

    let searchValue = $('#searchInput').val();

    let param = {
        dockName: searchValue
    };

    let queryParam = $.param(param);


    $('#loadingState').show();

    $.ajax({
        url: API_URL + "/filter-docks?" + queryParam,
        type: "GET",
        contentType: "application/json",
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem("JWT")
        },

        success: function (response) {

            let html = "";

            for (const responseElement of response.body) {

                let status = responseElement.status || "ACTIVE";
                let capacity = responseElement.maxCapacity || 0;

                html += `
                    <div class="dock-card">

                        <div>

                            <div class="dock-card-head">

                                <div class="dock-icon-box">
                                    <i class="fa-solid fa-anchor"></i>
                                </div>

                                <span class="dock-status-tag ${status.toLowerCase()}">
                                    ${status}
                                </span>

                            </div>

                            <h3 class="dock-title">
                                ${responseElement.dockName}
                            </h3>

                            <p class="dock-location">
                                <i class="fa-solid fa-location-dot"></i>
                                ${responseElement.locationAddress}
                            </p>

                            <div class="occupancy-box">

                                <div class="occupancy-header">

                                    <span>
                                        Mooring Capacity
                                    </span>

                                    <span>
                                        ${capacity} Boats Capacity
                                    </span>

                                </div>

                            </div>

                        </div>

                        <div class="dock-actions">

                            <button
                                class="action-btn edit"
                                onclick="selectDock(${responseElement.dockId})">

                                <i class="fa-solid fa-pen-to-square"></i>
                                Edit

                            </button>

                            <button
                                class="action-btn delete"
                                onclick="deleteDock(${responseElement.dockId})">

                                <i class="fa-solid fa-trash-can"></i>
                                Delete

                            </button>

                        </div>

                    </div>
                `;
            }

            $('#dockGrid').html(html);

            if (response.body.length === 0) {
                $('#emptyState').show();
            } else {
                $('#emptyState').hide();
            }

        },

        error: function (xhr) {

            console.error("Search Dock Error:", xhr);

        },

        complete: function () {

            /* Stop buffering after search */
            $('#loadingState').hide();

        }
    });
}


/* =====================================================
   REFRESH
   ===================================================== */

function refreshDocks() {

    location.reload();

}


/* =====================================================
   BUTTON EVENTS
   ===================================================== */

$('#addDockBtn').click(function () {

    addDock();

});


$('#closeModalBtn').click(function () {

    closeModal();

});


$('#cancelModalBtn').click(function () {

    closeModal();

});


$('#dockForm').submit(function (e) {

    e.preventDefault();

    saveDock();

});


$('#refreshBtn').click(function () {

    refreshDocks();

});


$('#searchInput').on('input', function () {

    searchDocks();

});