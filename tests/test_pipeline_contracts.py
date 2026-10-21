import unittest
from pydantic import ValidationError
from src.schemas.pipeline import EvidenceItem, VerifiedQuizItem, AtomicFactCard, FactParameter
from scripts.visual_review import typed_evidence
from src.schemas import FrameEvidence

class PipelineContracts(unittest.TestCase):
    def test_inference_and_instrument_require_risk_tags(self):
        base=dict(id='E1',source_id='s',title='课',raw_text='文字',text='文字')
        for kind in ['VLM_VISUAL_INFERENCE','UI_OR_INSTRUMENT_OCR']:
            with self.assertRaises(ValidationError): EvidenceItem(**base,source_type=kind)
    def test_invalid_timestamps(self):
        with self.assertRaises(ValidationError): EvidenceItem(id='E1',source_id='s',title='课',raw_text='x',text='x',source_type='ASR_TRANSCRIPT',start_time=3,end_time=2)
    def test_visual_export_separates_inference_and_unknown_body(self):
        e=FrameEvidence(segment_id='s',timestamp=1,asr_text='讲解',frame_path='frame.jpg',subtitle_text='字幕',slide_text='屏幕文字',visual_description='可能是仪器',status='visual_inference')
        items=typed_evidence({'mediaId':'m'},[{'id':'s','start':0,'end':2000}],[e])
        self.assertEqual(len(items),4)
        self.assertEqual(items[2]['source_type'],'UNKNOWN_VISUAL_OCR')
        self.assertIn('VISUAL_INFERENCE',items[3]['flags'])
        self.assertNotIn('可能是仪器',items[1]['text'])
    def test_parameter_roles_roundtrip(self):
        p=FactParameter(name='电压',value='12',unit='V',quantity_role='输入',stage='转换前',object='电源',source_scope='本次')
        self.assertEqual(p.model_dump()['stage'],'转换前')
        self.assertEqual(FactParameter(name='电压',value='12',unit='V').quantity_role,'UNSPECIFIED')
    def test_blind_disagreement_never_validates(self):
        with self.assertRaises(ValidationError):
            VerifiedQuizItem(id='Q1',content='问题',topic='概念',dimension='WHY',options=[{'id':x,'text':x} for x in 'ABCD'],correct_answer='A',explanation='解析',fact_ids=['F1'],pipeline_id='P1',blind_verification={'answers':['B'],'unique':True,'sufficient_conditions':True,'non_overlapping':True,'option_judgments':[{'id':x,'valid':x=='B','reason':'理由'} for x in 'ABCD'],'rationale':'独立理由'})
if __name__=='__main__': unittest.main()
