package util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;

import spark.ModelAndView;
import spark.template.handlebars.HandlebarsTemplateEngine;

public class Util {
    private Util() {
	// utility class has no constructor
    }

    public static String render(Map<String, Object> model, String templateName) {
	return new HandlebarsTemplateEngine().render(new ModelAndView(model, templateName + ".hbs"));
    }

    // https://www.htmlgoodies.com/beyond/javascript/calculate-the-distance-between-two-points-in-your-web-apps.html
    // this function was taken from the website above.
    public static double distance(double lat1, double lon1, double lat2, double lon2) {
	double theta = lon1 - lon2;
	double dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2))
		+ Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
	dist = Math.acos(dist);
	dist = rad2deg(dist);
	dist = dist * 60 * 1.1515;
	dist = dist * 1.609344;
	return dist;
    }

    // This function converts decimal degrees to radians
    private static double deg2rad(double deg) {
	return (deg * Math.PI / 180.0);
    }

    // This function converts radians to decimal degrees
    private static double rad2deg(double rad) {
	return (rad * 180 / Math.PI);
    }

    /**
     * Gets the current time of the server and returns it as Melbourne time
     */
    public static LocalDateTime getCurrentTime() {
	ZonedDateTime aest = ZonedDateTime.now().withZoneSameInstant(ZoneId.of("Australia/Melbourne"));
	return aest.toLocalDateTime();
    }
}
