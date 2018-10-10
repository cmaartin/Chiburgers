package model;

import java.time.LocalDateTime;

public class Order {

    private final int id;
    private final LocalDateTime timestamp;
    private final Restaurant restaurant;
    private final String customerId;
    private final int duration;
    private final String item;

    protected Order(int id, LocalDateTime timestamp, Restaurant restaurant, String customerId, int duration,
	    String item) {
	this.id = id;
	this.timestamp = timestamp;
	this.restaurant = restaurant;
	this.customerId = customerId;
	this.duration = duration;
	this.item = item;
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

    public String getItem() {
	return this.item;
    }

}
