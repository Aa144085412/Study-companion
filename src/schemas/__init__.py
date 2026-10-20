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
