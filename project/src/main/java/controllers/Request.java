package controllers;

/**
 * Contain sever POJO classes for use with the GSON parser which enable parsing
 * of API requests.
 */
class Request {

    private Request() {
    }

    static class LocationRequest {
	double lat;
	double lng;
    }

    static class OrderRequest {
	String timestamp;
	String store_id;
	int duration;
	String item;
    }

    static class LoginRequest {
	String id;
    }

}
