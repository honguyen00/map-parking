let map;
let service;
let infoWindow;
let markers = [];
var resultTable = $("#results");
var infoWindow1;

// run after loading all html elements
$(function () {
    window.initMap = initMap;
})

// declare map, infoWindow, and service using google.api
async function initMap() {
    // set initial location to be Australia
    const { PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps")
    const location = {
        au: {
            center: { lat: -25.3, lng: 133.8 },
            zoom: 4,
        }
    }
    // assign a new map and render the map to $('#map') element
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: location.au.zoom,
        center: location.au.center,
        mapId: "My-map-id-1",
        mapTypeControl: false,
        streetViewControl: false,
    });
    // assign infoWindow, this is to show any extra information in a pop-up window in the map
    infoWindow = new google.maps.InfoWindow();
    // create a custom button to zoom in user's location 
    const currentLocationButton = $("<button class='custom-map-control-button'>Jump to your current location</button>")
    // add the cumstom button to the top center of the map
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(currentLocationButton[0]);
    // add listener to the custom button, function getCurrentPos
    currentLocationButton.on("click", getCurrentPos);
    // declare service, this is to have access to PlacesService api to get methods such as search nearby, find place etc..
    service = new google.maps.places.PlacesService(map);
    // stop the default behavior of the map when user click on an icon (default behavior is when click on any icons or places, infowindow will show up with details)
    map.addListener('click', (event) => {
        if (event.placeId) {
            event.stop();
            console.log(event)
        }
    });
    infoWindow1 = new google.maps.InfoWindow({
        content: document.getElementById("infowindow")
    })
}

// function to get the current position of user from the browser
function getCurrentPos() {
    // if browser have built-in method to get user location
    if (navigator.geolocation) {
        // browser will prompt user to allow access to their location
        navigator.geolocation.getCurrentPosition(
            // if user allow, we get a position
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }
                // create a marker with lat and lng from said postion
                createLocation(pos);
            },
            // if user block, no positon, give error
            () => {
                handleLocationError(true, infoWindow, map.getCenter())
            }
        );
    }
    // if browser doesn't support built-in method to get user location
    else {
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function createLocation(place) {
    if (!place) return;
    map.setCenter(place);
    map.setZoom(12)
    const marker = new google.maps.Marker({
        map: map,
        position: place,
        animation: google.maps.Animation.DROP,
    });
    marker.addListener("dblclick", searchParkingAroundRadius, { passive: true })
}

async function searchParkingAroundRadius(position) {
    if (typeof position == String) {
        // console.log("Is a string");
    }
    else {
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        var location = position.latLng.toJSON();
        const search = {
            location: { lat: location["lat"], lng: location["lng"] },
            radius: 1000,
            keyword: "car park",
            type: 'parking',
        };
        service.nearbySearch(search, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                clearResults();
                clearMarkers();
                // console.log(results);
                for (var i = 0; i < results.length; i++) {
                    const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
                    const pinBackground = new PinElement({
                        background: "#031cfc",
                        borderColor: "white",
                        glyphColor: "black",
                    })
                    defaultpinBackground = pinBackground;
                    markers[i] = new AdvancedMarkerElement({
                        position: results[i].geometry.location,
                        title: markerLetter + ". " + results[i].name,
                        content: pinBackground.element,
                    });

                    markers[i].placeResult = results[i];
                    // markers[i].addListener("click", showParkingInfo);
                    google.maps.event.addListener(markers[i], "click", showParkingInfo)
                    setTimeout(dropMarker(i), i*100);
                    addResult(results[i], i);
                }
                map.setCenter(markers[0].position);
                map.setZoom(16)
            }
        })
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation.",
    );
    infoWindow.open(map);
}


function dropMarker(i) {
    return function () {
        markers[i].setMap(map);
    }
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }
    markers = [];
}

function addResult(result, i) {
    const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26))
    const rowEle = $("<tr>");
    rowEle.on("click", () => {
        google.maps.event.trigger(markers[i], "click")
    })
    var resultTd = $("<td class='result-item w-full'>" + markerLetter + ". " + result.name + "</td>");
    rowEle.append(resultTd);
    resultTable.append(rowEle);
}

function clearResults() {
    resultTable.empty();
}

function showParkingInfo() {
    const marker = this;
    service.getDetails({ placeId: marker.placeResult.place_id }, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return;
        }
        console.log(place)
        infoWindow1.open(map, marker);
        buildIWContent(place);
    })
    google.maps.event.addListener(map, "click", function(event) {
        infoWindow1.close();
    });
}

function buildIWContent(place) {
    var infoDiv = $("#infowindow");
    if (infoDiv.children()) {
        infoDiv.empty();
    }
    var placeIcon = $("<img class='parkingIcon inline-block'" + "style='background-color:" + place.icon_background_color + "'" + "src='" + place.icon + "'>");
    var placeName = $("<a class='font-bold' href=" + place.url + " target='_blank'>" + place.name  + "</a>")
    var placeAddress = $("<p>Address: " + place.vicinity + "</p>");
    infoDiv.append(placeIcon[0], placeName[0], placeAddress[0]);
}

async function hightlightMarker(event) {
    if (event.target.tagName == 'TD') {
        var i = $(event.target).parent().index();
    } else {
        var i = $(event.target).index();
    }
    const { PinElement } = await google.maps.importLibrary(
        "marker",
    );
    const defaultpinBackground = new PinElement({
        background: "#031cfc",
        borderColor: "white",
        glyphColor: "black",
        scale: 1,
    })
    const onfocuspinBackground = new PinElement({
        background: "#031cfc",
        borderColor: "black",
        glyphColor: "white",
        scale: 1.2,
    })
    if ($(markers[i].content).children().eq(0).children().eq(0).children().eq(0).attr("fill") == "white") {
        markers[i].content = onfocuspinBackground.element;
    }
    else {
        markers[i].content = defaultpinBackground.element;
    }
}

resultTable.on("mouseover", hightlightMarker)
resultTable.on("mouseout", hightlightMarker)


let filterEl = document.getElementById('filter-Btn');
let searchOptionEl = document.querySelector('.search-option');
let saveEl = document.querySelector('.save-Btn');
let cancelEl = document.querySelector('.cancel-Btn');

filterEl.addEventListener("click", function (event) {
    event.preventDefault();

    searchOptionEl.classList.remove('hide');
});

cancelEl.addEventListener("click", function () {
    searchOptionEl.classList.add('hide');
});

saveEl.addEventListener("click", function () {
    let freeEl = document.querySelector('#free');
    let paidEl = document.querySelector('#paid');
    let accessibleEl = document.querySelector('#accessible');

    let fiveEl = document.querySelector('#five');
    let tenEl = document.querySelector('#ten');
    let fiftenEl = document.querySelector('#fiften');
    let twentyEl = document.querySelector('#twenty');

    if (freeEl.checked === true) {
        console.log(freeEl.value);
    };

    if (paidEl.checked === true) {
        console.log(paidEl.value);
    };

    if (accessibleEl.checked === true) {
        console.log(accessibleEl.value);
    };

    let radius;
    if (fiveEl.checked === true) {
        radius = fiveEl.value
    } else if (tenEl.checked === true) {
        radius = tenEl.value
    } else if (fiftenEl.checked === true) {
        radius = fiftenEl.value
    } else {
        radius = twentyEl.value
    }
    console.log(radius);

    searchOptionEl.classList.add('hide');
});



// let previousSearches = [];

// if(localStorage["previousSearches"]) {
//      previousSearches = JSON.parse(localStorage["previousSearches"]);
// }

// if(previousSearches.indexOf(search) == -1) {
//     previousSearches.unshift(search);
//     if(previousSearches.length > 5) { 
//        previousSearches.pop();
//     }
//     localStorage["previousSearches"] = JSON.stringify(previousSearches);
// }


// function drawpreviousSearches() {
//     if(previousSearches.length) {
//         var html = previousSearchesTemplate({search:previousSearches});
//         $("#previousSearches").html(html);
//     }
// }

// $(document).on("click", ".previousSearchLink", function(e) {
//     e.preventDefault();
//     var search = $(this).text();
//     doSearch(search);
// });