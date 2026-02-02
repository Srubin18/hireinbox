#!/usr/bin/env python3
"""
Convert Hyred SVG logo to PNG
Generates multiple sizes: 48px, 128px, 512px, 1024px
"""

import os
import sys

try:
    from cairosvg import svg2png
except ImportError:
    print("❌ Error: cairosvg not installed")
    print("Install with: pip3 install cairosvg")
    sys.exit(1)

svg_path = './public/hyred-logo.svg'
sizes = [
    ('hyred-logo-48.png', 48),
    ('hyred-logo-128.png', 128),
    ('hyred-logo-512.png', 512),
    ('hyred-logo-1024.png', 1024),
]

def convert_svg_to_png():
    """Convert SVG to multiple PNG sizes"""
    if not os.path.exists(svg_path):
        print(f"❌ Error: {svg_path} not found")
        sys.exit(1)

    for name, size in sizes:
        output_path = f'./public/{name}'
        svg2png(
            url=svg_path,
            write_to=output_path,
            output_width=size,
            output_height=size
        )
        print(f'✅ Created: public/{name} ({size}x{size})')

    print('\n🎉 All PNG logos generated successfully!')

if __name__ == '__main__':
    convert_svg_to_png()
