import unittest
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from scripts.video_sop import review_video, generate_audited_note, wait_for
from scripts import url_pipeline, tools_pipeline


class VideoSopTests(unittest.TestCase):
    def visual_api(self, report=None, status='done'):
        calls = []
        def api(base, route, data=None, **kwargs):
            calls.append((route, data))
            if route == '/api/visual-review': return {'id': 'r'}
            if route.startswith('/api/agent/runs'):
                return [{'id': 'r', 'status': status, 'error': 'OCR failed',
                         'result': report or {}}]
            return {'ok': True}
        return api, calls

    def test_visual_links_video_before_ocr_and_preserves_sample_count(self):
        api, calls = self.visual_api({'frames': 1, 'subtitleFrames': 1, 'sourceIds': ['v']})
        out = review_video('base', 'nb', 'video.mp4', {'id': 'asr', 'segments': [{}]}, api,
                           uploader=lambda *a: {'id': 'video'})
        self.assertEqual(out['mediaId'], 'video')
        self.assertEqual(calls[0], ('/api/link-media', {'sourceId': 'asr', 'mediaId': 'video'}))
        self.assertTrue(calls[1][1]['visionEnabled'])

    def test_missing_time_alignment_blocks_ocr_and_generation(self):
        api, calls = self.visual_api()
        with self.assertRaisesRegex(RuntimeError, '时间片段'):
            review_video('b', 'n', 'v', {'id': 's'}, api)
        self.assertEqual(calls, [])

    def test_visual_failure_is_not_success(self):
        api, _ = self.visual_api(status='failed')
        with self.assertRaisesRegex(RuntimeError, 'OCR failed'):
            review_video('b', 'n', 'v', {'id': 's', 'segments': [{}]}, api,
                         uploader=lambda *a: {'id': 'v'})

    def test_empty_or_partial_visual_output_blocks_delivery(self):
        for report in ({'frames': 1, 'sourceIds': ['v']},
                       {'frames': 0, 'subtitleFrames': 1, 'sourceIds': ['v']},
                       {'frames': 1, 'subtitleFrames': 1}):
            api, _ = self.visual_api(report)
            with self.assertRaises(RuntimeError):
                review_video('b', 'n', 'v', {'id': 's', 'segments': [{}]}, api,
                             uploader=lambda *a: {'id': 'v'})

    def note_api(self, fail=False, revision=True):
        calls = []
        def api(base, route, data=None, **kwargs):
            calls.append((route, data))
            if route == '/api/generate':
                self.assertTrue(data['background']); return {'status': 'running'}
            if route.startswith('/api/generate/status'):
                return {'status': 'failed' if fail else 'done', 'error': 'model offline'}
            if route.startswith('/api/audit'):
                return {'pipeline_id': 'P1', 'facts': [{'id': 'f'}]}
            if route == '/api/state':
                return {'revisions': [{'id': 'rev', 'notebookId': 'nb', 'content': '审计正文',
                                       'auditPipelineId': 'P1' if revision else 'old'}]}
            self.fail('Unexpected route: ' + route)
        return api, calls

    def test_generation_keeps_audited_revision_without_plain_notes_write(self):
        api, calls = self.note_api()
        result = generate_audited_note('b', 'nb', api)
        self.assertEqual(result['revisionId'], 'rev')
        self.assertEqual(result['auditPipelineId'], 'P1')
        self.assertFalse(any(r == '/api/notes' for r, _ in calls))

    def test_asr_only_audit_cannot_pass_video_sop(self):
        api, _ = self.note_api()
        with self.assertRaisesRegex(RuntimeError, "画面证据"):
            generate_audited_note("b", "nb", api, require_visual=True)

    def test_generation_failure_stops_before_audit(self):
        api, calls = self.note_api(fail=True)
        with self.assertRaisesRegex(RuntimeError, 'model offline'):
            generate_audited_note('b', 'nb', api)
        self.assertEqual(len(calls), 2)

    def test_stale_revision_cannot_be_reported_as_success(self):
        api, _ = self.note_api(revision=False)
        with self.assertRaises(RuntimeError): generate_audited_note('b', 'nb', api)

    def test_polling_survives_multiple_batches_and_times_out_explicitly(self):
        values = iter([{'status': 'running'}, {'status': 'running'}, {'status': 'done'}])
        out = wait_for(lambda: next(values), lambda p: p['status'] == 'done', sleep=lambda _: None)
        self.assertEqual(out['status'], 'done')
        ticks = iter([0, 0, 2])
        with self.assertRaises(TimeoutError):
            wait_for(lambda: {}, lambda p: False, timeout=1, clock=lambda: next(ticks), sleep=lambda _: None)

    def test_url_driver_orders_visual_before_audit_and_stops_on_visual_failure(self):
        for fail_visual in (False, True):
            with tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                video = root / 'clip.mp4'; video.write_bytes(b'video')
                audio = root / 'clip.wav'; audio.write_bytes(b'audio')
                resume = root / 'download.json'
                resume.write_text(json.dumps({'url': 'https://v.douyin.com/test/', 'source': 'douyin',
                    'video': str(video), 'audio': str(audio), 'dir': folder}), encoding='utf-8')
                report = root / 'report.json'; calls = []
                def visual(*a, **kw):
                    calls.append('visual')
                    if fail_visual: raise RuntimeError('OCR failed')
                    return {'frames': 1, 'sourceIds': ['visual']}
                def note(*a, **kw):
                    self.assertTrue(kw['require_visual']); calls.append('audit')
                    return {'revisionId': 'rev'}
                def skill(*a, **kw):
                    calls.append('skill'); return {'skill': {'name': 'k'}, 'gapCount': 0}
                argv = ['url_pipeline.py', '--source', 'douyin', '--url', 'https://v.douyin.com/test/',
                        '--app-root', folder, '--resume-media', str(resume), '--out', str(report)]
                with patch('sys.argv', argv), patch.object(url_pipeline, 'emit'), \
                     patch.object(url_pipeline, 'find_or_create_notebook', return_value={'id': 'nb', 'title': 'test', 'created': False}), \
                     patch.object(url_pipeline, 'transcribe', return_value={'id': 'asr', 'content': '原文', 'segments': [{'start': 0, 'end': 1000, 'text': '原文'}]}), \
                     patch.object(url_pipeline, 'review_video', side_effect=visual), \
                     patch.object(url_pipeline, 'generate_note', side_effect=note), \
                     patch.object(url_pipeline, 'run_skill', side_effect=skill):
                    code = url_pipeline.main()
                self.assertEqual(code, 1 if fail_visual else 0)
                self.assertEqual(calls, ['visual'] if fail_visual else ['visual', 'audit', 'skill'])
                self.assertEqual(json.loads(report.read_text(encoding='utf-8'))['status'], 'failed' if fail_visual else 'done')

    def test_video_link_domains_select_the_standard_driver(self):
        for url, source in [('https://b23.tv/test', 'bilibili'), ('https://www.xiaohongshu.com/explore/test', 'xhs-video')]:
            argv = ['tools_pipeline.py', '--api', 'http://127.0.0.1:8766', '--url', url]
            with patch('sys.argv', argv), patch.object(tools_pipeline.subprocess, 'run') as run:
                run.return_value.returncode = 0
                self.assertEqual(tools_pipeline.main(), 0)
            cmd = run.call_args.args[0]
            self.assertEqual(cmd[cmd.index('--source') + 1], source)

    def test_video_tools_driver_delegates_and_preserves_failure_exit(self):
        argv = ['tools_pipeline.py', '--api', 'http://127.0.0.1:8766', '--url',
                'https://v.douyin.com/test/', '--run-id', 'r', '--cookie-file', 'cookies.txt']
        with patch('sys.argv', argv), patch.object(tools_pipeline.subprocess, 'run') as run:
            run.return_value.returncode = 2
            self.assertEqual(tools_pipeline.main(), 2)
        cmd = run.call_args.args[0]
        self.assertTrue(cmd[1].endswith('url_pipeline.py'))
        self.assertEqual(cmd[cmd.index('--source') + 1], 'douyin')
        self.assertIn('cookies.txt', cmd); self.assertIn('r', cmd)


if __name__ == '__main__': unittest.main()
