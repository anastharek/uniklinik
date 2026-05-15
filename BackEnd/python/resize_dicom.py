#!/usr/bin/env python3
"""
Resize a DICOM image's pixel data to a maximum dimension.
Reads DICOM binary from stdin, writes resized DICOM to stdout.
Used by the OHIF backend to reduce memory pressure on mobile clients.

Usage:
  python3 resize_dicom.py MAX_DIM < input.dcm > output.dcm

Args:
  MAX_DIM: longest edge will be scaled to this value
           (0 or negative = passthrough, no resize)
"""
import sys
import io
import pydicom
from PIL import Image
import numpy as np

def resize_dicom(dicom_bytes, max_dim):
    """Resize DICOM pixel data. Returns new DICOM bytes."""
    ds = pydicom.dcmread(io.BytesIO(dicom_bytes))

    # Check if this instance has pixel data
    if not hasattr(ds, 'pixel_array'):
        return dicom_bytes  # passthrough (SR, PR, etc.)

    pixel_array = ds.pixel_array
    rows = pixel_array.shape[0]
    cols = pixel_array.shape[1] if len(pixel_array.shape) > 1 else 1

    # Don't upscale
    if max_dim <= 0 or (rows <= max_dim and cols <= max_dim):
        return dicom_bytes

    # Calculate scale factor
    larger_edge = max(rows, cols)
    scale = max_dim / larger_edge
    new_rows = int(rows * scale)
    new_cols = int(cols * scale)

    # Handle multi-frame vs color images
    if len(pixel_array.shape) == 3 and pixel_array.shape[-1] in (3, 4):
        # Color image: shape is (rows, cols, channels)
        img = Image.fromarray(pixel_array)
        img = img.resize((new_cols, new_rows), Image.LANCZOS)
        new_pixels = np.array(img)
    elif len(pixel_array.shape) == 3:
        # True multi-frame: shape is (frames, rows, cols)
        num_frames = pixel_array.shape[0]
        resized_frames = []
        for i in range(num_frames):
            img = Image.fromarray(pixel_array[i])
            img = img.resize((new_cols, new_rows), Image.LANCZOS)
            resized_frames.append(np.array(img))
        new_pixels = np.stack(resized_frames, axis=0)
    else:
        img = Image.fromarray(pixel_array)
        img = img.resize((new_cols, new_rows), Image.LANCZOS)
        new_pixels = np.array(img)

    # Update DICOM tags
    ds.Rows = new_rows
    ds.Columns = new_cols
    ds.PixelData = new_pixels.tobytes()

    # Force Explicit VR Little Endian to avoid implicit VR size issues
    ds.is_little_endian = True
    ds.is_implicit_VR = False
    ds.file_meta.TransferSyntaxUID = '1.2.840.10008.1.2.1'  # Explicit VR Little Endian

    # Update pixel spacing if present
    if hasattr(ds, 'PixelSpacing') and isinstance(ds.PixelSpacing, pydicom.multival.MultiValue):
        orig_spacing = list(ds.PixelSpacing)
        ds.PixelSpacing = [
            orig_spacing[0] / scale,
            orig_spacing[1] / scale,
        ]

    output = io.BytesIO()
    ds.save_as(output, write_like_original=False)
    return output.getvalue()

def main():
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: resize_dicom.py MAX_DIM\n')
        sys.exit(1)

    try:
        max_dim = int(sys.argv[1])
    except ValueError:
        sys.stderr.write(f'Invalid MAX_DIM: {sys.argv[1]}\n')
        sys.exit(1)

    # Read stdin
    input_data = sys.stdin.buffer.read()

    try:
        output_data = resize_dicom(input_data, max_dim)
        sys.stdout.buffer.write(output_data)
    except Exception as e:
        # If anything fails, fall back to passthrough
        sys.stderr.write(f'DICOM resize failed (passthrough): {e}\n')
        sys.stdout.buffer.write(input_data)

if __name__ == '__main__':
    main()
