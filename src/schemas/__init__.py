"""Versioned contracts. All public timestamps use seconds; app store uses ms."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class Contract(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)

class TimelineSegment(Contract):
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)
    asr_text: str = ''
    visual_description: str = ''

    @model_validator(mode='after')
    def ordered(self):
        if self.end_time <= self.start_time:
            raise ValueError('end_time must be after start_time')
        return self

class RawMultimodalDocument(Contract):
    schema_version: Literal['1.0'] = '1.0'
    source_url: str | None = None
    media_type: Literal['video', 'audio', 'article', 'mixed']
    title: str = Field(min_length=1)
    raw_text: str | None = None
    segments: list[TimelineSegment] = Field(default_factory=list)

class QuizItem(Contract):
    question_id: str
    question_type: Literal['concept', 'parameter', 'troubleshooting']
    question: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str
    related_timestamp: str | None = None

class KnowledgeMastery(Contract):
    topic: str
    status: Literal['untested', 'mastered', 'partial', 'failed'] = 'untested'
    last_feedback: str | None = None

class StructuredNote(Contract):
    title: str
    markdown: str
    source_ids: list[str] = Field(default_factory=list)
    unresolved: list[str] = Field(default_factory=list)

class LearningSession(Contract):
    session_id: str
    notebook_id: str
    current_question: QuizItem | None = None
    mastery: list[KnowledgeMastery] = Field(default_factory=list)


class TutorQuestion(Contract):
    type: Literal['concept', 'parameter', 'troubleshooting']
    content: str = Field(min_length=1, max_length=2000)
    topic: str = Field(min_length=1, max_length=200)
    source_label: str = Field(pattern=r'^S[1-9][0-9]*$')

class TutorResponse(Contract):
    evaluation: Literal['initial', 'mastered', 'partial', 'failed']
    feedback_message: str = Field(max_length=4000)
    question: TutorQuestion

class TutorRequest(Contract):
    notebookId: str
    action: Literal['next', 'answer']
    version: int = Field(ge=0)
    questionId: str | None = None
    replaceUnanswered: bool = False
    answer: str | None = Field(default=None, max_length=4000)


class FrameEvidence(Contract):
    segment_id: str
    timestamp: float = Field(ge=0)
    asr_text: str
    frame_path: str
    subtitle_text: str = ''
    ocr_version: int = 2
    slide_text: str = ''
    slide_id: str = ''
    slide_start_time: float = Field(default=0, ge=0)
    slide_changed: bool = False
    slide_confidence: float = Field(default=0, ge=0, le=1)
    ocr_confidence: float = Field(default=0, ge=0, le=1)
    visual_description: str = ''
    status: Literal['subtitle_candidate', 'no_subtitle', 'visual_inference', 'unresolved']

class SkillPackage(Contract):
    name: str = Field(pattern=r'^[a-z0-9][a-z0-9-]{0,63}$')
    entry_path: str
    source_count: int = Field(ge=0)
    status: Literal['draft'] = 'draft'
