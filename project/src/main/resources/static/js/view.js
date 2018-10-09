// contains JS blueprints for dynamic views
var view = (function() {
	
	function zeroPad(number) {
		if (number < 10) {
			return "0" + number;
		} else {
			return "" + number;
		}
	}
	
	function jsonToDate(timestamp) {
		// 1 is subtracted from month as JS months are 0-based
		return new Date(timestamp.date.year, timestamp.date.month - 1, timestamp.date.day, 
			timestamp.time.hour, timestamp.time.minute, timestamp.time.second);
	}
	
	function addMinutes(date, minutes) {
		// reference: https://stackoverflow.com/a/1214753/2393133
		return new Date(date.getTime() + minutes*60000);
	}
	
	function difference(date1, date2) {
		var diffHours = (date1 - date2) / 3600000
		if (diffHours > 1) {
			return Math.round(diffHours) + " Hours";
		} else {
			return Math.round(diffHours * 60) + " Minutes";
		}
	}
	
	function timeToString(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var meridian;
		if (hours <= 12) {
			meridian = "AM"
		} else {
			hours = hours - 12;
			meridian = "PM";
		}
		return "" + hours + ":" + zeroPad(minutes) + " " + meridian;
	}
	
	return {
		
		dateToString: function(d) {
			var year = d.getFullYear();
			var month = zeroPad(d.getMonth() + 1);
			var day = zeroPad(d.getDate());
			var hours = zeroPad(d.getHours());
			var minutes = zeroPad(d.getMinutes());
			var seconds = zeroPad(d.getSeconds());
			return year + "-" + month + "-" + day + " "
				+ hours + ":" + minutes + ":" + seconds;
		},
		
		jsonDateToString: function(d) {
			return d.date.day + '/' +  d.date.month + '/' + d.date.year + " " +
				d.time.hour + ":" + zeroPad(d.time.minute)
		},
		
		vehicleInfo: function(vehicle) {
			var container = document.createElement("div");
			var desc = document.createElement("h3");
			var colour = document.createElement("p");
			var rego = document.createElement("p");
			
			container.className = "vehicle-info";
			desc.innerText = vehicle.description;
			colour.innerText = "Colour: " + vehicle.colour;
			rego.innerText = "Registration: " + vehicle.registration;
			
			container.appendChild(desc);
			container.appendChild(colour);
			container.appendChild(rego);
			
			return container;
		},
		
		bookingInfo: function(booking) {
			var container = document.createElement("div");
			var remaining = document.createElement("h3");
			var end = document.createElement("p");
			
			container.className = "booking-info";
			
			var currentDate = new Date();
			var startDate = jsonToDate(booking.timestamp);
			var endDate = addMinutes(startDate, booking.duration);
			
			var remainingTime = difference(endDate, currentDate)
			var endTime = timeToString(endDate);
						
			container.className = "booking-info";
			remaining.innerText = "" + remainingTime + " Remaining";
			end.innerText = "Booked until " + endTime;
			
			container.appendChild(remaining);
			container.appendChild(end);
			
			return container;
		},
		
		nearbyVehicle: function(vehicle, callback) {
			var container = document.createElement("div");
			
			// create vehicle info
			var vehicleInfo = this.vehicleInfo(vehicle);
			
			// create book button
			var bookButtonContainer = document.createElement("div");
			var bookButton = document.createElement("button");
			var distance = document.createElement("p");
			
			container.className = "nearby-info";
			bookButtonContainer.className = "book-container";
			bookButton.innerText = "BOOK";
			distance.innerText = vehicle.distance;
			
			bookButtonContainer.appendChild(distance);
			bookButtonContainer.appendChild(bookButton);
			
			// create listener for book button
			bookButton.addEventListener('click', callback);
			
			// append to the container & return
			container.appendChild(vehicleInfo);
			container.appendChild(bookButtonContainer)
			return container;
		},
		
		bookingForm: function(vehicle) {			
			var form = document.createElement("form");
			var submit = document.createElement("button");
			
			// create dropoff fieldset
			var registration = document.createElement("input");
			var dropoff = document.createElement("fieldset");
			var dropoffLegend = document.createElement("legend");
			var dropoffTime = document.createElement("select");
			var dropoffLocation = document.createElement("input");
			
			registration.id = "registration";
			registration.type = "hidden";
			registration.value = vehicle.registration;
			
			dropoffLegend.innerText = "Drop off";
			dropoffTime.id = "dropoff-time";
			dropoffTime.name = "dropoff-time";
			dropoffLocation.id = "dropoff-location";
			dropoffLocation.name = "dropoff-location";
			dropoffLocation.placeholder = "Enter an address...";
			
			// add options to select
			options = [
				{value: 60, text: "1 Hour"},
				{value: 120, text: "2 Hours"},
				{value: 180, text: "3 Hours"},
				{value: 360, text: "6 Hours"},
				{value: 720, text: "12 Hours"},
				{value: 1440, text: "24 Hours"},
			];
			for (var i = 0; i < options.length; i++) {
				option = document.createElement("option");
				option.value = options[i].value;
				option.innerText = options[i].text;
				dropoffTime.appendChild(option);
			}
			
			// append everything to the fieldset
			dropoff.appendChild(dropoffLegend);
			dropoff.appendChild(dropoffTime);
			// dropoff.appendChild(dropoffLocation); //TODO: Temporarily removed
			
			// set up submit button
			submit.className = "confirm";
			submit.type = "submit";
			submit.innerText = "CONFIRM BOOKING";
			
			// mix it all up
			form.appendChild(registration);
			form.appendChild(dropoff);
			form.appendChild(submit);
			
			return form;
		},
		
		bookingConfirmed: function() {
			var container = document.createElement("div");
			var header = document.createElement("h3");
			var message = document.createElement("p");
			
			header.innerText = "Booking Confirmed!";
			message.innerText = "Make sure that you leave your car at the drop-off spot before the end of your rental.";
			
			container.appendChild(header);
			container.appendChild(message);
			
			return container;
		},
		
		infoWindow: function(vehicle, callback) {
			var infoContents = document.createElement("div");
			var bookBtn = document.createElement("button");
			var vehicleInfo = this.vehicleInfo(vehicle);
			
			bookBtn.className = "confirm";
			// disable button if car unavailable
			if (vehicle.status == 0) {
				bookBtn.innerText = "BOOK NOW";
				bookBtn.addEventListener("click", callback);
			} else {
				bookBtn.innerText = "NOT AVAILABLE";
				bookBtn.disabled = true;
			}
			infoContents.className = "map-info";
			infoContents.appendChild(vehicleInfo);
			infoContents.appendChild(bookBtn);
			
			return infoContents;
		},
		
		previousBooking: function(booking) {
			var container = document.createElement("div");
			var vehicleInfo = this.vehicleInfo(booking.vehicle);
			var date = document.createElement("p");
			var cost = document.createElement("p");
			
			// create date string
			
			date.innerText = this.jsonDateToString(booking.timestamp);
			cost.innerText = "$" + booking.cost.toFixed(2);
			cost.className = "cost";
			
			container.appendChild(vehicleInfo);
			container.appendChild(date);
			container.appendChild(cost);
			
			return container;
		},
		
		currentBookingInfo: function(booking) {
			var container = document.createElement("div");
			var bookingInfo = this.bookingInfo(booking);
			var vehicleInfo = this.vehicleInfo(booking.vehicle);
			
			container.appendChild(vehicleInfo);
			container.appendChild(bookingInfo);
			
			return container;
		},
		
		currentBookingButtons: function(booking, findCallback, extendCallback, endCallback) {
			var buttons = new Array();
			
			var findVehicleButton = document.createElement("button");
			var extendBookingButton = document.createElement("button");
			var endBookingButton = document.createElement("button");
			
			findVehicleButton.addEventListener("click", function(e) {
				e.preventDefault();
				findCallback(booking);
			});
			extendBookingButton.addEventListener("click", function(e) {
				e.preventDefault();
				extendCallback(booking);
			});
			endBookingButton.addEventListener("click", function(e) {
				e.preventDefault();
				endCallback(booking);
			});
			
			findVehicleButton.className = "confirm";
			extendBookingButton.className = "confirm";
			endBookingButton.className = "confirm";
			
			findVehicleButton.innerText = "FIND CAR";
			findVehicleButton.style = "margin-right: 8px"
			extendBookingButton.innerText = "EXTEND";
			extendBookingButton.style = "background-color: #4CAF50";
			endBookingButton.innerText = "END BOOKING";
			endBookingButton.style = "float: right; background-color: #F44336";
			
			buttons.push(findVehicleButton);
			buttons.push(extendBookingButton);
			buttons.push(endBookingButton);
			
			return buttons;
		},
		
		currentBooking: function(booking, findCallback, extendCallback, endCallBack) {
			var container = document.createElement("div");
			
			var info = this.currentBookingInfo(booking);
			var buttons = this.currentBookingButtons(booking, findCallback, extendCallback, endCallBack);
			
			// todo: find button doesn't work without the map, so remove it
			buttons.shift();
			// add margin to the extend button to push it right
			// TODO: do this better
			buttons[0].style.marginLeft = "calc(100% - 228px)";
			
			container.appendChild(info);
			for (var i = buttons.length - 1; i >= 0; i--) {
				container.appendChild(buttons[i]);
			}
			
			return container;
		},
		
		currentBookingCard: function(booking, findCallback, extendCallback, endCallBack) {
			var container = document.createElement("div");
			container.id = "current-booking";
			
			var header = document.createElement("h3");
			var info = this.currentBookingInfo(booking);
			var buttons = this.currentBookingButtons(booking, findCallback, extendCallback, endCallBack);
			
			header.innerText = "CURRENT BOOKING";
			
			container.appendChild(header);
			container.appendChild(info);
			
			for (var i = 0; i < buttons.length; i++) {
				container.appendChild(buttons[i]);
			}
			
			return container;
		}
		
	}
	
})();
