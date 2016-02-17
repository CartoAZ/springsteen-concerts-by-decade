/* Map showing GeoJSON data from megacities.geojson
- Get data
- create leaflet map
- Bring in map tiles
- Put data on map
- Convert points to circle markers
- Make proportional symbol based on attribute
- Do this for each of our 7 attributes
- Make circles change size based on selected year
- Add time slider/temporal aspect
- Add background information/point popups
- Add pan
- Add zoom
- Add other elements (title, infographics, etc.)


*/

//function to instantiate the Leaflet map
function createMap(){

    //creates our map with default center/zoom
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    getData(map);
};

//calculate the radius of each proportional symbols
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scalFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scalFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
}

function pointToLayer(feature, latlng){
    //determines which attribute to visualize with proportional symbols
    var attribute = "Pop_2015"

    //create marker options
    var options = {
       fillColor: "#76EE00",
       color: "#000",
       weight: 1,
       opacity: 1,
       fillOpacity: 0.8
    };

    //determine value of selected attribute for each feature
    var attValue = Number(feature.properties[attribute]);

    //give each feature's circle marker a radius based on its attribute
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";

    //bind popup to circle marker and offset popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius)
    });

    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });

    //return circle marker to the L.geoJson pointToLayer options
    return layer;
};

//create circle markers for point features to map
function createPropSymbols(data, map){

    //create a Leaflet GeoJSON layer and places it on map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
  };


//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retieve data
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            //call function to create proportional symbols
            console.log(response.features)
            createPropSymbols(response, map);
        }
    });
};

// //attaches popup containing all properties for each feature
// //function that attaches popup to each feature in GeoJSON data on map
// function onEachFeature(feature,layer) {
//
//     //no property named popupContent in our GeoJSON data so we create HTML string variable to contain properties
//     var popupContent = "";
//
//     //what is this doing???? if the feature has any properties?
//     if (feature.properties) {
//
//         //loop to add feature property; 'property' could be any ariable?
//         for (var property in feature.properties){
//             popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
//         }
//
//         //adds our popup string to whatever layer is passed into onEachFeature function
//         layer.bindPopup(popupContent);
//     };
// };
//
// //function to retrieve data and place on map
// function getData(map){
//
// //jQuery AJAX method to retieve data
//     $.ajax("data/MegaCities.geojson", {
//         dataType: "json",
//         success: function(response){
//
//         //create a Leaflet GeoJSON layer and places it on map
//             L.geoJson(response, {
//                 onEachFeature: onEachFeature
//             }).addTo(map);
//         }
//     });
// };


// //function that retrieves data and filters based on 2015 population
// function getData(map){
//
// //jQuery AJAX method to retieve data
//     $.ajax("data/MegaCities.geojson", {
//         dataType: "json",
//         success: function(response){
//
//         //create a Leaflet GeoJSON layer and places it on map
//             L.geoJson(response, {
//                 filter: function(feature, layer) {
//                     return feature.properties.Pop_2015 > 20;
//                 }
//             }).addTo(map);
//         }
//     });
// };



$(document).ready(createMap);
