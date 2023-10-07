let map;
let service;
let infoWindow;
let markers = [];
var resultTable = $("#results");
var infoWindow1;
var searchMarker;
var radius;
var currentFocusedMarker;

// run after loading all html elements
$(function () {
    window.initMap = initMap;
})

// declare map, infoWindow, and service using google.api
async function initMap() {
    // set initial location to be Australia
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
    const currentLocationButton = $("<button class='custom-map-control-button'>Current location</button>")
    // add the cumstom button to the top center of the map
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(currentLocationButton[0]);
    // add listener to the custom button, function getCurrentPos
    currentLocationButton.on("click", getCurrentPos);
    // declare service, this is to have access to PlacesService api to get methods such as search nearby, find place etc..
    service = new google.maps.places.PlacesService(map);
    // stop the default behavior of the map when user click on an icon (default behavior is when click on any icons or places, infowindow will show up with details)
    map.addListener('click', (event) => {
        if (event.placeId) {
            event.stop();
        }
    });
    infoWindow1 = new google.maps.InfoWindow({
        content: document.getElementById("infowindow")
    })
    const options = {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
        componentRestrictions: {country: "au"}
    };
    var input = $("#search-address");
    const autocomplete = new google.maps.places.Autocomplete(input[0], options);
    searchMarker = new google.maps.Marker();
    $(".search-icon").on("click", (event) => {
        event.preventDefault();
        if(input.val() != "") {
            if (typeof autocomplete.getPlace() != typeof undefined) {
                createLocation(autocomplete.getPlace().geometry.location);
                input.val("");
            }
            else {
                handleLocationError(true, infoWindow, map.getCenter());
            }
        }
    })
    radius = 1000;
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
                handleLocationError(true, infoWindow, map.getCenter());
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
    clearResults();
    clearSearchMarker();
    clearResultMarkers();
    map.panTo(place);
    map.setZoom(12)
    searchMarker = new google.maps.Marker({
        map: map,
        position: place,
        animation: google.maps.Animation.DROP,
    });
    searchMarker.addListener("dblclick", searchParkingAroundRadius, { passive: true })
}

async function searchParkingAroundRadius(position) {
        var location = position.latLng.toJSON();
        const search = {
            location: { lat: location["lat"], lng: location["lng"] },
            radius: radius,
            keyword: "parking lot",
        };
        var moreButton = $("#more");
        let getNextPage;
        moreButton.on("click", function() {
            moreButton.attr("disabled", true)
            if (getNextPage) {
                getNextPage();
            }
        }) 
        var i = 0;
        service.nearbySearch(search, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) { 
            addResultsToMap(results, i);
            moreButton.attr("disabled", (!pagination || !pagination.hasNextPage));
            if (pagination && pagination.hasNextPage) {
                getNextPage = () => {
                    pagination.nextPage();
                    i += 20;
                }
            } 
        }
        else {
            handleLocationError(true, infoWindow, map.getCenter());
        }
        })
        map.setZoom(14);
    }

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: There is no results available"
            : "Error: Your browser doesn't support geolocation.",
    );
    infoWindow.open(map);
}


function dropMarker(i) {
    return function () {
        markers[i].setMap(map);
    }
}
function clearSearchMarker() {
    searchMarker.setMap(null);
}

function clearResultMarkers() {
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }
    markers = [];
}

async function addResultsToMap(results, i) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    results.forEach(result => {
        var markerNumber = i+1;
        const pinBackground = new PinElement({
            background: "#031cfc",
            borderColor: "white",
            glyphColor: "black",
        })
        defaultpinBackground = pinBackground;
        markers.push(new AdvancedMarkerElement({
            position: result.geometry.location,
            title: markerNumber + ". " + result.name,
            content: pinBackground.element,
        }));

        markers[i].placeResult = result;
        google.maps.event.addListener(markers[i], "click", showParkingInfo)
        setTimeout(dropMarker(i), i*100);
        // addResultsToMap(results[i], i);
        addResultsToDiv(result, i);
        i++;
    });
}

function addResultsToDiv(result, i) {
        var markerNumber = i+1;
        const rowEle = $("<tr>");
        rowEle.on("click", () => {
            google.maps.event.trigger(markers[i], "click");
        })
        var resultTd = $("<td class='result-item w-full'>" + markerNumber + ". " + result.name + "</td>");
        rowEle.append(resultTd);
        resultTable.append(rowEle);
}


function clearResults() {
    resultTable.empty();
}

function showParkingInfo() {
    currentFocusedMarker = this;
    const marker = this;
    service.getDetails({ placeId: marker.placeResult.place_id }, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return;
        }
        infoWindow1.open(map, marker);
        map.panTo(marker.placeResult.geometry.location);
        map.setZoom(16 - (radius/1000));
        buildIWContent(place); 
    });
}

function buildIWContent(place) {
    var infoDiv = $("#infowindow");
    if (infoDiv.children()) {
        infoDiv.empty();
    }
    var headDiv = $("<div class='mb-2'>")
    var placeIcon = $("<img class='parkingIcon inline-block'" + "style='background-color:" + place.icon_background_color + "'" + "src='" + place.icon + "'>");
    var placeName = $("<a class='font-bold' href=" + place.url + " target='_blank'>" + place.name  + "</a>");
    headDiv.append(placeIcon, placeName);
    var placeAddress = $("<p class='mb-2'><strong>Address:</strong> " + place.vicinity + "</p>");
    infoDiv.append(headDiv[0], placeAddress[0]);
    addPhotos(place, infoDiv, function() {
        addRatingandFeedback(place,infoDiv);
    });
}

function addPhotos(place, infoDiv, callback) {
    var sv = new google.maps.StreetViewService();
    var direction = new google.maps.DirectionsService();
    var request = {
        origin: place.geometry.location,
        destination: place.geometry.location,
        travelMode: 'DRIVING'
    };
    direction.route(request, (result, status) => {
        if (status == 'OK') {
            var location = result.routes[0].legs[0].start_location;
            var streetviewDiv = $("<div class='streetview mb-2'>");
            sv.getPanoramaByLocation(location, 50, (data, status) => {
                if (status == 'OK') {
                    var heading = google.maps.geometry.spherical.computeHeading(data.location.latLng, place.geometry.location);
                    const panorama = new google.maps.StreetViewPanorama(streetviewDiv[0], {
                        addressControl: false,
                        linksControl: false,
                        enableCloseButton: false,
                        panControl: false,          
                    });
                    panorama.setPano(data.location.pano);
                    panorama.setPov({
                        heading: heading,
                        pitch: 5,
                    });
                    panorama.setVisible(true);
                    infoDiv.append(streetviewDiv);
                    callback();
                }
            })
        }
    })
}

function addRatingandFeedback(place, infoDiv) {
    var ratingHtml = "";
    var ratingLab = "<strong>Rating: </strong> ";
    if (place.rating) {
        for (let i=0; i<5; i++) {
            if (place.rating < i + 0.5) {
                ratingHtml += "&#10025;";
            }
            else {
                ratingHtml += "&#10029;";
            }
        } 
        ratingHtml += " (" + place.rating + ")";
    } else {
        ratingHtml = "(No ratings)"
    }
    var ratingDiv = $("<div>" + ratingLab + ratingHtml + "</div>");
    var accessFeedbackDiv = $("<div class='feedback'>")
    var accessFeedbackLabel = $("<p>Does this place have disabled parking spaces and/or wheelchair accessible? </p>");
    var upcount = 0;
    var downcount = 0;
    var feedback = JSON.parse(localStorage.getItem("feedback"));
    var savedLocation = {lat: $(currentFocusedMarker)[0].ln.lat, lng: $(currentFocusedMarker)[0].ln.lng};
    if (feedback) {
        feedback.find((item) => {
            if (JSON.stringify(item.location) === JSON.stringify(savedLocation)) {
                upcount = item.up;
                downcount = item.down;
                return;
            }
        })
    }
    var up = $("<button class='like my-auto'><i class='fa fa-thumbs-up' aria-hidden='true'></i></button>");
    var upCountDiv = $("<div class='my-auto'>(<span id='upcount'>" + upcount + "</span>)</div>");
    var down = $("<button class='dislike my-auto'><i class='fa fa-thumbs-down' aria-hidden='true'></i></button>");
    var downCountDiv = $("<div class='my-auto'>(<span id='downcount'>" + downcount + "</span>)</div>");
    accessFeedbackDiv.append(accessFeedbackLabel, up, upCountDiv, down, downCountDiv)
    infoDiv.append(ratingDiv, accessFeedbackDiv);
}

$('#infowindow').on("click",".like, .dislike", (event)=> {
    event.preventDefault();
    // $('.active').removeClass('active');
    // $(event.target).addClass('active');
    var savedLocation = {lat: $(currentFocusedMarker)[0].ln.lat, lng: $(currentFocusedMarker)[0].ln.lng};
    var upcountEle = $("#upcount");
    var downcountEle = $("#downcount");
    var upcount = parseInt(upcountEle[0].textContent);
    var downcount = parseInt(downcountEle[0].textContent);
    if ($(event.target).attr("class") === 'fa fa-thumbs-up') {
        upcount++;
        upcountEle[0].textContent = upcount;
    } else {
        downcount++;
        downcountEle[0].textContent = downcount;
    }
    // ===================================================================================================
    var localStorageItem = {location: savedLocation, up: upcount, down: downcount};
    var feedback = JSON.parse(localStorage.getItem("feedback"));
    if (!feedback) {
        var feedback = [];
        feedback.push(localStorageItem);
        localStorage.setItem("feedback", JSON.stringify(feedback));
    } else {
        var duplicate = feedback.find((item) => {
            if (JSON.stringify(item.location) === JSON.stringify(savedLocation)) {
                item.up = upcount;
                item.down = downcount;
                localStorage.setItem("feedback", JSON.stringify(feedback));
                return true;
            }
        });
        if (!duplicate) {
            feedback.push(localStorageItem);
            localStorage.setItem("feedback", JSON.stringify(feedback));
            return;
        }
    }
})

$('#infowindow').on("mousedown",".like, .dislike", (event)=> {
    $(event.target).addClass('active');
})

$('#infowindow').on("mouseup",".like, .dislike", (event)=> {
    $('.active').removeClass('active');
})

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
        background: "#fc0317",
        borderColor: "black",
        glyphColor: "white",
        scale: 1.2,
    })
    if ($(markers[i].content).children().eq(0).children().eq(0).children().eq(0).attr("fill") == "white") {
        markers[i].content = onfocuspinBackground.element;
        markers[i].zIndex = markers.length + 1;
    }
    else {
        markers[i].content = defaultpinBackground.element;
        markers[i].zIndex = i;
    }
}

resultTable.on("mouseover", hightlightMarker)
resultTable.on("mouseout", hightlightMarker)

// Defining the variables for the filter options
let filterEl = document.getElementById('filter-Btn');
let searchOptionEl = document.querySelector('.search-option');
let saveEl = document.querySelector('.save-Btn');
let cancelEl = document.querySelector('.cancel-Btn');

// Adding an event listener for when user clicks on the filter button
filterEl.addEventListener("click", function (event) {
    event.preventDefault();

    searchOptionEl.classList.remove('hide');
});

// Adding an event listener to hide the modal when user clicks on the cancel button
cancelEl.addEventListener("click", function () {
    searchOptionEl.classList.add('hide');
});

// The event listener will process user's filter inputs when they click on the save button
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

// Defining the variables for search history features
let historyEl = document.querySelector('.history');
let historyListEl = document.querySelector('.historyList');
let searchValueEl = document.getElementById('search-address');
let searchEl = document.getElementById('search-bar');
let historyItemEl = document.querySelector('.historyItem');

// Saving the search history in local storage
let previousSearch = JSON.parse(localStorage.getItem("previousSearch")) || [];

// Adding a click event for the search button
searchEl.addEventListener("submit", function (event) {
    event.preventDefault();

    // Hide the search history feature when user clicks on the search button
    historyEl.classList.add('hide');

    // If the text input is an empty string, or is a repeat from the previous string, do not save the result in local storage
    if (searchValueEl.value === '' || previousSearch.indexOf(searchValueEl.value) !== -1) {
        return
    }

    // Adding the new search value to the top of the search history 
    previousSearch.unshift(searchValueEl.value);

    // Displaying the saved string lists from local storage
    localStorage.setItem("previousSearch", JSON.stringify(previousSearch));

    showHistory();

    // Only showing the last 8 search history 
    if (previousSearch.length > 7) {
        previousSearch.pop();
    }

    // Clearing the text input value once user submits
    searchValueEl.value = "";
})

// Adding a click event so that the search history feature will show up when user clicks on the text input box
searchValueEl.addEventListener('click', function () {
    historyEl.classList.remove('hide');
})

function showHistory() {

    // Adding html elements into the historyList element
    historyListEl.innerHTML = '';

    // Creating a for loop and all the elements required for the user input
    for (let i = 0; i < previousSearch.length; i++) {
        let newDiv = document.createElement('div');
        newDiv.classList.add('historyItem');

        let iconEl = document.createElement('i');
        iconEl.setAttribute('class', 'fa-regular fa-clock');

        let pEl = document.createElement('button');
        pEl.textContent = previousSearch[i];

        newDiv.append(iconEl, pEl);

        historyListEl.appendChild(newDiv);
    }
}

showHistory();

// Adding a keyboard event listener so that when user types anything in the search bar, the autocomplete function will kick in instead of search history.
searchEl.addEventListener("keyup", function () {

    historyEl.classList.add('hide');

    if (searchValueEl.value === '') {
        return historyEl.classList.remove('hide');
    }
})



window.initMap = initMap;


