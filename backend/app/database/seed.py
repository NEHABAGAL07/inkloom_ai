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
    GuidelineRule,
    ApprovedAsset,
    ContentSubmission,
    ContentRevision,
    AuditRun,
    AuditFinding,
    AuditEvent,
)


def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_acme = db.query(Organization).filter(Organization.slug == "acme-cloud").first()
        if existing_acme:
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
            is_active=True,
        )
        db.add(acme_guideline)
        db.flush()

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
