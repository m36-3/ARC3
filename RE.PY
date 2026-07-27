def read_medicraft_file(file_path):
    print(f"\n--- قراءة محتوى الملف: {file_path} ---")
    with open(file_path, 'r', encoding='ascii', errors='ignore') as f:
        content = f.read()
        # بما أن الفاصل هو '|'، سنقوم بتقسيم النص لعرضه بشكل أوضح
        parts = content.split('|')
        for i, part in enumerate(parts):
            print(f"الجزء {i}: {part}")

# جرب هذا على أحد ملفات MEF
read_medicraft_file(r'D:\BS200251\3.MEF')