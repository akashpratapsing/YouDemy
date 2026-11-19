package com.youdemy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/** Runs Flyway against a real PostgreSQL when Docker is available; otherwise skipped. */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class PostgresMigrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("youdemy_test")
            .withUsername("youdemy")
            .withPassword("youdemy");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("app.jwt.secret", () -> "test-secret-key-for-youdemy-tests-that-is-long-enough-123456");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywayCreatesAllRequiredTables() {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*) from information_schema.tables
                where table_schema = 'public'
                  and table_name in ('users', 'playlists', 'videos', 'user_playlists',
                                     'user_video_progress', 'notes')
                """, Integer.class);
        assertThat(count).isEqualTo(6);

        Integer noteVersionColumns = jdbcTemplate.queryForObject("""
                select count(*) from information_schema.columns
                where table_name = 'notes' and column_name = 'version'
                """, Integer.class);
        assertThat(noteVersionColumns).isEqualTo(1);
    }
}
