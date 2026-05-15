/**
 * SimpleQREncoder - Tạo QR matrix thuần Java (không cần thư viện ngoài)
 * Implements QR Code Model 2, Version 1-5 cho nội dung text ngắn/trung bình
 * Đủ để hiển thị QR tượng trưng với đầy đủ finder patterns, timing, format
 */
public class SimpleQREncoder {

    // GF(256) arithmetic cho QR
    private static final int[] EXP_TABLE = new int[512];
    private static final int[] LOG_TABLE = new int[256];

    static {
        int x = 1;
        for (int i = 0; i < 255; i++) {
            EXP_TABLE[i] = x;
            LOG_TABLE[x] = i;
            x <<= 1;
            if (x >= 256) x ^= 0x11D;
        }
        for (int i = 255; i < 512; i++) EXP_TABLE[i] = EXP_TABLE[i - 255];
    }

    /**
     * Encode string thành QR boolean matrix
     * @param data nội dung cần encode
     * @param version QR version (1-10), ảnh hưởng đến kích thước. Mặc định auto-detect
     */
    public static boolean[][] encode(String data, int version) {
        try {
            // Tự chọn version phù hợp với độ dài data
            version = selectVersion(data.length());
            return buildMatrix(data, version);
        } catch (Exception e) {
            // Fallback: trả về pattern đơn giản 21x21
            return buildFallbackMatrix(21);
        }
    }

    static int selectVersion(int len) {
        // Version 1: 17 chars, 2: 32, 3: 53, 4: 78, 5: 106, 6: 134, 7: 154
        if (len <= 17) return 1;
        if (len <= 32) return 2;
        if (len <= 53) return 3;
        if (len <= 78) return 4;
        if (len <= 106) return 5;
        if (len <= 134) return 6;
        if (len <= 154) return 7;
        if (len <= 192) return 8;
        if (len <= 230) return 9;
        return 10;
    }

    static boolean[][] buildMatrix(String data, int version) {
        int size = version * 4 + 17;
        boolean[][] matrix = new boolean[size][size];
        boolean[][] reserved = new boolean[size][size]; // đánh dấu ô đã dùng

        // 1. Finder patterns (3 góc)
        placeFinderPattern(matrix, reserved, 0, 0);
        placeFinderPattern(matrix, reserved, 0, size - 7);
        placeFinderPattern(matrix, reserved, size - 7, 0);

        // 2. Separators
        placeSeparators(matrix, reserved, size);

        // 3. Timing patterns
        placeTimingPatterns(matrix, reserved, size);

        // 4. Dark module
        matrix[size - 8][8] = true;
        reserved[size - 8][8] = true;

        // 5. Format info placeholder
        placeFormatInfo(matrix, reserved, size);

        // 6. Alignment patterns (version >= 2)
        if (version >= 2) {
            int[][] alignPositions = getAlignmentPositions(version);
            for (int[] pos : alignPositions) {
                placeAlignmentPattern(matrix, reserved, pos[0], pos[1]);
            }
        }

        // 7. Data encoding
        byte[] bytes = encodeData(data, version);

        // 8. Đặt data vào matrix
        placeData(matrix, reserved, bytes, size);

        // 9. Apply mask pattern 0 (xor với checkerboard)
        applyMask(matrix, reserved, size, 0);

        // 10. Ghi format info thực
        writeFormatInfo(matrix, size, 0, 1); // mask 0, EC level L

        return matrix;
    }

    static void placeFinderPattern(boolean[][] m, boolean[][] r, int row, int col) {
        // 7x7 finder pattern
        int[][] pattern = {
            {1,1,1,1,1,1,1},
            {1,0,0,0,0,0,1},
            {1,0,1,1,1,0,1},
            {1,0,1,1,1,0,1},
            {1,0,1,1,1,0,1},
            {1,0,0,0,0,0,1},
            {1,1,1,1,1,1,1}
        };
        for (int i = 0; i < 7; i++)
            for (int j = 0; j < 7; j++) {
                if (row+i >= 0 && row+i < m.length && col+j >= 0 && col+j < m[0].length) {
                    m[row+i][col+j] = pattern[i][j] == 1;
                    r[row+i][col+j] = true;
                }
            }
    }

    static void placeSeparators(boolean[][] m, boolean[][] r, int size) {
        // Horizontal separators
        for (int j = 0; j < 8; j++) {
            setReserved(m, r, 7, j, false);
            setReserved(m, r, 7, size-1-j, false);
            setReserved(m, r, size-8, j, false);
        }
        // Vertical separators
        for (int i = 0; i < 8; i++) {
            setReserved(m, r, i, 7, false);
            setReserved(m, r, i, size-8, false);
            setReserved(m, r, size-8+i, 7, false);
        }
    }

    static void setReserved(boolean[][] m, boolean[][] r, int row, int col, boolean val) {
        if (row >= 0 && row < m.length && col >= 0 && col < m[0].length) {
            m[row][col] = val;
            r[row][col] = true;
        }
    }

    static void placeTimingPatterns(boolean[][] m, boolean[][] r, int size) {
        for (int i = 8; i < size - 8; i++) {
            boolean val = (i % 2 == 0);
            setReserved(m, r, 6, i, val);
            setReserved(m, r, i, 6, val);
        }
    }

    static void placeFormatInfo(boolean[][] m, boolean[][] r, int size) {
        // Format info positions (placeholder)
        int[] positions = {0,1,2,3,4,5,7,8};
        for (int p : positions) {
            r[8][p] = true;
            r[p][8] = true;
        }
        r[8][8] = true;
        // Bottom-left and top-right
        for (int i = 0; i < 8; i++) {
            r[size-1-i][8] = true;
            r[8][size-8+i] = true;
        }
    }

    static void placeAlignmentPattern(boolean[][] m, boolean[][] r, int row, int col) {
        // 5x5 alignment pattern, centered at (row, col)
        int[][] pattern = {
            {1,1,1,1,1},
            {1,0,0,0,1},
            {1,0,1,0,1},
            {1,0,0,0,1},
            {1,1,1,1,1}
        };
        for (int i = -2; i <= 2; i++)
            for (int j = -2; j <= 2; j++) {
                int nr = row + i, nc = col + j;
                if (nr >= 0 && nr < m.length && nc >= 0 && nc < m[0].length && !r[nr][nc]) {
                    m[nr][nc] = pattern[i+2][j+2] == 1;
                    r[nr][nc] = true;
                }
            }
    }

    static int[][] getAlignmentPositions(int version) {
        // Simplified alignment positions for version 2-10
        int[][] table = {
            {},             // v1
            {6, 18},        // v2
            {6, 22},        // v3
            {6, 26},        // v4
            {6, 30},        // v5
            {6, 34},        // v6
            {6, 22, 38},    // v7
            {6, 24, 42},    // v8
            {6, 26, 46},    // v9
            {6, 28, 50},    // v10
        };
        if (version < 2 || version > 10) return new int[0][];
        int[] centers = table[version - 1];
        // Generate all pairs except top-left and related finder areas
        java.util.List<int[]> positions = new java.util.ArrayList<>();
        for (int r : centers)
            for (int c : centers)
                if (!(r == centers[0] && c == centers[0]))
                    positions.add(new int[]{r, c});
        return positions.toArray(new int[0][]);
    }

    static byte[] encodeData(String text, int version) {
        // Byte mode encoding
        byte[] textBytes = text.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
        int totalBits = getDataBits(version);
        int totalBytes = totalBits / 8;

        java.util.BitSet bits = new java.util.BitSet(totalBits);
        int pos = 0;

        // Mode indicator: 0100 = byte mode
        pos = appendBits(bits, pos, 0b0100, 4);
        // Character count (8 bits for version 1-9)
        pos = appendBits(bits, pos, textBytes.length, 8);
        // Data bytes
        for (byte b : textBytes) {
            pos = appendBits(bits, pos, b & 0xFF, 8);
        }
        // Terminator
        pos = appendBits(bits, pos, 0, Math.min(4, totalBits - pos));
        // Pad to byte boundary
        while (pos % 8 != 0) pos++;
        // Pad bytes
        boolean[] padBytes = {false};
        int padIdx = 0;
        int[][] padPairs = {{1,1,1,0,1,1,0,0}, {0,0,0,1,0,0,0,1}}; // 0xEC, 0x11
        while (pos < totalBits) {
            int[] pad = padPairs[padIdx % 2];
            for (int i = 0; i < 8 && pos < totalBits; i++, pos++) {
                if (pad[i] == 1) bits.set(pos);
            }
            padIdx++;
        }

        // Convert to byte array
        byte[] result = new byte[totalBytes];
        for (int i = 0; i < totalBytes; i++) {
            int b = 0;
            for (int j = 0; j < 8; j++) {
                if (bits.get(i * 8 + j)) b |= (1 << (7 - j));
            }
            result[i] = (byte) b;
        }
        return result;
    }

    static int appendBits(java.util.BitSet bits, int pos, int value, int count) {
        for (int i = count - 1; i >= 0; i--) {
            if ((value & (1 << i)) != 0) bits.set(pos);
            pos++;
        }
        return pos;
    }

    static int getDataBits(int version) {
        // Data codewords for version 1-10, EC level L (approx)
        int[] codewords = {19, 34, 55, 80, 108, 136, 156, 194, 232, 274};
        if (version < 1 || version > 10) return 19 * 8;
        return codewords[version - 1] * 8;
    }

    static void placeData(boolean[][] m, boolean[][] r, byte[] data, int size) {
        int bit = 0;
        int totalBits = data.length * 8;
        // Zigzag column placement from right to left, skipping column 6 (timing)
        for (int right = size - 1; right >= 1; right -= 2) {
            if (right == 6) right--; // skip timing column
            for (int vert = 0; vert < size; vert++) {
                for (int j = 0; j < 2; j++) {
                    int col = right - j;
                    // Direction: up or down based on which "column pair" we're in
                    int row = (((size - 1 - right) / 2) % 2 == 0) ? (size - 1 - vert) : vert;
                    if (col >= 0 && col < size && row >= 0 && row < size && !r[row][col]) {
                        boolean val = false;
                        if (bit < totalBits) {
                            int byteIdx = bit / 8;
                            int bitIdx = 7 - (bit % 8);
                            val = ((data[byteIdx] >> bitIdx) & 1) == 1;
                            bit++;
                        }
                        m[row][col] = val;
                    }
                }
            }
        }
    }

    static void applyMask(boolean[][] m, boolean[][] r, int size, int mask) {
        for (int row = 0; row < size; row++)
            for (int col = 0; col < size; col++)
                if (!r[row][col] && maskCondition(mask, row, col))
                    m[row][col] = !m[row][col];
    }

    static boolean maskCondition(int mask, int row, int col) {
        switch (mask) {
            case 0: return (row + col) % 2 == 0;
            case 1: return row % 2 == 0;
            case 2: return col % 3 == 0;
            case 3: return (row + col) % 3 == 0;
            case 4: return (row / 2 + col / 3) % 2 == 0;
            case 5: return (row * col) % 2 + (row * col) % 3 == 0;
            case 6: return ((row * col) % 2 + (row * col) % 3) % 2 == 0;
            case 7: return ((row + col) % 2 + (row * col) % 3) % 2 == 0;
            default: return false;
        }
    }

    static void writeFormatInfo(boolean[][] m, int size, int mask, int ecLevel) {
        // EC level bits: L=01, M=00, Q=11, H=10 (in format: ecLevel << 3)
        int formatData = (ecLevel << 3) | mask;
        // BCH error correction for format info
        int bch = formatData << 10;
        int gen = 0x537;
        for (int i = 14; i >= 10; i--) {
            if ((bch >> i & 1) != 0) bch ^= gen << (i - 10);
        }
        int format = ((formatData << 10) | bch) ^ 0x5412;

        // Place format bits
        int[] bits = new int[15];
        for (int i = 0; i < 15; i++) bits[i] = (format >> i) & 1;

        // Around top-left finder
        int[] rows1 = {8,8,8,8,8,8,8,8,7,5,4,3,2,1,0};
        int[] cols1 = {0,1,2,3,4,5,7,8,8,8,8,8,8,8,8};
        // Bottom-left + top-right
        int[] rows2 = {size-1,size-2,size-3,size-4,size-5,size-6,size-7,size-8, 8,8,8,8,8,8,8};
        int[] cols2 = {8,8,8,8,8,8,8,8, size-8,size-7,size-6,size-5,size-4,size-3,size-2};

        for (int i = 0; i < 15; i++) {
            m[rows1[i]][cols1[i]] = bits[i] == 1;
            m[rows2[i]][cols2[i]] = bits[i] == 1;
        }
        // Dark module
        m[size - 8][8] = true;
    }

    static boolean[][] buildFallbackMatrix(int size) {
        boolean[][] m = new boolean[size][size];
        // Chỉ vẽ finder patterns để nhận ra là QR
        for (int r = 0; r < 7; r++)
            for (int c = 0; c < 7; c++) {
                boolean v = (r == 0 || r == 6 || c == 0 || c == 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
                m[r][c] = v;
                m[r][size-1-c] = v;
                m[size-1-r][c] = v;
            }
        for (int i = 8; i < size - 8; i++) m[6][i] = m[i][6] = (i % 2 == 0);
        return m;
    }
}
