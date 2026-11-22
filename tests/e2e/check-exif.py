# Reads the photos in an exported zip and prints their EXIF position, time and description.
import sys, zipfile, io, exifread
z = zipfile.ZipFile(sys.argv[1])
for n in sorted(z.namelist()):
    if not n.endswith(".jpg"): continue
    t = exifread.process_file(io.BytesIO(z.read(n)), details=False)
    def dec(tag, ref):
        if tag not in t: return None
        d, m, s = [float(x.num) / float(x.den) for x in t[tag].values]
        v = d + m / 60 + s / 3600
        return round(-v if str(t[ref]) in ("S", "W") else v, 7)
    print(n)
    print("  position:", dec("GPS GPSLatitude", "GPS GPSLatitudeRef"), dec("GPS GPSLongitude", "GPS GPSLongitudeRef"), "| accuracy:", t.get("GPS GPSHPositioningError"), "| datum:", t.get("GPS GPSMapDatum"))
    print("  taken:", t.get("EXIF DateTimeOriginal"), t.get("EXIF OffsetTimeOriginal"))
    print("  description:", t.get("Image ImageDescription"))
    print("  software:", t.get("Image Software"))
