package com.youdemy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(properties = "spring.config.import=optional:file:src/test/resources/fake-env.properties")
class EnvFileImportTest {

    @Autowired
    private Environment environment;

    @Test
    void loadsYouTubeKeyFromEnvFile() {
        assertThat(environment.getProperty("YOUTUBE_API_KEY")).isEqualTo("fake-key-for-config-import-test");
    }
}
