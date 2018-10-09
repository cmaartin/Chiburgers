import static spark.Spark.path;
import static spark.Spark.redirect;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.appengine.api.utils.SystemProperty;

import controllers.AdminApiController;
import controllers.AdminUiController;
import controllers.ApiController;
import controllers.UiController;
import spark.Spark;
import spark.servlet.SparkApplication;
import util.Config;

public class Main implements SparkApplication {

    @Override
    public void init() {

	final Logger logger = LoggerFactory.getLogger(Main.class);

	// Load configuration
	try {
	    Config.loadConfig();
	    logger.info("Loading Config");
	} catch (IOException e) {
	    logger.error("Unable to load config.");
	    System.exit(1);
	}

	logger.info("Start Application");

	// get keys from config depending on environment
	String mapsApiKey;
	String googleClientId;
	if (SystemProperty.environment.value() == SystemProperty.Environment.Value.Production) {
	    mapsApiKey = Config.get("remoteMapsApiKey");
	    googleClientId = Config.get("remoteGoogleClientId");
	} else {
	    mapsApiKey = Config.get("localMapsApiKey");
	    googleClientId = Config.get("localGoogleClientId");
	}
	// check that keys are loaded
	if (mapsApiKey == null || mapsApiKey.equals("")) {
	    logger.error("No Maps API key. Check your config.");
	    System.exit(1);
	}
	if (googleClientId == null || googleClientId.equals("")) {
	    logger.error("No Google Client ID. Check your config.");
	    System.exit(1);
	}

	/* == ROUTES == */

	// use static folder in resources for static content
	Spark.staticFiles.location("static");

	// create routes
	new UiController(mapsApiKey, googleClientId);
	path("/api", () -> new ApiController());
	path("/admin", () -> {
	    new AdminUiController(mapsApiKey, googleClientId);
	    path("/api", () -> new AdminApiController());
	});
	// fix for /admin 404
	// routes with & without trailing slash are treated as separate
	redirect.get("/admin", "/admin/");
    }

}
