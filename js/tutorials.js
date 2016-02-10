// /* From Leaflet startup Guide */
/* Questions
1 - don't understand openPopup() -- does it apply to all of the other variables?

*/


//creates our map and adds it to the <div>
//sets initial geometric center of map to a specific lat, lng with a zoom level of 13
//adds all that to a variable 'map'
var map = L.map('map').setView([51.505, -0.09], 13);

//loads and displays tile layers based on URL template
//options object that define keys in the URL, set maximum zoom for map, etc.
//.addTo(map) takes whatever the method did and adds it to the map in our div -- this is added
//to the end of every method in this file
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,  <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'alexzarley.p3olokca',
    accessToken: 'pk.eyJ1IjoiYWxleHphcmxleSIsImEiOiJjaWtlcDI2c2wwMDV3djJtMjZ6Y3hjNng0In0.5M74FhpO08BsrTnesKkjRQ'
}).addTo(map);

//creates marker variable in which method puts a marker at a specific set of lat, lng coordinates on map
var marker = L.marker([51.5, -0.09]).addTo(map);

//creates a circle variable in which a circle overlays at a specific set of lat, lng coordinates
//and a radius in meters; options object defines style of circle; adds it to map
var circle = L.circle([51.508, -0.11], 500, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
}).addTo(map);

//creates polygon variable in which a polygon with vertices is created at lat,lng points specified
//don't need to duplicate first/last set of coordinates
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//attaches a popup that opens when you click the variable with the attached HTML string inside the popup
//openPopup closes the previous popup when you click on another variable with a popup
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();

//attaches a popup that opens when you click the variable with the attached HTML string inside the popup
circle.bindPopup("I am a circle.");

//attaches a popup that opens when you click the variable with the attached HTML string inside the popup
polygon.bindPopup("I am a polygon.");

//creates an instance of a popup at a specified lat,long location, sets a message,
//and closes previous popup when this one opens
var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

var popup = L.popup();

//creates function that can be called as parameter in even object
function onMapClick(e) {
    popup
        //records lat,lng of where user clicked
        .setLatLng(e.latlng)
        //determines HTML/string to be displayed in popup
        .setContent("You clicked the map at " + e.latlng.toString())
        //closes previous popup
        .openOn(map);
}

//creates an event object that allows us to determine what a user click does
//in this case it calls onMapClick function
map.on('click', onMapClick);



//using GeoJSON
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Fields",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104,99404, 39.75621]
    }
};

//adds feature in 'geojsonFeature' to map
L.geoJson(geojsonFeature).addTo(map);


var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

L.geoJson(myLines, {
    style: myStyle
}).addTo(map);


var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

L.geoJson(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);


var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

L.geoJson(someGeojsonFeature, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);


function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent);
    }
}

var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

L.geoJson(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);


var someFeatures = [{
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

L.geoJson(someFeatures, {
    filter: function(feature, layer) {
        return feature.properties.show_on_map;
    }
}).addTo(map);
