//function to instantiate the Leaflet map
function createMap(){

    //creates our map with default center/zoom
    var map = L.map('map', {
        center: [42, -96],
        zoom: 3
    });

    // L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}', {
    //   	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    //   	subdomains: 'abcd',
    //   	minZoom: 0,
    //   	maxZoom: 20,
    //   	ext: 'png'
    // }).addTo(map);

    L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
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
       fillColor: "#00ccff",
       color: "#336699",
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

    //define text to be in popup
    var popupContent = "<p><b>State:</b> " + feature.properties.FullState + "</p>";

    //add formatted attribute to panel content string
    var year1 = attribute.split("_")[0];
    var year2 = attribute.split("_")[1];
    popupContent += "<p><b>Concerts in " + feature.properties.State + " between " + year1 + " and " + year2 + ":</b> " + feature.properties[attribute] + "</p>";


    //build popup content string
    // var popupContent = feature.properties.State

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
        }
        // click: function(){
        //     $("#panel").html(panelContent);
        // }
    });

    //return circle marker to the L.geoJson pointToLayer options
    return layer;
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
              var popupContent = "<p><b>State:</b> " + props.FullState + "</p>";

              //add formatted attribute to panel content string
              var year1 = attribute.split("_")[0];
              var year2 = attribute.split("_")[1];
              popupContent += "<p><b>Concerts in " + props.State + " between " + year1 + " and " + year2 + ":</b> " + props[attribute] + "</p>";

              //replace the layer popup
              layer.bindPopup(popupContent, {
                  offset: new L.Point(0,-radius)
              });
          }
      })
  };


//function to create sequence controls
function createSequenceControls(map, attributes){
      //create range input element, i.e. a slider
      $('#panel').append('<input class="range-slider" type="range">');

      //set slider attributes
      $('.range-slider').attr({
          max: 4,
          min: 0,
          value: 0,
          step: 1

      });
      //add the skip buttons to range slider
      $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
      $('#panel').append('<button class="skip" id="forward">Skip</button>');
      $('#reverse').html('<img src="img/backward.png">');
      $('#forward').html('<img src="img/forward.png">');

      //click listener for buttons
      $('.skip').click(function(){
          //retrieve index value before click
          var index = $('.range-slider').val();
          if ($(this).attr('id') == 'forward'){
              index++;

              //if this will make it go over the last attribute, return to first attribute
              index = index > 4 ? 0 : index;
          } else if ($(this).attr('id') == 'reverse'){
              index--;
              //if this will make it go below first attribute, return to last attribute
              index = index < 0 ? 4 : index;
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
        if (attribute.indexOf("_") > -1){
            attributes.push(attribute);
        };
    };

    //passes attributes back to anonymous callback function to add to variable
    return attributes;
};

//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retieve data
    $.ajax("data/springsteenByState.geojson", {
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


$(document).ready(createMap);
