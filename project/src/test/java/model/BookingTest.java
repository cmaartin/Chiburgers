package model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class BookingTest {

    private Booking booking;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() throws Exception {
	this.booking = new Booking(1, LocalDateTime.of(2018, 8, 23, 18, 30), this.vehicle, "123", 2, new Position(1, 1),
		0);
    }

    // test to make sure booking is added properly
    @Test
    void testId() {
	int id = 1;
	assertEquals(id, this.booking.getId());
    }

    @Test
    void testTimestamp() {
	LocalDateTime timestamp = LocalDateTime.of(2018, 8, 23, 18, 30);
	assertEquals(timestamp, this.booking.getTimestamp());
    }

    @Test
    void testCustId() {
	String expected = "123";
	assertEquals(expected, this.booking.getCustomerId());
    }

}
