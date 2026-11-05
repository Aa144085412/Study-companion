import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResearchReport} from '../src/research_notes/index.mjs';
import {renderResearchReport} from '../src/research_notes/render.mjs';
import {makeFixture} from './fixtures/research-notes/make-fixture.mjs';

const options = {outline: {research_question: ['F1'], methods: ['F2'], results: ['F3']}};
const allItems = report => report.sections.flatMap(section => section.items);
const changeFact = (input, id, changes) => Object.assign(input.facts.find(f => f.id === id), changes);
const pending = (report, id) => report.pending.find(item => item.fact_id === id);

test('research report organizes existing facts and isolates rejected, unknown and conflicting content', () => {
  const report = buildResearchReport(makeFixture(), options);
  assert.deepEqual(allItems(report).map(item => item.fact_id), ['F1', 'F2', 'F3', 'F4']);
  assert.deepEqual(report.metrics, {input_facts: 8, source_items: 4, pending_items: 4, referenced_evidence: 5});
  assert.ok(pending(report, 'F5').reason_codes.includes('UNREVIEWED'));
  assert.ok(pending(report, 'F6').reason_codes.includes('UNSUPPORTED_SOURCE'));
  for (const id of ['F7', 'F8']) assert.ok(pending(report, id).reason_codes.includes('UNRESOLVED_CONFLICT'));
  assert.equal(report.sections.find(s => s.id === 'results').items[0].statement, makeFixture().facts[2].statement);
});

test('meeting template preserves speaker suggestions without manufacturing decisions, dates or bibliography', () => {
  const input = makeFixture(); input.title = '某论文 DOI: fabricated.example，作者待确认';
  const report = buildResearchReport(input, {template: 'meeting'});
  assert.equal(report.sections.length, 1);
  assert.equal(report.sections[0].items.length, 4);
  assert.deepEqual(report.decisions, []); assert.deepEqual(report.action_items, []);
  assert.deepEqual(report.bibliography, {title: null, authors: [], year: null, doi: null, status: 'NOT_VERIFIED'});
  assert.ok(allItems(report).every(item => item.status === 'SOURCE_STATEMENT_NOT_MEETING_DECISION'));
  assert.match(renderResearchReport(report), /尚未确认/);
});

test('no outline defaults to source topics instead of guessing research roles', () => {
  const report = buildResearchReport(makeFixture());
  assert.equal(report.sections.find(s => s.id === 'methods').items.length, 0);
  assert.equal(report.sections.find(s => s.id === 'topics').items.length, 4);
  assert.equal(report.provenance.classification, 'UNCLASSIFIED');
});

test('mapping rejected facts cannot bypass admission', () => {
  const report = buildResearchReport(makeFixture(), {outline: {results: ['F5', 'F6', 'F7']}});
  assert.equal(report.sections.find(s => s.id === 'results').items.length, 0);
  assert.ok(pending(report, 'F5'));
});

test('missing and duplicate audits are held for review', () => {
  for (const duplicate of [false, true]) {
    const input = makeFixture(), audit = input.audits.shift();
    if (duplicate) input.audits.push(audit, {...audit});
    const report = buildResearchReport(input);
    assert.ok(pending(report, 'F1').reason_codes.includes('AUDIT_NOT_ACCEPTED'));
  }
});

test('an audit requiring source checking cannot certify a fact despite matching quotes', () => {
  const input = makeFixture(); input.audits[0].certainty = 'SOURCE_CHECK_REQUIRED';
  assert.ok(pending(buildResearchReport(input), 'F1').reason_codes.includes('AUDIT_NOT_ACCEPTED'));
});

test('missing evidence and fabricated quotes are isolated even after a nominal accepted audit', () => {
  for (const quote of [{evidence_id: 'absent', quote: '不存在'}, {evidence_id: 'E1', quote: '材料完全没有这个结论'}]) {
    const input = makeFixture(); input.facts[0].evidence_quotes = [quote];
    assert.ok(pending(buildResearchReport(input), 'F1'));
  }
});

test('one valid quote does not hide another invalid supporting quote', () => {
  const input = makeFixture(); input.facts[0].evidence_quotes.push({evidence_id: 'E1', quote: '伪造支持'});
  assert.ok(pending(buildResearchReport(input), 'F1').reason_codes.includes('QUOTE_MISMATCH'));
});

test('a model-cleaned quote absent from raw text cannot enter the report body', () => {
  const input = makeFixture(); input.evidence[0].text += '\n模型新增的内容';
  input.facts[0].evidence_quotes = [{evidence_id: 'E1', quote: '模型新增的内容'}];
  assert.ok(pending(buildResearchReport(input), 'F1').reason_codes.includes('QUOTE_MISMATCH'));
});

test('original text and cleaned text remain separate and line breaks do not corrupt quote matching', () => {
  const input = makeFixture(); input.evidence[0].raw_text += '\n待清理的原始噪声';
  const report = buildResearchReport(input, options), source = report.evidence_index[0];
  assert.ok(allItems(report).some(item => item.fact_id === 'F1'));
  assert.notEqual(source.rawText, source.text);
  const md = renderResearchReport(report); assert.match(md, /管线清洗文字/); assert.match(md, /待清理的原始噪声/);
});

test('same time ranges on different media remain separate and use project milliseconds', () => {
  const report = buildResearchReport(makeFixture()), [first, second] = report.evidence_index.filter(e => e.sourceType === 'ASR_TRANSCRIPT');
  assert.notEqual(first.mediaId, second.mediaId); assert.notEqual(first.label, second.label);
  assert.equal(first.start, 12375); assert.equal(first.end, 19125);
  assert.equal(second.start, 12375); assert.equal(second.end, 19125);
  assert.equal(first.playbackAvailable, true);
  assert.match(renderResearchReport(report), /0:12\.375 → 0:19\.125/);
});

test('document-only evidence has source positions without fabricated media times', () => {
  const report = buildResearchReport(makeFixture());
  const source = report.evidence_index.find(e => e.evidenceId === 'E1');
  assert.equal(source.start, null); assert.equal(source.end, null); assert.equal(source.playbackAvailable, false);
  assert.match(renderResearchReport(report), /原资料未提供媒体时间戳/);
});

test('zero start time is retained; reversed, partial and nonfinite timestamps are not playable', () => {
  const good = makeFixture(); Object.assign(good.evidence[1], {start_time: 0, end_time: 1.5});
  assert.equal(buildResearchReport(good).evidence_index[1].start, 0);
  for (const pair of [[20, 10], [null, 10], [0, Infinity], [-1, 10], [0, 0.00001]]) {
    const input = makeFixture(); [input.evidence[1].start_time, input.evidence[1].end_time] = pair;
    const report = buildResearchReport(input);
    assert.ok(pending(report, 'F3').reason_codes.includes('INVALID_TIME_RANGE'));
    assert.equal(report.evidence_index[1].playbackAvailable, false);
  }
});

test('noise, low-confidence and missing raw evidence cannot enter source items', () => {
  for (const changes of [{noise: true}, {confidence: 0.79}, {raw_text: ''}, {flags: ['LOW_CONFIDENCE']}]) {
    const input = makeFixture(); Object.assign(input.evidence[0], changes);
    assert.ok(pending(buildResearchReport(input), 'F1').reason_codes.includes('LOW_QUALITY_EVIDENCE'));
  }
});

test('single-run and high-risk facts are preserved as pending even with accepted audit', () => {
  const input = makeFixture(); changeFact(input, 'F1', {knowledge_type: 'SINGLE_RUN_METRIC'});
  changeFact(input, 'F2', {flags: ['PARAMETER_ROLE_UNRESOLVED']});
  const report = buildResearchReport(input);
  assert.ok(pending(report, 'F1').reason_codes.includes('SINGLE_RUN'));
  assert.ok(pending(report, 'F2').reason_codes.includes('RISK_FLAG'));
});

test('malformed fact fields are held without crashing or coercing objects into confirmed prose', () => {
  for (const changes of [{statement: {}}, {flags: {}}, {conditions: [null]}, {knowledge_type: 'UNKNOWN'}, {evidence_quotes: {}}]) {
    const input = makeFixture(); changeFact(input, 'F1', changes);
    assert.ok(pending(buildResearchReport(input), 'F1'));
  }
});

test('invalid global artifacts, duplicate identities and dangling conflict references fail explicitly', () => {
  assert.throws(() => buildResearchReport({}), /schema_version/);
  for (const key of ['facts', 'evidence']) {
    const input = makeFixture(); input[key].push({...input[key][0]});
    assert.throws(() => buildResearchReport(input), /不重复/);
  }
  const input = makeFixture(); input.conflicts[0].fact_ids.push('missing');
  assert.throws(() => buildResearchReport(input), /无效事实/);
});

test('outline typos, duplicate allocation and decision/action keys fail instead of silently changing meaning', () => {
  for (const outline of [{results: ['missing']}, {results: ['F1'], methods: ['F1']},
    {decisions: ['F1']}, {action_items: ['F1']}, {methods: 'F1'}]) {
    assert.throws(() => buildResearchReport(makeFixture(), {outline}), /栏目/);
  }
  assert.throws(() => buildResearchReport(makeFixture(), {template: 'unknown'}), /模板/);
});

test('untrusted markdown, HTML and line breaks are escaped in all source text', () => {
  const input = makeFixture(), evil = '<script>alert(1)</script>\n# injected [open](javascript:alert(2))';
  input.title = evil; input.facts[0].statement = evil; input.facts[0].topic = evil;
  input.facts[0].evidence_quotes[0].quote = evil; input.evidence[0].raw_text = evil; input.evidence[0].text = evil;
  const md = renderResearchReport(buildResearchReport(input));
  assert.ok(!md.includes('<script>')); assert.ok(!md.includes('\n# injected'));
  assert.ok(!md.includes('](javascript:')); assert.ok(md.includes('&lt;script&gt;'));
  assert.ok(md.includes('<a id="source-s1"></a>'));
});

test('unreviewed candidate statements do not appear as report body assertions', () => {
  const input = makeFixture(), report = buildResearchReport(input);
  assert.ok(!renderResearchReport(report).includes(input.facts[4].statement));
  assert.equal(pending(report, 'F5').proposed_statement, input.facts[4].statement);
});

test('empty artifacts still show explicit missing information instead of hallucinated summaries', () => {
  const input = makeFixture(); input.facts = []; input.evidence = []; input.audits = []; input.conflicts = [];
  const report = buildResearchReport(input);
  assert.equal(report.metrics.source_items, 0); assert.equal(report.metrics.pending_items, 0);
  assert.match(renderResearchReport(report), /材料未明确提及/);
  assert.match(renderResearchReport(report), /没有可用证据索引/);
});

test('input is unchanged and repeat reports are byte-stable; evidence changes affect the report identity', () => {
  const input = makeFixture(), before = JSON.stringify(input);
  const first = buildResearchReport(input, options), second = buildResearchReport(input, options);
  assert.equal(JSON.stringify(input), before); assert.deepEqual(first, second);
  assert.equal(renderResearchReport(first), renderResearchReport(second));
  input.evidence[1].start_time = 12.5;
  assert.notEqual(buildResearchReport(input, options).report_id, first.report_id);
  assert.match(renderResearchReport(first), /合成开发样例/);
});
