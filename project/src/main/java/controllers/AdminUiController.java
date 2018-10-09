package controllers;

import static spark.Spark.before;
import static spark.Spark.get;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AdminUiController {

    public AdminUiController(String mapsApiKey, String googleClientId) {

	// create model with API keys
	Map<String, Object> model = new HashMap<>();
	model.put("mapsApiKey", mapsApiKey);
	model.put("googleClientId", googleClientId);

	final Logger logger = LoggerFactory.getLogger(AdminUiController.class);

	before("/*", (req, res) -> logger.info("Client API Request: " + req.uri()));

	get("/", (req, res) -> {
	    logger.info("Serving admin dashboard");
	    return util.Util.render(model, "admin");
	});
    }

}
