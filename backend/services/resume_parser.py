import re

SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "go", "rust", "sql", "mysql", "postgresql",
    "mongodb", "redis", "html", "css", "react", "next.js", "node.js", "express", "django", "flask", "fastapi",
    "spring boot", "tailwind", "docker", "kubernetes", "git", "github", "aws", "azure", "gcp", "linux",
    "rest api", "graphql", "machine learning", "deep learning", "nlp", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "keras", "power bi", "tableau", "excel", "data structures", "algorithms",
    "oop", "dbms", "operating systems", "computer networks", "langchain", "rag", "firebase", "supabase",
]

PROJECT_HEADERS = re.compile(r"^\s*(academic\s+)?projects?\s*:?\s*$", re.I)
SECTION_HEADERS = re.compile(
    r"^\s*(education|experience|work experience|skills|technical skills|certifications?|achievements?|"
    r"internships?|positions of responsibility|extracurriculars?|summary|objective)\s*:?\s*$",
    re.I,
)


def extract_text(uploaded_file) -> str:
    name = (getattr(uploaded_file, "name", "") or "").lower()
    data = uploaded_file.read()
    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


def extract_skills(text: str, limit: int = 15):
    lowered = text.lower()
    found = []
    for skill in SKILLS:
        pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
        if re.search(pattern, lowered):
            found.append(skill)
    return found[:limit]


def extract_projects(text: str, limit: int = 3):
    lines = [ln.strip() for ln in text.splitlines()]
    projects, inside = [], False
    for ln in lines:
        if PROJECT_HEADERS.match(ln):
            inside = True
            continue
        if inside and SECTION_HEADERS.match(ln):
            break
        if inside and 8 <= len(ln) <= 90 and not ln.startswith(("•", "-", "*", "●")):
            projects.append(ln.rstrip(":|-– "))
        if len(projects) >= limit:
            break
    return projects


def parse_resume(uploaded_file) -> dict:
    text = extract_text(uploaded_file)
    text = re.sub(r"[ \t]+", " ", text).strip()
    return {
        "text": text[:6000],
        "skills": extract_skills(text),
        "projects": extract_projects(text),
    }
