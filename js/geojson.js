/* Map showing GeoJSON data from megacities.geojson */

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


//get data function that turns point markers to circle markers
//function to retrieve data and place on map
function getData(map){

//jQuery AJAX method to retieve data
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){

            //create marker options
            var geojsonMarkerOptions = {
               radius: 5,
               fillColor: "#76EE00",
               color: "#000",
               weight: 1,
               opacity: 1,
               fillOpacity: 0.8
            };

        //create a Leaflet GeoJSON layer and places it on map
        L.geoJson(response, {
            pointToLayer: function(feature, latlng){
                return L.circleMarker(latlng, geojsonMarkerOptions)
            }


        }).addTo(map);
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
