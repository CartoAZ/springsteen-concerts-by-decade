//function to instantiate the Leaflet map
function createMap(){

    //creates our map with default center/zoom
    var map = L.map('map', {
        center: [42, -96],
        zoom: 3
    });

//loads tilelayer onto map
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
    var scalFactor = 30;
    //area based on attribute value and scale factor
    var area = attValue * scalFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

function createPopup(properties, attribute, layer, radius){
    //checks for underscore to format popups when viewing data by decade vs format popup for
    //individual tours that don't have a from/to date
    if (attribute.indexOf("_") > -1){
        //define text to be in popup
        var popupContent = "<p><b>State:</b> " + properties.FullState + "</p>";

        //add formatted attribute to popup content string
        var year1 = attribute.split("_")[0];
        var year2 = attribute.split("_")[1];
        popupContent += "<p><b>Concerts between " + year1 + " and " + year2 + ":</b> " + properties[attribute] + "</p>";
    } else {
      //define text to be in popup
      var popupContent = "<p><b>State:</b> " + properties.FullState + "</p>";

      //add formatted attribute to popup content string
      popupContent += "<p><b>Concerts on " + attribute + " Tour in " + properties.State + ":</b> " + properties[attribute] + "</p>";
    };
    //bind popup to circle marker and offset popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius),
        closeButton: false
    });
};

//function to iterate over each record in geojson and create a point marker for it
//also creates/defines popup content for each point marker
function pointToLayer(feature, latlng, attributes){

    //determines which attribute to visualize with proportional symbols upon loading map
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

    //call function and sent necessary data to create popup for circleMarkers
    createPopup(feature.properties, attribute, layer, options.radius);

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
function createPropSymbols(data, map, attributes, tours){

    //create a Leaflet GeoJSON layer and places it on map
    L.geoJson(data, {
      pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes, tours);
      }
    }).addTo(map);
};

//function to udpate the attribute based on user inputs (i.e., clicking and sliding)
function updatePropSymbols(map, attribute){
    //iterates through each layer (i.e., point) on map
    map.eachLayer(function(layer){
        //conditional to make sure we're processing a layer with an attribute and ignore basemap
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //call function and sent necessary data to create popup for circleMarkers
            createPopup(props, attribute, layer, radius);
        };
    })
};

//function to create sequence controls
//need to add something that when you adjust slider, it changes dropdown back to Select a tour
function createSequenceControls(map, attributes){

    //trying to add dynamic title telling user what years' data they are on
    // var year1 = attributes[0].split("_")[0];
    // var year2 = attributes[0].split("_")[1];
    // index = attributes[0];
    // var titleLabel = '<p>Bruce Springsteen concerts from ' + year1 + ' to ' + year2 + ' </p>';
    //
    //
    // $("#title").html(titleLabel);

    // updatePanelLabel(map, index);
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function(map) {
            //create the container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element, i.e. a slider
            $(container).append('<input class="range-slider" type="range">');

            //add the skip buttons to range slider
            $(container).append('<button class="skip" id="reverse" title="Reverse"><img src="img/backward.png"></button>');
            $(container).append('<button class="skip" id="forward" title="Skip"><img src="img/forward.png"></button>');

            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

    map.addControl(new SequenceControl());

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

        // //trying to pass new index to function to update label
        // updateTitle(map, attributes[index]);
    });
    // //input listener for slider
    // $('.range-slider').on('input', function(){
    //     //retrieve new index value
    //     var index = $(this).val();
    //
    //     //pass new index to function so it can update prop symbols accordingly
    //     updatePropSymbols(map, attributes[index]);
    // });
};

// //function to udpate HTML string on panel telling user what years' data are being displayed
// function updateTitle(map, attribute, titleContent){
//
//
//     //split attribute title into 'from' and 'to' years
//     var year1 = attribute.split("_")[0];
//     var year2 = attribute.split("_")[1];
//     $("#title").html('<p>Bruce Springsteen concerts from ' + year1 + ' to ' + year2 + ' </p>');
//     // $("#panel").append('<p>Bruce Springsteen concerts from ' + year1 + ' to ' + year2 + ' </p>');
// }

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

//function to create dropdown filter menu
function createFilter(map, tours){
    //variable to hold dropdown
    var legend = L.control({position: 'topright'});

    //not sure what this does??
    legend.onAdd = function (map) {

        //creates a div element to add to map
        var div = L.DomUtil.create('div', 'info legend');

        //variable to hold HTML string; add numeric value to reference index in tours array
        var dropdown = '<select id="list"><option value=20>Select a Tour</option>'

        //for loop to add each tour from 'tours' array to dropdown menu
        for (i = 19; i > -1; i--){

          dropdown += '<option class="tour" value="' + i + '">' + tours[i] + '</option>'
        };
        dropdown += '</select>';

        //adds HTML string fromd dropdown to innerHTML of div
        div.innerHTML = dropdown

        //what does this do??????
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;

        return div;
    };legend.addTo(map);
};

function processTours(data){
    //empty array to hold attributes
    var tours = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        if (attribute.indexOf(" ") > -1){
            tours.push(attribute);
        };
    };

    //passes attributes back to anonymous callback function to add to variable
    return tours;
}

function filterIndex(map, tours){
    //click listener for filter list
    $('#list').change(function(){
      var index = $('#list').val();
      //update prop symbols based on new filter choice
      updateFilter(map, tours[index]);
    });
      // console.log(index);
      // $( "select" ).change( displayVals );
      // displayVals(index);
        // var a = $('select.list option:selected').val();
        // console.log(a);
        // retrieve index value before click
        // var index = $('.range-slider').val();
        // console.log(index);
        // console.log($(this).attr('id'));

        // if ($(this).attr('id') == 'forward'){
        //     index++;
    //
    //         //if this will make it go over the last attribute, return to first attribute
    //         index = index > 4 ? 0 : index;
    //     } else if ($(this).attr('id') == 'reverse'){
    //         index--;
    //         //if this will make it go below first attribute, return to last attribute
    //         index = index < 0 ? 4 : index;
    //     };
    //     //updates the slider based on clicking buttons
    //     $('.range-slider').val(index);
    //
    //     //pass new index to function so it can update prop symbols accordingly
    //     updatePropSymbols(map, attributes[index]);
    // });
    // //input listener for slider
    // $('.range-slider').on('input', function(){
    //     //retrieve new index value
    //     var index = $(this).val();
    //
    //     //pass new index to function so it can update prop symbols accordingly
    //     updatePropSymbols(map, attributes[index]);
    // });
}


//NEED TO UPDATE FILTER POPUP CONTENT
function updateFilter(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //call function and send necessary data to create popup for circleMarkers
            createPopup(props, attribute, layer, radius);
        };
    });
};

//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retieve data
    $.ajax("data/springsteenByState.geojson", {
        dataType: "json",
        success: function(response){
            //create attributes array
            var attributes = processData(response);

            var tours = processTours(response);

            createFilter(map, tours);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes, tours);
            //call function to create sequence controls
            createSequenceControls(map, attributes);

            filterIndex(map, tours);
        }
    });
};


$(document).ready(createMap);
