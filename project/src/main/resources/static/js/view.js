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
		
		restaurantInfo: function(restaurant) {
			var container = document.createElement("div");
			var desc = document.createElement("h3");
			var manager = document.createElement("p");
			var phone = document.createElement("p");
			
			container.className = "restaurant-info";
			desc.innerText = restaurant.description;
			manager.innerText = "Manager: " + restaurant.manager;
			phone.innerText = "Phone: " + restaurant.phone;
			
			
			container.appendChild(desc);
			container.appendChild(manager);
			container.appendChild(phone);
			
			return container;
		},
		
		ordersInfo: function(orders) {
			var container = document.createElement("div");
			var remaining = document.createElement("h3");
			var end = document.createElement("p");
			
			container.className = "orders-info";
			
			var currentDate = new Date();
			var startDate = jsonToDate(orders.timestamp);
			var endDate = addMinutes(startDate, orders.duration);
			
			var remainingTime = difference(endDate, currentDate)
			var endTime = timeToString(endDate);
						
			container.className = "orders-info";
			remaining.innerText = "" + remainingTime + " Remaining";
			end.innerText = "Ordered until " + endTime;
			
			container.appendChild(remaining);
			container.appendChild(end);
			
			return container;
		},
		
		nearbyVehicle: function(vehicle, callback) {
			var container = document.createElement("div");
			
			// create vehicle info
			var vehicleInfo = this.restaurantInfo(vehicle);
			
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
		
		orderForm: function(restaurant) {			
			var form = document.createElement("form");
			var submit = document.createElement("button");
			
			// create dropoff fieldset
			var store_id = document.createElement("input");
			var dropoff = document.createElement("fieldset");
			var dropoffLegend = document.createElement("legend");
			var dropoffTime = document.createElement("select");
			var dropoffLocation = document.createElement("input");
			
			store_id.id = "store_id";
			store_id.type = "hidden";
			store_id.value = restaurant.storeid;
			
			dropoffLegend.innerText = "Menu";
			dropoffTime.id = "dropoff-time";
			dropoffTime.name = "dropoff-time";
			dropoffLocation.id = "dropoff-location";
			dropoffLocation.name = "dropoff-location";
			dropoffLocation.placeholder = "Enter an address...";
			
			// add options to select
			options = [
				{value: 10, text: "Basic ChiBurg Luncheon"},
				{value: 25, text: "Grand ChiBurg Luncheon"},
				{value: 25, text: "Angus Chiburger Luncheon"},
				{value: 13, text: "Big ChiMac Burger Luncheon"},
				{value: 10, text: "Fish ChiBurger Luncheon"},
				{value: 10, text: "Happy ChiBurger Meal"},
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
			submit.innerText = "CONFIRM ORDER";
			
			// mix it all up
			form.appendChild(store_id);
			form.appendChild(dropoff);
			form.appendChild(submit);
			
			return form;
		},
		
		orderConfirmed: function() {
			var container = document.createElement("div");
			var header = document.createElement("h3");
			var message = document.createElement("p");
			
			header.innerText = "Order Confirmed!";
			message.innerText = "Make sure that you pick up your burger at the chosen restaurant.";
			
			container.appendChild(header);
			container.appendChild(message);
			
			return container;
		},
		
		infoWindow: function(restaurant, callback) {
			var infoContents = document.createElement("div");
			var bookBtn = document.createElement("button");
			var restaurantInfo = this.restaurantInfo(restaurant);
			
			bookBtn.className = "confirm";
			
			bookBtn.innerText = "ORDER NOW";
			bookBtn.addEventListener("click", callback);
			
			infoContents.className = "map-info";
			infoContents.appendChild(restaurantInfo);
			infoContents.appendChild(bookBtn);
			
			return infoContents;
		},
		
		previousOrder: function(order) {
			var container = document.createElement("div");
			var restaurantInfo = this.restaurantInfo(order.restaurant);
			var date = document.createElement("p");
			var item = document.createElement("p");
			
			// create date string
			date.innerText = this.jsonDateToString(order.timestamp);
			
			container.appendChild(restaurantInfo);
			container.appendChild(date);
			return container;
		},
		
		currentOrderInfo: function(orders) {
			var container = document.createElement("div");
			var ordersInfo = this.ordersInfo(orders);
			var restaurantInfo = this.restaurantInfo(orders.restaurant);
			
			container.appendChild(ordersInfo);
			container.appendChild(restaurantInfo);
			
			return container;
		},
		
		currentOrderButtons: function(orders, findCallback, endCallback) {
			var buttons = new Array();
			
			var findRestaurantButton = document.createElement("button");
			var endOrderButton = document.createElement("button");
			
			findRestaurantButton.addEventListener("click", function(e) {
				e.preventDefault();
				findCallback(orders);
			});
			endOrderButton.addEventListener("click", function(e) {
				e.preventDefault();
				endCallback(orders);
			});
			
			findRestaurantButton.className = "confirm";
			endOrderButton.className = "confirm";
			
			findRestaurantButton.innerText = "FIND STORE";
			findRestaurantButton.style = "margin-right: 8px"
			endOrderButton.innerText = "END ORDER";
			endOrderButton.style = "float: right; background-color: #F44336";
			
			buttons.push(findRestaurantButton);
			buttons.push(endOrderButton);
			
			return buttons;
		},
		
		currentOrders: function(orders, findCallback, endCallBack) {
			var container = document.createElement("div");
			var info = this.currentOrderInfo(orders);
			
			var buttons = this.currentOrderButtons(orders, findCallback, endCallBack);
			
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
		
		currentOrderCard: function(order, findCallback, endCallBack) {
			var container = document.createElement("div");
			container.id = "current-order";
			
			var header = document.createElement("h3");
			var info = this.currentOrderInfo(order);
			var buttons = this.currentOrderButtons(order, findCallback, endCallBack);
			
			header.innerText = "CURRENT ORDER";
			
			container.appendChild(header);
			container.appendChild(info);
			
			for (var i = 0; i < buttons.length; i++) {
				container.appendChild(buttons[i]);
			}
			
			
			return container;
		},
		
		payment: function() {
			var container = document.createElement("div");
			
			var description = document.createElement("p");
			description.innerText = "Pay for your booking using the button below.";
			
			var paypalButton = document.createElement("div");
			paypalButton.id = "paypal-button-container";
			
			container.appendChild(description);
			container.appendChild(paypalButton);
			
			return container;
		},
		
		paymentConfirmation(success) {
			var container = document.createElement("div");
			
			var description = document.createElement("p");
			if (success) {
				description.innerText = "Payment successful!";
			} else {
				description.innerText = "Payment failed. Please contact an administrator.";
			}
			
			container.appendChild(description);
			
			return container;
		}
		
	}
	
})();
