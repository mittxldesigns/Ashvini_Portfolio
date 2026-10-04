"""Local image-only processor. Website credentials are never passed to this process."""
import io
import json
import sys
import warnings
from pathlib import Path

from PIL import Image, ImageChops, ImageOps

MODEL = "birefnet-general-lite"
MAX_PIXELS = 32_000_000


def apply_mask(source, mask):
    """Keep RGB intact; combine the generated mask with any existing source alpha."""
    rgba = source.convert("RGBA")
    mask = mask.convert("L").resize(rgba.size, Image.Resampling.LANCZOS)
    rgba.putalpha(ImageChops.multiply(mask, rgba.getchannel("A")))
    return rgba



def preserve_flat_render(source, mask):
    """Recover a clipped product panel when a model mistakes it for a flat backdrop.

    Only neutral, nearly black/white studio backgrounds qualify. Restored pixels
    must belong to an existing foreground component that touches the frame edge.
    This adds source-image coverage; it never synthesizes or changes subject RGB.
    """
    import numpy as np
    from scipy import ndimage

    rgb = np.asarray(source.convert("RGB"), dtype=np.int16)
    current = np.asarray(mask.convert("L").resize(source.size, Image.Resampling.LANCZOS))
    edge = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    bins = edge // 8
    keys = bins[:, 0] * 1024 + bins[:, 1] * 32 + bins[:, 2]
    values, counts = np.unique(keys, return_counts=True)
    winner = values[counts.argmax()]
    if counts.max() < len(edge) * .4:
        return mask
    background = np.median(edge[keys == winner], axis=0)
    if background.max() - background.min() > 6 or not (background.max() <= 16 or background.min() >= 239):
        return mask
    contrast = np.max(np.abs(rgb - background), axis=2)
    candidate = contrast > 12
    labels, count = ndimage.label(candidate, structure=np.ones((3, 3)))
    if not count:
        return mask
    sizes = np.bincount(labels.ravel())
    overlap = np.bincount(labels[current >= 96], minlength=len(sizes))
    boundary = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    accepted = np.zeros(len(sizes), dtype=bool)
    accepted[boundary] = True
    accepted &= (sizes >= max(64, current.size // 1000)) & (overlap >= 16)
    accepted[0] = False
    restore = accepted[labels]
    if restore.sum() <= (current >= 96).sum() * 1.2:
        return mask
    supplement = np.where(restore, np.clip((contrast - 8) * 255 / 12, 0, 255), 0).astype("uint8")
    return Image.fromarray(np.maximum(current, supplement))



class CroppedSourceError(ValueError):
    pass


def check_source_framing(source, mask):
    # A tight but already-transparent export can simply receive fresh padding.
    alpha = source.convert("RGBA").getchannel("A").histogram()
    if sum(alpha[:8]) >= source.width * source.height * .05:
        return
    solid = mask.convert("L").resize(source.size, Image.Resampling.LANCZOS)
    width, height = source.size
    edges = list(solid.crop((0, 0, width, 1)).tobytes()) + list(solid.crop((0, height - 1, width, height)).tobytes())
    edges += list(solid.crop((0, 0, 1, height)).tobytes()) + list(solid.crop((width - 1, 0, width, height)).tobytes())
    if sum(value >= 96 for value in edges) > max(4, len(edges) * .01):
        raise CroppedSourceError("choose a complete view with space around the object")


def encode_bounded(image, dimension, max_bytes):
    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    pixels = image.width * image.height
    if sum(histogram[:8]) < pixels * 0.01 or sum(histogram[8:]) == 0:
        raise ValueError("mask did not identify a useful cutout")
    bbox = alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()
    if not bbox:
        raise ValueError("no foreground")
    subject = image.crop(bbox)
    side = min(768, dimension)
    while True:
        usable = max(1, int(side * 0.84))
        scale = min(usable / subject.width, usable / subject.height)
        fitted = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), Image.Resampling.LANCZOS)
        image = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        image.paste(fitted, ((side - fitted.width) // 2, (side - fitted.height) // 2))
        alpha = image.getchannel("A").histogram()
        pixels = image.width * image.height
        if alpha[0] < pixels * 0.01 or sum(alpha[1:]) < pixels * 0.01:
            raise ValueError("no useful transparent foreground")
        output = io.BytesIO()
        image.save(output, format="PNG", optimize=True, compress_level=9)
        if len(output.getvalue()) <= min(max_bytes, 2_097_152):
            return output.getvalue()
        if side <= 256:
            raise ValueError("output too large")
        side = max(256, int(side * 0.8))


def main():
    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    warnings.simplefilter("error", Image.DecompressionBombWarning)
    try:
        from rembg import new_session, remove
        session = new_session(MODEL, providers=["CPUExecutionProvider"])
    except Exception:
        print(json.dumps({"ready": False, "code": "model_failed"}), flush=True)
        return
    print(json.dumps({"ready": True, "model": MODEL}), flush=True)
    for line in sys.stdin:
        try:
            request = json.loads(line)
            dimension = max(1, min(1600, int(request["maxDimension"])))
            max_bytes = max(1, min(2_097_152, int(request["maxBytes"])))
            with Image.open(request["input"]) as opened:
                if opened.format not in {"JPEG", "PNG", "WEBP"} or opened.width * opened.height > MAX_PIXELS:
                    raise ValueError("input invalid")
                image = ImageOps.exif_transpose(opened).convert("RGBA")
        except Exception:
            print(json.dumps({"ok": False, "code": "input_invalid"}), flush=True)
            continue
        try:
            mask = remove(image, session=session, only_mask=True, alpha_matting=False, post_process_mask=False)
            mask = preserve_flat_render(image, mask)
            check_source_framing(image, mask)
            result = encode_bounded(apply_mask(image, mask), dimension, max_bytes)
            Path(request["output"]).write_bytes(result)
            print(json.dumps({"ok": True}), flush=True)
        except CroppedSourceError:
            print(json.dumps({"ok": False, "code": "input_invalid"}), flush=True)
        except Exception:
            print(json.dumps({"ok": False, "code": "processing_failed"}), flush=True)


if __name__ == "__main__":
    main()
