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

function pointToLayer(feature, latlng, attributes){
    //determines which attribute to visualize with proportional symbols
    var attribute = attributes[0];

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

    //original popupContent change to panelContent
    var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    panelContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";


    //build popup content string
    var popupContent = feature.properties.City

    //bind popup to circle marker and offset popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
        closeButton: false
    });

    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#panel").html(panelContent);
        }
    });

    //return circle marker to the L.geoJson pointToLayer options
    return layer;
};

//function to udpate the attribute based on user inputs (i.e., clicking and sliding)
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>City:</b> " + props.City + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        }
    })
};

//create circle markers for point features to map
function createPropSymbols(data, map, attributes){

    //create a Leaflet GeoJSON layer and places it on map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
  };

//function to create sequence controls
function createSequenceControls(map, attributes){
      //create range input element, i.e. a slider
      $('#panel').append('<input class="range-slider" type="range">');

      //set slider attributes
      $('.range-slider').attr({
          max: 6,
          min: 0,
          value: 0,
          step: 1

      });
      //add the skip buttons to range slider
      $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
      $('#panel').append('<button class="skip" id="forward">Skip</button>');
      //add images for the buttoms
      $('#reverse').html('<img src="img/backward.png">');
      $('#forward').html('<img src="img/forward.png">');
      //click listener for buttons
      $('.skip').click(function(){
          //retrieve index value before click
          var index = $('.range-slider').val();
          if ($(this).attr('id') == 'forward'){
              index++;

              //if this will make it go over the last attribute, return to first attribute
              index = index > 6 ? 0 : index;
          } else if ($(this).attr('id') == 'reverse'){
              index--;
              //if this will make it go below first attribute, return to last attribute
              index = index < 0 ? 6 : index;
          };
          //updates the slider based on clicking buttons
          $('.range-slider').val(index);

          //pass new index to function so it can update prop symbols accordingly
          updatePropSymbols(map, attributes[index]);
      });
      //input listener for slider
      $('.range-slider').on('input', function(){
          //retrieve new index value
          var index = $(this).val();

          //pass new index to function so it can update prop symbols accordingly
          updatePropSymbols(map, attributes[index]);
      });
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};



//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retieve data
    $.ajax("data/MegaCities.geojson", {
        dataType: "json",
        success: function(response){
            //create attributes array
            var attributes = processData(response);

            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            //call function to create sequence controls
            createSequenceControls(map, attributes);
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
