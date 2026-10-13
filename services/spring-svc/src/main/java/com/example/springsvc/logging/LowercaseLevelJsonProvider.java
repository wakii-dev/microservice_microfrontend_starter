package com.example.springsvc.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import com.fasterxml.jackson.core.JsonGenerator;
import net.logstash.logback.composite.AbstractFieldJsonProvider;

import java.io.IOException;
import java.util.Locale;

/**
 * Level lowercase — platform/conventions/03 bắt buộc "info"|"warn"|...
 * (LogstashEncoder mặc định emit "INFO" uppercase).
 */
public class LowercaseLevelJsonProvider extends AbstractFieldJsonProvider<ILoggingEvent> {

    public LowercaseLevelJsonProvider() {
        setFieldName("level");
    }

    @Override
    public void writeTo(JsonGenerator generator, ILoggingEvent event) throws IOException {
        generator.writeStringField(getFieldName(), event.getLevel().toString().toLowerCase(Locale.ROOT));
    }
}
