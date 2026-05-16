"""ConversionOptimizer — part of the internal linking tools suite."""

from typing import List, Dict, Any

from crewai.tools import tool

from .enums import LinkType, ConversionObjective


class ConversionOptimizer:
    """
    Conversion-focused optimization tool (70% focus).
    
    Responsible for:
    - Business objective integration (hybrid approach)
    - Conversion path optimization
    - Funnel progression mapping
    - Conversion value scoring
    """
    
    def __init__(self):
        self.conversion_weights = {
            ConversionObjective.LEAD_GENERATION: 0.4,
            ConversionObjective.DEMO_REQUEST: 0.3,
            ConversionObjective.TRIAL_SIGNUP: 0.2,
            ConversionObjective.PURCHASE: 0.1
        }
    
    @tool
    def optimize_conversion_paths(
        self,
        linking_analysis: Dict[str, Any],
        conversion_goals: List[str],
        business_goals: List[str],
        conversion_focus: float = 0.7
    ) -> Dict[str, Any]:
        """
        Optimize internal linking for conversion objectives (70% weight).
        
        Args:
            linking_analysis: Output from LinkingAnalyzer
            conversion_goals: Conversion objectives (leads, trials, sales)
            business_goals: Primary business objectives
            conversion_focus: Balance between conversion vs SEO (0.3-0.9)
            
        Returns:
            Conversion-optimized linking strategy
        """
        
        # 1. Business Objective Integration (Hybrid Approach)
        hybrid_links = self._create_hybrid_objective_links(
            conversion_goals, linking_analysis, business_goals
        )
        
        # 2. Conversion Path Mapping (70% weight)
        conversion_paths = self._map_conversion_paths(
            linking_analysis, conversion_goals, business_goals
        )
        
        # 3. Funnel Optimization
        funnel_optimization = self._optimize_funnel_progression(
            linking_analysis, conversion_goals
        )
        
        # 4. Conversion Value Scoring
        scored_conversions = self._score_conversion_value(
            linking_analysis, conversion_goals, conversion_focus
        )
        
        # 5. CTA Integration
        cta_integrations = self._integrate_conversion_ctas(
            linking_analysis, conversion_goals
        )
        
        return {
            "hybrid_links": hybrid_links,
            "conversion_paths": conversion_paths,
            "funnel_optimization": funnel_optimization,
            "scored_conversions": scored_conversions,
            "cta_integrations": cta_integrations,
            "conversion_focus": conversion_focus,
            "conversion_score": self._calculate_conversion_score(scored_conversions),
            "optimization_metadata": {
                "total_conversion_opportunities": len(hybrid_links) + len(scored_conversions),
                "high_value_conversions": len([c for c in scored_conversions if c.get("conversion_value", 0) >= 7.0]),
                "funnel_stages_covered": list(funnel_optimization.get("stage_coverage", {}).keys())
            }
        }
    
    def _create_hybrid_objective_links(
        self,
        conversion_goals: List[str],
        linking_analysis: Dict[str, Any],
        business_goals: List[str]
    ) -> List[Dict[str, Any]]:
        """Create hybrid links that serve multiple business objectives."""
        
        hybrid_links = []
        content_inventory = linking_analysis.get("content_categorization", {})
        
        # Lead Generation + Demo Request Hybrid
        if "lead_generation" in conversion_goals and "demo_request" in conversion_goals:
            hybrid_links.extend(self._create_lead_demo_hybrid(content_inventory))
        
        # Demo/Trial + Sales Hybrid
        demo_trial_goals = [g for g in conversion_goals if g in ["demo_request", "trial_signup", "purchase"]]
        if len(demo_trial_goals) >= 2:
            hybrid_links.extend(self._create_demo_trial_sales_hybrid(content_inventory, demo_trial_goals))
        
        # Content + Lead Generation Hybrid
        if "lead_generation" in conversion_goals:
            hybrid_links.extend(self._create_content_lead_hybrid(content_inventory))
        
        return hybrid_links
    
    def _create_lead_demo_hybrid(self, content_inventory: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create lead generation + demo request hybrid links."""
        
        hybrid_links = []
        
        # Find consideration-stage content
        cluster_pages = content_inventory.get("cluster_pages", [])
        consideration_content = [
            page for page in cluster_pages
            if page.get("business_goal") in ["consider", "evaluate"] or 
               any(word in page.get("title", "").lower() for word in ["vs", "comparison", "review", "best"])
        ]
        
        for content in consideration_content:
            hybrid_links.append({
                "source_url": content.get("url", ""),
                "link_type": LinkType.HYBRID_OBJECTIVE,
                "primary_objective": ConversionObjective.LEAD_GENERATION,
                "secondary_objective": ConversionObjective.DEMO_REQUEST,
                "conversion_path": "consideration → evaluation → decision",
                "anchor_patterns": [
                    "request personalized demo",
                    "get customized demo",
                    "schedule tailored walkthrough",
                    "see how it works for you"
                ],
                "context_requirements": [
                    "user viewed comparison content",
                    "spent >2 minutes on page",
                    "scroll depth >60%"
                ],
                "conversion_value": 8.5,
                "seo_value": 6.0,
                "personalization_triggers": ["company_size_indicated", "role_specified", "budget_mentioned"]
            })
        
        return hybrid_links
    
    def _create_demo_trial_sales_hybrid(
        self,
        content_inventory: Dict[str, Any],
        conversion_goals: List[str]
    ) -> List[Dict[str, Any]]:
        """Create demo/trial + sales hybrid links."""
        
        hybrid_links = []
        
        # Find decision-stage content
        all_pages = (content_inventory.get("pillar_pages", []) + 
                    content_inventory.get("cluster_pages", []))
        decision_content = [
            page for page in all_pages
            if page.get("business_goal") in ["convert", "decision"] or
               any(word in page.get("title", "").lower() for word in ["pricing", "cost", "features", "buy"])
        ]
        
        for content in decision_content:
            if "purchase" in conversion_goals:
                primary_obj = ConversionObjective.PURCHASE
                secondary_obj = ConversionObjective.TRIAL_SIGNUP if "trial_signup" in conversion_goals else ConversionObjective.DEMO_REQUEST
            else:
                primary_obj = ConversionObjective.TRIAL_SIGNUP
                secondary_obj = ConversionObjective.DEMO_REQUEST
            
            hybrid_links.append({
                "source_url": content.get("url", ""),
                "link_type": LinkType.CONVERSION,
                "primary_objective": primary_obj,
                "secondary_objective": secondary_obj,
                "conversion_path": "evaluation → trial → purchase",
                "anchor_patterns": [
                    "start free trial",
                    "buy now",
                    "get instant access",
                    "upgrade to premium"
                ],
                "urgency_elements": ["limited_time_offer", "trial_extension_available", "early_pricing"],
                "risk_reduction": ["money_back_guarantee", "easy_cancellation", "no_commitment"],
                "conversion_value": 9.0,
                "seo_value": 5.0,
                "personalization_triggers": ["pricing_page_viewed", "feature_comparison_completed", "competitor_research"]
            })
        
        return hybrid_links
    
    def _create_content_lead_hybrid(self, content_inventory: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create content + lead generation hybrid links."""
        
        hybrid_links = []
        
        # Find educational/awareness content
        pillar_pages = content_inventory.get("pillar_pages", [])
        educational_content = [
            page for page in pillar_pages
            if page.get("business_goal") == "educate" or
               any(word in page.get("title", "").lower() for word in ["guide", "tutorial", "how to", "learn"])
        ]
        
        for content in educational_content:
            hybrid_links.append({
                "source_url": content.get("url", ""),
                "link_type": LinkType.HYBRID_OBJECTIVE,
                "primary_objective": "content_engagement",
                "secondary_objective": ConversionObjective.LEAD_GENERATION,
                "conversion_path": "awareness → consideration → lead capture",
                "content_upgrades": [
                    "download comprehensive guide",
                    "get checklist template",
                    "access exclusive resources",
                    "join expert community"
                ],
                "progressive_profiling": True,
                "minimal_data_capture": True,
                "value_proposition": "Free valuable content with optional upgrade",
                "conversion_value": 7.0,
                "seo_value": 7.5,
                "personalization_triggers": ["scroll_depth_80", "time_on_page_5min", "return_visitor"]
            })
        
        return hybrid_links
    
    def _map_conversion_paths(
        self,
        linking_analysis: Dict[str, Any],
        conversion_goals: List[str],
        business_goals: List[str]
    ) -> Dict[str, Any]:
        """Map conversion paths through internal linking."""
        
        conversion_paths = {
            "lead_generation_path": self._map_lead_gen_path(linking_analysis, conversion_goals),
            "demo_request_path": self._map_demo_request_path(linking_analysis, conversion_goals),
            "trial_signup_path": self._map_trial_signup_path(linking_analysis, conversion_goals),
            "purchase_path": self._map_purchase_path(linking_analysis, conversion_goals)
        }
        
        # Calculate path effectiveness scores
        for path_name, path_data in conversion_paths.items():
            path_data["effectiveness_score"] = self._calculate_path_effectiveness(path_data, conversion_goals)
            path_data["optimization_opportunities"] = self._identify_path_optimizations(path_data)
        
        return conversion_paths
    
    def _map_lead_gen_path(self, linking_analysis: Dict[str, Any], conversion_goals: List[str]) -> Dict[str, Any]:
        """Map lead generation conversion path."""
        
        path = {
            "stages": [
                {
                    "stage": "awareness",
                    "content_types": ["pillar_pages", "educational_guides"],
                    "link_objectives": ["educate_about_problem", "introduce_solution"],
                    "conversion_triggers": ["problem_awareness", "solution_seeking"]
                },
                {
                    "stage": "consideration",
                    "content_types": ["cluster_pages", "comparison_content"],
                    "link_objectives": ["compare_options", "show_social_proof"],
                    "conversion_triggers": ["solution_comparison", "case_study_interest"]
                },
                {
                    "stage": "lead_capture",
                    "content_types": ["landing_pages", "content_upgrades"],
                    "link_objectives": ["capture_email", "offer_value"],
                    "conversion_triggers": ["resource_download", "webinar_registration"]
                }
            ],
            "primary_links": [],
            "supporting_links": [],
            "conversion_points": []
        }
        
        return path
    
    def _map_demo_request_path(self, linking_analysis: Dict[str, Any], conversion_goals: List[str]) -> Dict[str, Any]:
        """Map demo request conversion path."""
        
        path = {
            "stages": [
                {
                    "stage": "feature_awareness",
                    "content_types": ["feature_guides", "product_tours"],
                    "link_objectives": ["highlight_features", "show_capabilities"],
                    "conversion_triggers": ["feature_interest", "capability_questions"]
                },
                {
                    "stage": "solution_evaluation",
                    "content_types": ["demo_videos", "case_studies"],
                    "link_objectives": ["demonstrate_value", "build_trust"],
                    "conversion_triggers": ["value_confirmation", "trust_building"]
                },
                {
                    "stage": "demo_request",
                    "content_types": ["demo_landing", "consultation_pages"],
                    "link_objectives": ["schedule_demo", "personalize_offer"],
                    "conversion_triggers": ["demo_scheduling", "consultation_booking"]
                }
            ],
            "primary_links": [],
            "supporting_links": [],
            "conversion_points": []
        }
        
        return path
    
    def _map_trial_signup_path(self, linking_analysis: Dict[str, Any], conversion_goals: List[str]) -> Dict[str, Any]:
        """Map trial signup conversion path."""
        
        path = {
            "stages": [
                {
                    "stage": "product_interest",
                    "content_types": ["feature_overviews", "benefit_guides"],
                    "link_objectives": ["show_benefits", "build_desire"],
                    "conversion_triggers": ["benefit_understanding", "desire_building"]
                },
                {
                    "stage": "trial_consideration",
                    "content_types": ["trial_guides", "onboarding_tours"],
                    "link_objectives": ["reduce_fear", "show_ease"],
                    "conversion_triggers": ["fear_reduction", "ease_confirmation"]
                },
                {
                    "stage": "trial_signup",
                    "content_types": ["trial_landing", "signup_pages"],
                    "link_objectives": ["start_trial", "remove_barriers"],
                    "conversion_triggers": ["trial_initiation", "barrier_removal"]
                }
            ],
            "primary_links": [],
            "supporting_links": [],
            "conversion_points": []
        }
        
        return path
    
    def _map_purchase_path(self, linking_analysis: Dict[str, Any], conversion_goals: List[str]) -> Dict[str, Any]:
        """Map purchase conversion path."""
        
        path = {
            "stages": [
                {
                    "stage": "purchase_readiness",
                    "content_types": ["pricing_pages", "comparison_pages"],
                    "link_objectives": ["justify_price", "show_value"],
                    "conversion_triggers": ["price_acceptance", "value_confirmation"]
                },
                {
                    "stage": "purchase_decision",
                    "content_types": ["testimonials", "guarantee_pages"],
                    "link_objectives": ["build_confidence", "reduce_risk"],
                    "conversion_triggers": ["confidence_building", "risk_reduction"]
                },
                {
                    "stage": "purchase_action",
                    "content_types": ["checkout_pages", "payment_pages"],
                    "link_objectives": ["complete_purchase", "secure_transaction"],
                    "conversion_triggers": ["payment_processing", "purchase_confirmation"]
                }
            ],
            "primary_links": [],
            "supporting_links": [],
            "conversion_points": []
        }
        
        return path
    
    def _optimize_funnel_progression(
        self,
        linking_analysis: Dict[str, Any],
        conversion_goals: List[str]
    ) -> Dict[str, Any]:
        """Optimize funnel progression through internal linking."""
        
        stage_coverage = {
            "awareness": self._optimize_awareness_stage(linking_analysis),
            "consideration": self._optimize_consideration_stage(linking_analysis),
            "decision": self._optimize_decision_stage(linking_analysis),
            "retention": self._optimize_retention_stage(linking_analysis)
        }
        
        progression_flows = self._design_progression_flows(stage_coverage, conversion_goals)
        
        return {
            "stage_coverage": stage_coverage,
            "progression_flows": progression_flows,
            "optimization_score": self._calculate_funnel_optimization_score(stage_coverage)
        }
    
    def _optimize_awareness_stage(self, linking_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize awareness stage linking."""
        
        return {
            "primary_objective": "educate_about_problem",
            "link_types": [LinkType.PILLAR_TO_CLUSTER],
            "anchor_focus": "problem_awareness",
            "conversion_value": 4.0,
            "seo_value": 8.0,
            "optimization_tactics": [
                "link to comprehensive guides",
                "connect to problem-solving content",
                "introduce solution concepts"
            ]
        }
    
    def _optimize_consideration_stage(self, linking_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize consideration stage linking."""
        
        return {
            "primary_objective": "evaluate_solutions",
            "link_types": [LinkType.CLUSTER_TO_PILLAR, LinkType.HYBRID_OBJECTIVE],
            "anchor_focus": "solution_comparison",
            "conversion_value": 6.5,
            "seo_value": 6.0,
            "optimization_tactics": [
                "link to comparison content",
                "connect to case studies",
                "introduce demo options"
            ]
        }
    
    def _optimize_decision_stage(self, linking_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize decision stage linking."""
        
        return {
            "primary_objective": "convert_to_action",
            "link_types": [LinkType.CONVERSION, LinkType.FUNNEL_TRANSITION],
            "anchor_focus": "action_oriented",
            "conversion_value": 9.0,
            "seo_value": 4.0,
            "optimization_tactics": [
                "link to landing pages",
                "connect to trial/signup",
                "introduce purchase options"
            ]
        }
    
    def _optimize_retention_stage(self, linking_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize retention stage linking."""
        
        return {
            "primary_objective": "maintain_engagement",
            "link_types": [LinkType.PERSONALIZED],
            "anchor_focus": "ongoing_value",
            "conversion_value": 7.0,
            "seo_value": 5.0,
            "optimization_tactics": [
                "link to support content",
                "connect to training resources",
                "introduce community features"
            ]
        }
    
    def _design_progression_flows(
        self,
        stage_coverage: Dict[str, Any],
        conversion_goals: List[str]
    ) -> List[Dict[str, Any]]:
        """Design optimal progression flows between funnel stages."""
        
        flows = []
        
        # Awareness → Consideration flow
        flows.append({
            "from_stage": "awareness",
            "to_stage": "consideration",
            "trigger_conditions": ["educational_content_consumed", "problem_understanding"],
            "link_strategy": "deepen_knowledge",
            "conversion_focus": 0.6
        })
        
        # Consideration → Decision flow
        flows.append({
            "from_stage": "consideration",
            "to_stage": "decision",
            "trigger_conditions": ["solution_comparison", "social_proof_reviewed"],
            "link_strategy": "drive_conversion",
            "conversion_focus": 0.8
        })
        
        # Decision → Retention flow
        flows.append({
            "from_stage": "decision",
            "to_stage": "retention",
            "trigger_conditions": ["conversion_completed", "purchase_made"],
            "link_strategy": "ensure_success",
            "conversion_focus": 0.7
        })
        
        return flows
    
    def _score_conversion_value(
        self,
        linking_analysis: Dict[str, Any],
        conversion_goals: List[str],
        conversion_focus: float
    ) -> List[Dict[str, Any]]:
        """Score all linking opportunities for conversion value."""
        
        scored_conversions = []
        
        # Score new opportunities
        new_opps = linking_analysis.get("new_opportunities", [])
        for opp in new_opps:
            conversion_score = self._calculate_conversion_score_for_opportunity(
                opp, conversion_goals, conversion_focus
            )
            opp["conversion_value"] = conversion_score
            opp["overall_score"] = (opp.get("seo_value", 5.0) * (1 - conversion_focus)) + (conversion_score * conversion_focus)
            scored_conversions.append(opp)
        
        # Score existing optimizations
        existing_opts = linking_analysis.get("existing_optimizations", [])
        for opt in existing_opts:
            conversion_score = self._calculate_conversion_score_for_optimization(
                opt, conversion_goals, conversion_focus
            )
            opt["conversion_value"] = conversion_score
            opt["overall_score"] = (opt.get("seo_value", 5.0) * (1 - conversion_focus)) + (conversion_score * conversion_focus)
            scored_conversions.append(opt)
        
        return sorted(scored_conversions, key=lambda x: x.get("overall_score", 0), reverse=True)
    
    def _calculate_conversion_score_for_opportunity(
        self,
        opportunity: Dict[str, Any],
        conversion_goals: List[str],
        conversion_focus: float
    ) -> float:
        """Calculate conversion score for a link opportunity."""
        
        base_score = 5.0
        
        # Boost based on link type
        link_type = opportunity.get("link_type", "")
        if link_type == LinkType.CONVERSION:
            base_score += 2.0
        elif link_type == LinkType.HYBRID_OBJECTIVE:
            base_score += 1.5
        elif link_type == LinkType.FUNNEL_TRANSITION:
            base_score += 1.8
        
        # Boost based on conversion objective alignment
        # This would be enhanced with actual conversion goal matching
        if any(goal in str(opportunity) for goal in conversion_goals):
            base_score += 1.0
        
        # Apply conversion focus multiplier
        final_score = base_score * conversion_focus
        
        return min(10.0, final_score)
    
    def _calculate_conversion_score_for_optimization(
        self,
        optimization: Dict[str, Any],
        conversion_goals: List[str],
        conversion_focus: float
    ) -> float:
        """Calculate conversion score for a link optimization."""
        
        base_score = optimization.get("conversion_impact", 5.0)
        
        # Boost for optimization types that improve conversion
        opt_type = optimization.get("optimization_type", "")
        if opt_type == "anchor_text":
            base_score += 1.2  # Anchor text optimization impacts conversion
        elif opt_type == "link_placement":
            base_score += 0.8  # Placement impacts visibility
        
        # Apply conversion focus
        final_score = base_score * conversion_focus
        
        return min(10.0, final_score)
    
    def _integrate_conversion_ctas(
        self,
        linking_analysis: Dict[str, Any],
        conversion_goals: List[str]
    ) -> List[Dict[str, Any]]:
        """Integrate conversion-focused CTAs into linking strategy."""
        
        cta_integrations = []
        
        for goal in conversion_goals:
            if goal == "lead_generation":
                cta_integrations.extend(self._create_lead_gen_ctas())
            elif goal == "demo_request":
                cta_integrations.extend(self._create_demo_request_ctas())
            elif goal == "trial_signup":
                cta_integrations.extend(self._create_trial_signup_ctas())
            elif goal == "purchase":
                cta_integrations.extend(self._create_purchase_ctas())
        
        return cta_integrations
    
    def _create_lead_gen_ctas(self) -> List[Dict[str, Any]]:
        """Create lead generation CTAs."""
        
        return [
            {
                "cta_type": "content_upgrade",
                "triggers": ["scroll_depth_70", "time_on_page_3min"],
                "placement": "within_content",
                "copy_variations": [
                    "Download Complete Guide",
                    "Get Free Checklist",
                    "Access Template Library"
                ],
                "conversion_value": 7.5
            },
            {
                "cta_type": "newsletter_signup",
                "triggers": ["exit_intent", "page_bottom"],
                "placement": "overlay_footer",
                "copy_variations": [
                    "Get Weekly Marketing Tips",
                    "Join 10,000+ Marketers",
                    "Stay Ahead of Trends"
                ],
                "conversion_value": 6.0
            }
        ]
    
    def _create_demo_request_ctas(self) -> List[Dict[str, Any]]:
        """Create demo request CTAs."""
        
        return [
            {
                "cta_type": "demo_scheduling",
                "triggers": ["feature_page_view", "pricing_page_interaction"],
                "placement": "sticky_header",
                "copy_variations": [
                    "Schedule Personalized Demo",
                    "See How It Works",
                    "Get Custom Walkthrough"
                ],
                "conversion_value": 8.5
            }
        ]
    
    def _create_trial_signup_ctas(self) -> List[Dict[str, Any]]:
        """Create trial signup CTAs."""
        
        return [
            {
                "cta_type": "free_trial",
                "triggers": ["product_interest", "comparison_completed"],
                "placement": "inline_content",
                "copy_variations": [
                    "Start Free 14-Day Trial",
                    "Try It Risk-Free",
                    "Get Instant Access"
                ],
                "conversion_value": 8.0
            }
        ]
    
    def _create_purchase_ctas(self) -> List[Dict[str, Any]]:
        """Create purchase CTAs."""
        
        return [
            {
                "cta_type": "buy_now",
                "triggers": ["pricing_confidence", "value_understanding"],
                "placement": "prominent_position",
                "copy_variations": [
                    "Buy Now - Instant Access",
                    "Get Started Today",
                    "Unlock Premium Features"
                ],
                "conversion_value": 9.5
            }
        ]
    
    def _calculate_conversion_score(self, scored_conversions: List[Dict[str, Any]]) -> float:
        """Calculate overall conversion optimization score."""
        
        if not scored_conversions:
            return 0.0
        
        total_conversion_value = sum(c.get("conversion_value", 0) for c in scored_conversions)
        average_conversion_value = total_conversion_value / len(scored_conversions)
        
        # Bonus for high-conversion opportunities
        high_value_count = len([c for c in scored_conversions if c.get("conversion_value", 0) >= 7.0])
        bonus_score = (high_value_count / len(scored_conversions)) * 10
        
        return min(100.0, average_conversion_value * 10 + bonus_score)
    
    def _calculate_path_effectiveness(self, path_data: Dict[str, Any], conversion_goals: List[str]) -> float:
        """Calculate effectiveness score for a conversion path."""
        
        # Simplified effectiveness calculation
        stage_count = len(path_data.get("stages", []))
        completeness = stage_count / 3  # Assume 3 stages is optimal
        
        # Check if path aligns with conversion goals
        goal_alignment = 0.5  # Base alignment
        for goal in conversion_goals:
            if goal in str(path_data).lower():
                goal_alignment += 0.2
        
        return min(1.0, completeness * goal_alignment)
    
    def _identify_path_optimizations(self, path_data: Dict[str, Any]) -> List[str]:
        """Identify optimization opportunities for a conversion path."""
        
        optimizations = []
        
        stages = path_data.get("stages", [])
        if len(stages) < 3:
            optimizations.append("Add missing funnel stages")
        
        # Check for weak transitions
        for i in range(len(stages) - 1):
            current_stage = stages[i]
            next_stage = stages[i + 1]
            
            if not current_stage.get("link_objectives"):
                optimizations.append(f"Strengthen {current_stage.get('stage')} stage objectives")
        
        return optimizations
    
    def _calculate_funnel_optimization_score(self, stage_coverage: Dict[str, Any]) -> float:
        """Calculate overall funnel optimization score."""
        
        stages = list(stage_coverage.keys())
        if not stages:
            return 0.0
        
        total_score = sum(stage.get("conversion_value", 0) for stage in stage_coverage.values())
        average_score = total_score / len(stages)
        
        return min(100.0, average_score * 10)
