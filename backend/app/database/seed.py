"""
Inkloom AI Multi-Tenant Database Seeder
Seeds safe synthetic demo workspaces, role accounts, guidelines, assets, and audit findings
for Hackathon Demo and local evaluation.
"""
from datetime import datetime, timezone, timedelta
from app.database.session import SessionLocal
from app.core.security import hash_password
from app.models import (
    Organization,
    User,
    Membership,
    Invitation,
    BrandGuideline,
    BrandGuidelineVersion,
    GuidelineRule,
    ApprovedAsset,
    ContentSubmission,
    ContentRevision,
    AuditRun,
    AuditFinding,
    AuditEvent,
)


ACME_MASTER_BRAND_DATA = {
    "identity": {
        "brand_name": "Acme Cloud Systems",
        "tagline": "Autonomous Zero-Trust Infrastructure for the AI-Native Enterprise",
        "description": "Acme Cloud Systems provides high-performance, mathematically verifiable hybrid cloud compute and automated zero-trust security infrastructure for regulated global enterprises.",
        "industry": "Enterprise Cloud & Infrastructure",
        "mission": "Empowering resilient, sovereign computing that scales fearlessly across global multi-cloud boundaries.",
        "vision": "To be the undisputed foundation of mission-critical AI workloads and zero-trust cloud fabrics worldwide.",
        "values": ["Zero-Trust Rigor", "Transparent Reliability", "Developer Empowerment", "Sustainable Scale"],
        "positioning": "The premier enterprise cloud infrastructure platform combining silicon-grade isolation with effortless developer velocity.",
        "target_market": "Global Fortune 500, High-Frequency Fintech, Healthcare & Defense Technology",
        "primary_audience": "Chief Technology Officers, VP Infrastructure, Principal Platform Architects",
        "secondary_audience": "Site Reliability Engineers, DevSecOps Leads, Cloud Security Auditors",
        "personality": ["Authoritative", "Empowering", "Consultative", "Precise", "Sophisticated"],
        "differentiators": ["Sub-50ms Global Core Latency", "Verified Multi-Region Isolation", "Zero Proprietary Lock-In"],
        "preferred_language": "English (US)",
        "supported_languages": ["English (US)", "English (UK)", "German", "Japanese"],
        "website_url": "https://acmecloud.com",
        "social_links": [
            {"platform": "LinkedIn", "url": "https://linkedin.com/company/acme-cloud"},
            {"platform": "X", "url": "https://x.com/acmecloud"},
        ],
        "contact_email": "brand@acmecloud.com",
    },
    "voice": {
        "brand_tone": ["Authoritative", "Consultative", "Engineering-Grade", "Empowering"],
        "formality_level": "professional",
        "personality_traits": ["Direct", "Evidence-Based", "Calm", "No-Hype"],
        "communication_style": "Clear, technical precision backed by empirical benchmarks rather than marketing hype.",
        "preferred_vocabulary": ["zero-trust fabric", "verified uptime", "deterministic throughput", "resilient compute", "low-latency mesh"],
        "words_to_use": ["verifiable", "deterministic", "engineered", "resilient", "autonomous", "proven"],
        "words_to_avoid": ["Inkloom Cloud Suite", "CloudSpeed", "HyperScale", "magic", "miracle", "foolproof", "destroying competition", "guaranteed 100% reduction"],
        "writing_style": "Active voice, concise sentences, evidence-first claims.",
        "sentence_length_preference": "concise",
        "technical_terminology": "Always define three-letter acronyms on first mention (e.g. Virtual Private Cloud (VPC)).",
        "humor_preference": "none",
        "emotional_tone": "Reassuring, confident, consultative.",
        "cta_style": "Actionable and descriptive, e.g. 'Deploy Zero-Trust Cluster' rather than generic 'Click Here'.",
        "headline_preferences": "Clear benefit-driven value statements under 10 words.",
        "caption_rules": "Describe technical architecture or benchmark conditions clearly.",
        "grammar_conventions": "Oxford comma required. Sentence case for UI actions and title case for major headings.",
        "inclusive_communication": "Use gender-neutral pronouns. Avoid legacy master/slave terminology in favor of primary/replica.",
        "approved_copy_examples": [
            {"context": "Homepage Headline", "text": "Engineered for 99.999% Verified Resilience Under Peak Distributed Workloads."},
            {"context": "Product Feature Copy", "text": "Deploy microsecond packet routing across 42 sovereign cloud zones without vendor lock-in."},
        ],
        "prohibited_copy_examples": [
            {"context": "Urgency Sales Copy", "text": "Hurry up before your competitors crush you!", "reason": "Violates anti-FUD policy."},
            {"context": "Unverified Quantitative Claim", "text": "Guaranteed 100% reduction in all infrastructure costs.", "reason": "Absolute claims violate legal disclosure rules."},
        ],
    },
    "colors": {
        "palette": [
            {"id": "col_pri", "name": "Acme Midnight Slate", "hex": "#0F172A", "rgb": "rgb(15, 23, 42)", "role": "primary", "usage_intent": "Core brand background and high-contrast typography", "restrictions": "Mandatory base for enterprise documentation and primary layouts", "status": "mandatory"},
            {"id": "col_ind", "name": "Electric Indigo", "hex": "#6366F1", "rgb": "rgb(99, 102, 241)", "role": "accent", "usage_intent": "Primary interactive elements, call-to-actions, and focus indicators", "restrictions": "Must maintain 4.5:1 contrast against dark backgrounds", "status": "mandatory"},
            {"id": "col_sky", "name": "Sovereign Sky", "hex": "#0284C7", "rgb": "rgb(2, 132, 199)", "role": "secondary", "usage_intent": "Data visualization, infrastructure status, and secondary links", "restrictions": "Do not use for body paragraph text", "status": "preferred"},
            {"id": "col_eme", "name": "Verified Emerald", "hex": "#10B981", "rgb": "rgb(16, 185, 129)", "role": "semantic", "usage_intent": "Passed audit benchmarks, 99.99% uptime badges, and verified status", "restrictions": "Reserved strictly for positive system confirmations", "status": "mandatory"},
            {"id": "col_amb", "name": "Caution Amber", "hex": "#F59E0B", "rgb": "rgb(245, 158, 11)", "role": "semantic", "usage_intent": "High-latency alerts, pending audits, and reviewer triage flags", "restrictions": "Use only for advisory notices", "status": "preferred"},
            {"id": "col_ros", "name": "Critical Rose", "hex": "#EF4444", "rgb": "rgb(239, 68, 68)", "role": "semantic", "usage_intent": "Governance violations, broken safe-area margins, and non-compliance", "restrictions": "Never use as a decorative accent", "status": "mandatory"},
            {"id": "col_neu", "name": "Neutral Steel", "hex": "#94A3B8", "rgb": "rgb(148, 163, 184)", "role": "neutral", "usage_intent": "Borders, placeholder copy, secondary captions, and structural lines", "restrictions": "Ensure secondary text readability", "status": "preferred"},
        ],
        "contrast_rules": {
            "min_ratio_normal": 4.5,
            "min_ratio_large": 3.0,
            "notes": "All client-facing assets must strictly comply with WCAG 2.1 Level AA standards.",
        },
    },
    "typography": {
        "primary_font": "Inter",
        "secondary_font": "Roboto",
        "display_font": "Outfit",
        "monospace_font": "JetBrains Mono",
        "approved_weights": ["Regular (400)", "Medium (500)", "Semi-Bold (600)", "Bold (700)", "Extra-Bold (800)"],
        "fallback_fonts": ["system-ui", "-apple-system", "sans-serif"],
        "restrictions": "Never substitute serif or script typefaces. Decorative drop-shadows on typography are strictly prohibited.",
        "licensing_notes": "All approved typefaces are licensed under open SIL OFL or enterprise commercial multi-seat licenses.",
        "presets": [
            {"name": "H1", "font_family": "Outfit", "font_weight": "800", "font_size": "36px", "line_height": "44px", "letter_spacing": "-0.02em", "text_case": "none", "intended_usage": "Primary hero banners and executive presentation titles"},
            {"name": "H2", "font_family": "Outfit", "font_weight": "700", "font_size": "28px", "line_height": "36px", "letter_spacing": "-0.01em", "text_case": "none", "intended_usage": "Section headings and modal titles"},
            {"name": "H3", "font_family": "Inter", "font_weight": "600", "font_size": "20px", "line_height": "28px", "letter_spacing": "-0.005em", "text_case": "none", "intended_usage": "Card titles, subsection dividers"},
            {"name": "Body", "font_family": "Inter", "font_weight": "400", "font_size": "15px", "line_height": "24px", "letter_spacing": "0em", "text_case": "none", "intended_usage": "Standard paragraphs, documentation, and product descriptions"},
            {"name": "Small", "font_family": "Inter", "font_weight": "500", "font_size": "13px", "line_height": "18px", "letter_spacing": "0em", "text_case": "none", "intended_usage": "Table rows, metadata tags, and sidebar items"},
            {"name": "Caption", "font_family": "Inter", "font_weight": "400", "font_size": "12px", "line_height": "16px", "letter_spacing": "0.01em", "text_case": "none", "intended_usage": "Image captions, footnotes, and timestamps"},
            {"name": "CTA", "font_family": "Inter", "font_weight": "700", "font_size": "14px", "line_height": "20px", "letter_spacing": "0.02em", "text_case": "none", "intended_usage": "Interactive buttons, links, and high-visibility actions"},
            {"name": "Legal", "font_family": "Inter", "font_weight": "400", "font_size": "11px", "line_height": "15px", "letter_spacing": "0em", "text_case": "none", "intended_usage": "Disclaimers, copyright notices, and patent disclosures"},
        ],
    },
    "logos": {
        "variants": [
            {"id": "logo_pri", "name": "Primary Acme Wordmark", "type": "primary", "image_url": "https://assets.acmecloud.com/logos/acme-primary.svg", "min_width_px": 140, "min_height_px": 32, "clear_space_formula": "Minimum padding equal to height of letter 'A' or 24px on all sides", "preferred_placement": "Top-left or centered upper-third", "approved_backgrounds": "Dark slate (#0F172A) or clean neutral white (#FFFFFF)", "permitted_modifications": "Monochrome white or black exports only", "prohibited_modifications": "No drop shadows, stretching, distortion, or background gradients behind wordmark"},
            {"id": "logo_ico", "name": "Acme Sovereign Icon / Monogram", "type": "icon", "image_url": "https://assets.acmecloud.com/logos/acme-icon.svg", "min_width_px": 32, "min_height_px": 32, "clear_space_formula": "12px all sides", "preferred_placement": "App favicons, profile avatars, and compact toolbars", "approved_backgrounds": "Universal", "permitted_modifications": "Color fill in Electric Indigo or White", "prohibited_modifications": "No rotation or partial occlusion"},
        ],
        "partner_rules": "Partner logos must be separated by a 1px solid vertical divider (#475569) with at least 32px horizontal spacing.",
        "co_branding_rules": "Acme wordmark must always have equal or prominent visual weight in joint press releases.",
    },
    "visual_identity": {
        "overall_style": "Clean, modern, cyber-architectural, high-fidelity dark aesthetic with focused vibrant accents.",
        "photography_aesthetic": "Real engineering teams, clean server architecture, authentic collaborative workspaces. Avoid generic stock photos.",
        "illustration_style": "Isometric vector diagrams, precise infrastructure schematics, clean geometric topology.",
        "graphic_design_style": "Editorial layout with generous negative space, crisp border dividers, and subtle glassmorphic panels.",
        "iconography_style": "Monoline 2px stroke icons with rounded caps (Lucide / Heroicons style).",
        "shapes_and_patterns": "Subtle 24px dot grids and isometric circuit nodes.",
        "background_treatment": "Deep dark slate with subtle radial lighting vignettes.",
        "textures": "Subtle mesh gradients and fine mathematical noise.",
        "use_of_gradients": "Restrained linear gradients between Indigo (#6366F1) and Sky (#0284C7).",
        "visual_density": "balanced",
        "composition": "Left-anchored content with balanced right-side schematic visuals.",
        "negative_space": "Maintain minimum 30% negative space on all major marketing collaterals.",
        "image_treatment": "Natural contrast, slightly cool color temperature, authentic lighting.",
        "color_grading": "Cool tone balance (5200K - 5600K) with deep shadow retention.",
        "preferred_styles_examples": ["Isometric network topology diagrams", "Candid engineering war-room photos"],
        "prohibited_styles_examples": ["Cartoon caricatures", "Cheesy handshake stock photography", "Neon lens flares"],
    },
    "layout_spacing": {
        "alignment": "left",
        "grid_system": "8pt grid system with 12-column responsive layout",
        "spacing_principles": "Multiples of 8px (8, 16, 24, 32, 48, 64px) for all margins and padding.",
        "padding_guidelines": "Cards require 24px internal padding; modals require 32px padding.",
        "border_divider_usage": "1px solid border (#1E293B) with subtle opacity.",
        "corner_radius": "12px for standard cards and containers; 8px for buttons; 9999px for status pills.",
        "shadow_usage": "Subtle elevation shadows: 0 10px 25px -5px rgba(0, 0, 0, 0.4).",
        "content_hierarchy": "Eyebrow tag -> Main Title -> Subtitle -> Supporting Body -> Action Group.",
        "logo_to_content_spacing": "Minimum 32px separation between logo and nearest headline or visual element.",
        "safe_area_principles": "Never place text within 24px of any canvas edge.",
    },
    "dos_and_donts": [
        {"id": "rule_1", "title": "Always Validate Quantitative Claims", "description": "Every latency or uptime percentage must cite certified benchmarks and testing methodology.", "type": "mandatory", "priority": "critical"},
        {"id": "rule_2", "title": "Maintain Wordmark Safe Area Margin", "description": "Ensure at least 24px margin padding around all four sides of the primary logo.", "type": "mandatory", "priority": "high"},
        {"id": "rule_3", "title": "No Fear, Uncertainty, or Doubt (Anti-FUD)", "description": "Never use fear-inducing sales tactics or aggressive competitor bashing.", "type": "prohibited", "priority": "high"},
        {"id": "rule_4", "title": "Adhere to Approved Color Palettes", "description": "Do not introduce arbitrary unapproved neon or pastel hues outside official brand specifications.", "type": "prohibited", "priority": "medium"},
        {"id": "rule_5", "title": "Consistent Call-to-Action Terminology", "description": "Use descriptive action verbs (e.g. 'Deploy Sovereign Mesh') instead of vague 'Click Here'.", "type": "recommended", "priority": "low"},
        {"id": "rule_6", "title": "Avoid Generic Stock Imagery", "description": "Do not use stereotypical stock photos of suited businessmen shaking hands.", "type": "common_mistake", "priority": "medium"},
    ],
    "compliance": [
        {"id": "comp_1", "title": "Quantitative Benchmark Disclaimer", "category": "disclaimer", "rule_text": "Performance statistics verified under standardized enterprise lab benchmarks (Q1 2026). Individual enterprise latency results may vary based on topological proximity.", "requirement_level": "mandatory"},
        {"id": "comp_2", "title": "Registered Trademark Notice", "category": "trademark", "rule_text": "Acme Cloud Systems™, Acme Core Fabric™, and Sovereign Mesh™ are registered trademarks of Acme Cloud Systems Inc.", "requirement_level": "mandatory"},
        {"id": "comp_3", "title": "Availability & SLA Disclosures", "category": "regulatory", "rule_text": "99.999% SLA availability applies strictly to sovereign multi-region clusters backed by enterprise support agreements.", "requirement_level": "conditional"},
        {"id": "comp_4", "title": "Accessibility WCAG Standard", "category": "accessibility", "rule_text": "All public facing visual media, banners, and digital ads must achieve minimum WCAG 2.1 AA 4.5:1 contrast ratio.", "requirement_level": "mandatory"},
    ],
    "assets_library": [
        {"id": "ass_1", "name": "Primary Dark Theme Wordmark", "type": "logo", "file_url": "https://assets.acmecloud.com/logos/acme-primary.svg", "description": "Vector SVG format wordmark for dark backgrounds.", "usage_restrictions": "Do not distort or stretch.", "campaign": "Global Corporate", "approval_status": "approved"},
        {"id": "ass_2", "name": "Sovereign Cloud Mesh Architecture Diagram", "type": "reference_design", "file_url": "https://assets.acmecloud.com/graphics/mesh-topo.png", "description": "Approved isometric topology diagram for technical presentations.", "usage_restrictions": "Authorized for customer facing architecture briefings.", "campaign": "Core Fabric 2026", "approval_status": "approved"},
        {"id": "ass_3", "name": "Brand Guidelines PDF Specification v2026.1", "type": "document", "file_url": "https://assets.acmecloud.com/docs/acme-brand-book-2026.pdf", "description": "Complete PDF brand guidelines and design system reference.", "usage_restrictions": "Internal and certified agency distribution.", "campaign": "Enterprise Governance", "approval_status": "approved"},
    ],
    "media_guidelines": {
        "social_media": {
            "enabled": True,
            "description": "Governance rules for LinkedIn, X (Twitter), Facebook, and YouTube social campaign banners.",
            "inherit_brand_defaults": True,
            "overrides": {"primary_color": "#0F172A", "cta_style": "High-contrast action banner"},
            "platforms": [
                {"platform": "LinkedIn", "placement": "Feed Banner", "dimensions": "1200x627", "aspect_ratio": "1.91:1", "safe_areas": "40px margin on all sides", "text_density_limit": "Maximum 20% canvas text area", "headline_size": "28px Outfit Bold", "body_size": "15px Inter Regular", "cta_rules": "Bottom-right pill button with 4.5:1 contrast", "logo_placement": "Top-left 32px offset", "export_format": "PNG (Lossless)"},
                {"platform": "X (Twitter)", "placement": "In-Stream Card", "dimensions": "1600x900", "aspect_ratio": "16:9", "safe_areas": "30px margins", "text_density_limit": "Concise text under 15 words", "headline_size": "32px Outfit Bold", "body_size": "16px Inter", "cta_rules": "Visible action prompt", "logo_placement": "Top-left or Bottom-right", "export_format": "PNG / JPG"},
                {"platform": "YouTube", "placement": "Video Thumbnail", "dimensions": "1280x720", "aspect_ratio": "16:9", "safe_areas": "Avoid bottom-right timestamp zone (160x50px)", "text_density_limit": "Under 6 words in high-contrast display type", "headline_size": "48px Outfit Black", "body_size": "N/A", "cta_rules": "Visual focal point", "logo_placement": "Top-left", "export_format": "PNG / JPG"},
            ],
            "mandatory_rules": ["Include primary Acme wordmark with 24px clear space", "WCAG AA contrast on all overlaid copy"],
            "prohibited_elements": ["Generic unbranded stock photos", "Unapproved color gradients"],
        },
        "photography": {
            "enabled": True,
            "description": "Visual standards for professional photoshoot production, employee portraits, and facility imagery.",
            "inherit_brand_defaults": True,
            "overrides": {},
            "lighting": "Natural diffused lighting with cool directional rim accents.",
            "composition": "Rule of thirds; intentional negative space for headline overlay.",
            "framing": "Medium close-up for portraits; wide-angle schematic depth for data centers.",
            "color_grading": "Cool neutral palette (5400K) preserving natural skin tones and deep slate shadows.",
            "retouching_restrictions": "Minor blemish cleanup permitted; altering physical features or heavy AI smoothing is prohibited.",
            "product_visibility": "Enterprise hardware must show genuine industrial design without exaggerated 3D glows.",
            "model_direction": "Authentic, focused, collaborative demeanor.",
            "required_resolutions": "Minimum 300 DPI for print, minimum 4K (3840x2160) for digital master archives.",
            "output_formats": "TIFF / Adobe RGB 1998 for master archives; WebP / PNG for digital.",
        },
        "video": {
            "enabled": True,
            "description": "Motion graphics, product demos, webinar recordings, and promotional video reels.",
            "inherit_brand_defaults": True,
            "overrides": {},
            "video_styles": ["Cinematic Realism", "Technical Product Walkthrough", "Executive Keynote"],
            "aspect_ratios": ["16:9 (Landscape)", "9:16 (Vertical Reel)", "1:1 (Square)"],
            "resolutions": ["1080p (1920x1080)", "4K (3840x2160)"],
            "frame_rates": ["24 fps (Cinematic)", "30 fps (Web)", "60 fps (Product Screencasts)"],
            "duration_recommendations": "Social clips: 15-45s; Product demos: 90-180s; Keynotes: 15-30min.",
            "opening_hook_rules": "Brand identity or compelling customer problem statement within first 3 seconds.",
            "logo_appearance_timing": "Opening bug (lower left) or dedicated 1.5s motion intro.",
            "subtitles_placement": "Centered lower-third with 10% black translucent backing box for readability.",
            "music_restrictions": "Modern ambient electronic or subtle orchestral. Prohibit aggressive trap or cheerful ukelele tracks.",
            "end_card_cta": "Clear URL (acmecloud.com) with approved logo and certified disclaimer.",
            "export_formats": "MP4 (H.264 / AAC) at 15-25 Mbps bitrate.",
        },
        "print": {
            "enabled": True,
            "description": "Standards for physical exhibition booths, brochures, print ads, and whitepapers.",
            "inherit_brand_defaults": True,
            "overrides": {},
            "dpi": 300,
            "color_mode": "CMYK & Pantone Matching System (PMS)",
            "bleed": "3mm (0.125 in) all sides",
            "safe_margin": "5mm (0.2 in) inside trim line",
            "paper_finishes": ["Matte Coated 120gsm (Brochures)", "Heavy Silk 300gsm (Business Collaterals)"],
            "export_format": "PDF/X-1a:2001 with embedded fonts and crop marks",
        },
        "web_ads": {
            "enabled": True,
            "description": "Google Display Network, programmatic banners, and digital marketing placements.",
            "inherit_brand_defaults": True,
            "overrides": {},
            "standard_sizes": ["300x250 (Medium Rectangle)", "728x90 (Leaderboard)", "160x600 (Skyscraper)", "300x600 (Half Page)"],
            "max_file_size_kb": 150,
            "animation_rules": "Maximum 15 seconds animation loop. No rapid strobing or deceptive click triggers.",
            "mobile_adaptations": "Responsive scaling with minimum 14px font size on mobile screens.",
        },
        "custom_media": [],
    },
}


def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_acme = db.query(Organization).filter(Organization.slug == "acme-cloud").first()
        if existing_acme:
            acme_g = db.query(BrandGuideline).filter(BrandGuideline.organization_id == existing_acme.id).first()
            if acme_g and not acme_g.published_data:
                acme_g.status = "published"
                acme_g.published_data = ACME_MASTER_BRAND_DATA
                acme_g.draft_data = ACME_MASTER_BRAND_DATA
                acme_g.published_by = "Alex Mercer (Manager)"
                acme_g.published_at = datetime.now(timezone.utc)
                v = db.query(BrandGuidelineVersion).filter(BrandGuidelineVersion.guideline_id == acme_g.id).first()
                if not v:
                    db.add(
                        BrandGuidelineVersion(
                            id="ver_acme_master_2026_1",
                            guideline_id=acme_g.id,
                            organization_id=existing_acme.id,
                            version="2026.1.0",
                            changelog="Initial publication of Acme Cloud Master Brand Standards 2026.",
                            published_by="Alex Mercer (Manager)",
                            published_at=datetime.now(timezone.utc),
                            snapshot_data=ACME_MASTER_BRAND_DATA,
                        )
                    )
                db.commit()
            return

        demo_pwd_hash = hash_password("password123")

        # =========================================================
        # 0. Legacy / Default Tenant (Maintains backwards compat)
        # =========================================================
        legacy_org = db.query(Organization).filter(Organization.id == "org_default_inkloom").first()
        if not legacy_org:
            legacy_org = Organization(
                id="org_default_inkloom",
                name="Inkloom Global Brand",
                slug="inkloom-global",
                industry="Software & AI Governance",
                is_active=True,
            )
            db.add(legacy_org)
            db.flush()

            legacy_user = User(
                id="user_local_dev",
                email="compliance@inkloom.internal",
                full_name="Jane Reviewer (Compliance Officer)",
                hashed_password=demo_pwd_hash,
                is_active=True,
            )
            db.add(legacy_user)
            db.flush()

            legacy_mem = Membership(
                organization_id=legacy_org.id,
                user_id=legacy_user.id,
                role="compliance_officer",
            )
            db.add(legacy_mem)

        # =========================================================
        # 1. Company 1: Acme Cloud Systems (Enterprise Cloud Infrastructure)
        # =========================================================
        acme_org = Organization(
            id="org_acme_cloud",
            name="Acme Cloud Systems",
            slug="acme-cloud",
            industry="Enterprise Cloud & Infrastructure",
            description="Enterprise hybrid cloud compute and automated zero-trust security infrastructure.",
            website="https://acmecloud.com",
            is_active=True,
        )
        db.add(acme_org)
        db.flush()

        # Acme Users (All 4 roles)
        acme_admin = User(
            id="user_acme_admin",
            email="admin@acmecloud.com",
            full_name="Alex Mercer (Manager)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        acme_marketing = User(
            id="user_acme_marketing",
            email="marketing@acmecloud.com",
            full_name="Maya Lin (Marketing Lead)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        acme_designer = User(
            id="user_acme_designer",
            email="designer@acmecloud.com",
            full_name="Leo Vance (Senior Designer)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        acme_compliance = User(
            id="user_acme_compliance",
            email="compliance@acmecloud.com",
            full_name="Elena Rostova (Legal & Compliance)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        db.add_all([acme_admin, acme_marketing, acme_designer, acme_compliance])
        db.flush()

        # Acme Memberships
        db.add_all([
            Membership(organization_id=acme_org.id, user_id=acme_admin.id, role="admin"),
            Membership(organization_id=acme_org.id, user_id=acme_marketing.id, role="marketing"),
            Membership(organization_id=acme_org.id, user_id=acme_designer.id, role="designer"),
            Membership(organization_id=acme_org.id, user_id=acme_compliance.id, role="compliance_officer"),
        ])

        # Acme Pending Invitation
        db.add(
            Invitation(
                organization_id=acme_org.id,
                email="sam.newhire@acmecloud.com",
                role="designer",
                token="acme_invite_designer_2026",
                invited_by_id=acme_admin.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
        )

        # Acme Brand Guidelines & Rules
        acme_guideline = BrandGuideline(
            id="guide_acme_master",
            organization_id=acme_org.id,
            name="Acme Cloud Master Brand Standard 2026",
            description="Official corporate guidelines governing tone, terminology, typography, and certified performance claims.",
            version="2026.1.0",
            status="published",
            published_at=datetime.now(timezone.utc),
            published_by="Alex Mercer (Manager)",
            draft_data=ACME_MASTER_BRAND_DATA,
            published_data=ACME_MASTER_BRAND_DATA,
            is_active=True,
        )
        db.add(acme_guideline)
        db.flush()

        db.add(
            BrandGuidelineVersion(
                id="ver_acme_master_2026_1",
                guideline_id=acme_guideline.id,
                organization_id=acme_org.id,
                version="2026.1.0",
                changelog="Initial publication of Acme Cloud Master Brand Standards 2026.",
                published_by="Alex Mercer (Manager)",
                published_at=datetime.now(timezone.utc),
                snapshot_data=ACME_MASTER_BRAND_DATA,
            )
        )

        db.add_all([
            GuidelineRule(
                guideline_id=acme_guideline.id,
                category="terminology",
                rule_name="Deprecated Brand Names",
                section="Section 2.1: Product Portfolio Naming",
                severity_default="high",
                rule_definition={
                    "forbidden_terms": ["Inkloom Cloud Suite", "CloudSpeed", "HyperScale", "OldProduct"],
                    "replacements": {
                        "Inkloom Cloud Suite": "Acme Governance Hub",
                        "CloudSpeed": "Acme Core Fabric",
                        "HyperScale": "Acme Enterprise Cloud",
                    },
                },
                requires_human_review=False,
                source_url="https://brand.acmecloud.com/naming#sec-2-1",
            ),
            GuidelineRule(
                guideline_id=acme_guideline.id,
                category="claim_verification",
                rule_name="Mandatory Benchmark Citation for Quantitative Claims",
                section="Rule C-04: Numerical Performance Claims",
                severity_default="high",
                rule_definition={
                    "requires_citation": True,
                    "certified_benchmarks": [
                        {"pattern": "latency", "benchmark_value": "45ms", "certified": True},
                        {"pattern": "uptime", "benchmark_value": "99.99%", "certified": True},
                    ],
                },
                requires_human_review=True,
                source_url=None,
            ),
            GuidelineRule(
                guideline_id=acme_guideline.id,
                category="tone_voice",
                rule_name="Anti-FUD Messaging Policy",
                section="Pillar 1: Empowering, Consultative Voice",
                severity_default="medium",
                rule_definition={
                    "prohibited_tones": ["fear", "aggressive_sales", "hype"],
                    "prohibited_phrases": [
                        "hurry up before your competitors crush you",
                        "guaranteed 100% reduction",
                        "destroying competition",
                    ],
                },
                requires_human_review=False,
                source_url="https://brand.acmecloud.com/tone#pillar-1",
            ),
            GuidelineRule(
                guideline_id=acme_guideline.id,
                category="visual_brand",
                rule_name="Primary Color Contrast & Safe Margin",
                section="Section 5.3: Visual Standards",
                severity_default="low",
                rule_definition={"primary_hex": "#6366F1", "minimum_contrast_ratio": 4.5},
                requires_human_review=False,
                source_url="https://brand.acmecloud.com/visual#sec-5-3",
            ),
        ])

        # Acme Approved Assets
        db.add_all([
            ApprovedAsset(
                organization_id=acme_org.id,
                name="Acme Cloud Primary Wordmark (SVG)",
                asset_type="logo",
                file_url="https://assets.acmecloud.com/logos/acme-primary.svg",
                specifications={"min_padding_px": 24, "variants": ["dark_bg", "light_bg"]},
                is_active=True,
            ),
            ApprovedAsset(
                organization_id=acme_org.id,
                name="Executive Color Palette 2026",
                asset_type="color_palette",
                specifications={"primary": "#6366F1", "secondary": "#0F172A", "accent": "#10B981"},
                is_active=True,
            ),
            ApprovedAsset(
                organization_id=acme_org.id,
                name="SOC 2 Type II Compliance Disclaimer",
                asset_type="boilerplate",
                specifications={"approved_text": "Acme Cloud Infrastructure is audited and certified annually under AICPA SOC 2 Type II."},
                is_active=True,
            ),
        ])

        # Acme Submissions
        sub1 = ContentSubmission(
            id="sub_acme_001",
            organization_id=acme_org.id,
            creator_id=acme_marketing.id,
            title="Q4 Enterprise HyperScale Launch Announcement",
            description="Campaign copy for new enterprise governance launch.",
            content_type="text",
            status="pending_approval",
        )
        db.add(sub1)
        db.flush()

        rev1 = ContentRevision(
            id="rev_acme_001",
            submission_id=sub1.id,
            version_number=1,
            raw_text="""Get started with the powerful CloudSpeed Suite today.
Our newest release lets organizations experience a guaranteed 10x reduction in latency across all regions.
Hurry up before your competitors crush you and steal your market share.""",
            file_size_bytes=242,
        )
        db.add(rev1)
        db.flush()
        sub1.current_revision_id = rev1.id

        sub2 = ContentSubmission(
            id="sub_acme_002",
            organization_id=acme_org.id,
            creator_id=acme_designer.id,
            title="Annual Cloud Sustainability Brand Report PDF",
            description="Annual ESG and datacenter green energy disclosures brochure.",
            content_type="document",
            status="approved",
        )
        db.add(sub2)
        db.flush()

        rev2 = ContentRevision(
            id="rev_acme_002",
            submission_id=sub2.id,
            version_number=1,
            raw_text="Acme Cloud Systems datacenters run with 100% certified renewable energy matching ISO 14001 specifications.",
            file_size_bytes=108,
        )
        db.add(rev2)
        db.flush()
        sub2.current_revision_id = rev2.id

        sub3 = ContentSubmission(
            id="sub_acme_003",
            organization_id=acme_org.id,
            creator_id=acme_marketing.id,
            title="LinkedIn Brand Campaign Video Transcript",
            description="Promotional reel script introducing automated brand safety controls.",
            content_type="video",
            status="changes_requested",
        )
        db.add(sub3)
        db.flush()

        rev3 = ContentRevision(
            id="rev_acme_003",
            submission_id=sub3.id,
            version_number=1,
            raw_text="Empowering organizations with verified brand compliance safeguards and human-in-the-loop audit controls.",
            file_size_bytes=112,
        )
        db.add(rev3)
        db.flush()
        sub3.current_revision_id = rev3.id

        # Audit Run with findings for sub1
        audit_run_acme = AuditRun(
            id="aud_acme_001",
            submission_id=sub1.id,
            revision_id=rev1.id,
            schema_version="1.0.0",
            overall_status="needs_review",
            summary={
                "compliance_score": 71.0,
                "total_findings": 3,
                "critical_count": 0,
                "high_count": 2,
                "medium_count": 1,
                "low_count": 0,
                "info_count": 0,
                "human_review_required": True,
                "verdict_overview": "Content violates brand terminology rules with deprecated product names, makes an unverified performance claim regarding latency reductions, and exhibits overly aggressive sales tone. Final human sign-off required prior to public release.",
            },
            engine_metadata={
                "engine_version": "0.1.0-alpha",
                "rules_evaluated_count": 4,
                "execution_time_ms": 38.2,
                "modules_executed": ["guideline_retrieval", "terminology_checker", "tone_voice_analyzer", "claim_verifier"],
                "models_used": ["rule_engine_v1", "tone_classifier_heuristics"],
                "warnings": [],
            },
        )
        db.add(audit_run_acme)
        db.flush()

        db.add_all([
            AuditFinding(
                audit_run_id=audit_run_acme.id,
                finding_id="find_acme_01",
                category="terminology",
                severity="high",
                title="Use of Deprecated Brand Name",
                message="The term 'CloudSpeed' has been retired in favor of 'Acme Core Fabric'.",
                evidence="Get started with the powerful CloudSpeed Suite today.",
                confidence=0.98,
                suggested_correction={
                    "replacement_text": "Acme Core Fabric",
                    "rationale": "Official 2026 enterprise brand architecture.",
                    "preserves_intent": True,
                },
                status="open",
                location={"line_number": 1, "start_char": 28, "end_char": 38},
                requires_human_review=False,
            ),
            AuditFinding(
                audit_run_id=audit_run_acme.id,
                finding_id="find_acme_02",
                category="claim_verification",
                severity="high",
                title="Unverified Quantitative Latency Multiplier",
                message="Asserts a 'guaranteed 10x reduction in latency' without citing verified benchmark.",
                evidence="guaranteed 10x reduction in latency across all regions",
                confidence=0.94,
                suggested_correction={
                    "replacement_text": "significant latency reductions validated in customer performance benchmarks",
                    "rationale": "Replaces unverified multiplier with compliant qualified statement.",
                    "preserves_intent": True,
                },
                status="manual_check_required",
                location={"line_number": 2, "start_char": 32, "end_char": 82},
                requires_human_review=True,
            ),
            AuditFinding(
                audit_run_id=audit_run_acme.id,
                finding_id="find_acme_03",
                category="tone_voice",
                severity="medium",
                title="Aggressive Sales Fear-Inducing Phrasing",
                message="Violates consultative brand persona with coercive language.",
                evidence="Hurry up before your competitors crush you and steal your market share.",
                confidence=0.88,
                suggested_correction={
                    "replacement_text": "Accelerate your governance posture as market expectations evolve.",
                    "rationale": "Reframes fear into constructive strategic guidance.",
                    "preserves_intent": True,
                },
                status="open",
                location={"line_number": 3, "start_char": 0, "end_char": 71},
                requires_human_review=False,
            ),
        ])

        # =========================================================
        # 2. Company 2: NovaBio Health Sciences (Biotech & Life Sciences)
        # =========================================================
        novabio_org = Organization(
            id="org_novabio_health",
            name="NovaBio Health Sciences",
            slug="novabio-health",
            industry="Biotechnology & Clinical Research",
            description="FDA-registered genomic sequencing and targeted therapeutics research institute.",
            website="https://novabiohealth.org",
            is_active=True,
        )
        db.add(novabio_org)
        db.flush()

        novabio_admin = User(
            id="user_novabio_admin",
            email="admin@novabio.com",
            full_name="Dr. Rachel Hayes (Manager)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        novabio_compliance = User(
            id="user_novabio_compliance",
            email="compliance@novabio.com",
            full_name="Marcus Thorne, Esq. (FDA Regulatory Reviewer)",
            hashed_password=demo_pwd_hash,
            is_active=True,
        )
        db.add_all([novabio_admin, novabio_compliance])
        db.flush()

        db.add_all([
            Membership(organization_id=novabio_org.id, user_id=novabio_admin.id, role="admin"),
            Membership(organization_id=novabio_org.id, user_id=novabio_compliance.id, role="compliance_officer"),
        ])

        # NovaBio Pending Invitation
        db.add(
            Invitation(
                organization_id=novabio_org.id,
                email="sarah.biomarketing@novabio.com",
                role="marketing",
                token="novabio_invite_marketing_2026",
                invited_by_id=novabio_admin.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
        )

        # NovaBio Guidelines
        novabio_guideline = BrandGuideline(
            id="guide_novabio_fda",
            organization_id=novabio_org.id,
            name="NovaBio Medical & Clinical Brand Standard",
            description="Strict regulatory compliance for scientific reporting, clinical communications, and patient disclosures.",
            version="3.2.0",
            is_active=True,
        )
        db.add(novabio_guideline)
        db.flush()

        db.add_all([
            GuidelineRule(
                guideline_id=novabio_guideline.id,
                category="terminology",
                rule_name="Prohibited Absolute Efficacy Claims",
                section="FDA Guidance Section 4.2",
                severity_default="critical",
                rule_definition={
                    "forbidden_terms": ["100% cure", "miracle drug", "guaranteed remission"],
                    "replacements": {
                        "100% cure": "statistically significant therapeutic response",
                        "miracle drug": "investigational targeted candidate",
                    },
                },
                requires_human_review=True,
                source_url="https://regulatory.novabiohealth.org/fda#sec-4-2",
            ),
            GuidelineRule(
                guideline_id=novabio_guideline.id,
                category="claim_verification",
                rule_name="Mandatory Clinical Trial Phase III Citation",
                section="Clinical Trial Disclosures",
                severity_default="high",
                rule_definition={
                    "requires_citation": True,
                    "certified_benchmarks": [
                        {"pattern": "survival rate", "benchmark_value": "84.2%", "certified": True},
                    ],
                },
                requires_human_review=True,
            ),
        ])

        # NovaBio Assets
        db.add_all([
            ApprovedAsset(
                organization_id=novabio_org.id,
                name="NovaBio Clinical Wordmark (Teal SVG)",
                asset_type="logo",
                file_url="https://assets.novabiohealth.org/brand/novabio-clinical.svg",
                specifications={"primary_color": "#0D9488"},
                is_active=True,
            ),
            ApprovedAsset(
                organization_id=novabio_org.id,
                name="FDA Mandatory Cautionary Disclaimer",
                asset_type="boilerplate",
                specifications={"approved_text": "Investigational product. Limited by United States law to investigational use."},
                is_active=True,
            ),
        ])

        # NovaBio Submission
        sub_novabio = ContentSubmission(
            id="sub_novabio_001",
            organization_id=novabio_org.id,
            creator_id=novabio_admin.id,
            title="Phase III Oncology Clinical Trial Publication",
            description="Peer-reviewed clinical outcome communication for medical professionals.",
            content_type="text",
            status="pending_approval",
        )
        db.add(sub_novabio)
        db.flush()

        rev_novabio = ContentRevision(
            id="rev_novabio_001",
            submission_id=sub_novabio.id,
            version_number=1,
            raw_text="NovaBio announces our miracle drug delivers a 100% cure rate in targeted breast cancer cohorts.",
            file_size_bytes=104,
        )
        db.add(rev_novabio)
        db.flush()
        sub_novabio.current_revision_id = rev_novabio.id

        audit_run_novabio = AuditRun(
            id="aud_novabio_001",
            submission_id=sub_novabio.id,
            revision_id=rev_novabio.id,
            schema_version="1.0.0",
            overall_status="needs_review",
            summary={
                "compliance_score": 42.0,
                "total_findings": 2,
                "critical_count": 2,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "info_count": 0,
                "human_review_required": True,
                "verdict_overview": "CRITICAL REGULATORY RISK: Contains prohibited phrase '100% cure' and 'miracle drug' in clinical communication. Violates FDA 21 CFR Part 312 regulations.",
            },
            engine_metadata={
                "engine_version": "0.1.0-alpha",
                "rules_evaluated_count": 2,
                "execution_time_ms": 29.5,
                "modules_executed": ["guideline_retrieval", "terminology_checker", "claim_verifier"],
                "models_used": ["rule_engine_v1", "regulatory_heuristics"],
                "warnings": [],
            },
        )
        db.add(audit_run_novabio)
        db.flush()

        db.add_all([
            AuditFinding(
                audit_run_id=audit_run_novabio.id,
                finding_id="find_novabio_01",
                category="terminology",
                severity="critical",
                title="Prohibited Claim: '100% cure'",
                message="Clinical literature strictly forbids promising 100% cure before regulatory approval.",
                evidence="delivers a 100% cure rate in targeted breast cancer cohorts",
                confidence=0.99,
                suggested_correction={
                    "replacement_text": "demonstrated a 84.2% overall survival response rate in Phase III trials",
                    "rationale": "Aligns with certified clinical trial data and FDA promotional rules.",
                    "preserves_intent": True,
                },
                status="manual_check_required",
                location={"line_number": 1, "start_char": 42, "end_char": 51},
                requires_human_review=True,
            ),
            AuditFinding(
                audit_run_id=audit_run_novabio.id,
                finding_id="find_novabio_02",
                category="terminology",
                severity="critical",
                title="Prohibited Sensationalism: 'miracle drug'",
                message="The word 'miracle' is prohibited under medical advertising governance.",
                evidence="announces our miracle drug delivers",
                confidence=0.99,
                suggested_correction={
                    "replacement_text": "investigational candidate (NV-409)",
                    "rationale": "Medical objectivity standard.",
                    "preserves_intent": True,
                },
                status="open",
                location={"line_number": 1, "start_char": 23, "end_char": 35},
                requires_human_review=False,
            ),
        ])

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding multi-tenant database: {e}")
    finally:
        db.close()
