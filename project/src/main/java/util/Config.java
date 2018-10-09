package util;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import spark.resource.ClassPathResource;
import spark.resource.Resource;

public class Config {

    private Config() {
	// config class has no constructor
    }

    private static Properties config = null;

    public static void loadConfig() throws IOException {
	config = new Properties();
	Resource configResource = new ClassPathResource("config.properties");
	InputStream propFile = configResource.getInputStream();
	config.load(propFile);
    }

    public static String get(String key) {
	if (config != null) {
	    return config.getProperty(key);
	} else {
	    throw new RuntimeException("Config has not been loaded!");
	}
    }

}
