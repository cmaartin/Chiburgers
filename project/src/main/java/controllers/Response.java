package controllers;

import java.util.List;

import model.Location;

class Response {

    private Response() {
    }

    static class Error {
	String message;

	Error(String message) {
	    this.message = message;
	}
    }

    static class ClientIdResponse {
	String clientId;

	public ClientIdResponse(String clientId) {
	    this.clientId = clientId;
	}
    }

    static class RouteResponse {
	List<Location> route;

	public RouteResponse(List<Location> route) {
	    this.route = route;
	}
    }

}
