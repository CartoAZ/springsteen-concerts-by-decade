//function to instantiate the Leaflet map
function createMap(){

    //variables to set bounds for panning
    var southWest = L.latLng(24, -140);
    var northEast = L.latLng(65, -54);
    var bounds = L.latLngBounds(southWest, northEast);

    //creates map with default center/zoom
    var map = L.map('map', {
        center: [42, -96],
        maxBounds: bounds,
        zoom: 3
    });

    //loads tilelayer onto map
    L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
      	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      	subdomains: 'abcd',
      	minZoom: 3,
      	maxZoom: 5,
      	ext: 'png'
    }).addTo(map);

    //function that retrieves data and calls other functions
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
};

//creates popup and adds content
function createPopup(properties, attribute, layer, radius){
    //checks if the state has a 0 for the specified attribute
    if (properties[attribute] == 0){
        //removes popup for states that didn't have any concerts
        layer.unbindPopup();

    } else {
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
    }
};

//function to iterate over each record in geojson and create a point marker for it
function pointToLayer(feature, latlng, attributes){

    //determines which attribute to visualize with proportional symbols upon loading map
    var attribute = attributes[0];
    //avoid creating tiny circles with a weighted outline for attribute value of 0
    if (feature.properties[attribute] != 0){
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
        if (attribute != 0){
            //call function and send necessary data to create popup for circleMarkers
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
        };
        //return circle marker to the L.geoJson pointToLayer options
        return layer;
    };
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
    //iterates through each layer (i.e., point) on map
    map.eachLayer(function(layer){
        //conditional to make sure we're processing a layer with an attribute and ignoring other layers
        if (layer.feature){
            //checks if the attribute of the property we are checking is equal to zero
            //need to check this because attribute value of 0 are not considered as existing (using the && operator)
            //by explicitly checking that attribute value is 0, we ensure that feature is passed to createPopup to update popup accordingly
            if (layer.feature.properties[attribute] == 0){
                //access feature properties
                var props = layer.feature.properties;
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);

                layer.setRadius(radius);

                //call function and send necessary data to create popup for circleMarkers
                createPopup(props, attribute, layer, radius);

            } else {
                //access feature properties
                var props = layer.feature.properties;
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);

                //call function and send necessary data to create popup for circleMarkers
                createPopup(props, attribute, layer, radius);
            };
        };
    });
};

//function to create sequence controls
function createSequenceControls(map, attributes){
    //create sequence control to add to leaflet map in bottom left corner
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

            //kill any mouse event listeners on the map when clicking on container
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

    //adds the control to 'map'
    map.addControl(new SequenceControl());

    //set slider attributes
    $('.range-slider').attr({
        max: 4,
        min: 0,
        value: 0,
        step: 1
    });

    //add the skip buttons to range slider
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
        //call updateLegend, which in turn class functions to update decade and panel
        updateLegend(map, attributes[index], index, attributes);
        //clears album image from panel when sequencer is used
        $('#album').html('');
        //calls backgroundInfo function to add text to panel_container when sequencer is used
        backgroundInfo();
        //reset dropdown list to select a tour
        $('#list').val(99);

    });

    //input listener for slider
    $('.range-slider').on('input', function(){
        //retrieve new index value
        var index = $(this).val();

        //pass new index to function so it can update prop symbols accordingly
        updatePropSymbols(map, attributes[index]);
        //call updateLegend, which in turn class functions to update decade and panel
        updateLegend(map, attributes[index], index, attributes);
        //clears album image from panel when sequencer is used
        $('#album').html('');
        //calls backgroundInfo function to add text to panel_container when sequencer is used
        backgroundInfo();
        //reset dropdown list to select a tour
        $('#list').val(99);

    });
};

//function to put AJAX query data into array and return to callback function
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        if (attribute.indexOf("_") || attribute.indexOf(" ") > -1){
            //remove 'State' and 'FullState' properties from array
            if (attribute.indexOf("State") == -1){
                //add attribute to attributes array
                attributes.push(attribute);
            };
        };
    };
    //passes attributes back to anonymous callback function to add to variable
    return attributes;
};

//function that creates list of tours for 70s upon loading map
function createPanelFilter(map, attributes){
    //array of years to add to panel
    var concertYears = ['(1972-73)', '(1974-75)', '(1976)', '(1976-77)', '(1978-79)'];
    //create variable to hold unnumbered list of tours
    var panelContent = '<ul id="tours">'
    //for loop adding the first tours to variable
    for (i = 5; i <10 ; i++){
        panelContent += '<li class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i - 5] + '</li>';
    };
    //close HTML unnumbered list
    panelContent += "</li>"

    //add html content to panel
    $("#panel").html(panelContent);
    //call function for panel event listeners
    panelEvents(map, attributes);
    //adds background info upon loading map
    backgroundInfo();
};

//function to add some background info to a div when an album cover is not present
function backgroundInfo(){
    var content = '<p class="info">Bruce Springsteen, now 66 years old, has been touring with the E Street Band for over 40 years. He continues to play to sold out stadiums and arenas around the world, with sets lasting over three hours.</p><p class="info"id="quote">"Think of it this way: performing is like sprinting while screaming for three, four minutes. And then you do it again. And then you do it again. And then you walk a little, shouting the whole time."</p><p class="info"> -- Bruce Springsteen</p>'
    $("#background").html(content);
};

//function to hold event listeners for tours listed in panels
function panelEvents(map, attributes){
    //affordance to highlight tour when moused over
    $('ul li.tour').mouseover(function(){
        $(this).addClass("hover");
    });
    $('li').mouseout(function(){
        $(this).removeClass("hover");
    });

    //click listener for buttons
    $('ul li').click(function(){

        //allows for styling of selected tour by adding/removing class
        $('ul li').removeClass("active");
        $(this).addClass("active");
        //retrieve index value from list
        var index = $(this).val();
        //add album to panel based on index number
        $('#album').html('<img src ="/../img/' + index + '.jpg">');

        //sets dropdown list to tour selected in panel
        $('#list').val(index);

        //did not call updateLegend() here because in updateLegend I call other functions that overwrite
        //the adding of the active class from this event listener function
        //instead just copied code here to avoid loop

        //update prop symbols based on new filter choice
        updatePropSymbols(map, attributes[index]);
        //remove background text because I album cover is present
        $('#background').html(" ")

        //store tour attribute in variable
        var legendContent = attributes[index];

        //replaces legend content
        $('#temporal-legend').html(legendContent);

        //get max, mean, min values and return as object stored in circleValues
        var circleValues = getCircleValues(map, attributes[index]);

        //loop to update attribute legend
        for (var key in circleValues){
            //get radius for legend based on min, max, mean attribute values in circleValues object
            var radius = calcPropRadius(circleValues[key]);

            $('#'+key).attr({
                cy: 99 - radius,
                r: radius
            });

            //conditional to make minimum say 1 show rather than 1 shows
            if (key == 'min') {
                //adds legend text
                $('#'+key+'-text').text(circleValues[key] + " show");
            } else {
                //adds legend text
                $('#'+key+'-text').text(circleValues[key] + " shows");
            };
        };
    });
};

//function to update panel/tour list based on decade selected with sequencer
function updatePanel(map, attributes, index){
    //array of years to add to panel
    var concertYears = ['(1972-73)', '(1974-75)', '(1976)', '(1976-77)', '(1978-79)','(1980-81)', '(1984-85)', '(1988-89)', '(1992-93)', '(1995-96)', '(1999-2000)', '(2002-03)', '(2005)', '(2006)', '(2007-08)', '(2009)', '(2012)', '(2014)', '(2016)'];
    //create variable to hold unnumbered list of tours
    var panelContent = '<ul id="tours">'
    //conditional to check for tours in the 1970s
    if (index == 0){
        //for loop adding tours to variable
        for (i = 5; i <10 ; i++){
            panelContent += '<li class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i-5] + '</li>';
        };
    } else if (index == 1) {
        //for loop adding tours to variable
        for (i = 10; i <13 ; i++){
            panelContent += '<li class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i-5] + '</li>';
      };
    } else if (index == 2) {
        //for loop adding tours to variable
        for (i = 13; i <16 ; i++){
            panelContent += '<li class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i-5] + '</li>';
        };
    } else if (index == 3) {
        //for loop adding tours to variable
        for (i = 16; i <21 ; i++){
            panelContent += '<li class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i-5] + '</li>';
        };
    } else if (index == 4) {
        //for loop adding tours to variable
        for (i = 21; i <24 ; i++){
            panelContent += '<li option class="tour" id="a' + i + '"value="'+ i + '">' + attributes[i] + ' ' + concertYears[i-5] + '</li>';
        };
    };
    //close HTML unnumbered list
    panelContent += "</li>"
    //add html content to panel
    $("#panel").html(panelContent);

    //call function for panel event listeners
    panelEvents(map, attributes);

};

//function to create legend upon lodating map
function createLegend(map, attributes){
    //adds legend control to leaflet map
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
    },

        onAdd: function(map){
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // add div to container for temporal legend
            $(container).append('<div id="temporal-legend">');

            //variable with HTML code to add to legend container
            var svg = '<svg id="attribute-legend" width="160px" height="100px">';

            //object for circles to hold values and y coord.
            var circles = {
                max: 35,
                mean: 66,
                min: 95
            };

            //loop adding appropriate ID to legend component and setting Y coords.
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle +
                '" fill="#00ccff" fill-opacity="0.8" stroke="#336699" cx="50"/>';

                //text string for circles
                svg += '<text id="' + circle + '-text" x="95" y="' + circles[circle] +'"></text>';
            };
            //closes svg HTML string
            svg += "</svg>";

            //add svg to attribute legendContent
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
    //call function to create original display of legend
    updateLegend(map, attributes[0], 0, attributes);
    //call function to create original display of decade in panel
    updateDecade(map, attributes, 0);
    //call function to create original display of tours in panel
    updatePanel(map, attributes, 0);


};

//function to convert index values from entire attributes array (specifically when selecting a concert)
//into a variable specific to decades
function getDecadeValue(index){
    //conditionals to set to proper decade whether a decade or a specific tour is passed
    if (index < 5) {
        var decadeValue = index
    } else if (index > 4 && index < 10){
        var decadeValue = 0;
    } else if (index > 9 && index < 13){
        var decadeValue = 1;
    } else if (index > 12 && index < 16){
        var decadeValue = 2;
    } else if (index > 15 && index < 21){
        var decadeValue = 3;
    } else if (index > 20 && index < 24){
        var decadeValue = 4;
    };
    return decadeValue;
};

//updates decade displayed at top of panel
function updateDecade(map, attributes, index){
    //variable to ensure index value represents appropriate decade
    var decadeValue = getDecadeValue(index);
    //place the appropriate decade into a variable
    var attribute = attributes[decadeValue];
    //add formatted attribute to popup content string
    var year1 = attribute.split("_")[0];
    var year2 = attribute.split("_")[1];
    //sets HTML string
    var decadeContent = 'Tours ' + year1 + ' - ' + year2;
    //adds HTML string to div
    $('#decade').html(decadeContent);
    //call function to update tours listed in panel based on decade selected
    updatePanel(map, attributes, decadeValue);
};

//function to update legend based on user selections
function updateLegend(map, attribute, index, attributes) {
    //if attribute is decade, make this temporal legend
    if (attribute.indexOf("_") > -1){
        //add formatted attribute to popup content string
        var year1 = attribute.split("_")[0];
        var year2 = attribute.split("_")[1];
        var legendContent = year1 + " through " + year2;

    //if attribute is a tour, make tour display in legend
    } else {
        var legendContent = attribute;
    };

    //replaces legend content
    $('#temporal-legend').html(legendContent);

    //calls function to update decade based on attribute index passed to updateLegend
    updateDecade(map, attributes, index);

    //get max, mean, min values and return as object stored in circleValues
    var circleValues = getCircleValues(map, attribute);

    //loop to set appropriate values for circles/labels in legend
    for (var key in circleValues){
        //get radius for legend based on min, max, mean attribute values in circleValues object
        var radius = calcPropRadius(circleValues[key]);

        $('#'+key).attr({
            cy: 99 - radius,
            r: radius
        });

        //conditional to make minimum say 1 show rather than 1 shows
        if (key == 'min') {
            //adds legend text
            $('#'+key+'-text').text(circleValues[key] + " show");
        } else {
            //adds legend text
            $('#'+key+'-text').text(circleValues[key] + " shows");
        };
    };
};

//function to calculate max, mean, min values for an attribute-legend
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible values
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get attribute value
        //include second statement of conditional so that attribute values of 0 are not included
        //because if a 0 is passed as min, the circle will have radius 0 and not show up in legend
        if (layer.feature && layer.feature.properties[attribute]){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean; round to avoid decimals
    var mean = Math.round((max + min) / 2);

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//function to create dropdown filter menu
function createFilter(map, attributes){
    //variable to hold dropdown
    var legend = L.control({position: 'topright'});

    //function called when legend is added to map
    legend.onAdd = function (map) {

        //creates a div element to add to map
        var div = L.DomUtil.create('div', 'info legend');

        //variable to hold HTML string; add numeric value to reference index in tours array
        var dropdown = '<select id="list"><option value=99>Select a Tour</option>'

        //for loop to add each tour from array to dropdown menu
        for (i = 23; i > 4; i--){
            dropdown += '<option class="tour" value="' + i + '">' + attributes[i] + '</option>'
        };
        //closes HTML string
        dropdown += '</select>';

        //adds HTML string fromd dropdown to innerHTML of div
        div.innerHTML = dropdown

        //stops event listeners on map when using dropdown menu
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;

        return div;
    };legend.addTo(map);
    //calls eventlistener dropdown function
    filterIndex(map, attributes)
};

//function to hold event listener for dropdown and update panel, legend, decade based on selection
function filterIndex(map, attributes){
    //click listener for filter list
    $('#list').change(function(){
        var index = $(this).val();
        //conditional to avoid anything happening when user re-selects 'Select a Tour'
        if ($(this).val() != 99){

            //change album div based on index value
            $('#album').html('<img src ="/../img/' + index + '.jpg">');

            //retrieve index for appropriate decade based on tour selection
            var decadeValue = getDecadeValue(index);
            //set sequencer to appropriate decade based on tour selection
            $('.range-slider').val(decadeValue);

            //update prop symbols based on new filter choice
            updatePropSymbols(map, attributes[index], index);
            //remove background info
            $('#background').html(" ")

            //update legend based on dropdown selection
            updateLegend(map, attributes[index], index, attributes);

            //ugly conditional statements to set an index variable for the array tourIndex
            //created below to hold only the tours contained within the decade that is active in map
            //the tours index in the attributes array determines what its index for array
            //tourIndex will be
            if (index == 5 || index == 10 || index == 13 || index == 16 || index == 21){
                var tourIndex = 0
            } else if (index == 6 || index == 11 || index == 14 || index == 17 || index == 22){
                var tourIndex = 1
            } else if (index == 7 || index == 12 || index == 15 || index == 18 || index == 23){
                var tourIndex = 2
            } else if (index == 8 || index == 19){
                var tourIndex = 3
            } else if (index == 9 || index == 20){
                var tourIndex = 3
            };

            //array to hold elements retrieved from panel after it updates based on user's selection in dropdown
            var tourArray = ($("li").get());
            //adds the class 'active' to the element based on its index
            $(tourArray[tourIndex]).addClass("active");
        };
    });
};

//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retrieve data
    $.ajax("data/springsteenByState.geojson", {
        dataType: "json",
        success: function(response){
            //create/returns attributes array
            var attributes = processData(response);

            //creates dropdown menu
            createFilter(map, attributes);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            //call function to create sequence controls
            createSequenceControls(map, attributes);
            //creates original legend
            createLegend(map, attributes);
            backgroundInfo();
        }
    });
};

$(document).ready(createMap);
