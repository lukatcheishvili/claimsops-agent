"""
Generates four demo evidence files for Mohammed Alkhan's low-risk auto claim
(CLM-2026-3050) so the ClaimsOps Agent can fast-track it for human approval.

Files:
  - claim_form.pdf       : typed insurance claim form
  - customer_id.jpg      : mock national ID card (clearly labeled DEMO)
  - damage_photo.jpg     : minor parking scratch placeholder image
  - repair_estimate.pdf  : workshop quote for the scratch repair

These are demo artifacts only - never real personal documents.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_DIR = Path(__file__).resolve().parent / "mohammed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_claim_form() -> Path:
    width, height = 1240, 1754
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(38, bold=True)
    section_font = load_font(22, bold=True)
    body_font = load_font(20)
    small_font = load_font(16)

    draw.rectangle([(0, 0), (width, 110)], fill=(15, 23, 42))
    draw.text((60, 35), "ClaimsOps Insurance", font=title_font, fill="white")
    draw.text((60, 78), "Auto Claim Form  -  Confidential", font=small_font, fill=(200, 220, 240))

    y = 150
    draw.text((60, y), "Claim ID:        CLM-2026-3050", font=body_font, fill="black")
    draw.text((60, y + 32), "Insurance Line: Auto", font=body_font, fill="black")
    draw.text((60, y + 64), "Date Filed:     2026-06-27", font=body_font, fill="black")
    draw.text((640, y), "Policy Number:  AUTO-MHK-001", font=body_font, fill="black")
    draw.text((640, y + 32), "Status:         Submitted", font=body_font, fill="black")
    draw.text((640, y + 64), "Segment:        VIP", font=body_font, fill="black")

    y = 310
    draw.text((60, y), "1. POLICYHOLDER DETAILS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    fields = [
        ("Full Name", "Mohammed Alkhan"),
        ("Date of Birth", "1995-08-14"),
        ("Address", "Building 482, Road 1907, Block 319, Manama, Bahrain"),
        ("Phone", "+973 3344 5566"),
        ("Email", "mohammed_alkhan@hotmail.com"),
    ]
    for index, (label, value) in enumerate(fields):
        line_y = y + 56 + index * 36
        draw.text((80, line_y), f"{label}:", font=body_font, fill=(80, 80, 80))
        draw.text((300, line_y), value, font=body_font, fill="black")

    y = 580
    draw.text((60, y), "2. INCIDENT DETAILS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    incident = [
        ("Incident Date", "2026-06-26"),
        ("Reported Date", "2026-06-27"),
        ("Location", "Office parking lot, Seef District, Manama"),
        ("Vehicle", "2024 Toyota Corolla - plate 21947"),
        ("Estimated Loss", "BHD 450  /  USD 1,200"),
    ]
    for index, (label, value) in enumerate(incident):
        line_y = y + 56 + index * 36
        draw.text((80, line_y), f"{label}:", font=body_font, fill=(80, 80, 80))
        draw.text((300, line_y), value, font=body_font, fill="black")

    y = 850
    draw.text((60, y), "3. DESCRIPTION OF EVENTS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    description = (
        "On 2026-06-26 at approximately 17:30 I returned to my vehicle in the\n"
        "office parking lot and discovered a horizontal scratch along the\n"
        "driver-side door, approximately 30 cm in length, with no paint transfer\n"
        "from another vehicle. CCTV footage was unavailable for that aisle.\n\n"
        "No other vehicle is involved in this claim. There are no injuries to\n"
        "any party. The car is fully driveable. The bodywork shop has provided\n"
        "a written repair estimate which is attached to this submission."
    )
    for index, line in enumerate(description.split("\n")):
        draw.text((80, y + 56 + index * 30), line, font=body_font, fill="black")

    y = 1240
    draw.text((60, y), "4. ATTACHMENTS SUBMITTED", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    attachments = [
        "[x] Customer ID (national ID card scan)",
        "[x] Photographs of the damaged door panel",
        "[x] Workshop repair estimate (Manama Auto Centre)",
        "[x] Signed declaration of policyholder",
    ]
    for index, line in enumerate(attachments):
        draw.text((80, y + 56 + index * 32), line, font=body_font, fill="black")

    y = 1450
    draw.text((60, y), "5. DECLARATION", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    draw.text(
        (80, y + 56),
        "I confirm that the information above is accurate and complete to the best of my knowledge.",
        font=body_font,
        fill="black",
    )
    draw.line([(80, y + 150), (560, y + 150)], fill="black", width=2)
    draw.text((80, y + 158), "Mohammed Alkhan (signature)", font=small_font, fill=(80, 80, 80))
    draw.line([(680, y + 150), (1160, y + 150)], fill="black", width=2)
    draw.text((680, y + 158), "Date: 2026-06-27", font=small_font, fill=(80, 80, 80))

    draw.text(
        (60, height - 40),
        "DEMO FILE - ClaimsOps Agent classroom MVP - generated for unit testing only",
        font=small_font,
        fill=(150, 150, 150),
    )

    output_path = OUTPUT_DIR / "claim_form.pdf"
    image.save(output_path, "PDF", resolution=150.0)
    return output_path


def make_customer_id() -> Path:
    width, height = 1000, 630
    image = Image.new("RGB", (width, height), (245, 245, 248))
    draw = ImageDraw.Draw(image)

    title_font = load_font(34, bold=True)
    label_font = load_font(15, bold=True)
    value_font = load_font(22)
    small_font = load_font(14)

    draw.rectangle([(0, 0), (width, 90)], fill=(15, 64, 50))
    draw.text((30, 28), "KINGDOM OF DEMO  -  NATIONAL IDENTITY CARD", font=title_font, fill="white")

    draw.rectangle([(40, 130), (290, 480)], fill=(200, 210, 225), outline=(120, 130, 150), width=2)
    draw.ellipse([(120, 180), (210, 270)], fill=(160, 170, 195))
    draw.polygon([(80, 470), (165, 320), (250, 470)], fill=(160, 170, 195))
    draw.text((78, 490), "Photograph", font=small_font, fill=(80, 80, 80))

    detail_x = 330
    rows = [
        ("FULL NAME", "Mohammed Alkhan"),
        ("DATE OF BIRTH", "14 August 1995"),
        ("PLACE OF BIRTH", "Manama"),
        ("NATIONALITY", "Bahraini (demo)"),
        ("ID NUMBER", "DEMO-1995-08-14-MA"),
        ("DATE OF ISSUE", "2024-03-04"),
        ("DATE OF EXPIRY", "2034-03-04"),
    ]
    for index, (label, value) in enumerate(rows):
        row_y = 130 + index * 50
        draw.text((detail_x, row_y), label, font=label_font, fill=(110, 110, 130))
        draw.text((detail_x, row_y + 18), value, font=value_font, fill=(15, 23, 42))

    draw.line([(detail_x, 510), (detail_x + 280, 510)], fill=(120, 120, 120), width=2)
    draw.text((detail_x, 516), "Holder signature", font=small_font, fill=(110, 110, 130))

    draw.rectangle([(0, height - 70), (width, height)], fill=(230, 232, 240))
    draw.text(
        (30, height - 60),
        "ID<DEMO<ALKHAN<<MOHAMMED<<<<<<<<<<<<<<<<<<<<<<<<<<",
        font=small_font,
        fill=(60, 60, 60),
    )
    draw.text(
        (30, height - 38),
        "DEMO-1995-08-14-MA<2BAH9508144M3403043<<<<<<<<<<<8",
        font=small_font,
        fill=(60, 60, 60),
    )

    draw.text(
        (width - 160, height - 22),
        "DEMO FILE - NOT REAL",
        font=small_font,
        fill=(180, 60, 60),
    )

    output_path = OUTPUT_DIR / "customer_id.jpg"
    image.save(output_path, "JPEG", quality=88)
    return output_path


def make_damage_photo() -> Path:
    """Close-up of a driver-side door panel with a horizontal scratch."""
    width, height = 1280, 720
    image = Image.new("RGB", (width, height), (40, 50, 70))
    draw = ImageDraw.Draw(image)
    # Asphalt background (parking lot floor) at the bottom
    draw.rectangle([(0, height - 120), (width, height)], fill=(55, 55, 60))
    # Parking line
    draw.rectangle([(80, height - 60), (width - 80, height - 50)], fill=(220, 200, 80))

    # Car door panel (silver/white)
    panel_top = 90
    panel_bottom = height - 130
    panel_left = 80
    panel_right = width - 80
    draw.rectangle([(panel_left, panel_top), (panel_right, panel_bottom)], fill=(225, 228, 232))
    # Door shadow band along bottom
    draw.rectangle([(panel_left, panel_bottom - 80), (panel_right, panel_bottom)], fill=(190, 195, 205))
    # Window above
    draw.rectangle([(panel_left + 40, panel_top + 20), (panel_right - 40, panel_top + 180)], fill=(60, 75, 95))
    # Side mirror
    draw.ellipse([(panel_right - 220, panel_top + 70), (panel_right - 80, panel_top + 180)], fill=(210, 213, 218))
    # Door handle
    draw.rectangle([(panel_left + 580, panel_top + 250), (panel_left + 760, panel_top + 290)], fill=(170, 175, 185))
    draw.rectangle([(panel_left + 600, panel_top + 258), (panel_left + 740, panel_top + 282)], fill=(120, 125, 135))
    # The scratch - thin dark horizontal line + a few fine parallel scuffs
    scratch_y = panel_top + 380
    draw.line([(panel_left + 240, scratch_y), (panel_left + 780, scratch_y)], fill=(60, 50, 50), width=3)
    for offset in range(-6, 7, 3):
        draw.line(
            [(panel_left + 260 + offset, scratch_y + offset), (panel_left + 760 + offset, scratch_y + offset)],
            fill=(110, 100, 100),
            width=1,
        )
    # A small chip at the right edge of the scratch
    draw.ellipse([(panel_left + 770, scratch_y - 5), (panel_left + 790, scratch_y + 12)], fill=(80, 70, 70))

    # Caption strip
    overlay = Image.new("RGBA", (width, 70), (0, 0, 0, 180))
    image.paste(overlay, (0, height - 70), overlay)
    caption_font = load_font(22, bold=True)
    sub_font = load_font(16)
    draw = ImageDraw.Draw(image)
    draw.text(
        (24, height - 60),
        "Driver-side door scratch  -  Toyota Corolla  -  plate 21947",
        font=caption_font,
        fill="white",
    )
    draw.text(
        (24, height - 28),
        "Manama, Seef office parking  -  2026-06-26 17:30  -  DEMO IMAGE",
        font=sub_font,
        fill=(200, 210, 230),
    )

    # Top-right demo watermark
    label_font = load_font(20, bold=True)
    draw.rectangle([(width - 240, 20), (width - 20, 60)], fill=(220, 60, 60))
    draw.text((width - 226, 28), "DEMO FILE - NOT REAL", font=label_font, fill="white")

    output_path = OUTPUT_DIR / "damage_photo.jpg"
    image.save(output_path, "JPEG", quality=88)
    return output_path


def make_repair_estimate() -> Path:
    width, height = 1240, 1754
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(34, bold=True)
    section_font = load_font(22, bold=True)
    body_font = load_font(20)
    small_font = load_font(15)
    table_header = load_font(18, bold=True)

    # Workshop letterhead
    draw.rectangle([(0, 0), (width, 130)], fill=(30, 40, 70))
    draw.text((60, 30), "MANAMA AUTO CENTRE", font=title_font, fill="white")
    draw.text(
        (60, 80),
        "Bodywork  -  Paint  -  Detailing  |  Block 319, Manama, Bahrain  |  CR 12-44892 (demo)",
        font=small_font,
        fill=(200, 220, 240),
    )

    # Estimate metadata
    y = 170
    draw.text((60, y), "WORKSHOP REPAIR ESTIMATE", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    meta = [
        ("Estimate Number", "EST-2026-0612"),
        ("Issue Date", "2026-06-27"),
        ("Valid Until", "2026-07-27"),
        ("Customer", "Mohammed Alkhan"),
        ("Phone", "+973 3344 5566"),
        ("Vehicle", "Toyota Corolla 2024 - plate 21947 - white"),
        ("Reference Claim", "CLM-2026-3050 (AUTO-MHK-001)"),
    ]
    for index, (label, value) in enumerate(meta):
        row_y = y + 60 + index * 32
        draw.text((80, row_y), f"{label}:", font=body_font, fill=(80, 80, 80))
        draw.text((360, row_y), value, font=body_font, fill="black")

    # Inspection note
    y = 480
    draw.text((60, y), "INSPECTION NOTE", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    inspection = (
        "Horizontal scratch along the driver-side door, approximately 30 cm in\n"
        "length, depth limited to the clear coat and base coat layers. No\n"
        "structural damage to the door panel; no impact deformation observed.\n"
        "Recommended repair: localised sanding, base coat application, clear\n"
        "coat blending across the adjacent panel, and final polish."
    )
    for index, line in enumerate(inspection.split("\n")):
        draw.text((80, y + 60 + index * 30), line, font=body_font, fill="black")

    # Line item table
    y = 740
    draw.text((60, y), "ITEMISED COST  (USD)", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    # Table header band
    th_y = y + 56
    draw.rectangle([(60, th_y), (width - 60, th_y + 38)], fill=(238, 240, 248))
    draw.text((76, th_y + 9), "Description", font=table_header, fill=(20, 20, 30))
    draw.text((760, th_y + 9), "Hours", font=table_header, fill=(20, 20, 30))
    draw.text((900, th_y + 9), "Unit", font=table_header, fill=(20, 20, 30))
    draw.text((1060, th_y + 9), "Total", font=table_header, fill=(20, 20, 30))

    rows = [
        ("Door panel preparation and sanding", "1.5", "$45", "$67.50"),
        ("Colour match and base coat application", "2.0", "$45", "$90.00"),
        ("Clear coat application and curing", "1.5", "$45", "$67.50"),
        ("Wet sand and polish (panel blend)", "2.0", "$45", "$90.00"),
        ("Paint material (base + clear, colour code 040)", "-", "-", "$385.00"),
        ("Consumables (masking, abrasives, polishing pads)", "-", "-", "$120.00"),
        ("Workshop labour overhead", "-", "-", "$220.00"),
    ]
    row_y = th_y + 50
    for desc, hours, unit, total in rows:
        draw.text((76, row_y), desc, font=body_font, fill="black")
        draw.text((760, row_y), hours, font=body_font, fill="black")
        draw.text((900, row_y), unit, font=body_font, fill="black")
        draw.text((1060, row_y), total, font=body_font, fill="black")
        draw.line([(60, row_y + 30), (width - 60, row_y + 30)], fill=(220, 220, 226), width=1)
        row_y += 38

    # Totals
    row_y += 12
    draw.text((760, row_y), "Subtotal", font=table_header, fill=(80, 80, 80))
    draw.text((1060, row_y), "$1,040.00", font=table_header, fill=(20, 20, 30))
    row_y += 32
    draw.text((760, row_y), "VAT (10%)", font=table_header, fill=(80, 80, 80))
    draw.text((1060, row_y), "$160.00", font=table_header, fill=(20, 20, 30))
    row_y += 36
    draw.line([(740, row_y), (width - 60, row_y)], fill=(20, 20, 30), width=2)
    row_y += 14
    draw.text((760, row_y), "TOTAL", font=section_font, fill=(15, 23, 42))
    draw.text((1060, row_y), "$1,200.00", font=section_font, fill=(15, 23, 42))

    # Terms / footer
    y = 1430
    draw.text((60, y), "TERMS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    terms = [
        "Estimate valid for 30 days from the issue date.",
        "Repair completion timeline: 3 working days from approval.",
        "Original equipment paint match guaranteed for 12 months.",
        "Customer collects vehicle upon settlement of the invoice.",
    ]
    for index, line in enumerate(terms):
        draw.text((80, y + 60 + index * 30), f"- {line}", font=body_font, fill="black")

    # Signature
    draw.line([(80, height - 130), (560, height - 130)], fill="black", width=2)
    draw.text((80, height - 122), "Workshop manager signature", font=small_font, fill=(80, 80, 80))
    draw.line([(680, height - 130), (1160, height - 130)], fill="black", width=2)
    draw.text((680, height - 122), "Date: 2026-06-27", font=small_font, fill=(80, 80, 80))

    draw.text(
        (60, height - 40),
        "DEMO FILE - ClaimsOps Agent classroom MVP - generated for unit testing only",
        font=small_font,
        fill=(150, 150, 150),
    )

    output_path = OUTPUT_DIR / "repair_estimate.pdf"
    image.save(output_path, "PDF", resolution=150.0)
    return output_path


def main() -> None:
    files = [
        make_claim_form(),
        make_customer_id(),
        make_damage_photo(),
        make_repair_estimate(),
    ]
    print("Generated demo files for Mohammed Alkhan (CLM-2026-3050):")
    for path in files:
        size_kb = path.stat().st_size / 1024
        print(f"  {path.relative_to(OUTPUT_DIR.parent)}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
