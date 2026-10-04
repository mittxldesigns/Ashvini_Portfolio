import io
import unittest

from PIL import Image
from worker import apply_mask, encode_bounded, preserve_flat_render, check_source_framing, CroppedSourceError


class WorkerTests(unittest.TestCase):
    def test_rgb_and_existing_alpha_are_preserved_before_framing(self):
        source = Image.new("RGBA", (2, 2), (17, 91, 203, 128))
        mask = Image.new("L", source.size, 64)
        output = apply_mask(source, mask)
        self.assertEqual(output.getpixel((0, 0))[:3], (17, 91, 203))
        self.assertEqual(output.getpixel((0, 0))[3], 128 * 64 // 255)

    def test_subject_crop_square_and_margin(self):
        image = Image.new("RGBA", (200, 400), (0, 0, 0, 0))
        image.paste((20, 100, 180, 255), (90, 160, 110, 240))
        result = Image.open(io.BytesIO(encode_bounded(image, 1600, 2_097_152)))
        self.assertEqual(result.mode, "RGBA")
        self.assertEqual(result.size, (768, 768))
        bbox = result.getchannel("A").getbbox()
        self.assertGreaterEqual(bbox[1], 55)
        self.assertLessEqual(bbox[1], 64)
        self.assertGreater(bbox[3] - bbox[1], 640)
        self.assertLess(bbox[2] - bbox[0], 170)

    def test_png_is_bounded_and_noninterlaced(self):
        image = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        image.paste((50, 60, 70, 255), (25, 25, 75, 75))
        body = encode_bounded(image, 512, 2_097_152)
        self.assertLessEqual(len(body), 2_097_152)
        self.assertEqual(body[24], 8)
        self.assertEqual(body[25], 6)
        self.assertEqual(body[28], 0)
        self.assertEqual(Image.open(io.BytesIO(body)).size, (512, 512))

    def test_clipped_panel_is_restored_without_detached_watermark_or_holes(self):
        source = Image.new("RGBA", (100, 100), (0, 0, 0, 255))
        source.paste((40, 80, 110, 255), (35, 0, 100, 70))
        source.paste((0, 0, 0, 255), (60, 20, 65, 25))
        source.paste((255, 255, 255, 255), (5, 85, 12, 92))
        mask = Image.new("L", source.size, 0)
        mask.paste(255, (35, 40, 100, 70))
        repaired = preserve_flat_render(source, mask)
        self.assertEqual(repaired.getpixel((75, 10)), 255)
        self.assertEqual(repaired.getpixel((7, 87)), 0)
        self.assertEqual(repaired.getpixel((62, 22)), 0)
        self.assertEqual(apply_mask(source, repaired).getpixel((75, 10))[:3], (40, 80, 110))

    def test_flat_supplement_does_not_touch_normal_or_non_neutral_backdrops(self):
        for background in ((90, 120, 170, 255), (0, 0, 0, 255)):
            source = Image.new("RGBA", (100, 100), background)
            source.paste((220, 100, 30, 255), (20, 20, 80, 80))
            mask = Image.new("L", source.size, 0)
            mask.paste(255, (20, 40, 80, 80))
            self.assertEqual(preserve_flat_render(source, mask).tobytes(), mask.tobytes())

    def test_cropped_opaque_source_needs_a_full_view_but_tight_alpha_export_is_valid(self):
        source = Image.new("RGBA", (100, 100), (20, 80, 100, 255))
        mask = Image.new("L", (100, 100), 0)
        mask.paste(255, (30, 0, 80, 80))
        with self.assertRaises(CroppedSourceError):
            check_source_framing(source, mask)
        source.putalpha(mask)
        check_source_framing(source, mask)
        full = Image.new("L", (100, 100), 0)
        full.paste(255, (20, 20, 80, 80))
        check_source_framing(Image.new("RGB", (100, 100)), full)

    def test_empty_and_opaque_results_are_rejected(self):
        for alpha in (0, 255):
            with self.assertRaises(ValueError):
                encode_bounded(Image.new("RGBA", (50, 50), (20, 30, 40, alpha)), 768, 2_097_152)


if __name__ == "__main__":
    unittest.main()
