"""FunnelIntegrator — part of the internal linking tools suite."""

from typing import List, Dict, Any

from crewai.tools import tool

from .enums import LinkType


class FunnelIntegrator:
    """
    Marketing funnel integration tool.
    
    Responsible for:
    - Funnel stage mapping
    - Conversion path design
    - Stage transition optimization
    - Business objective alignment
    """
    
    def __init__(self):
        self.funnel_stages = ["awareness", "consideration", "decision", "retention", "advocacy"]
    
    @tool
    def map_funnel_touchpoints(
        self,
        linking_strategy: Dict[str, Any],
        business_objectives: List[str],
        conversion_objectives: List[str]
    ) -> Dict[str, Any]:
        """
        Map internal linking to marketing funnel touchpoints.
        
        Args:
            linking_strategy: Linking strategy from analysis
            business_objectives: Business goals
            conversion_objectives: Conversion goals
            
        Returns:
            Funnel-mapped linking strategy
        """
        
        # Map content to funnel stages
        stage_mapping = self._map_content_to_stages(linking_strategy)
        
        # Design stage transitions
        transition_links = self._design_stage_transitions(
            stage_mapping, business_objectives, conversion_objectives
        )
        
        # Create touchpoint map
        touchpoint_map = self._create_touchpoint_map(
            stage_mapping, transition_links, conversion_objectives
        )
        
        return {
            "stage_mapping": stage_mapping,
            "transition_links": transition_links,
            "touchpoint_map": touchpoint_map,
            "funnel_effectiveness": self._calculate_funnel_effectiveness(touchpoint_map)
        }
    
    @tool
    def integrate_funnel_strategy(
        self,
        linking_strategy: Dict[str, Any],
        business_objectives: List[str],
        conversion_objectives: List[str],
        target_audience: str
    ) -> Dict[str, Any]:
        """
        Integrate comprehensive marketing funnel strategy into linking.
        
        Args:
            linking_strategy: Base linking strategy
            business_objectives: Business goals
            conversion_objectives: Conversion objectives
            target_audience: Target audience description
            
        Returns:
            Funnel-integrated linking strategy
        """
        
        funnel_integration = {
            "funnel_stages": self.funnel_stages,
            "stage_content_map": self._map_content_to_stages(linking_strategy),
            "progression_flows": self._design_progression_flows(business_objectives),
            "conversion_touchpoints": self._map_conversion_touchpoints(conversion_objectives),
            "target_audience": target_audience
        }
        
        return funnel_integration
    
    def _map_content_to_stages(self, linking_strategy: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """Map content to funnel stages."""
        
        stage_map = {stage: [] for stage in self.funnel_stages}
        
        # Map new opportunities
        new_opps = linking_strategy.get("new_opportunities", [])
        for opp in new_opps:
            stage = self._determine_funnel_stage(opp)
            stage_map[stage].append(opp)
        
        return stage_map
    
    def _determine_funnel_stage(self, opportunity: Dict[str, Any]) -> str:
        """Determine funnel stage for a linking opportunity."""
        
        link_type = opportunity.get("link_type", "")
        purpose = opportunity.get("purpose", "")
        
        if link_type == LinkType.PILLAR_TO_CLUSTER or "educate" in purpose:
            return "awareness"
        elif link_type == LinkType.HYBRID_OBJECTIVE or "compare" in purpose:
            return "consideration"
        elif link_type == LinkType.CONVERSION or "convert" in purpose:
            return "decision"
        
        return "awareness"
    
    def _design_stage_transitions(
        self,
        stage_mapping: Dict[str, List[Dict[str, Any]]],
        business_objectives: List[str],
        conversion_objectives: List[str]
    ) -> List[Dict[str, Any]]:
        """Design optimal transitions between funnel stages."""
        
        transitions = []
        
        for i in range(len(self.funnel_stages) - 1):
            from_stage = self.funnel_stages[i]
            to_stage = self.funnel_stages[i + 1]
            
            transitions.append({
                "from_stage": from_stage,
                "to_stage": to_stage,
                "trigger_conditions": self._define_transition_triggers(from_stage, to_stage),
                "link_strategy": self._define_transition_strategy(from_stage, to_stage),
                "conversion_focus": self._calculate_stage_conversion_focus(to_stage)
            })
        
        return transitions
    
    def _define_transition_triggers(self, from_stage: str, to_stage: str) -> List[str]:
        """Define triggers for stage transitions."""
        
        triggers_map = {
            ("awareness", "consideration"): ["educational_content_consumed", "problem_understanding"],
            ("consideration", "decision"): ["solution_comparison", "social_proof_reviewed"],
            ("decision", "retention"): ["conversion_completed", "purchase_made"],
            ("retention", "advocacy"): ["success_achieved", "satisfaction_high"]
        }
        
        return triggers_map.get((from_stage, to_stage), [])
    
    def _define_transition_strategy(self, from_stage: str, to_stage: str) -> str:
        """Define linking strategy for stage transition."""
        
        strategy_map = {
            ("awareness", "consideration"): "deepen_knowledge",
            ("consideration", "decision"): "drive_conversion",
            ("decision", "retention"): "ensure_success",
            ("retention", "advocacy"): "build_loyalty"
        }
        
        return strategy_map.get((from_stage, to_stage), "general_progression")
    
    def _calculate_stage_conversion_focus(self, stage: str) -> float:
        """Calculate conversion focus for a funnel stage."""
        
        focus_map = {
            "awareness": 0.3,
            "consideration": 0.6,
            "decision": 0.9,
            "retention": 0.7,
            "advocacy": 0.5
        }
        
        return focus_map.get(stage, 0.5)
    
    def _create_touchpoint_map(
        self,
        stage_mapping: Dict[str, List[Dict[str, Any]]],
        transition_links: List[Dict[str, Any]],
        conversion_objectives: List[str]
    ) -> Dict[str, Any]:
        """Create comprehensive touchpoint map."""
        
        return {
            "stage_touchpoints": {
                stage: len(content_list)
                for stage, content_list in stage_mapping.items()
            },
            "transition_touchpoints": len(transition_links),
            "conversion_touchpoints": len(conversion_objectives),
            "total_touchpoints": sum(len(content_list) for content_list in stage_mapping.values())
        }
    
    def _calculate_funnel_effectiveness(self, touchpoint_map: Dict[str, Any]) -> float:
        """Calculate funnel effectiveness score."""
        
        total_touchpoints = touchpoint_map.get("total_touchpoints", 0)
        transition_touchpoints = touchpoint_map.get("transition_touchpoints", 0)
        
        if total_touchpoints == 0:
            return 0.0
        
        coverage_score = min(100.0, (total_touchpoints / 20) * 100)  # Assume 20 is good coverage
        transition_score = min(100.0, (transition_touchpoints / 4) * 100)  # 4 main transitions
        
        return (coverage_score + transition_score) / 2
    
    def _design_progression_flows(self, business_objectives: List[str]) -> List[Dict[str, Any]]:
        """Design optimal progression flows."""
        
        return [
            {
                "flow_type": "awareness_to_decision",
                "stages": ["awareness", "consideration", "decision"],
                "objectives": business_objectives,
                "optimization_focus": "conversion"
            }
        ]
    
    def _map_conversion_touchpoints(self, conversion_objectives: List[str]) -> Dict[str, Any]:
        """Map conversion touchpoints."""
        
        return {
            objective: {
                "primary_stage": self._get_primary_stage_for_objective(objective),
                "supporting_stages": self._get_supporting_stages_for_objective(objective)
            }
            for objective in conversion_objectives
        }
    
    def _get_primary_stage_for_objective(self, objective: str) -> str:
        """Get primary funnel stage for conversion objective."""
        
        objective_stage_map = {
            "lead_generation": "consideration",
            "demo_request": "consideration",
            "trial_signup": "decision",
            "purchase": "decision"
        }
        
        return objective_stage_map.get(objective, "consideration")
    
    def _get_supporting_stages_for_objective(self, objective: str) -> List[str]:
        """Get supporting funnel stages for conversion objective."""
        
        return ["awareness", "consideration", "decision"]
