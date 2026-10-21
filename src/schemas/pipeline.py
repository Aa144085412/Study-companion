"""Pipeline v2 contracts: extraction confidence is never scientific verification."""
from enum import Enum
from typing import Literal
from pydantic import Field, model_validator
from . import Contract

class EvidenceSourceType(str, Enum):
    ASR_TRANSCRIPT = 'ASR_TRANSCRIPT'
    SUBTITLE_OCR = 'SUBTITLE_OCR'
    SLIDE_DOCUMENT_OCR = 'SLIDE_DOCUMENT_OCR'
    UI_OR_INSTRUMENT_OCR = 'UI_OR_INSTRUMENT_OCR'
    VLM_VISUAL_INFERENCE = 'VLM_VISUAL_INFERENCE'
    UNKNOWN_VISUAL_OCR = 'UNKNOWN_VISUAL_OCR'
    DOCUMENT_TEXT = 'DOCUMENT_TEXT'

class EvidenceItem(Contract):
    id: str
    source_id: str
    segment_id: str | None = None
    media_id: str | None = None
    title: str
    start_time: float | None = Field(default=None, ge=0)
    end_time: float | None = Field(default=None, ge=0)
    source_type: EvidenceSourceType
    raw_text: str
    text: str
    confidence: float | None = Field(default=None, ge=0, le=1)
    flags: list[str] = Field(default_factory=list)
    classification_method: str = 'imported_metadata'
    aligned_evidence_ids: list[str] = Field(default_factory=list)
    frame_path: str | None = None
    noise: bool = False
    @model_validator(mode='after')
    def safety(self):
        if self.start_time is not None and self.end_time is not None and self.end_time <= self.start_time:
            raise ValueError('invalid time range')
        if self.source_type == EvidenceSourceType.VLM_VISUAL_INFERENCE and 'VISUAL_INFERENCE' not in self.flags:
            raise ValueError('inference must remain marked')
        if self.source_type == EvidenceSourceType.UI_OR_INSTRUMENT_OCR and 'HIGH_RISK_ISOLATED_NUMBER' not in self.flags:
            raise ValueError('instrument evidence requires risk flag')
        return self

class GlossaryCandidate(Contract):
    observed: str
    proposed: str
    evidence_ids: list[str]
    status: Literal['CANDIDATE_ONLY'] = 'CANDIDATE_ONLY'
    reason: str

class EvidenceQuote(Contract):
    evidence_id: str
    quote: str = Field(min_length=1)

class FactParameter(Contract):
    name: str
    value: str
    unit: str

class AtomicFactCard(Contract):
    id: str
    topic: str
    step: str
    entity: str
    property: str
    statement: str
    parameters: list[FactParameter] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    knowledge_type: Literal['GENERAL_PRINCIPLE', 'CONDITIONAL_PRACTICE', 'SINGLE_RUN_METRIC', 'SOURCE_CLAIM']
    evidence_quotes: list[EvidenceQuote] = Field(min_length=1)
    flags: list[str] = Field(default_factory=list)
    verification: Literal['UNREVIEWED', 'MODEL_REVIEWED', 'EXTERNALLY_VERIFIED', 'PENDING_VERIFICATION'] = 'UNREVIEWED'
    layer: Literal['CORE', 'CONTEXT', 'UNRESOLVED'] = 'UNRESOLVED'

class ConflictRecord(Contract):
    id: str
    fact_ids: list[str] = Field(min_length=2)
    reason: str
    status: Literal['UNRESOLVED_CONFLICT', 'RESOLVED_CONTEXT'] = 'UNRESOLVED_CONFLICT'

class AttributionAuditResult(Contract):
    fact_id: str
    attribution: Literal['NONE', 'ASR_OCR_DISTORTION', 'MODEL_INDUCTION_ERROR', 'SOURCE_TEACHING_DEVIATION', 'UNDETERMINED']
    supported: bool
    generalizable: bool
    rationale: str
    proposed_correction: str = ''
    standard_boundary: str = ''
    external_reference_ids: list[str] = Field(default_factory=list)
    decision: Literal['ACCEPT', 'CONTEXT_ONLY', 'REWRITE', 'PENDING_VERIFICATION']
    certainty: Literal['MODEL_REVIEW', 'SOURCE_CHECK_REQUIRED', 'EXTERNAL_REFERENCE'] = 'MODEL_REVIEW'

class QuizOption(Contract):
    id: Literal['A','B','C','D']
    text: str = Field(min_length=1)

class OptionJudgment(Contract):
    id: Literal['A','B','C','D']
    valid: bool
    reason: str = Field(min_length=1)

class BlindSolverResult(Contract):
    answers: list[Literal['A','B','C','D']]
    unique: bool
    sufficient_conditions: bool
    non_overlapping: bool
    option_judgments: list[OptionJudgment] = Field(min_length=4, max_length=4)
    rationale: str = Field(min_length=1)

class VerifiedQuizItem(Contract):
    id: str
    content: str
    topic: str
    dimension: Literal['WHY','JUDGMENT','CONTROL_LOGIC','TROUBLESHOOTING']
    options: list[QuizOption] = Field(min_length=4, max_length=4)
    correct_answer: Literal['A','B','C','D']
    explanation: str
    fact_ids: list[str] = Field(min_length=1)
    blind_verification: BlindSolverResult
    verification_status: Literal['BLIND_MODEL_AGREEMENT'] = 'BLIND_MODEL_AGREEMENT'
    pipeline_id: str
    @model_validator(mode='after')
    def gate(self):
        b=self.blind_verification
        if {o.id for o in self.options} != set('ABCD') or len({o.text for o in self.options})!=4:
            raise ValueError('four distinct options required')
        if not (b.unique and b.sufficient_conditions and b.non_overlapping and b.answers==[self.correct_answer]):
            raise ValueError('blind solver did not independently agree')
        if {o.id for o in b.option_judgments}!=set('ABCD') or [o.id for o in b.option_judgments if o.valid]!=[self.correct_answer]:
            raise ValueError('all distractors must be rejected with reasons')
        return self

class PipelineArtifact(Contract):
    schema_version: Literal['2.0'] = '2.0'
    pipeline_id: str
    input_hash: str
    title: str
    domain: str
    glossary: list[GlossaryCandidate]
    evidence: list[EvidenceItem]
    facts: list[AtomicFactCard]
    conflicts: list[ConflictRecord]
    audits: list[AttributionAuditResult]
    clusters: list[dict]
    markdown: str
    metrics: dict
    provenance: dict
