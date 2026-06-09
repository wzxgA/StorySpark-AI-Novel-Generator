package com.storyspark;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class StorySparkApplication {

    public static void main(String[] args) {
        SpringApplication.run(StorySparkApplication.class, args);
    }
}
