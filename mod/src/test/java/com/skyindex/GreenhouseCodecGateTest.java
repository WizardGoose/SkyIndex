package com.skyindex;

import com.skyindex.data.GreenhouseBoard;
import com.skyindex.data.GreenhouseCell;
import com.skyindex.data.IslandSnapshot;
import com.skyindex.export.BinaryCodec;
import com.skyindex.export.CompactCodec;
import com.skyindex.export.ExportCodec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pins the greenhouse into the binary clipboard contract. */
class GreenhouseCodecGateTest {

    private static IslandSnapshot withGreenhouse() {
        return Fixtures.snapshot().greenhouse(new GreenhouseBoard(Fixtures.TS, 10, 10, List.of(
                GreenhouseCell.crop(0, 3, "PUMPKIN").withNextStageAt(Fixtures.TS + 30_000),
                GreenhouseCell.mutation(1, 3, "CHOCONUT"))));
    }

    @Test
    @DisplayName("binary v2 carries the complete greenhouse without changing its semantics")
    void binaryCarriesGreenhouse() {
        IslandSnapshot original = withGreenhouse();
        IslandSnapshot back = BinaryCodec.decodeCode(BinaryCodec.encodeCode(original));
        assertEquals(original.toMinifiedJson(), back.toMinifiedJson());
        assertNotNull(back.greenhouse());
        assertEquals(2, back.greenhouse().cellCount());
        assertEquals(Fixtures.TS + 30_000, back.greenhouse().cells().get(0).nextStageAt());
        assertEquals("CHOCONUT", back.greenhouse().cells().get(1).mutation());
    }

    @Test
    @DisplayName("emission selects the shorter complete representation")
    void emissionSelectsShortestLosslessCode() {
        IslandSnapshot snapshot = withGreenhouse();
        String binary = BinaryCodec.encodeCode(snapshot);
        String json = ExportCodec.encode(snapshot.toMinifiedJson());
        String emitted = BinaryCodec.shortestCode(snapshot);
        assertEquals(Math.min(binary.length(), json.length()), emitted.length());
        assertTrue(emitted.equals(binary) || emitted.equals(json));
    }
}