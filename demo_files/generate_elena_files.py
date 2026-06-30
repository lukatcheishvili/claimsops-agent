"""
Generates three demo evidence files for Elena Garcia's auto claim (CLM-2026-1042):
  - claim_form.pdf   : a typed insurance claim form
  - customer_id.jpg  : a mock national ID card (clearly labeled DEMO)
  - damage_photo.jpg : a placeholder rear-end damage photo

These are NOT real documents - they are demo artifacts for the ClaimsOps Agent
classroom MVP so the file-upload + Evidence Review Agent flow can be exercised
end-to-end.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_DIR = Path(__file__).resolve().parent / "elena"
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
    """A4 portrait at 150dpi -> 1240x1754 px white sheet."""
    width, height = 1240, 1754
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(38, bold=True)
    section_font = load_font(22, bold=True)
    body_font = load_font(20)
    small_font = load_font(16)

    # Header band
    draw.rectangle([(0, 0), (width, 110)], fill=(15, 23, 42))
    draw.text((60, 35), "ClaimsOps Insurance", font=title_font, fill="white")
    draw.text((60, 78), "Auto Claim Form  -  Confidential", font=small_font, fill=(200, 220, 240))

    # Top metadata block
    y = 150
    draw.text((60, y), "Claim ID:        CLM-2026-1042", font=body_font, fill="black")
    draw.text((60, y + 32), "Insurance Line: Auto", font=body_font, fill="black")
    draw.text((60, y + 64), "Date Filed:     2026-06-18", font=body_font, fill="black")
    draw.text((640, y), "Policy Number:  AUTO-10293", font=body_font, fill="black")
    draw.text((640, y + 32), "Status:         Submitted", font=body_font, fill="black")

    # Section: Policyholder
    y = 310
    draw.text((60, y), "1. POLICYHOLDER DETAILS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    fields = [
        ("Full Name", "Elena Garcia"),
        ("Date of Birth", "1989-04-21"),
        ("Address", "Calle de Alcala 145, Madrid 28009, Spain"),
        ("Phone", "+34 612 458 091"),
        ("Email", "elena.garcia@example.com"),
    ]
    for index, (label, value) in enumerate(fields):
        line_y = y + 56 + index * 36
        draw.text((80, line_y), f"{label}:", font=body_font, fill=(80, 80, 80))
        draw.text((300, line_y), value, font=body_font, fill="black")

    # Section: Incident
    y = 580
    draw.text((60, y), "2. INCIDENT DETAILS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    incident = [
        ("Incident Date", "2026-06-16"),
        ("Reported Date", "2026-06-18"),
        ("Location", "M-30 ring road, Madrid, Spain"),
        ("Vehicle", "2022 Volkswagen Golf - plate 4738-LMP"),
        ("Estimated Loss", "EUR 8,400"),
    ]
    for index, (label, value) in enumerate(incident):
        line_y = y + 56 + index * 36
        draw.text((80, line_y), f"{label}:", font=body_font, fill=(80, 80, 80))
        draw.text((300, line_y), value, font=body_font, fill="black")

    # Section: Description
    y = 850
    draw.text((60, y), "3. DESCRIPTION OF EVENTS", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    description = (
        "On 2026-06-16 at approximately 08:45 my vehicle was struck from behind\n"
        "while stationary at a red light during the morning commute. The other\n"
        "driver admitted fault and exchanged insurance details on scene.\n\n"
        "Damage is limited to the rear bumper and trunk lid. The vehicle is\n"
        "driveable. No injuries were reported by either driver or any passenger.\n"
        "A repair estimate from an authorised body shop will be provided once\n"
        "the workshop has completed its inspection (scheduled 2026-06-22)."
    )
    for index, line in enumerate(description.split("\n")):
        draw.text((80, y + 56 + index * 30), line, font=body_font, fill="black")

    # Section: Attachments
    y = 1240
    draw.text((60, y), "4. ATTACHMENTS SUBMITTED", font=section_font, fill=(15, 23, 42))
    draw.line([(60, y + 32), (width - 60, y + 32)], fill=(180, 180, 180), width=2)
    attachments = [
        "[x] Customer ID (national ID card scan)",
        "[x] Photographs of the damaged vehicle",
        "[ ] Repair Estimate (pending - workshop appointment 2026-06-22)",
    ]
    for index, line in enumerate(attachments):
        draw.text((80, y + 56 + index * 32), line, font=body_font, fill="black")

    # Signature block
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
    draw.text((80, y + 158), "Elena Garcia (signature)", font=small_font, fill=(80, 80, 80))
    draw.line([(680, y + 150), (1160, y + 150)], fill="black", width=2)
    draw.text((680, y + 158), "Date: 2026-06-18", font=small_font, fill=(80, 80, 80))

    # Footer
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
    """A landscape ID card 1000x630 px (roughly credit-card aspect)."""
    width, height = 1000, 630
    image = Image.new("RGB", (width, height), (245, 245, 248))
    draw = ImageDraw.Draw(image)

    title_font = load_font(36, bold=True)
    label_font = load_font(15, bold=True)
    value_font = load_font(22)
    small_font = load_font(14)

    # Top band
    draw.rectangle([(0, 0), (width, 90)], fill=(20, 35, 90))
    draw.text((30, 25), "KINGDOM OF DEMO  -  NATIONAL IDENTITY CARD", font=title_font, fill="white")

    # Photo box
    draw.rectangle([(40, 130), (290, 480)], fill=(200, 210, 225), outline=(120, 130, 150), width=2)
    # Stylised silhouette
    draw.ellipse([(120, 180), (210, 270)], fill=(160, 170, 195))
    draw.polygon([(80, 470), (165, 320), (250, 470)], fill=(160, 170, 195))
    draw.text((78, 490), "Photograph", font=small_font, fill=(80, 80, 80))

    # Details on the right
    detail_x = 330
    rows = [
        ("FULL NAME", "Elena Garcia"),
        ("DATE OF BIRTH", "21 April 1989"),
        ("PLACE OF BIRTH", "Madrid"),
        ("NATIONALITY", "Spanish"),
        ("ID NUMBER", "DEMO-1989-04-21-EG"),
        ("DATE OF ISSUE", "2024-01-12"),
        ("DATE OF EXPIRY", "2034-01-12"),
    ]
    for index, (label, value) in enumerate(rows):
        row_y = 130 + index * 50
        draw.text((detail_x, row_y), label, font=label_font, fill=(110, 110, 130))
        draw.text((detail_x, row_y + 18), value, font=value_font, fill=(15, 23, 42))

    # Signature line
    draw.line([(detail_x, 510), (detail_x + 280, 510)], fill=(120, 120, 120), width=2)
    draw.text((detail_x, 516), "Holder signature", font=small_font, fill=(110, 110, 130))

    # MRZ-style footer
    draw.rectangle([(0, height - 70), (width, height)], fill=(230, 232, 240))
    draw.text(
        (30, height - 60),
        "ID<DEMO<GARCIA<<ELENA<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
        font=small_font,
        fill=(60, 60, 60),
    )
    draw.text(
        (30, height - 38),
        "DEMO-1989-04-21-EG<9SPA8904214F3401127<<<<<<<<<<<6",
        font=small_font,
        fill=(60, 60, 60),
    )

    # Demo watermark
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
    """1280x720 placeholder photo simulating a rear-end damage shot."""
    width, height = 1280, 720
    # Sky gradient
    image = Image.new("RGB", (width, height), (110, 130, 150))
    draw = ImageDraw.Draw(image)
    for y in range(height // 2):
        shade = 110 + int(60 * (y / (height // 2)))
        draw.line([(0, y), (width, y)], fill=(shade, shade + 10, shade + 30))
    # Asphalt
    draw.rectangle([(0, height // 2), (width, height)], fill=(45, 45, 50))
    # Lane markings
    for x in range(40, width, 180):
        draw.rectangle([(x, height - 80), (x + 90, height - 60)], fill=(220, 200, 80))

    # Damaged car body (rear view)
    body_top = 320
    body_bottom = 560
    body_left = 360
    body_right = 920
    draw.rectangle([(body_left, body_top + 60), (body_right, body_bottom)], fill=(180, 60, 50))
    # Roof
    draw.polygon(
        [
            (body_left + 60, body_top + 60),
            (body_left + 140, body_top),
            (body_right - 140, body_top),
            (body_right - 60, body_top + 60),
        ],
        fill=(160, 50, 40),
    )
    # Rear window
    draw.polygon(
        [
            (body_left + 130, body_top + 60),
            (body_left + 180, body_top + 10),
            (body_right - 180, body_top + 10),
            (body_right - 130, body_top + 60),
        ],
        fill=(60, 80, 110),
    )
    # Bumper
    draw.rectangle([(body_left + 20, body_bottom - 60), (body_right - 20, body_bottom)], fill=(110, 110, 115))
    # Tail lights
    draw.rectangle([(body_left + 30, body_top + 200), (body_left + 90, body_top + 240)], fill=(255, 80, 60))
    draw.rectangle([(body_right - 90, body_top + 200), (body_right - 30, body_top + 240)], fill=(255, 80, 60))
    # Plate
    draw.rectangle([(body_left + 230, body_top + 220), (body_right - 230, body_top + 260)], fill=(240, 240, 240))
    label_font = load_font(20, bold=True)
    draw.text((body_left + 260, body_top + 225), "4738-LMP", font=label_font, fill=(20, 20, 20))

    # Damage area - dented bumper, crumpled trunk
    for offset in range(-8, 9, 2):
        draw.line(
            [(body_left + 80 + offset, body_bottom - 30), (body_right - 80 - offset, body_bottom - 30)],
            fill=(70, 70, 75),
            width=2,
        )
    # Crumple lines on trunk
    draw.line([(560, body_top + 270), (620, body_top + 330)], fill=(50, 20, 15), width=4)
    draw.line([(640, body_top + 240), (700, body_top + 330)], fill=(50, 20, 15), width=4)
    draw.line([(720, body_top + 270), (780, body_top + 330)], fill=(50, 20, 15), width=4)
    # Bumper crack
    draw.line([(body_left + 200, body_bottom - 40), (body_left + 280, body_bottom - 5)], fill=(20, 20, 20), width=3)
    draw.line([(body_right - 280, body_bottom - 5), (body_right - 200, body_bottom - 40)], fill=(20, 20, 20), width=3)

    # Caption strip
    overlay = Image.new("RGBA", (width, 70), (0, 0, 0, 180))
    image.paste(overlay, (0, height - 70), overlay)
    caption_font = load_font(22, bold=True)
    sub_font = load_font(16)
    draw = ImageDraw.Draw(image)
    draw.text(
        (24, height - 60),
        "Rear-end damage  -  Volkswagen Golf  -  plate 4738-LMP",
        font=caption_font,
        fill="white",
    )
    draw.text(
        (24, height - 28),
        "Madrid, M-30 ring road  -  2026-06-16 08:47  -  DEMO IMAGE",
        font=sub_font,
        fill=(200, 210, 230),
    )

    # Top-right demo watermark
    draw.rectangle([(width - 240, 20), (width - 20, 60)], fill=(220, 60, 60))
    draw.text((width - 226, 28), "DEMO FILE - NOT REAL", font=label_font, fill="white")

    output_path = OUTPUT_DIR / "damage_photo.jpg"
    image.save(output_path, "JPEG", quality=88)
    return output_path


def main() -> None:
    files = [make_claim_form(), make_customer_id(), make_damage_photo()]
    print("Generated demo files for Elena Garcia (CLM-2026-1042):")
    for path in files:
        size_kb = path.stat().st_size / 1024
        print(f"  {path.relative_to(OUTPUT_DIR.parent)}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
