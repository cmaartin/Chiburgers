package controllers;

import java.util.List;

import model.Position;

class Response {

    private Response() {
    }

    static class ErrorResponse {
	String message;

	ErrorResponse(String message) {
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
	List<Position> route;

	public RouteResponse(List<Position> route) {
	    this.route = route;
	}
    }

}
