
sidebar_path = r"C:\DYNAMICE CRM TRIPIDIO\universal-crm\src\components\layout\Sidebar.tsx"
with open(sidebar_path, "r", encoding="utf-8") as f:
    sidebar = f.read()

if "Video: () =>" not in sidebar:
    replacement = """  Video: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  Phone: () => ("""
    sidebar = sidebar.replace("  Phone: () => (", replacement)
    with open(sidebar_path, "w", encoding="utf-8") as f:
        f.write(sidebar)
    print("Fixed Sidebar Icons.")

