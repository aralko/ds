sap.designstudio.sdk.Component.subclass("com.ar.sample.maps.GoogleMaps", function() {
	var that = this;
	var SAP_HQ_LAT = 49.290818;
	var SAP_HQ_LNG = 8.643104;
	
	this.init = function() {
		this.geocoder = new google.maps.Geocoder();

		var mapOptions = {
			zoom: 1,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(this.$()[0], mapOptions);
		google.maps.event.addListener(this.map, 'zoom_changed', function() {
			that.firePropertiesChanged(["zoom"]);
			that.fireEvent("onZoom");
		});
		drawMarker("611 8th Avenue NE, Calgary, AB");

	};
	
	this.afterUpdate = function() {
		
	};
	

	
	//Returns geocoded coordinates of a String address
	function drawMarker(value) {
		that.geocoder.geocode( { 'address': value}, function(results, status) {
		    if (status == google.maps.GeocoderStatus.OK) {
		    	var marker = new google.maps.Marker({
			          map: that.map,
			          position: results[0].geometry.location
			      });
		    	that.map.setCenter(results[0].geometry.location);
		    } else {
		      alert('Geocode was not successful for the following reason: ' + status);
		    }
		  });
	};
	

	// property setter/getter functions
	this.maptype = function(value) {
		if (value === undefined) {
			return this.map.getMapTypeId();
		} else {
			this.map.setMapTypeId(value);
			return this;
		}
	};

	this.zoom = function(value) {
		if (value === undefined) {
			return this.map.getZoom();
		} else {
			this.map.setZoom(value);
			return this;
		}
	};
});

sap.designstudio.sdk.Component.subclass("com.ar.sample.maps.DataMap", function() {
	var SAP_HQ_LAT = 49.290818;
	var SAP_HQ_LNG = 8.643104;
	
	var ad = null;
	var meta_data = null;
	var redmarker_data = null;
	var bluemarker_data = null;
	
	var that = this;

	this.init = function() {
		var mapOptions = {
			center: new google.maps.LatLng(SAP_HQ_LAT, SAP_HQ_LNG),
			zoom: 2,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(this.$()[0], mapOptions);
		this.geocoder = new google.maps.Geocoder();
	};

	this.afterUpdate = function() {
		if (meta_data) {
			var relevant_dim = null;
			for (var i = 0; i < meta_data.dimensions.length; i++) {
				var dim = meta_data.dimensions[i];
				if (dim.key === ad) {
					relevant_dim = dim;
					break;
				}
			}
			if (relevant_dim) {
				drawSeries(redmarker_data, bluemarker_data, relevant_dim.members);
			}
		}
	};

	function drawSeries(aSeries1, aSeries2, aMembers) {
		var iNumbersOfMarkers = Math.min(100, aMembers.length); // Limit needed as Google Geocoder has a load limit
		
		for (var i = 0; i < iNumbersOfMarkers; i++) {
			var nPixels1 = 0;
			var nPixels2 = 0;
			var sMember = aMembers[i].text;
			if (aSeries1) {
				var nValue1 = aSeries1.data[i];
				nPixels1 = nValue1 / 20000;
			}
			if (aSeries2) {
				var nValue2 = aSeries2.data[i];
				nPixels2 = nValue2 / 20000;
			}
			drawMarker(sMember, nPixels1, nPixels2, i);				
		}
	}
	
	function drawMarker(city, nPixels1, nPixels2, i) {
		setTimeout(function() { // Slowing down usage of Google Geocoder allows more markers to be shown
			that.geocoder.geocode({
				'address': city
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (nPixels1) {
						var sPath1 = 'm 0,0 l0,' + (-nPixels1) + 'l5,0, l0,' + nPixels1 + '  z';
						var marker1 = new google.maps.Marker({
							map: that.map,
							position: results[0].geometry.location,
							icon: {
								path: sPath1,
								scale: 1,
								strokeColor: 'red',
								fillColor: 'red',
								fillOpacity: 0.5
							}
						});
					}
					if (nPixels2) {
						var sPath2 = 'm 0,0 l0,' + (-nPixels2) + 'l5,0, l0,' + nPixels2 + '  z';
						var marker2 = new google.maps.Marker({
							map: that.map,
							position: results[0].geometry.location,
							icon: {
								anchor: new google.maps.Point(2, -2),
								path: sPath2,
								scale: 1,
								strokeColor: 'blue',
								fillColor: 'blue',
								fillOpacity: 0.5
							}
						});
					}
				} else {
					// alert("Geocode failed for the following reason: " + status);
				}
			});
		}, i * 700);
	}
	
	// property setter/getter functions	
	
	this.metadata = function(value) {
		if (value === undefined) {
			return meta_data;
		} else {
			meta_data = value;
			return this;
		}
	};

	this.redmarker = function(value) {
		if (value === undefined) {
			return redmarker_data;
		} else {
			redmarker_data = value;
			return this;
		}
	};

	this.bluemarker = function(value) {
		if (value === undefined) {
			return bluemarker_data;
		} else {
			bluemarker_data = value;
			return this;
		}
	};

	this.addressdimension = function(value) {
		if (value === undefined) {
			return ad;
		} else {
			ad = value;
			return this;
		}
	};
});

sap.designstudio.sdk.Component.subclass("com.ar.sample.maps.Leaflet", function() {
	var that = this;
	
	this.init = function() {
		var geojson;
		var map = L.map(this.$()[0]).setView([51.05, -114.09], 18);
		
		//Leaflet ui helpers
		function highlightFeature(e) {
		    var layer = e.target;
		    layer.setStyle({
		        weight: 3,
		        color: 'white',
		        dashArray: '',
		        fillOpacity: 0.6
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }
		}
		
		function resetHighlight(e) {
		    geojson.resetStyle(e.target);
		}
		
		function zoomToFeature(e) {
		    map.fitBounds(e.target.getBounds());
		}
		
		function onEachFeature(feature, layer) {
		    layer.openPopup("<b>" + feature.properties.NAME + "</b>");
			layer.on({
		        mouseover: highlightFeature,
		        mouseout: resetHighlight,
		        click: zoomToFeature
		    });
			
		}
		
		function style(feature) {
		    return {
		        fillColor: getColor(fooValues(feature.properties.NAME)),
		        weight: 2,
		        opacity: 1,
		        color: 'white',
		        dashArray: '3',
		        fillOpacity: 0.6
		    };
		}
		
		function fooValues(feature) {
			return Math.floor((Math.random() * 1000) + 1);

		}
		
		function getColor(d) {
		    return d > 1000 ? '#800026' :
		           d > 500  ? '#BD0026' :
		           d > 200  ? '#E31A1C' :
		           d > 100  ? '#FC4E2A' :
		           d > 50   ? '#FD8D3C' :
		           d > 20   ? '#FEB24C' :
		           d > 10   ? '#FED976' :
		                      '#FFEDA0';
		}

		//Overlay maps
		//GeoJSON
		geojson = L.geoJson(world_data, {
		    style: style,
		    onEachFeature: onEachFeature
		}).addTo(map);
		
		//Markers
		var stations = {"station":[		                              
		                              {"address":"102, 26230 Township Road 531A	Acheson, Alberta", "latlng":"51.2859656", "lng":"-113.998274"},
		                              {"address":"190 East Lake Crescent NE	Airdrie, Alberta", "latlng":"51.2997026", "lng":"-114.0041252"},
		                              {"address":"217 Edmonton Trail NE,	Airdrie, Alberta", "latlng":"50.5828504", "lng":"-111.8971288"},
		                              {"address":"203-2 Street West	Brooks, Alberta", "latlng":"51.0214679", "lng":"-114.1410271"},
		                              {"address":"4646 37 Street SW,	Calgary, Alberta", "latlng":"51.0240963", "lng":"-114.11892"},
		                              {"address":"2235 33 Avenue SW,	Calgary, Alberta", "latlng":"51.0476924", "lng":"-114.0715294"},
		                              {"address":"1920 4 Street SW,	Calgary, Alberta", "latlng":"51.0872975", "lng":"-114.2256313"},
		                              {"address":"1320 16 Avenue NW	Calgary, Alberta", "latlng":"51.0190525", "lng":"-113.9766934"},
		                              {"address":"15 Erin Woods Blvd. SE	Calgary, Alberta", "latlng":"50.9273389", "lng":"-114.0707495"},
		                              {"address":"9288 MacLeod Trail S	Calgary, Alberta", "latlng":"51.0902507", "lng":"-114.1597545"},
		                              {"address":"4624 Valiant Drive NW	Calgary, Alberta", "latlng":"51.033162", "lng":"-113.9815888"},
		                              {"address":"120 36 Street SE,	Calgary, Alberta", "latlng":"50.9278518", "lng":"-114.0274869"},
		                              {"address":"1120 137 Avenue SE,	Calgary, Alberta", "latlng":"51.1106754", "lng":"-113.9652086"},
		                              {"address":"520 64 Avenue NE,	Calgary, Alberta", "latlng":"51.0665767", "lng":"-113.9818602"},
		                              {"address":"2655 36 Street NE,	Calgary, Alberta", "latlng":"51.1256476", "lng":"-114.1670159"},
		                              {"address":"407 Hawkwood Blvd. NW	Calgary, Alberta", "latlng":"51.0464834", "lng":"-114.1811817"},
		                              {"address":"1010 Strathcona Drive SW	Calgary, Alberta", "latlng":"51.0013791", "lng":"-114.0599991"},
		                              {"address":"336 58 Avenue SE	Calgary, Alberta", "latlng":"51.0013791", "lng":"-114.0599991"},
		                              {"address":"100 Crowfoot Way NW,	Calgary, Alberta", "latlng":"51.1243012", "lng":"-114.2036884"},
		                              {"address":"630 1 Ave. N.E.	Calgary, Alberta", "latlng":"51.0532637", "lng":"-114.050927"},
		                              {"address":"177 Country Hills Blvd. NW,	Calgary, Alberta", "latlng":"51.1474592", "lng":"-114.0780453"},
		                              {"address":"5505 Signal Hill Centre SW,	Calgary, Alberta", "latlng":"51.0196714", "lng":"-114.166914"},
		                              {"address":"11 Sunpark Drive SE,	Calgary, Alberta", "latlng":"50.9000477", "lng":"-114.0550881"},

		                          ]};

		
		var littleton = L.marker([39.61, -105.02]).bindPopup('This is Littleton, CO.'),
	    denver    = L.marker([39.74, -104.99]).bindPopup('This is Denver, CO.'),
	    aurora    = L.marker([39.73, -104.8]).bindPopup('This is Aurora, CO.');
		
		var cities = L.layerGroup([littleton, denver, aurora]);
		var marker = [];
		marker[0] = L.marker([stations.station[0].latlng, stations.station[0].lng]).addTo(map);

		for(i=0; i < stations.station.length; i++) {
			//alert(stations.station[i].address);
			marker[i] = L.marker([stations.station[i].latlng, stations.station[i].lng]).addTo(map);

		}
		
		
		

		//Tile maps
		var grayscale = L.tileLayer('http://{s}.tiles.mapbox.com/v3/aralko.j9kf8hc3/{z}/{x}/{y}.png', {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		});
		
		var standard = L.tileLayer('http://{s}.tiles.mapbox.com/v3/aralko.j9faoh2c/{z}/{x}/{y}.png', {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		    maxZoom: 18,
		    center: [39.73, -104.99],
		    layers: [grayscale, cities]
		});
		
		standard.addTo(map);
		

		//Layer controls
		var baseMaps = {
			    "Grayscale": grayscale,
			    "Default": standard
		};
		
		var overlayMaps = {
			    "Cities": cities,
			    "Canada GeoJSON": geojson
			};	  
			    			  
		
		                          
		L.control.layers(baseMaps, overlayMaps).addTo(map);
		//var marker = L.marker([51.05, -114.09]).addTo(map);
		//marker.bindPopup("<b>Calgary, AB</b>");
				
	};
	
	
	this.afterUpdate = function() {
		
	};
});