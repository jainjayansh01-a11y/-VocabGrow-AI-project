import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app=express(),PORT=process.env.PORT||3000,__dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"}));app.use(express.static(path.join(__dirname,"public")));
let qvac,modelId,modelStatus="loading",modelError="";
async function initModel(){try{qvac=await import("@qvac/sdk");const modelSrc=qvac.LLAMA_3_2_1B_INST_Q4_0??qvac.LLAMA_3_2_1B_INSTRUCT_Q4_0??qvac.LLAMA_3_2_1B_Q4_0;if(!modelSrc||typeof qvac.loadModel!=="function")throw Error("QVAC model export/loadModel not found. Verify SDK version and supported model export.");const loaded=await qvac.loadModel({modelSrc});modelId=loaded?.modelId??loaded?.id??loaded;if(!modelId)throw Error("QVAC did not return a model ID.");modelStatus="ready";console.log("ReplyCraft AI: QVAC local model loaded.");}catch(e){modelStatus="error";modelError=e?.message||String(e);console.error("QVAC initialization failed:",modelError);}}
async function getText(r) {
  let value = r?.text ?? r?.content ?? r?.message?.content ??
    r?.output ?? (typeof r === "string" ? r : "");

  value = await value;

  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return "";
}
app.get("/api/status",(_req,res)=>res.json({status:modelStatus,message:modelStatus==="ready"?"Local AI is ready.":modelStatus==="error"?modelError:"Loading local model…"}));
app.post("/api/reply",async(req,res)=>{const message=String(req.body?.message??"").trim().slice(0,6000),purpose=String(req.body?.purpose??"General reply").slice(0,80),tone=String(req.body?.tone??"Friendly").slice(0,40),length=String(req.body?.length??"Medium").slice(0,30),extra=String(req.body?.extra??"").trim().slice(0,1500);if(!message)return res.status(400).json({error:"Paste the message you want to reply to."});if(modelStatus!=="ready")return res.status(503).json({error:"Local QVAC model is not ready.",detail:modelError||"Wait for model loading."});const prompt=`You are ReplyCraft AI, a helpful writing assistant. Write a reply to the message below.\nPurpose: ${purpose}\nTone: ${tone}\nLength: ${length}\nAdditional instructions: ${extra||"None"}\nOriginal message:\n"""${message}"""\nReturn only the reply text, without commentary or quotation marks. Do not invent facts, promises, dates, or commitments. If key information is missing, use a brief placeholder in square brackets.`;try{const result=await qvac.completion({modelId,history:[{role:"user",content:prompt}],stream:false}),answer= await getText(result);if(!answer)throw Error("QVAC returned no readable text.");res.json({answer:String(answer),source:"on-device QVAC model"});}catch(e){res.status(500).json({error:"Local AI reply generation failed.",detail:e?.message||String(e)});}});
app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>{console.log(`ReplyCraft AI: http://localhost:${PORT}`);initModel();});
