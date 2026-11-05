import fs from 'node:fs';import path from 'node:path';
import {renderAgentMarkdown} from './agent-markdown.mjs';
export function copyReferenceImages(images,directory,imageRoot){
 const allowed=imageRoot&&path.resolve(imageRoot)+path.sep;
 for(const image of images){
  const source=path.resolve(image.sourcePath);
  if(!allowed||!source.startsWith(allowed)||!source.toLowerCase().endsWith('.jpg')||!fs.existsSync(source))throw Error('参考截图缺失或不属于当前画面证据目录');
  if(!/^images\/G\d{2,}\.jpg$/.test(image.relativePath))throw Error('无效参考图片名称');
  const target=path.join(directory,image.relativePath);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
 }
}
export function writeAgentBundle(artifact,{directory,imageRoot,sourceUrl='',review=null}){
 const document=renderAgentMarkdown(artifact,{sourceUrl,review});
 if(artifact.visual_sections?.length&&!document.images.length)throw Error('视频图文参考包缺少图片');
 fs.mkdirSync(directory,{recursive:true});copyReferenceImages(document.images,directory,imageRoot);
 fs.writeFileSync(path.join(directory,'note.md'),document.markdown,'utf8');
 const manifest={format:document.format,entry:'note.md',reviewStatus:document.reviewStatus,images:document.images.map(({sourcePath,...image})=>image),facts:document.factCount,pending:document.pendingCount};
 fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2),'utf8');
 fs.writeFileSync(path.join(directory,'README.md'),'# 图文参考资料\n\n把本目录或整个压缩包提供给支持读取图片的Agent。先读note.md，再按G编号联合读取images中的原图与对应K条目。若只收到note.md而没有images，应先补齐图片再作图文理解。\n','utf8');
 return {document,manifest};
}
