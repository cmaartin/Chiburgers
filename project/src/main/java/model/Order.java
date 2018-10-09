package model;

import java.time.LocalDateTime;

public class Order {

    private final int id;
    private final LocalDateTime timestamp;
    private final Restaurant restaurant;
    private final String customerId;
    private final int duration;
    private final double cost;

    protected Order(int id, LocalDateTime timestamp, Restaurant restaurant, String customerId, int duration,
	    double cost) {
	this.id = id;
	this.timestamp = timestamp;
	this.restaurant = restaurant;
	this.customerId = customerId;
	this.duration = duration;
	this.cost = cost;
    }

    public int getId() {
	return this.id;
    }

    public LocalDateTime getTimestamp() {
	return this.timestamp;
    }

    public Restaurant getRestaurant() {
	return this.restaurant;
    }

    public String getCustomerId() {
	return this.customerId;
    }

    public int getDuration() {
	return this.duration;
    }

    public double getCost() {
	return this.cost;
    }

}
