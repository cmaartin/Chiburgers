package controllers;

import static spark.Spark.before;
import static spark.Spark.delete;
import static spark.Spark.get;
import static spark.Spark.halt;
import static spark.Spark.path;
import static spark.Spark.post;
import static spark.Spark.put;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;

import controllers.Request.EditBookingRequest;
import controllers.Request.EditVehicleRequest;
import controllers.Request.UserRequest;
import controllers.Request.VehicleRequest;
import controllers.Request.VehicleStatusRequest;
import controllers.Response.ClientIdResponse;
import controllers.Response.ErrorResponse;
import controllers.Response.RouteResponse;
import model.Booking;
import model.Database;
import model.Position;
import model.Vehicle;

/**
 * Contains routes to be used by the administrator front-end for managing the
 * system.
 */
public class AdminApiController {

    public AdminApiController() {

	final Logger logger = LoggerFactory.getLogger(AdminApiController.class);

	// authenticate admin users
	before("/*", (req, res) -> {
	    logger.info("Admin API Request: " + req.uri());
	    if (req.session(false) == null) {
		logger.info("User is not logged in");
		halt(401);
	    }
	    boolean isAdmin = req.session().attribute("isAdmin");
	    if (!isAdmin) {
		logger.info("User is NOT an administrator");
		halt(403);
	    }
	    logger.info("User is an administrator");
	});

	// create a new vehicle
	post("/vehicles", (req, res) -> {
	    res.type("application/json");

	    Position pos;
	    VehicleRequest vr;
	    int status = 2;
	    try {
		vr = new Gson().fromJson(req.body(), VehicleRequest.class);
		pos = new Position(vr.position.lat, vr.position.lng);
		if (vr.status.equals("active")) {
		    status = 0;
		} else if (vr.status.equals("inactive")) {
		    status = 1;
		} else if (vr.status.equals("retired")) {
		    status = 2;
		} else {
		    res.status(400);
		    return new Gson().toJson(new ErrorResponse("Bad Request - Vehicle Creation Error"));
		}
	    } catch (JsonParseException | NullPointerException e) {
		logger.error("Error inserting vehicle", e);
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }
	    logger.info("Inserting a car with rego: " + vr.registration);

	    Database db = new Database();
	    Vehicle inserted_vehicle = db.insertVehicle(vr.registration, vr.make, vr.model, vr.year, vr.colour, pos,
		    status, vr.type);
	    db.close();

	    if (inserted_vehicle != null) {
		logger.info("Inserted successfully!");
		return new Gson().toJson(inserted_vehicle);
	    } else {
		logger.info("Clould not insert vehicle");
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Vehicle was not created"));
	    }
	});

	// set the status of a particular vehicle
	// inactive vehicles can't be booked by clients
	post("/vehicle/status", (req, res) -> {
	    res.type("application/json");

	    VehicleStatusRequest var;
	    int status = 2;
	    try {
		var = new Gson().fromJson(req.body(), VehicleStatusRequest.class);
		if (var.status.equals("active")) {
		    status = 0;
		} else if (var.status.equals("inactive")) {
		    status = 1;
		} else if (var.status.equals("retired")) {
		    status = 2;
		} else {
		    res.status(400);
		    return new Gson().toJson(new ErrorResponse("Bad Request"));
		}

	    } catch (JsonParseException | NullPointerException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    Database db = new Database();
	    Boolean dbResponse = db.changeVehicleStatus(var.registration, status);
	    db.close();

	    if (dbResponse) {
		res.status(200);
		logger.info("Changed availability of vehicle (" + var.registration + ")!");
		return "";
	    } else {
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request - Vehicle Status"));
	    }
	});

	// returns a list of all vehicles
	get("/vehicles/all", (req, res) -> {
	    res.type("application/json");

	    Database db = new Database();
	    List<Vehicle> vehicles = db.getVehicles();
	    db.close();

	    logger.info("Found " + vehicles.size() + " vehicles");
	    return new Gson().toJson(vehicles);
	});

	// returns a list of all bookings
	get("/bookings/all", (req, res) -> {
	    res.type("application/json");

	    Database db = new Database();
	    List<Booking> bookings = db.getBookings();
	    db.close();

	    logger.info("Found " + bookings.size() + " bookings");
	    return new Gson().toJson(bookings);
	});

	// returns a list of bookings for the given user
	get("/bookings/:id", (req, res) -> {
	    String id = req.params().get(":id");

	    Database db = new Database();
	    List<Booking> bookings = db.getBookingsOfUser(id);
	    db.close();

	    logger.info("Found " + bookings.size() + " bookings for " + id);

	    res.type("application/json");
	    return new Gson().toJson(bookings);
	});

	// delete a booking
	delete("/bookings/:id", (req, res) -> {
	    int id = Integer.parseInt(req.params(":id"));

	    Database db = new Database();
	    Boolean dbResponse = db.deleteBooking(id);
	    db.close();
	    if (dbResponse) {
		res.status(200);
		return "";
	    } else {
		res.status(400);
		res.type("application/json");
		return new Gson().toJson(new ErrorResponse("Couldn't delete booking"));
	    }
	});

	// update a booking
	put("/bookings/:id", (req, res) -> {
	    res.type("application/json");

	    LocalDateTime dateTime;
	    EditBookingRequest br;

	    int id = Integer.parseInt(req.params(":id"));

	    try {
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		br = new Gson().fromJson(req.body(), EditBookingRequest.class);
		dateTime = LocalDateTime.parse(br.timestamp, formatter);

	    } catch (JsonParseException | NullPointerException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    Database db = new Database();

	    Boolean dbResponse = db.editBooking(id, dateTime, br.registration, br.customerId, br.duration);

	    db.close();

	    if (dbResponse) {
		res.status(200);
		return "";
	    } else {
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request - Update Booking"));
	    }

	});

	// get the route of a booking
	get("/bookings/:id/route", (req, res) -> {
	    int bookingId = Integer.parseInt(req.params(":id"));
	    try (Database db = new Database()) {
		Booking booking = db.getBooking(bookingId);
		List<Position> route = db.getRouteOfVehicle(booking);

		res.type("application/json");
		return new Gson().toJson(new RouteResponse(route));
	    }
	});

	// update a vehicle
	put("/vehicles", (req, res) -> {
	    res.type("application/json");

	    EditVehicleRequest vr;
	    int status;
	    try {
		vr = new Gson().fromJson(req.body(), EditVehicleRequest.class);
		if (vr.status.equals("active")) {
		    status = 0;
		} else if (vr.status.equals("inactive")) {
		    status = 1;
		} else if (vr.status.equals("retired")) {
		    status = 2;
		} else {
		    res.status(400);
		    return new Gson().toJson(new ErrorResponse("Bad Request - Vehicle Editing Error"));
		}
	    } catch (JsonParseException | NullPointerException e) {
		logger.error("Error updating vehicle", e);
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    Database db = new Database();

	    Boolean dbResponse = db.editVehicle(vr.registration, vr.make, vr.model, vr.year, vr.colour, status);

	    db.close();

	    if (dbResponse) {
		res.status(200);
		return "";
	    } else {
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request - Edit Vehicle"));
	    }

	});

	post("/user", (req, res) -> {
	    res.type("application/json");

	    UserRequest ur = new Gson().fromJson(req.body(), UserRequest.class);

	    String email = ur.email;
	    Database db = new Database();
	    String cid = db.getCid(email);
	    db.close();

	    logger.info("Found Client ID: " + cid);
	    return new Gson().toJson(new ClientIdResponse(cid));
	});

	// rate routes
	path("/rates", () -> {

	    get("", (req, res) -> {
		try (Database db = new Database()) {
		    Map<String, Double> rates = db.getRates();
		    res.type("application/json");
		    return new Gson().toJson(rates);
		}
	    });

	    post("", (req, res) -> {
		/* @formatter:off */
		// ref: https://stackoverflow.com/a/15943171/2393133
		Type type = new TypeToken<Map<String, Double>>(){}.getType();
		Map<String, Double> rates = new Gson().fromJson(req.body(), type);
		/* @formatter:on */
		try (Database db = new Database()) {
		    if (db.setRates(rates)) {
			return "";
		    } else {
			res.status(400);
			res.type("application/json");
			return new Gson().toJson(new ErrorResponse("Couldn't set rates"));
		    }
		}
	    });

	});
    }

}
