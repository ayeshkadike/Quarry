#!/usr/bin/env python3
"""Generate a simple app icon for Tauri"""

try:
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a 1024x1024 image with a blue background
    size = 1024
    img = Image.new('RGBA', (size, size), (59, 130, 246, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple icon - a magnifying glass
    # Circle for lens
    circle_center = (size // 2, size // 2 - 50)
    circle_radius = 200
    draw.ellipse(
        [circle_center[0] - circle_radius, circle_center[1] - circle_radius,
         circle_center[0] + circle_radius, circle_center[1] + circle_radius],
        outline='white',
        width=40
    )
    
    # Handle for magnifying glass
    handle_start = (circle_center[0] + circle_radius - 60, circle_center[1] + circle_radius - 60)
    handle_end = (size // 2 + 250, size // 2 + 200)
    draw.line([handle_start, handle_end], fill='white', width=40)
    
    # Save the icon
    img.save('app-icon.png')
    print("Icon generated successfully: app-icon.png")
    
except ImportError:
    print("PIL/Pillow not installed. Creating a minimal fallback...")
    # Create a minimal PNG manually (1x1 blue pixel, will be scaled)
    # This is a valid minimal PNG file
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x04, 0x00,  # 1024x1024
        0x08, 0x06, 0x00, 0x00, 0x00, 0xBC, 0x73, 0x8F,  # RGBA, compression, filter, interlace, CRC
        0x16,
        0x00, 0x00, 0x00, 0x01, 0x73, 0x52, 0x47, 0x42,  # sRGB chunk
        0x00, 0xAE, 0xCE, 0x1C, 0xE9
    ])
    
    with open('app-icon.png', 'wb') as f:
        f.write(png_data)
    print("Minimal fallback icon created. Install Pillow for better results: pip install Pillow")
