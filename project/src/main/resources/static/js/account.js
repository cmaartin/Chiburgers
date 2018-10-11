document.addEventListener("login", function() {
	//get current booking
	rebu.getCurrentBooking(function(orders) {
		var currentDiv = document.getElementById("cur-orders");
		currentDiv.appendChild(view.currentOrders(orders, findBookedVehicle, endOrder));
		
	});
	// get past bookings
	var user = googleUser.getBasicProfile().getEmail()
	rebu.getOrders(user, function(orders) {
		console.log(orders);
		var ordersDiv = document.getElementById("prev-orders");
		for (var i = 0; i <orders.length ; i++) {
			// TODO: server may need to send this as a seperate field
			
			orders[i].restaurant.description = orders[i].restaurant.storename;
			ordersDiv.appendChild(view.previousOrder(orders[i]));
			
		}
	});
});
