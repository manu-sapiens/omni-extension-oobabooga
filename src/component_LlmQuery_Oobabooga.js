//@ts-check
import { createLlmQueryComponent, extractPayload } from 'omnilib-llms/llmComponent';

import { Llm_Oobabooga } from './llm_Oobabooga.js'
const MODEL_PROVIDER = 'oobabooga';

const llm = new Llm_Oobabooga();
const links = {}; // TBD: provide proper links
const LlmQueryComponent_Oobabooga =  createLlmQueryComponent(MODEL_PROVIDER, links, runProviderPayload );

async function runProviderPayload(payload, ctx) 
{
    const { instruction, prompt, temperature, model_name, args } = extractPayload(payload, MODEL_PROVIDER);
    const response = await llm.query(ctx, prompt, instruction, model_name, temperature, args);
    return response;
}

export { LlmQueryComponent_Oobabooga };
