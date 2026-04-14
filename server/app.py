from flask import Flask, request, jsonify
import joblib
import spacy
from spacy.matcher import PhraseMatcher
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

app = Flask(__name__)

# 1. Model load karo (Isme Tfidf Vectorizer pehle se include hai)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'role_prediction_model.pkl')

# Ab load karo
model = joblib.load(model_path)
ENHANCER_PATH = os.path.join(BASE_DIR, 'production_resume_model').replace("\\","/")
enhancer_tokenizer = AutoTokenizer.from_pretrained(ENHANCER_PATH)
enhancer_model = AutoModelForSeq2SeqLM.from_pretrained(ENHANCER_PATH)
# 2. Skill extraction ke liye spaCy load karo (agar tum skills ke base pe predict karna chahte ho)
nlp = spacy.load("en_core_web_sm")

# 3. Skill recommender model load karo
skill_model_path = os.path.join(BASE_DIR, 'model_dump.pkl')
with open(skill_model_path, 'rb') as f:
    skill_dump = pickle.load(f)
skill_df = skill_dump['dataframe']
skill_embeddings = skill_dump['embeddings']
skill_sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Skill recommender model loaded successfully!")
# Note: PhraseMatcher ko load karne ke liye patterns bhi save karne padenge, 
# par simple prediction ke liye text hi kafi hai.

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        resume_text = data.get('text', '')

        if not resume_text:
            return jsonify({'error': 'No text provided'}), 400

        # predict_proba se saari classes ki probability milti hai
        probabilities = model.predict_proba([resume_text])[0]
        classes = model.classes_

        # Sabhi roles ko confidence ke saath pair karo, descending sort
        role_confidence_pairs = sorted(
            zip(classes, probabilities),
            key=lambda x: x[1],
            reverse=True
        )

        # Top 4 roles lo — probabilities normalize karo taaki user ko samajh aaye
        top_4_pairs = role_confidence_pairs[:4]
        total_prob = sum(prob for _, prob in top_4_pairs)

        top_roles = []
        for role_name, prob in top_4_pairs:
            # Normalize: is role ka share kitna hai top 4 mein se
            normalized_conf = round((prob / total_prob) * 100, 1) if total_prob > 0 else 0
            top_roles.append({
                'role': str(role_name),
                'confidence': f"{normalized_conf}%"
            })

        return jsonify({
            'roles': top_roles,
            'role': top_roles[0]['role'],
            'confidence': top_roles[0]['confidence']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

import re

import fitz

@app.route('/parse-resume-file', methods=['POST'])
def parse_resume_file():
    try:
        pdf_bytes = request.data
        if not pdf_bytes:
            return jsonify({'error': 'No document provided'}), 400
        
        # Parse PDF graphically with PyMuPDF to preserve visual blocks/sections perfectly
        pdf_document = fitz.open("pdf", pdf_bytes)
        
        lines = []
        for page in pdf_document:
            blocks = page.get_text("blocks") 
            # Blocks are visually grouped paragraphs. Sort by vertical coordinate (y0)
            blocks.sort(key=lambda b: b[1])
            for b in blocks:
                if b[6] == 0: # 0 means text block
                    block_text = b[4].strip()
                    # Break block into visual lines
                    for line in block_text.split('\n'):
                        clean_line = line.strip()
                        if clean_line:
                            lines.append(clean_line)
                            
        clean_text = '\n'.join(lines)
        
        doc_nlp = nlp(clean_text[:3000])

        # 1. Contact Info
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,5}'
        url_pattern = r'https?://[^\s]+|www\.[^\s]+'
        
        emails = re.findall(email_pattern, clean_text)
        phones = re.findall(phone_pattern, clean_text)
        urls = re.findall(url_pattern, clean_text)

        email = emails[0] if emails else ""
        phone = phones[0] if phones else ""
        
        linkedin = ""
        website = ""
        for url in urls:
            if 'linkedin.com' in url.lower() or 'lnkd.in' in url.lower():
                linkedin = url
            elif 'github.com' in url.lower():
                website = url
            elif not website:
                website = url

        # 2. Name Extraction
        name = ""
        for line in lines[:8]:
            if '@' in line or re.search(r'\d', line) or 'github' in line.lower() or 'linkedin' in line.lower():
                continue
            words = line.split()
            if 1 <= len(words) <= 4 and all(w.isalpha() or '-' in w for w in words):
                name = line.title()
                break
                
        if not name:
            for ent in doc_nlp.ents:
                if ent.label_ == "PERSON" and '\n' not in ent.text and len(ent.text) < 30:
                    name = ent.text.title()
                    break

        # Section Chunking
        sections = {"summary": [], "experience": [], "education": [], "skills": [], "projects": [], "unknown": []}
        current_section = "unknown"
        
        section_keywords = {
            "experience": ["experience", "employment", "work history", "professional experience", "career", "work experience"],
            "education": ["education", "academic", "qualifications", "studies", "academic background"],
            "skills": ["skills", "technical skills", "technologies", "core competencies", "expertise", "it skills"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "summary": ["summary", "profile", "objective", "about me", "professional summary"]
        }

        for line in lines:
            line_lower = line.lower().strip()
            # If the line is short, it might be a header
            if len(line_lower) < 40:
                is_header = False
                for sec, keywords in section_keywords.items():
                    if line_lower in keywords or line_lower.replace(":", "") in keywords:
                        current_section = sec
                        is_header = True
                        break
                if is_header:
                    continue
            sections[current_section].append(line)

        # 3. Skills Extraction
        skill_list = [
            "python", "java", "c++", "c#", "javascript", "typescript", "react", "react.js", "angular", "vue", "vue.js",
            "node.js", "express", "django", "flask", "spring", "spring boot", "html", "html5", "css", "css3", "sass", 
            "sql", "mysql", "postgresql", "mongodb", "redis", "firebase", "aws", "azure", "gcp",
            "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "agile", "scrum", "machine learning",
            "deep learning", "nlp", "data analysis", "pandas", "numpy", "tensorflow", "pytorch",
            "linux", "bash", "rest api", "graphql", "tailwind", "bootstrap", "figma", "php", "laravel", "ruby", "go", "rust"
        ]
        
        extracted_skills = []
        # Check both skills section and overall text
        text_to_check_skills = " ".join(sections["skills"]) if sections["skills"] else clean_text
        text_lower = text_to_check_skills.lower()
        
        for skill in skill_list:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                proper_case = next(s for s in skill_list if s.lower() == skill)
                extracted_skills.append(proper_case)

        # 4. Education Extractions
        education = []
        degrees_list = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA', 'PhD', 'Bachelor', 'Master', 'B.E', 'M.E', 'Diploma', 'High School', 'Secondary']
        edu_keywords = ['university', 'college', 'institute', 'school', 'academy', 'technology', 'vidyalaya', 'b.tech', 'm.tech', 'degree', 'bachelor', 'b.sc', 'b.a']
        
        edu_lines = sections["education"] if sections["education"] else lines
        
        for i, line in enumerate(edu_lines):
            line_lower = line.lower()
            if any(k in line_lower for k in edu_keywords) and len(line) < 150:
                degree = "Degree"
                context = " ".join(edu_lines[max(0, i-2):i+3]).lower()
                for d in degrees_list:
                    if d.lower() in context or d.lower() in line_lower:
                        degree = d
                        break
                
                # Check year
                year_match = re.search(r'\b(19|20)\d{2}\b', line_lower)
                grad_date = year_match.group() if year_match else ""

                # Less aggressive deduplication: require exactly same degree and institution
                is_duplicate = any(e['institution'].lower() == line.lower() for e in education)
                if not is_duplicate:
                    education.append({
                        "institution": line.title(),
                        "degree": degree,
                        "field": "",
                        "graduation_date": grad_date,
                        "gpa": ""
                    })

        # 5. Experience Extractions
        experience = []
        # Support formats like: Jan 2020 - Mar 2022 or 2020 to Present
        date_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*(?:-|to|–)\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})'
        
        exp_lines = sections["experience"] if sections["experience"] else lines
        
        for i, line in enumerate(exp_lines):
            match = re.search(date_pattern, line, re.IGNORECASE)
            if match:
                start_date = match.group(1).title()
                end_date = match.group(2).title()
                
                company = "Company Name"
                position = "Professional"
                
                if i > 0:
                    position_candidate = exp_lines[i-1].title()
                    if len(position_candidate) < 60:
                        position = position_candidate
                if i > 1:
                    company_candidate = exp_lines[i-2].title()
                    if len(company_candidate) < 60 and not any(k in company_candidate.lower() for k in edu_keywords):
                        company = company_candidate
                        
                # Optionally get a description sentence
                desc = ""
                if i + 1 < len(exp_lines) and not re.search(date_pattern, exp_lines[i+1], re.IGNORECASE):
                    desc = exp_lines[i+1]
                    if len(desc) > 10 and len(desc) < 300:
                        pass # keep it
                    else:
                        desc = ""

                experience.append({
                    "company": company,
                    "position": position,
                    "start_date": start_date,
                    "end_date": end_date,
                    "description": desc,
                    "is_current": end_date.lower() in ['present', 'current']
                })

        # Summary
        summary = " ".join(sections["summary"])[:500] if sections["summary"] else ""

        # Predict Role — Top 4 roles with confidence
        predicted_role = "Undefined Role"
        predicted_roles = []
        try:
           if extracted_skills:
               extracted_skills_str = ", ".join(extracted_skills)
               probabilities = model.predict_proba([extracted_skills_str])[0]
               classes = model.classes_

               role_confidence_pairs = sorted(
                   zip(classes, probabilities),
                   key=lambda x: x[1],
                   reverse=True
               )

               top_4_pairs = role_confidence_pairs[:4]
               total_prob = sum(prob for _, prob in top_4_pairs)

               for role_name, prob in top_4_pairs:
                   normalized_conf = round((prob / total_prob) * 100, 1) if total_prob > 0 else 0
                   predicted_roles.append({
                       'role': str(role_name),
                       'confidence': f"{normalized_conf}%"
                   })

               predicted_role = predicted_roles[0]['role'] if predicted_roles else "Undefined Role"
        except Exception as pred_e:
           print("Prediction Warning:", pred_e)
           
        parsed_data = {
            "professional_summary": summary,
            "skills": [s.title() for s in extracted_skills],
            "personal_info": {
                "image": "",
                "full_name": name,
                "profession": predicted_role if 'Undefined' not in predicted_role else "",
                "email": email,
                "phone": phone,
                "location": "",
                "linkedin": linkedin,
                "website": website
            },
            "experience": experience,
            "project": [],
            "education": education,
            "predicted_role": predicted_role,
            "predicted_roles": predicted_roles
        }

        return jsonify(parsed_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Flask Error parsing resume: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
    
@app.route('/enhance-summary', methods=['POST'])
def ai_enhance_summary():
    try:
        data = request.get_json()
        user_text = data.get('text', '')

        if not user_text:
            return jsonify({'error': 'No content provided'}), 400

        input_text = "enhance resume: " + user_text
        inputs = enhancer_tokenizer(input_text, return_tensors="pt", max_length=256, truncation=True).input_ids
        
        with torch.no_grad():
            outputs = enhancer_model.generate(
                inputs, 
                min_length=64, max_length=512, 
                num_beams=5, do_sample=True, 
                temperature=0.9, repetition_penalty=1.5
            )
        
        enhanced_content = enhancer_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return jsonify({'enhancedContent': enhanced_content})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/check-ats', methods=['POST'])
def check_ats():
    """ATS Health Check — analyzes a resume PDF for ATS compatibility and returns a detailed score breakdown."""
    try:
        pdf_bytes = request.data
        if not pdf_bytes:
            return jsonify({'error': 'No document provided'}), 400

        # Parse PDF
        pdf_document = fitz.open("pdf", pdf_bytes)

        lines = []
        for page in pdf_document:
            blocks = page.get_text("blocks")
            blocks.sort(key=lambda b: b[1])
            for b in blocks:
                if b[6] == 0:
                    block_text = b[4].strip()
                    for line in block_text.split('\n'):
                        clean_line = line.strip()
                        if clean_line:
                            lines.append(clean_line)

        clean_text = '\n'.join(lines)
        text_lower = clean_text.lower()
        total_words = len(clean_text.split())

        # ============ RESUME VALIDATION (Strong) ============
        # Score-based system: resume signals add points, non-resume signals subtract points
        resume_score = 0

        # --- Positive signals (resume-like) ---

        # Contact info (+1 each)
        if re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', clean_text):
            resume_score += 1
        if re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,5}', clean_text):
            resume_score += 1

        # CORE: Resume section headings — most important signal (+2 each, max +8)
        resume_headings = ['experience', 'education', 'skills', 'summary', 'objective',
                           'qualifications', 'projects', 'work history', 'professional experience',
                           'technical skills', 'achievements', 'certifications', 'internship',
                           'career objective', 'core competencies', 'work experience']
        heading_hits = 0
        for line in lines:
            line_clean = line.lower().strip().replace(":", "")
            if len(line_clean) < 40 and line_clean in resume_headings:
                heading_hits += 1
        resume_score += min(heading_hits * 2, 8)

        # Degree/qualification mentions (+2)
        degree_names = ['b.tech', 'm.tech', 'bachelor', 'master', 'phd', 'diploma', 'bca', 'mca',
                        'b.sc', 'm.sc', 'bba', 'mba', 'b.e', 'm.e', 'b.com', 'm.com',
                        'bse', 'mse', 'associate degree', 'high school diploma']
        if any(d in text_lower for d in degree_names):
            resume_score += 2

        # Employment date ranges like "Jan 2020 - Present" (+1)
        date_ranges = re.findall(
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{4})\s*[-–—to]+\s*(?:present|current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{4})',
            clean_text, re.IGNORECASE)
        if len(date_ranges) >= 1:
            resume_score += 1

        # Career/resume-specific vocabulary (+1 each, max +2)
        career_vocab = ['resume', 'curriculum vitae', 'cv', 'work experience', 'employment history',
                        'career summary', 'professional profile', 'job title', 'designation',
                        'references available', 'gpa', 'cgpa']
        career_hits = sum(1 for w in career_vocab if w in text_lower)
        resume_score += min(career_hits, 2)

        # --- Negative signals (NOT a resume) ---

        non_resume_keywords = [
            # Proposal
            'proposal', 'scope of work', 'deliverables', 'milestones', 'project timeline',
            'payment terms', 'payment schedule', 'cost estimate', 'pricing', 'quotation',
            'statement of work', 'rfp', 'request for proposal', 'proposed solution',
            # Invoice / Receipt
            'invoice', 'bill to', 'total amount', 'subtotal', 'purchase order',
            'receipt', 'tax invoice', 'amount due', 'billing address',
            # Contract / Agreement
            'terms and conditions', 'agreement', 'whereas', 'hereinafter',
            'party of the first part', 'executed on', 'binding agreement',
            # Meeting / Memo
            'meeting minutes', 'agenda', 'memorandum', 'minutes of meeting',
            'attendees', 'action items',
            # Report / Article
            'table of contents', 'abstract', 'introduction', 'conclusion',
            'bibliography', 'references cited', 'chapter',
            # Letter
            'dear sir', 'dear madam', 'to whom it may concern', 'yours sincerely',
            'yours faithfully', 'warm regards',
        ]
        non_resume_hits = sum(1 for k in non_resume_keywords if k in text_lower)
        resume_score -= non_resume_hits * 2  # Strong penalty per hit

        # --- Decision: need at least 5 points to be a resume ---
        # A real resume with "Experience", "Education", "Skills" headings + email = 5+ easily
        # A proposal with email + phone but 3 non-resume keywords = 2 - 6 = negative
        if resume_score < 5:
            pdf_document.close()
            return jsonify({
                'error': 'not_a_resume',
                'message': 'This file does not appear to be a resume. It may be a proposal, invoice, report, or other document. Please upload a valid resume PDF with sections like Experience, Education, and Skills.'
            }), 400

        # ============ ATS SCORING CATEGORIES ============

        scores = {}
        suggestions = []
        details = {}

        # --- 1. CONTACT INFORMATION (15 points) ---
        contact_score = 0
        contact_items = []

        email_found = bool(re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', clean_text))
        phone_found = bool(re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,5}', clean_text))
        linkedin_found = 'linkedin.com' in text_lower or 'lnkd.in' in text_lower
        name_found = False
        for line in lines[:8]:
            if '@' not in line and not re.search(r'\d', line):
                words = line.split()
                if 1 <= len(words) <= 4 and all(w.isalpha() or '-' in w for w in words):
                    name_found = True
                    break

        if name_found:
            contact_score += 4
            contact_items.append({"label": "Full Name", "found": True})
        else:
            contact_items.append({"label": "Full Name", "found": False})
            suggestions.append("Add your full name clearly at the top of your resume.")

        if email_found:
            contact_score += 4
            contact_items.append({"label": "Email Address", "found": True})
        else:
            contact_items.append({"label": "Email Address", "found": False})
            suggestions.append("Add a professional email address to your resume.")

        if phone_found:
            contact_score += 4
            contact_items.append({"label": "Phone Number", "found": True})
        else:
            contact_items.append({"label": "Phone Number", "found": False})
            suggestions.append("Add a phone number so recruiters can reach you.")

        if linkedin_found:
            contact_score += 3
            contact_items.append({"label": "LinkedIn Profile", "found": True})
        else:
            contact_items.append({"label": "LinkedIn Profile", "found": False})
            suggestions.append("Add your LinkedIn profile URL to improve credibility.")

        scores["contact_info"] = {"score": contact_score, "max": 15, "items": contact_items}

        # --- 2. SECTION HEADINGS (15 points) ---
        section_score = 0
        section_items = []

        required_sections = {
            "Professional Summary / Objective": ["summary", "objective", "profile", "about me", "professional summary"],
            "Work Experience": ["experience", "employment", "work history", "professional experience", "work experience"],
            "Education": ["education", "academic", "qualifications"],
            "Skills": ["skills", "technical skills", "core competencies", "expertise"],
            "Projects": ["projects", "personal projects", "academic projects", "key projects"]
        }

        for section_name, keywords in required_sections.items():
            found = False
            for line in lines:
                line_clean = line.lower().strip().replace(":", "")
                if line_clean in keywords or any(k == line_clean for k in keywords):
                    found = True
                    break
            if found:
                section_score += 3
                section_items.append({"label": section_name, "found": True})
            else:
                section_items.append({"label": section_name, "found": False})
                suggestions.append(f"Add a clear '{section_name}' section heading for better ATS parsing.")

        scores["section_headings"] = {"score": section_score, "max": 15, "items": section_items}

        # --- 3. PROFESSIONAL SUMMARY (10 points) ---
        summary_section_lines = []
        in_summary = False
        summary_keywords = ["summary", "objective", "profile", "about me", "professional summary"]
        experience_keywords_list = ["experience", "employment", "education", "skills", "projects"]

        for line in lines:
            line_clean = line.lower().strip().replace(":", "")
            if line_clean in summary_keywords:
                in_summary = True
                continue
            if in_summary and line_clean in experience_keywords_list:
                break
            if in_summary:
                summary_section_lines.append(line)

        summary_text = " ".join(summary_section_lines)
        summary_word_count = len(summary_text.split()) if summary_text else 0
        summary_score = 0
        summary_items = []

        if summary_word_count >= 30:
            summary_score += 5
            summary_items.append({"label": "Summary Present (30+ words)", "found": True})
        elif summary_word_count > 0:
            summary_score += 2
            summary_items.append({"label": "Summary Present (too short)", "found": False})
            suggestions.append("Expand your professional summary to at least 30 words for better ATS scoring.")
        else:
            summary_items.append({"label": "Summary Present", "found": False})
            suggestions.append("Add a professional summary/objective at the top of your resume.")

        # Check for action words in summary
        action_words = ["developed", "managed", "led", "created", "designed", "implemented",
                        "built", "improved", "delivered", "analyzed", "optimized", "achieved",
                        "increased", "reduced", "launched", "coordinated", "established",
                        "experienced", "skilled", "proficient", "expertise", "passionate"]
        action_found = sum(1 for w in action_words if w in summary_text.lower())
        if action_found >= 3:
            summary_score += 5
            summary_items.append({"label": "Strong Action Words Used", "found": True})
        elif action_found >= 1:
            summary_score += 2
            summary_items.append({"label": "Some Action Words (add more)", "found": False})
            suggestions.append("Use more action/power words in your summary (e.g., 'developed', 'managed', 'led').")
        else:
            summary_items.append({"label": "Action Words in Summary", "found": False})
            suggestions.append("Include action words like 'developed', 'managed', 'led' in your summary.")

        scores["professional_summary"] = {"score": summary_score, "max": 10, "items": summary_items}

        # --- 4. WORK EXPERIENCE (20 points) ---
        exp_score = 0
        exp_items = []
        date_pattern_ats = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*(?:-|to|–)\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})'
        date_matches = re.findall(date_pattern_ats, clean_text, re.IGNORECASE)

        if len(date_matches) >= 2:
            exp_score += 7
            exp_items.append({"label": f"Date Ranges Found ({len(date_matches)})", "found": True})
        elif len(date_matches) == 1:
            exp_score += 3
            exp_items.append({"label": "Only 1 Date Range Found", "found": False})
            suggestions.append("Add more work experience entries with clear date ranges (e.g., 'Jan 2020 - Mar 2022').")
        else:
            exp_items.append({"label": "Date Ranges in Experience", "found": False})
            suggestions.append("Add clear date ranges to your experience entries (e.g., 'Jan 2020 - Mar 2022').")

        # Check for bullet points / quantifiable achievements
        bullet_lines = [l for l in lines if l.startswith(('•', '-', '–', '→', '●', '▪', '*'))]
        if len(bullet_lines) >= 5:
            exp_score += 7
            exp_items.append({"label": f"Bullet Points ({len(bullet_lines)})", "found": True})
        elif len(bullet_lines) >= 2:
            exp_score += 3
            exp_items.append({"label": f"Few Bullet Points ({len(bullet_lines)})", "found": False})
            suggestions.append("Add more bullet points to describe your achievements and responsibilities.")
        else:
            exp_items.append({"label": "Bullet Points for Responsibilities", "found": False})
            suggestions.append("Use bullet points to list your responsibilities and achievements clearly.")

        # Quantifiable results (numbers/metrics)
        number_matches = re.findall(r'\b\d+[%+]?\b', clean_text)
        metric_words = [w for w in number_matches if len(w) > 1]
        if len(metric_words) >= 3:
            exp_score += 6
            exp_items.append({"label": "Quantifiable Metrics/Numbers", "found": True})
        elif len(metric_words) >= 1:
            exp_score += 2
            exp_items.append({"label": "Few Metrics (add more numbers)", "found": False})
            suggestions.append("Add more quantifiable achievements (e.g., 'Increased sales by 30%', 'Managed team of 5').")
        else:
            exp_items.append({"label": "Quantifiable Metrics", "found": False})
            suggestions.append("Include numbers and metrics to quantify your achievements (e.g., percentages, team sizes).")

        scores["work_experience"] = {"score": exp_score, "max": 20, "items": exp_items}

        # --- 5. SKILLS (15 points) ---
        skills_score = 0
        skills_items = []

        ats_skill_list = [
            "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue",
            "node.js", "express", "django", "flask", "spring", "spring boot", "html", "css", "sass",
            "sql", "mysql", "postgresql", "mongodb", "redis", "firebase", "aws", "azure", "gcp",
            "docker", "kubernetes", "jenkins", "git", "github", "agile", "scrum", "machine learning",
            "deep learning", "nlp", "data analysis", "pandas", "numpy", "tensorflow", "pytorch",
            "linux", "bash", "rest api", "graphql", "tailwind", "bootstrap", "php", "laravel",
            "ruby", "go", "rust", "figma", "excel", "power bi", "tableau", "jira", "communication",
            "leadership", "problem solving", "teamwork", "project management", "time management",
            "critical thinking", "adaptability", "creativity"
        ]

        found_skills = []
        for skill in ats_skill_list:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill.title())

        if len(found_skills) >= 10:
            skills_score += 10
            skills_items.append({"label": f"Skills Found ({len(found_skills)})", "found": True})
        elif len(found_skills) >= 5:
            skills_score += 6
            skills_items.append({"label": f"Some Skills Found ({len(found_skills)})", "found": False})
            suggestions.append("Add more relevant skills to pass ATS keyword filters. Aim for 10+ skills.")
        elif len(found_skills) >= 1:
            skills_score += 3
            skills_items.append({"label": f"Few Skills Found ({len(found_skills)})", "found": False})
            suggestions.append("Your skills section is weak. Add more industry-relevant skills.")
        else:
            skills_items.append({"label": "Skills Found", "found": False})
            suggestions.append("Add a clear skills section with relevant technical and soft skills.")

        # Check for both hard and soft skills
        soft_skills = ["communication", "leadership", "problem solving", "teamwork", "project management",
                       "time management", "critical thinking", "adaptability", "creativity"]
        has_soft = any(re.search(r'\b' + re.escape(s) + r'\b', text_lower) for s in soft_skills)
        hard_found = [s for s in found_skills if s.lower() not in soft_skills]

        if has_soft and len(hard_found) >= 3:
            skills_score += 5
            skills_items.append({"label": "Mix of Hard & Soft Skills", "found": True})
        elif has_soft or len(hard_found) >= 3:
            skills_score += 2
            skills_items.append({"label": "Skill Variety (needs balance)", "found": False})
            if not has_soft:
                suggestions.append("Add soft skills like 'communication', 'leadership', 'teamwork' alongside technical skills.")
            else:
                suggestions.append("Add more technical/hard skills to complement your soft skills.")
        else:
            skills_items.append({"label": "Skill Variety", "found": False})

        scores["skills"] = {"score": skills_score, "max": 15, "items": skills_items, "found_skills": found_skills}

        # --- 6. EDUCATION (10 points) ---
        edu_score = 0
        edu_items = []
        edu_kw = ['university', 'college', 'institute', 'school', 'academy', 'b.tech', 'm.tech',
                   'bachelor', 'master', 'phd', 'degree', 'diploma', 'bca', 'mca', 'b.sc', 'm.sc', 'mba']

        has_edu = any(any(k in line.lower() for k in edu_kw) for line in lines)
        if has_edu:
            edu_score += 5
            edu_items.append({"label": "Education Details Present", "found": True})
        else:
            edu_items.append({"label": "Education Details", "found": False})
            suggestions.append("Add your education details (degree, institution, graduation year).")

        # Check for graduation year
        edu_year = any(re.search(r'\b(19|20)\d{2}\b', line) for line in lines if any(k in line.lower() for k in edu_kw))
        if edu_year:
            edu_score += 3
            edu_items.append({"label": "Graduation Year", "found": True})
        else:
            edu_items.append({"label": "Graduation Year", "found": False})
            suggestions.append("Include your graduation year in the education section.")

        # Check for degree name
        degree_names = ['b.tech', 'm.tech', 'bca', 'mca', 'b.sc', 'm.sc', 'b.com', 'm.com',
                        'bba', 'mba', 'phd', 'bachelor', 'master', 'b.e', 'm.e', 'diploma']
        has_degree = any(d in text_lower for d in degree_names)
        if has_degree:
            edu_score += 2
            edu_items.append({"label": "Degree Name Specified", "found": True})
        else:
            edu_items.append({"label": "Degree Name", "found": False})
            suggestions.append("Specify your degree name (e.g., B.Tech, MBA, Bachelor of Science).")

        scores["education"] = {"score": edu_score, "max": 10, "items": edu_items}

        # --- 7. FORMATTING & READABILITY (15 points) ---
        format_score = 0
        format_items = []

        # Word count check (300-1000 for 1-page is ideal)
        if 300 <= total_words <= 1200:
            format_score += 5
            format_items.append({"label": f"Good Length ({total_words} words)", "found": True})
        elif total_words < 300:
            format_score += 2
            format_items.append({"label": f"Too Short ({total_words} words)", "found": False})
            suggestions.append(f"Your resume is too short ({total_words} words). Aim for 300-800 words for a strong 1-page resume.")
        else:
            format_score += 3
            format_items.append({"label": f"Lengthy ({total_words} words)", "found": False})
            suggestions.append(f"Your resume is quite long ({total_words} words). Consider trimming to keep it concise.")

        # Page count check
        page_count = pdf_document.page_count
        if page_count <= 2:
            format_score += 4
            format_items.append({"label": f"Good Page Count ({page_count})", "found": True})
        else:
            format_score += 1
            format_items.append({"label": f"Too Many Pages ({page_count})", "found": False})
            suggestions.append(f"Your resume is {page_count} pages. Keep it to 1-2 pages for best ATS results.")

        # Check for common ATS-unfriendly elements
        has_tables = any(b[6] == 1 for page in pdf_document for b in page.get_text("blocks"))
        if not has_tables:
            format_score += 3
            format_items.append({"label": "No Complex Tables/Images", "found": True})
        else:
            format_score += 1
            format_items.append({"label": "Contains Tables/Images", "found": False})
            suggestions.append("Avoid tables, images, and complex layouts — ATS systems may not parse them correctly.")

        # Check file is PDF (it is since we received it)
        format_score += 3
        format_items.append({"label": "PDF Format", "found": True})

        scores["formatting"] = {"score": format_score, "max": 15, "items": format_items}

        # ============ TOTAL SCORE ============
        total_score = sum(cat["score"] for cat in scores.values())
        max_score = sum(cat["max"] for cat in scores.values())
        percentage = round((total_score / max_score) * 100) if max_score > 0 else 0

        # Rating label
        if percentage >= 80:
            rating = "Excellent"
            rating_color = "green"
        elif percentage >= 60:
            rating = "Good"
            rating_color = "blue"
        elif percentage >= 40:
            rating = "Needs Improvement"
            rating_color = "orange"
        else:
            rating = "Poor"
            rating_color = "red"

        pdf_document.close()

        return jsonify({
            "ats_score": percentage,
            "total_score": total_score,
            "max_score": max_score,
            "rating": rating,
            "rating_color": rating_color,
            "categories": scores,
            "suggestions": suggestions,
            "found_skills": found_skills,
            "word_count": total_words,
            "page_count": page_count
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/recommend-skills', methods=['POST'])
def recommend_skills():
    """Role + Level se skills recommend karta hai using semantic search."""
    try:
        data = request.get_json()
        role = data.get('role', '').strip()
        level = data.get('level', '').strip().lower()

        if not role:
            return jsonify({'error': 'Role is required'}), 400

        # Level mapping
        level_mapping = {
            'fresher': 'junior', 'entry-level': 'junior', 'junior': 'junior',
            'mid-level': 'mid-level', 'mid-senior level': 'mid-level',
            'mid-senior': 'mid-level', 'experienced': 'mid-level',
            'senior-level': 'senior', 'senior': 'senior', 'lead': 'lead'
        }
        standard_level = level_mapping.get(level, '')

        # Semantic search: user ke role ko encode karo
        query_embedding = skill_sentence_model.encode([role])

        # Cosine similarity calculate karo
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(query_embedding, skill_embeddings)[0]

        # Top matches filter karo
        top_indices = np.argsort(similarities)[::-1]

        # Level filter lagao agar level diya hai
        matched_rows = []
        for idx in top_indices:
            sim_score = similarities[idx]
            if sim_score < 0.3:
                break
            row = skill_df.iloc[idx]
            if standard_level and row.get('standard_level') != standard_level:
                continue
            matched_rows.append({
                'title': row['Title'],
                'level': row.get('standard_level', row.get('ExperienceLevel', '')),
                'skills': row['cleaned_skills_list'],
                'similarity': round(float(sim_score), 3)
            })
            if len(matched_rows) >= 20:
                break

        # Agar level se kuch nahi mila toh without level filter try karo
        if not matched_rows and standard_level:
            for idx in top_indices[:50]:
                sim_score = similarities[idx]
                if sim_score < 0.3:
                    break
                row = skill_df.iloc[idx]
                matched_rows.append({
                    'title': row['Title'],
                    'level': row.get('standard_level', row.get('ExperienceLevel', '')),
                    'skills': row['cleaned_skills_list'],
                    'similarity': round(float(sim_score), 3)
                })
                if len(matched_rows) >= 20:
                    break

        if not matched_rows:
            return jsonify({
                'role': role,
                'level': standard_level or level,
                'skills': [],
                'matched_titles': [],
                'message': 'No matching roles found. Try a different role name.'
            })

        # Aggregate skills — frequency count karo across all matched jobs
        skill_frequency = {}
        for match in matched_rows:
            for skill in match['skills']:
                skill_clean = skill.strip().title()
                if len(skill_clean) > 1:
                    skill_frequency[skill_clean] = skill_frequency.get(skill_clean, 0) + 1

        # Sort by frequency (most common first)
        sorted_skills = sorted(skill_frequency.items(), key=lambda x: x[1], reverse=True)

        # Categorize: must-have (>50% matches), good-to-have (25-50%), bonus (<25%)
        total_matches = len(matched_rows)
        must_have = []
        good_to_have = []
        bonus_skills = []

        for skill_name, count in sorted_skills:
            percentage = (count / total_matches) * 100
            skill_obj = {'name': skill_name, 'frequency': count, 'percentage': round(percentage, 1)}
            if percentage >= 50:
                must_have.append(skill_obj)
            elif percentage >= 25:
                good_to_have.append(skill_obj)
            else:
                bonus_skills.append(skill_obj)

        # Matched titles for display
        matched_titles = [{'title': m['title'], 'level': m['level'], 'similarity': m['similarity']} for m in matched_rows[:8]]

        return jsonify({
            'role': role,
            'level': standard_level or level or 'all levels',
            'must_have': must_have[:15],
            'good_to_have': good_to_have[:10],
            'bonus_skills': bonus_skills[:10],
            'total_skills': len(sorted_skills),
            'matched_titles': matched_titles,
            'total_matches': total_matches
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5001, debug=True)