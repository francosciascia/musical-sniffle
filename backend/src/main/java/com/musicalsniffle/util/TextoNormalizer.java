package com.musicalsniffle.util;

/**
 * Normalización de textos de ficha (nombres, apellidos).
 */
public final class TextoNormalizer {

    private TextoNormalizer() {
    }

    /**
     * Trim + primera letra de cada palabra en mayúscula, resto en minúscula.
     * Ej: "juan CARLOS" → "Juan Carlos"
     */
    public static String capitalizarNombre(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.isEmpty()) {
            return trimmed;
        }
        StringBuilder sb = new StringBuilder(trimmed.length());
        boolean capitalizeNext = true;
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (Character.isWhitespace(c)) {
                sb.append(c);
                capitalizeNext = true;
            } else if (capitalizeNext) {
                sb.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }
}
