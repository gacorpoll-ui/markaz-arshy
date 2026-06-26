import re, glob, os

BASE = 'D:/follower-store/frontend/src'

# Dark theme patterns → replacement
REPLACEMENTS = [
    # Backgrounds
    (r"rgba\(255,\s*255,\s*255,\s*0\.0[2-5]\)", "var(--bg-page)"),
    (r"rgba\(255,\s*255,\s*255,\s*0\.06\)", "var(--bg-muted)"),
    (r"rgba\(255,\s*255,\s*255,\s*0\.08\)", "var(--bg-muted)"),
    (r"rgba\(255,\s*255,\s*255,\s*0\.1\)", "var(--border-default)"),
    (r"rgba\(255,\s*255,\s*255,\s*0\.97\)", "var(--bg-surface)"),
    (r"rgba\(0,\s*0,\s*0,\s*0\.\d+\)", "var(--bg-muted)"),
    # Neon colors
    (r"rgba\(0,\s*242,\s*254,\s*0\.05\)", "var(--accent-primary-light)"),
    (r"rgba\(0,\s*242,\s*254,\s*0\.08\)", "var(--accent-primary-light)"),
    (r"rgba\(0,\s*242,\s*254,\s*0\.1\)", "var(--accent-primary-light)"),
    (r"rgba\(0,\s*242,\s*254,\s*0\.15\)", "var(--accent-primary-light)"),
    (r"rgba\(0,\s*242,\s*254,\s*0\.2\)", "rgba(59, 130, 246, 0.15)"),
    (r"rgba\(0,\s*242,\s*254,\s*0\.3\)", "rgba(59, 130, 246, 0.2)"),
    (r"rgba\(127,\s*0,\s*255,", "rgba(59, 130, 246,"),
    (r"rgba\(255,\s*0,\s*127,", "rgba(239, 68, 68,"),
    # Border
    (r"border:\s*'1px solid var\(--border-color\)'", "border: '1px solid var(--border-default)'"),
    (r"var\(--border-color\)", "var(--border-default)"),
    # Shadows
    (r"box-shadow:\s*'0 20px 40px rgba\(0,0,0,0\.3\)'", "box-shadow: 'var(--shadow-md)'"),
    (r"box-shadow:\s*'0 0 20px rgba\(0,\s*242,\s*254,", "box-shadow: 'var(--shadow-md)'"),
    (r"rgba\(0,242,254,", "rgba(59, 130, 246,"),
    # Font
    (r"var\(--font-title\)", "var(--font-display)"),
    # Colors
    (r"color:\s*'#fff'", "color: 'var(--text-primary)'"),
    (r"color:\s*'#070913'", "color: 'var(--text-inverse)'"),
    (r"color:\s*'#fca5a5'", "color: 'var(--accent-danger)'"),
    (r"color:\s*'var\(--color-primary\)'", "color: 'var(--accent-primary)'"),
    (r"color:\s*'var\(--color-success\)'", "color: 'var(--accent-success)'"),
    (r"background:\s*'var\(--grad-primary\)'", "background: 'var(--accent-primary)'"),
    (r"var\(--grad-primary\)", "var(--accent-primary)"),
    (r"var\(--grad-accent\)", "var(--accent-primary)"),
]

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Process all JSX and JS files (skip already-done files)
files_fixed = []
for filepath in glob.glob(os.path.join(BASE, '**/*.jsx'), recursive=True):
    # Skip App.jsx, Home.jsx, Login.jsx, Register.jsx (already done)
    name = os.path.basename(filepath)
    if name in ('App.jsx', 'Home.jsx', 'Login.jsx', 'Register.jsx'):
        continue
    if fix_file(filepath):
        files_fixed.append(filepath.replace(BASE + '/', ''))

# Process CSS files
for filepath in glob.glob(os.path.join(BASE, '**/*.css'), recursive=True):
    name = os.path.basename(filepath)
    if name in ('tokens.css',):  # skip tokens
        continue
    if fix_file(filepath):
        files_fixed.append(filepath.replace(BASE + '/', ''))

print(f"Fixed {len(files_fixed)} files:")
for f in files_fixed:
    print(f"  {f}")
