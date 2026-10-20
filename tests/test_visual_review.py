import unittest
from scripts.visual_review import subtitle_rows, slide_rows, same_slide
from src.schemas import FrameEvidence
from pydantic import ValidationError

class VisualTests(unittest.TestCase):
    def test_filter_top_ui_and_low_confidence(self):
        rows=[([[0,10],[10,10],[10,20],[0,20]],'菜单',.99),([[0,300],[10,300],[10,320],[0,320]],'序列比对',.99),([[0,300],[10,300],[10,320],[0,320]],'噪声',.2)]
        text,score=subtitle_rows(rows,360)
        self.assertEqual(text,'序列比对');self.assertEqual(score,.99)
    def test_slide_text_is_separate_and_parameter_changes_are_preserved(self):
        rows=[([[0,10],[10,10],[10,20],[0,20]],'温度 37°C',.99),([[0,300],[10,300],[10,320],[0,320]],'字幕',.99)]
        self.assertEqual(slide_rows(rows,360)[0],'温度 37°C')
        self.assertFalse(same_slide('温度37°C','温度42°C'))
        self.assertTrue(same_slide('温度 37°C','温度37°C'))
    def test_missing_subtitle_is_not_inferred_text(self):
        self.assertEqual(subtitle_rows([],360),('',0))
    def test_contract_rejects_invalid_confidence(self):
        with self.assertRaises(ValidationError):
            FrameEvidence(segment_id='s',timestamp=1,asr_text='原文',frame_path='f',ocr_confidence=2,status='subtitle_candidate')
if __name__=='__main__':unittest.main()
