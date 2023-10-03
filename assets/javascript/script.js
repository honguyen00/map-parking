let map;
let service;
let infoWindow;
let markers = [];
var resultTable = $("#results");

// run after loading all html elements
$(function () {
    window.initMap = initMap;
})

// declare map, infoWindow, and service using google.api
function initMap() {
    // set initial location to be Australia
    const location = {
        au: {
            center: { lat: -25.3, lng: 133.8 },
            zoom: 4,
      }}
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
            createMarker(pos);
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

function createMarker(place) {
    if (!place) return;
    map.setCenter(place);
    map.setZoom(12)
    const marker = new google.maps.Marker({
        map: map,
        position: place,
        animation: google.maps.Animation.DROP,
    });

    infowindow = new google.maps.InfoWindow(
        {
            content: "{ "+ place.lat + ", " + place.lng + "}",
        }
    );
    marker.addListener("dblclick", searchParkingAroundRadius, {passive: true})
}

function searchParkingAroundRadius(position) {
    if (typeof position == String) {
        // console.log("Is a string");
    }
    else {
        var location = position.latLng.toJSON();
        const search = {
            location: {lat: location["lat"], lng: location["lng"]},
            radius: 1000,
            keyword: "parking",
        };
        service.nearbySearch(search, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                clearResults();
                clearMarkers();
                // console.log(results);
                cposn
                for (var i=0; i<results.length; i++) {
                    const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
                    markers[i] = new google.maps.Marker({
                        position: results[i].geometry.location,
                        animation: google.maps.Animation.DROP,
                        icon: "./assets/images/map-marker-blue.png",
                        title: markerLetter + ". " + results[i].name,
                    });

                    markers[i].placeResult = results[i];
                    markers[i].addListener("click", showParkingInfo);
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
    for (let i = 0; i<markers.length; i++) {
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
    var resultTd = $("<td class='result-item'>" + markerLetter + ". " + result.name + "</td>");
    rowEle.append(resultTd);
    resultTable.append(rowEle);
}

function clearResults() {
    resultTable.empty();
}

function showParkingInfo() {
    const marker = this;
    service.getDetails({placeId: marker.placeResult.place_id}, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return;
        }
        infoWindow.open(map, marker);
        // console.log(place);
        // console.log(place.photos[0].getUrl());
    })
}

function hightlightMarker(event) {
    var i = $(event.target).parent().index();
    if (markers[i].getAnimation() !== null) {
        markers[i].setAnimation(null);
    }
    else {
        markers[i].setAnimation(google.maps.Animation.BOUNCE);
    }
}

resultTable.on("mouseover", ".result-item", hightlightMarker)
resultTable.on("mouseout", ".result-item", hightlightMarker)