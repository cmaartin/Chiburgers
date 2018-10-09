var adminRequests = (function() {
	
	var endpoint = "/admin/api";
	
	// Creates a fetch promise for a get request at the given route
	function get(route) {
		var request = new Request(endpoint + route);
		return fetch(request);
	}
	
	// create a fetch promise for a post request at the given route
	// with the provided body
	function post(route, body) {
		var headers = new Headers();
		headers.append("Content-Type", "application/json");
		var request = new Request(endpoint + route, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(body)
		});
		return fetch(request);
	}
	
	// create a fetch promise for a put request at the given route
	// with the provided body
	function put(route, body) {
		var headers = new Headers();
		headers.append("Content-Type", "application/json");
		var request = new Request(endpoint + route, {
			method: "PUT",
			headers: headers,
			body: JSON.stringify(body)
		});
		return fetch(request);
	}
	
	return {
		
		getClientIdFromEmail: function(email, callback) {
			post("/user", { email: email })
			.then(res => res.json())
			.then(json => {
				callback(json.clientId);
			});
		},
		
		getBookingsForUser: function(clientId, callback) {
			get("/bookings/" + clientId)
			.then(res => res.json())
			.then(bookings => callback(bookings));
		},
		
		getBookingRoute: function(bookingId, callback) {
			get("/bookings/" + bookingId + "/route")
			.then(res => res.json())
			.then(json => callback(json.route));
		},
		
		createVehicle: function(vehicle, callback) {
			post("/vehicles", vehicle)
			.then(res => {
				if (res.ok) {
					callback(true);
				} else {
					callback(false);
				}
			});
		},
		
		updateVehicle: function(vehicle, callback) {
			put("/vehicles", vehicle)
			.then(res => {
				if (res.ok) {
					callback(true);
				} else {
					callback(false);
				}
			});
		},
		
		getRates: function(callback) {
			get("/rates")
			.then(res => res.json())
			.then(rates => callback(rates));
		},
		
		setRates: function(newRates, callback) {
			console.log("Setting rates to", newRates);
			post("/rates", newRates)
			.then(res => {
				if (res.ok) {
					callback(true);
				} else {
					callback(false);
				}
			});
		}
		
	}
	
})();


var adminView = (function() {
	
	return {
		
		// creates a menu using the passed in list of buttons
		menu: function(items) {
			var menu = document.createElement("ul");
			menu.className = "menu";
			// add list elements for each item
			for (var i = 0; i < items.length; i++) {
				var li = document.createElement("li");
				li.appendChild(items[i]);
				menu.appendChild(li);
			}
			return menu;
		},
		
		console: function(addVehicleCallback, manageUserCallback, editRatesCallback) {
			var container = document.createElement("div");
			var addVehicleBtn = document.createElement("button");
			var manageUserBtn = document.createElement("button");
			var editRatesBtn = document.createElement("button");
			var hint = document.createElement("p");
			
			hint.innerText = "Tip: Click on a vehicle to view details about it";
			hint.className = "hint";
			
			addVehicleBtn.innerText = "Add New Vehicle";
			addVehicleBtn.addEventListener('click', addVehicleCallback);
			manageUserBtn.innerText = "Manage User";
			manageUserBtn.addEventListener('click', manageUserCallback);
			editRatesBtn.innerText = "Edit Rates";
			editRatesBtn.addEventListener('click', editRatesCallback);
			
			var adminMenu = this.menu([addVehicleBtn, manageUserBtn, editRatesBtn]);
			
			container.appendChild(adminMenu);
			container.appendChild(hint);
			
			return container;
		},
		
		vehicleForm: function(vehicle, saveCallback) {
			var form = document.createElement("form");
			form.id = "vehicle-form";
			
			// vehicle details fieldset
			var details = document.createElement("fieldset");
			var detailsLegend = document.createElement("legend");
			detailsLegend.innerText = "Vehicle Details";
			details.appendChild(detailsLegend);
			// vehicle status fieldset
			var status = document.createElement("fieldset");
			var statusLegend = document.createElement("legend");
			statusLegend.innerText = "Current Status";
			status.appendChild(statusLegend);
			
			var rego = document.createElement("input");
			rego.id = "registration";
			rego.placeholder = "Registration";
			var year = document.createElement("input");
			year.placeholder = "Year";
			var make = document.createElement("input");
			make.placeholder = "Make";
			var model = document.createElement("input");
			model.placeholder = "Model";
			var colour = document.createElement("input");
			colour.placeholder = "Colour";
			
			details.appendChild(rego);
			details.appendChild(year);
			details.appendChild(make);
			details.appendChild(model);
			details.appendChild(colour);
			
			// only show current location fields for new vehicle
			if (vehicle == null) {
				var lat = document.createElement("input");
				lat.placeholder = "Latitude";
				var lng = document.createElement("input");
				lng.placeholder = "Longitude";
				
				status.appendChild(lat);
				status.appendChild(lng);
			}
			var statusSelect = document.createElement("select");
			status.appendChild(statusSelect);
			
			// add options to availability selector
			var options = ["Active", "Inactive", "Retired"];
			for (var i = 0; i < options.length; i++) {
				var option = document.createElement("option");
				option.innerText = options[i];
				option.value = options[i].toLowerCase();
				// select first option by default
				if (i == 0) options.selected = true;
				statusSelect.appendChild(option);
			}
			
			var submit = document.createElement("button");
			submit.innerText = "SAVE VEHICLE";
			submit.className = "confirm";
			submit.type = "submit";
			
			form.appendChild(details);
			form.appendChild(status);
			form.appendChild(submit);
			
			// submission listener
			// creates the vehicle object from the form fields
			submit.addEventListener("click", function(e) {
				e.preventDefault();
				
				var formVehicle = {
					registration: rego.value,
					make: make.value,
					model: model.value,
					year: parseInt(year.value),
					colour: colour.value,
					status: statusSelect.value,
					type: "tier 1"
				}
				
				// only read position fields of new vehicle
				if (vehicle == null) {
					formVehicle["position"] = {
						lat: parseFloat(lat.value),
						lng: parseFloat(lng.value)
					}
				}
				
				saveCallback(formVehicle);
			});
			
			// populate fields if vehicle was given
			if (vehicle != null) {
				rego.value = vehicle.registration;
				make.value = vehicle.make;
				model.value = vehicle.model;
				year.value = vehicle.year;
				colour.value = vehicle.colour;
				statusSelect.selectedIndex = vehicle.status;
			}
			
			return form;
		},
		
		manageUserForm: function(requestCallback) {
			var form = document.createElement("form");
			form.className = "searchbox";
						
			var email = document.createElement("input");
			email.id = "email";
			email.type = "email";
			email.placeholder = "Email Address";
			
			form.appendChild(email);
			
			var searchIcon = document.createElement("i");
			searchIcon.innerText = "search";
			searchIcon.className = "material-icons";
			
			var search = document.createElement("button");
			search.addEventListener("click", function(e) {
				e.preventDefault();
				requestCallback();
			});
			search.type = "submit";
			search.appendChild(searchIcon);
			
			form.appendChild(search);
			
			return form;
		},
		
		bookingList: function(bookings, viewCallback) {
			console.log(bookings);
			if (bookings.length == 0) {
				var p = document.createElement("p");
				p.className = "hint";
				p.innerText = "No bookings found for this user";
				return p;
			} else {
				var bookingBtns = new Array(bookings.length);
				for (var i = 0; i < bookings.length; i++) {
					// closure prevents incorrect listener values
					(function() {
						var booking = bookings[i]
						bookingBtns[i] = document.createElement("button");
						bookingBtns[i].addEventListener("click", function() {
							viewCallback(booking);
						});
						bookingBtns[i].innerText = view.jsonDateToString(booking.timestamp) + " (" + booking.vehicle.registration + ")";
					})();
				}
				var menu = adminView.menu(bookingBtns);
				var heading = document.createElement("h3");
				heading.innerText = "Past Bookings";
				return menu;
			}
		},
		
		editRatesForm: function(rates, callback) {
			var form = document.createElement("form");
			var submit = document.createElement("button");
			
			console.log(rates);
			
			var hint = document.createElement("p");
			hint.className = "hint";
			hint.innerText = "Update the per-minute rate of each vehicle tier";
			
			// create rate fields
			var ratesTable = document.createElement("div")
			ratesTable.className = "ratesTable";
			
			// keep track of rate inputs
			var rateInputs = new Map();
			
			for (var rate in rates) {
				if (rates.hasOwnProperty(rate)) {
					// create single row
					var row = document.createElement("div");
					var label = document.createElement("label");
					label.innerText = rate + " ($/min)";
					var input = document.createElement("input");
					input.type = "number";
					input.required = true;
					input.name = rate;
					input.min = 0;
					input.step = 0.01;
					
					// set value
					input.value = rates[rate];
					
					row.appendChild(label);
					row.appendChild(input);
					
					ratesTable.appendChild(row);
					
					// add this input to the inputs map
					rateInputs.set(rate, input);
				}
			}
			
			submit.type = "submit";
			submit.className = "confirm";
			submit.innerText = "Update";
			submit.addEventListener('click', function(e) {
				e.preventDefault();
				// get rates from inputs
				var newRates = {};
				for (var [tier, rateInput] of rateInputs) {
					newRates[tier] = parseFloat(rateInput.value);
				}
				callback(newRates);
			});
			
			form.appendChild(hint);
			form.appendChild(ratesTable);
			form.appendChild(submit);
			
			return form;
		}
		
	}
	
})();


// keeps track of the path currently drawn on the map
var currentRoute = null;


function mainMenu() {
	sidepane.clear();
	sidepane.appendHeader("ADMIN CONSOLE");
	sidepane.append(adminView.console(addVehicle, manageUser, editRates))
}

function addVehicle() {
	sidepane.clear();
	sidepane.appendHeader("ADD VEHICLE", function() {
		mainMenu();
	});
	sidepane.append(adminView.vehicleForm(null, function(vehicle) {
		console.log("Creating vehicle", vehicle);
		adminRequests.createVehicle(vehicle, function(success) {
			if (success) {
				alert("Vehicle created.");
				rebu.getVehicles(displayVehicles);
			} else {
				alert("Vehicle was not created");
			}
		});
	}));
}

function editVehicle(vehicle) {
	sidepane.clear();
	sidepane.appendHeader("EDIT VEHICLE", function() {
		mainMenu();
	});
	sidepane.append(adminView.vehicleForm(vehicle, function(vehicle) {
		console.log("Updating vehicle", vehicle);
		adminRequests.updateVehicle(vehicle, function(success) {
			if (success) {
				alert("Vehicle updated.");
				rebu.getVehicles(displayVehicles);
			} else {
				alert("Vehicle was not updated.");
			}
		});
	}));
}

function clientIdFromEmail(email) {
	return new Promise(resolve => {
		adminRequests.getClientIdFromEmail(email, function(clientId) {
			resolve(clientId);
		});
	});
}

function manageUser() {
	sidepane.clear();
	sidepane.appendHeader("MANAGE USER", function() {
		mainMenu();
	});
	sidepane.append(adminView.manageUserForm(function() {
		clientIdFromEmail(document.getElementById("email").value)
		.then(clientId => {
			adminRequests.getBookingsForUser(clientId, function(bookings) {
				sidepane.clear();
				sidepane.appendHeader("MANAGE USER", function() {
					hideRoute();
					manageUser();
				});
				sidepane.append(adminView.bookingList(bookings, displayRoute));
				var hint = document.createElement("p");
				hint.className = "hint";
				hint.innerText = "Tip: Click on a booking to view it's route";
				sidepane.append(hint);
			});
		});
	}));
}

function displayRoute(booking) {
	console.log(booking);
	adminRequests.getBookingRoute(booking.id, function(route) {
		// remove old route if present
		hideRoute()
		// draw the route
		if (route.length > 0) {
			currentRoute = {};
			currentRoute.line = new google.maps.Polyline({
				path: route,
				geodesic: true,
				map: map
			});
			
			// start / end markers
			currentRoute.start = new google.maps.InfoWindow({
				position: route[0],
				content: "Start",
				map: map
			});
			currentRoute.end = new google.maps.InfoWindow({
				position: route[route.length - 1],
				content: "End",
				map: map
			});
			
			// pan to the route
			var bounds = new google.maps.LatLngBounds();
			for (var i = 0; i < route.length; i++) {
				bounds.extend(route[i]);
			}
			map.fitBounds(bounds);
		} else {
			console.log("No route information for this booking");
		}
	});
}

function hideRoute() {
	if (currentRoute != null) {
		currentRoute.line.setMap(null);
		currentRoute.start.setMap(null);
		currentRoute.end.setMap(null);
		currentRoute = null;
	}
}

function editRates() {
	sidepane.clear();
	sidepane.appendHeader("EDIT RATES", function() {
		mainMenu();
	});
	// get current rates
	adminRequests.getRates(function(rates) {
		// create the rates form
		sidepane.append(adminView.editRatesForm(rates, function(newRates) {
			// callback on rates set by user
			adminRequests.setRates(newRates, function(success) {
				if (success) {
					alert("Vehicle rates have been set");
					mainMenu();
				} else {
					alert("Couldn't set vehicle rates");
				}
			});
		}));
	});
}

// set admin status
rebu.setAdmin(true);
mainMenu();
