
-- ============ ENUMS FOR NEW MODULES ============
CREATE TYPE public.risk_register_status AS ENUM ('open', 'mitigated', 'accepted', 'transferred');
CREATE TYPE public.requirement_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.requirement_status AS ENUM ('draft', 'approved', 'implemented', 'verified');
CREATE TYPE public.review_status AS ENUM ('planned', 'in_progress', 'completed');
CREATE TYPE public.finding_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE public.finding_status AS ENUM ('open', 'confirmed', 'fixed', 'false_positive');
CREATE TYPE public.engagement_status AS ENUM ('scoping', 'active', 'completed', 'reported');
CREATE TYPE public.engagement_type AS ENUM ('pentest', 'dast', 'red_team');
CREATE TYPE public.pentest_finding_status AS ENUM ('open', 'confirmed', 'remediated', 'accepted');
CREATE TYPE public.retest_status AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE public.compliance_status AS ENUM ('not_started', 'in_progress', 'ready', 'certified');
CREATE TYPE public.control_status AS ENUM ('not_implemented', 'partial', 'implemented', 'verified');

-- ============ HELPER: get user's org from projects ============
CREATE OR REPLACE FUNCTION public.user_can_access_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    -- consultant who owns the project's org
    SELECT 1 FROM public.projects p
    JOIN public.organizations o ON o.id = p.org_id
    WHERE p.id = _project_id AND o.created_by = _user_id
  )
  OR EXISTS (
    -- client assigned to the project
    SELECT 1 FROM public.project_clients pc
    WHERE pc.project_id = _project_id AND pc.user_id = _user_id
  )
$$;

-- ============ 1. RISK REGISTERS ============
CREATE TABLE public.risk_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  likelihood INT NOT NULL DEFAULT 3 CHECK (likelihood >= 1 AND likelihood <= 5),
  impact INT NOT NULL DEFAULT 3 CHECK (impact >= 1 AND impact <= 5),
  risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
  treatment TEXT DEFAULT '',
  status public.risk_register_status NOT NULL DEFAULT 'open',
  owner TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_registers_select" ON public.risk_registers FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "risk_registers_insert" ON public.risk_registers FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "risk_registers_update" ON public.risk_registers FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "risk_registers_delete" ON public.risk_registers FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));

-- ============ 2. SECURITY REQUIREMENTS ============
CREATE TABLE public.security_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  framework TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  priority public.requirement_priority NOT NULL DEFAULT 'medium',
  status public.requirement_status NOT NULL DEFAULT 'draft',
  assigned_to TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.security_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sec_reqs_select" ON public.security_requirements FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "sec_reqs_insert" ON public.security_requirements FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "sec_reqs_update" ON public.security_requirements FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "sec_reqs_delete" ON public.security_requirements FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));

-- ============ 3. CODE REVIEWS ============
CREATE TABLE public.code_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Code Review',
  repository_url TEXT DEFAULT '',
  scope TEXT DEFAULT '',
  status public.review_status NOT NULL DEFAULT 'planned',
  reviewer TEXT DEFAULT '',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "code_reviews_select" ON public.code_reviews FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "code_reviews_insert" ON public.code_reviews FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "code_reviews_update" ON public.code_reviews FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "code_reviews_delete" ON public.code_reviews FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));

-- ============ 4. CODE REVIEW FINDINGS ============
CREATE TABLE public.code_review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.code_reviews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  severity public.finding_severity NOT NULL DEFAULT 'medium',
  cwe_id TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  line_number INT,
  status public.finding_status NOT NULL DEFAULT 'open',
  remediation TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.code_review_findings ENABLE ROW LEVEL SECURITY;

-- RLS via review -> project
CREATE POLICY "cr_findings_select" ON public.code_review_findings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.code_reviews cr WHERE cr.id = review_id AND public.user_can_access_project(auth.uid(), cr.project_id)));
CREATE POLICY "cr_findings_insert" ON public.code_review_findings FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.code_reviews cr WHERE cr.id = review_id AND public.user_can_access_project(auth.uid(), cr.project_id)));
CREATE POLICY "cr_findings_update" ON public.code_review_findings FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.code_reviews cr WHERE cr.id = review_id AND public.user_can_access_project(auth.uid(), cr.project_id)));
CREATE POLICY "cr_findings_delete" ON public.code_review_findings FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.code_reviews cr WHERE cr.id = review_id AND public.user_can_access_project(auth.uid(), cr.project_id)));

-- ============ 5. PENTEST ENGAGEMENTS ============
CREATE TABLE public.pentest_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type public.engagement_type NOT NULL DEFAULT 'pentest',
  scope TEXT DEFAULT '',
  status public.engagement_status NOT NULL DEFAULT 'scoping',
  tester TEXT DEFAULT '',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pentest_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pentest_select" ON public.pentest_engagements FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "pentest_insert" ON public.pentest_engagements FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "pentest_update" ON public.pentest_engagements FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "pentest_delete" ON public.pentest_engagements FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));

-- ============ 6. PENTEST FINDINGS ============
CREATE TABLE public.pentest_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.pentest_engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  severity public.finding_severity NOT NULL DEFAULT 'medium',
  cvss_score NUMERIC(3,1) DEFAULT 0.0,
  status public.pentest_finding_status NOT NULL DEFAULT 'open',
  affected_asset TEXT DEFAULT '',
  remediation TEXT DEFAULT '',
  retest_status public.retest_status DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pentest_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pf_select" ON public.pentest_findings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pentest_engagements pe WHERE pe.id = engagement_id AND public.user_can_access_project(auth.uid(), pe.project_id)));
CREATE POLICY "pf_insert" ON public.pentest_findings FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.pentest_engagements pe WHERE pe.id = engagement_id AND public.user_can_access_project(auth.uid(), pe.project_id)));
CREATE POLICY "pf_update" ON public.pentest_findings FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.pentest_engagements pe WHERE pe.id = engagement_id AND public.user_can_access_project(auth.uid(), pe.project_id)));
CREATE POLICY "pf_delete" ON public.pentest_findings FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.pentest_engagements pe WHERE pe.id = engagement_id AND public.user_can_access_project(auth.uid(), pe.project_id)));

-- ============ 7. COMPLIANCE FRAMEWORKS ============
CREATE TABLE public.compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  framework_name TEXT NOT NULL,
  version TEXT DEFAULT '',
  status public.compliance_status NOT NULL DEFAULT 'not_started',
  target_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cf_select" ON public.compliance_frameworks FOR SELECT TO authenticated
  USING (public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "cf_insert" ON public.compliance_frameworks FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "cf_update" ON public.compliance_frameworks FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));
CREATE POLICY "cf_delete" ON public.compliance_frameworks FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND public.user_can_access_project(auth.uid(), project_id));

-- ============ 8. COMPLIANCE CONTROLS ============
CREATE TABLE public.compliance_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status public.control_status NOT NULL DEFAULT 'not_implemented',
  evidence TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_select" ON public.compliance_controls FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.compliance_frameworks cf WHERE cf.id = framework_id AND public.user_can_access_project(auth.uid(), cf.project_id)));
CREATE POLICY "cc_insert" ON public.compliance_controls FOR INSERT TO authenticated
  WITH CHECK (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.compliance_frameworks cf WHERE cf.id = framework_id AND public.user_can_access_project(auth.uid(), cf.project_id)));
CREATE POLICY "cc_update" ON public.compliance_controls FOR UPDATE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.compliance_frameworks cf WHERE cf.id = framework_id AND public.user_can_access_project(auth.uid(), cf.project_id)));
CREATE POLICY "cc_delete" ON public.compliance_controls FOR DELETE TO authenticated
  USING (public.current_role_is('consultant') AND EXISTS (SELECT 1 FROM public.compliance_frameworks cf WHERE cf.id = framework_id AND public.user_can_access_project(auth.uid(), cf.project_id)));

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_risk_registers_updated BEFORE UPDATE ON public.risk_registers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_security_requirements_updated BEFORE UPDATE ON public.security_requirements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_code_reviews_updated BEFORE UPDATE ON public.code_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_code_review_findings_updated BEFORE UPDATE ON public.code_review_findings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pentest_engagements_updated BEFORE UPDATE ON public.pentest_engagements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pentest_findings_updated BEFORE UPDATE ON public.pentest_findings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_compliance_frameworks_updated BEFORE UPDATE ON public.compliance_frameworks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_compliance_controls_updated BEFORE UPDATE ON public.compliance_controls FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
