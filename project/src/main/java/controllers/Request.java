package controllers;

/**
 * Contain sever POJO classes for use with the GSON parser which enable parsing
 * of API requests.
 */
class Request {

    private Request() {
    }

    /**
     * Sent by the client when they log in via Google
     */
    static class LoginRequest {
	String id;
    }

    /**
     * Parses user-posted coordinates
     */
    static class PositionRequest {
	double lat;
	double lng;
    }

    /**
     * Parses booking creation requests from clients
     */
    static class BookingRequest {
	String timestamp;
	String registration;
	int duration;
    }

    /**
     * Parses Order creation requests from clients
     */
    static class OrderRequest {
	String timestamp;
	String store_id;
	int duration;
	String item;
    }

    /**
     * Adds a customerId field to {@link BookingRequest} for admin editing of
     * bookings
     */
    static class EditBookingRequest extends BookingRequest {
	String customerId;
    }

    /**
     * Parses requests for setting vehicle active status
     */
    static class VehicleStatusRequest {
	String registration;
	String status;
    }

    /**
     * Parses vehicle creation requests
     */
    static class VehicleRequest {
	String registration;
	String make;
	String model;
	int year;
	String colour;
	PositionRequest position;
	String status;
	String type;
    }

    static class EditVehicleRequest {
	String registration;
	String make;
	String model;
	int year;
	String colour;
	String status;
    }

    static class UserRequest {
	String email;
    }

    /**
     * Parses extend booking
     */
    static class ExtendBookingRequest {
	int extraDuration;
    }

}
