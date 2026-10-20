import unittest
from unittest.mock import Mock
from pydantic import ValidationError
from src.schemas import TimelineSegment, RawMultimodalDocument, LearningSession
from src.extractors.course import from_source, transcribe

class Contracts(unittest.TestCase):
    def test_bad_timestamps(self):
        for start,end in [(2,1),(-1,2),(0,float('nan')),(0,float('inf'))]:
            with self.assertRaises(ValidationError):
                TimelineSegment(start_time=start,end_time=end)

    def test_units_and_no_invented_vision(self):
        d=from_source({'content':'示例','segments':[{'start':1500,'end':2700,'text':'示例'}]},'课')
        self.assertEqual(d.segments[0].start_time,1.5)
        self.assertEqual(d.segments[0].visual_description,'')
        self.assertEqual(RawMultimodalDocument.model_validate_json(d.model_dump_json()),d)

    def test_sessions_do_not_share_lists(self):
        a=LearningSession(session_id='a',notebook_id='b')
        b=LearningSession(session_id='b',notebook_id='b')
        self.assertIsNot(a.mastery,b.mastery)

class Queue(unittest.TestCase):
    def execute(self, states, **kwargs):
        api=Mock(side_effect=[states[0], {'id':'job'}, *states[1:]])
        result=transcribe('http://localhost', 'book', 'large.wav', api,
                         uploader=lambda *a:{'id':'media'},sleep=lambda _:None,**kwargs)
        return result,api

    def test_completion_preserves_source(self):
        source={'id':'text','notebookId':'book','mediaId':'media','content':'课','segments':[]}
        result,api=self.execute([{}, {'jobs':[{'id':'job','state':'running'}]},
            {'jobs':[{'id':'job','state':'completed','resultSourceId':'text'}],'sources':[source]}])
        self.assertEqual(result,source)
        self.assertFalse(any('/api/transcribe' in str(c) for c in api.call_args_list))

    def test_failure_states_are_not_success(self):
        for state in ['failed','cancelled','interrupted']:
            with self.assertRaises(RuntimeError):
                self.execute([{}, {'jobs':[{'id':'job','state':state,'error':'失败'}]}])

    def test_empty_completed_is_error(self):
        with self.assertRaises(RuntimeError):
            self.execute([{}, {'jobs':[{'id':'job','state':'completed'}]}])

    def test_timeout(self):
        ticks=iter([0,2])
        with self.assertRaises(TimeoutError):
            self.execute([{}],timeout=1,clock=lambda:next(ticks))

    def test_reuse_latest_corrected_transcript(self):
        source={'id':'corrected','notebookId':'book','mediaId':'media','content':'校对'}
        api=Mock(return_value={'sources':[{'id':'old','mediaId':'media','replacedBy':'corrected'},source]})
        self.assertEqual(transcribe('base','book','file',api,uploader=lambda *a:{'id':'media'}),source)
        self.assertEqual(api.call_count,1)

if __name__=='__main__': unittest.main()
