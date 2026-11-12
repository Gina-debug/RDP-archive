import os
import glob
import subprocess
from collections import deque

CANVAS_SIZE = 1400
SAFE_SPAN = 1320  # Garment fills 94.3% of the canvas for maximum visibility

def flood_fill_black_to_white(bmp_path, out_bmp_path):
    with open(bmp_path, "rb") as f:
        data = bytearray(f.read())
    offset = int.from_bytes(data[10:14], "little")
    w = int.from_bytes(data[18:22], "little", signed=True)
    h = abs(int.from_bytes(data[22:26], "little", signed=True))
    bpp = int.from_bytes(data[28:30], "little")
    row_size = ((w * bpp + 31) // 32) * 4
    bytes_per_pixel = bpp // 8

    visited = bytearray(w * h)
    queue = deque()

    def enqueue(x, y):
        idx = y * w + x
        if visited[idx]:
            return
        visited[idx] = 1
        b_idx = offset + y * row_size + x * bytes_per_pixel
        b, g, r = data[b_idx], data[b_idx + 1], data[b_idx + 2]
        if r <= 28 and g <= 28 and b <= 28:
            queue.append((x, y))

    for x in range(w):
        enqueue(x, 0)
        enqueue(x, h - 1)
    for y in range(h):
        enqueue(0, y)
        enqueue(w - 1, y)

    while queue:
        x, y = queue.popleft()
        b_idx = offset + y * row_size + x * bytes_per_pixel
        data[b_idx] = 255
        data[b_idx + 1] = 255
        data[b_idx + 2] = 255
        for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
            if 0 <= nx < w and 0 <= ny < h:
                enqueue(nx, ny)

    with open(out_bmp_path, "wb") as f:
        f.write(data)

def get_bounding_box(data, offset, w, h, x_start, x_end, bpp=32, is_dark_bg=False):
    row_size = ((w * bpp + 31) // 32) * 4
    bytes_per_pixel = bpp // 8
    min_x, max_x = w, -1
    min_y, max_y = h, -1

    for y in range(h):
        for x in range(x_start, x_end):
            idx = offset + y * row_size + x * bytes_per_pixel
            if bpp == 32:
                b, g, r, a = data[idx : idx + 4]
                if a > 25 and (r < 240 or g < 240 or b < 240):
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
            else:
                b, g, r = data[idx : idx + 3]
                is_active = (r > 28 or g > 28 or b > 28) if is_dark_bg else (r < 240 or g < 240 or b < 240)
                if is_active:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y

    if max_x < min_x or max_y < min_y:
        return (x_start, 0, x_end - 1, h - 1)
    return (min_x, min_y, max_x, max_y)

def process_and_save(src_bmp, box, out_name):
    min_x, min_y, max_x, max_y = box
    w = max_x - min_x + 1
    h = max_y - min_y + 1

    crop_bmp = f"test_crop/{out_name}_raw.bmp"
    subprocess.run([
        "sips",
        "--cropToHeightWidth", str(h), str(w),
        "--cropOffset", str(min_y), str(min_x),
        src_bmp,
        "--out", crop_bmp
    ], check=True, capture_output=True)

    scale = min(SAFE_SPAN / w, SAFE_SPAN / h)
    target_w = max(1, round(w * scale))
    target_h = max(1, round(h * scale))

    resamp_bmp = f"test_crop/{out_name}_resamp.bmp"
    subprocess.run([
        "sips",
        "-z", str(target_h), str(target_w),
        crop_bmp,
        "--out", resamp_bmp
    ], check=True, capture_output=True)

    final_out = f"assets/{out_name}.jpg"
    subprocess.run([
        "sips",
        "-p", str(CANVAS_SIZE), str(CANVAS_SIZE),
        "--padColor", "FFFFFF",
        resamp_bmp,
        "--out", final_out,
        "-s", "format", "jpeg",
        "-s", "formatOptions", "95"
    ], check=True, capture_output=True)
    print(f"Generated {final_out}: {CANVAS_SIZE}x{CANVAS_SIZE} (source box {w}x{h})")

def main():
    os.makedirs("assets", exist_ok=True)
    os.makedirs("test_crop", exist_ok=True)

    user_upload_dir = "/Users/riccardosolbiati/.gemini/antigravity/brain/19d68dcd-0da7-4a55-bf9d-8eccfa34d940/.user_uploaded"

    # 1. RDP-001: Crucifix Heavy Tee (media_1794504288129.png)
    f1 = "test_crop/img_0.bmp"
    with open(f1, "rb") as f: d1 = f.read()
    b1_front = get_bounding_box(d1, 138, 1024, 576, 0, 512, 32)
    b1_back = get_bounding_box(d1, 138, 1024, 576, 512, 1024, 32)
    process_and_save(f1, b1_front, "rdp-001-front")
    process_and_save(f1, b1_back, "rdp-001-back")

    # 2. RDP-002: Gothic Barbed Cross Tee (media_1794504299989.png)
    f2 = "test_crop/img_1.bmp"
    with open(f2, "rb") as f: d2 = f.read()
    b2_front = get_bounding_box(d2, 138, 1024, 576, 0, 512, 32)
    b2_back = get_bounding_box(d2, 138, 1024, 576, 512, 772, 32)  # exclude far-right speck
    process_and_save(f2, b2_front, "rdp-002-front")
    process_and_save(f2, b2_back, "rdp-002-back")

    # 3. RDP-003: Rosary AK & Spray Cross Tee (media_1794504321136.png)
    f3 = "test_crop/img_2.bmp"
    with open(f3, "rb") as f: d3 = f.read()
    b3_front = get_bounding_box(d3, 138, 1024, 576, 0, 512, 32)
    b3_back = get_bounding_box(d3, 138, 1024, 576, 512, 1024, 32)
    process_and_save(f3, b3_front, "rdp-003-front")
    process_and_save(f3, b3_back, "rdp-003-back")

    # 4 & 5. Flare Jeans image (media_1794504363239.png)
    f4 = "test_crop/img_3.bmp"
    with open(f4, "rb") as f: d4 = f.read()
    b4_left = get_bounding_box(d4, 138, 1024, 576, 0, 340, 32)
    b4_center = get_bounding_box(d4, 138, 1024, 576, 340, 660, 32)
    b4_right = get_bounding_box(d4, 138, 1024, 576, 660, 1024, 32)

    # RDP-004: Italia Tricolore Flare Denim (Center + Right)
    process_and_save(f4, b4_center, "rdp-004-front")
    process_and_save(f4, b4_right, "rdp-004-back")

    # RDP-005: Patchwork Camo & Leopard Jeans (Left + Right)
    process_and_save(f4, b4_left, "rdp-005-front")
    process_and_save(f4, b4_right, "rdp-005-back")

    # 6. RDP-006: Leopard RDP Oversized Flare Jeans (media_1794504369528.png)
    f5 = "test_crop/img_4.bmp"
    with open(f5, "rb") as f: d5 = f.read()
    b5_front = get_bounding_box(d5, 138, 1024, 576, 0, 500, 32)
    b5_back = get_bounding_box(d5, 138, 1024, 576, 500, 1024, 32)
    process_and_save(f5, b5_front, "rdp-006-front")
    process_and_save(f5, b5_back, "rdp-006-back")

    # 7. RDP-007: Casino Royale Snow Leopard Hoodie (media_1794504384945.png)
    f6 = "test_crop/img_5.bmp"
    with open(f6, "rb") as f: d6 = f.read()
    b6_front = get_bounding_box(d6, 138, 1024, 576, 0, 520, 32)
    b6_back = get_bounding_box(d6, 138, 1024, 576, 520, 1024, 32)
    process_and_save(f6, b6_front, "rdp-007-front")
    process_and_save(f6, b6_back, "rdp-007-back")

    # 8. RDP-008: Tactical Woodland Knuckle Jorts (media_1794504399075.png)
    f7 = "test_crop/img_6.bmp"
    with open(f7, "rb") as f: d7 = f.read()
    b7_front = get_bounding_box(d7, 138, 1024, 576, 0, 545, 32)
    b7_back = get_bounding_box(d7, 138, 1024, 576, 545, 1024, 32)
    process_and_save(f7, b7_front, "rdp-008-front")
    process_and_save(f7, b7_back, "rdp-008-back")

    # 9. RDP-009: Woodland Brass Knuckle Contrast Tee (media_1794504409245.png)
    f8 = "test_crop/img_7.bmp"
    with open(f8, "rb") as f: d8 = f.read()
    b8_front = get_bounding_box(d8, 138, 1024, 576, 0, 535, 32)
    b8_back = get_bounding_box(d8, 138, 1024, 576, 535, 1024, 32)
    process_and_save(f8, b8_front, "rdp-009-front")
    process_and_save(f8, b8_back, "rdp-009-back")

    # 10. RDP-010: Provincia Patch Lighter Denim Jorts (media_1794516850911.jpg)
    src_jorts = os.path.join(user_upload_dir, "media_1794516850911.jpg")
    raw_jorts_bmp = "test_crop/jorts_raw.bmp"
    white_jorts_bmp = "test_crop/jorts_clean_white.bmp"
    subprocess.run(["sips", "-s", "format", "bmp", src_jorts, "--out", raw_jorts_bmp], check=True, capture_output=True)
    flood_fill_black_to_white(raw_jorts_bmp, white_jorts_bmp)
    with open(white_jorts_bmp, "rb") as f: d_jorts = f.read()
    b10_front = get_bounding_box(d_jorts, 54, 1024, 576, 0, 503, 24, is_dark_bg=False)
    b10_back = get_bounding_box(d_jorts, 54, 1024, 576, 503, 1024, 24, is_dark_bg=False)
    process_and_save(white_jorts_bmp, b10_front, "rdp-010-front")
    process_and_save(white_jorts_bmp, b10_back, "rdp-010-back")

    # 11. RDP-011: Military Rosary Gothic Hooded Jacket (media_1794516927967.png)
    src_jacket = os.path.join(user_upload_dir, "media_1794516927967.png")
    jacket_bmp = "test_crop/jacket_raw.bmp"
    subprocess.run(["sips", "-s", "format", "bmp", src_jacket, "--out", jacket_bmp], check=True, capture_output=True)
    with open(jacket_bmp, "rb") as f: d_jacket = f.read()
    b11_front = get_bounding_box(d_jacket, 138, 1024, 576, 0, 512, 32)
    b11_back = get_bounding_box(d_jacket, 138, 1024, 576, 512, 1024, 32)
    process_and_save(jacket_bmp, b11_front, "rdp-011-front")
    process_and_save(jacket_bmp, b11_back, "rdp-011-back")

    print("\nSUCCESS: All 11 user garments processed at 1400x1400 high resolution (22 views)!")

if __name__ == "__main__":
    main()
