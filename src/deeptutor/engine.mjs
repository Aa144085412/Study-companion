export function parseTurn(raw,action,refs){
 const value=JSON.parse(raw.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/^```(?:json)?\s*|\s*```$/g,'').trim());
 const q=value.question;
 if(!['initial','mastered','partial','failed'].includes(value.evaluation)||!q||!['concept','parameter','troubleshooting'].includes(q.type)||typeof q.content!=='string'||!q.content.trim()||q.content.length>2000||typeof q.topic!=='string'||!q.topic.trim()||q.topic.length>200||typeof value.feedback_message!=='string'||value.feedback_message.length>4000||!refs.some(r=>r.label===q.source_label))throw Error('测评模型输出格式或来源无效，请重试');
 if((action==='next')!==(value.evaluation==='initial'))throw Error('测评阶段不匹配，请重试');
 return {evaluation:value.evaluation,feedback_message:value.feedback_message,question:{type:q.type,content:q.content,topic:q.topic,source_label:q.source_label}};
}
