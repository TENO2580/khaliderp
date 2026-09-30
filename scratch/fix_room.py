
import re

page_path = r"C:\DYNAMICE CRM TRIPIDIO\universal-crm\src\app\(app)\meetings\page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const roomUrl = https://meet.jit.si/UniversalCRM-;", "const roomUrl = `https://meet.jit.si/UniversalCRM-${meetingId}`;")

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed roomUrl.")

