//@ts-check
import { createComponent, generateModelId } from '../../../src/utils/omni-utils.js';
import { Llm_Oobabooga, MODEL_PROVIDER, PROVIDER_NAME } from './llm_Oobabooga.js'

const llm = new Llm_Oobabooga();

export async function async_getLlmManagerComponent_Oobabooga()
{

    const model_choices = {
        "block": "oobabooga.manageModelComponent",
        "args": {"action": "list"},
        "cache": "user",
        "map": { "root": "result" }
    };

    const inputs = [
        { name: 'model', type: 'string', customSocket: 'text', choices: model_choices},
        { name: 'use_gpu', type: 'boolean', defaultValue: false},
        { name: 'seed', type: 'number', defaultValue: -1, minimum: -1, maximum: 32768, step:1, description: "A number used to determine the initial noise distribution for the text generation process. Different seed values will create unique text results. The special value, -1, will generate a random seed instead."},
        { name: 'negative_prompt', type: 'string', customSocket: 'text', defaultValue: "", description: "A text description that guides the text generation process, but with a negative connotation."},
        { name: `max_new_tokens`, type: 'number', defaultValue: 2000, minimum: 8, maximum: 32768, step:1, description: "The maximum number of tokens to generate."},
        { name: 'llm_args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
        { name: 'loader_args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to load the LLM'},
    ];
    const outputs = [
        { name: 'model_id', type: 'string', customSocket: 'text', description: "The ID of the selected LLM model"},
        { name: 'args', type: 'object', customSocket: 'object', description: 'Extra arguments provided to the LLM'},
        { name: 'model_info', type: 'object', customSocket: 'object', description: 'Information about the selected model'},
        { name: 'model_name', type: 'string', customSocket: 'text', description: "The name of the selected LLM model"},
    ]
    const controls = null;
    const links = {}

    const LlmManagerComponent = createComponent(MODEL_PROVIDER, 'llm_manager',`LLM Manager: ${PROVIDER_NAME}`, 'Text Generation',`Manage LLMs from provider: ${PROVIDER_NAME}`, `Manage LLMs from provider: ${PROVIDER_NAME}`, links, inputs, outputs, controls, parsePayload );
    return LlmManagerComponent;
}


async function parsePayload(payload, ctx) 
{
    const failure = { result: { "ok": false }, model_id: null};

    if (!payload) return failure;
    
    const model_name = payload.model;

    const use_gpu = payload.use_gpu || false;
    const seed = payload.seed || -1;
    const negative_prompt = payload.negative_prompt || "";
    const max_new_tokens = payload.max_new_tokens || 2000;
    let llm_args = payload.llm_args;
    let loader_args = payload.loader_args;

    if (!llm_args || llm_args == undefined) llm_args = {}
    if (!loader_args || loader_args == undefined) loader_args = {}
    
    const model_id = generateModelId(model_name, MODEL_PROVIDER);
   
    if ("no_stream" in loader_args == false) loader_args["no_stream"] = true;
    if ("n-gpu-layers" in loader_args == false) 
    {
        if (use_gpu) loader_args['n-gpu-layers'] = 1; // TBD look into a better number based on the type of the model
        else loader_args['n-gpu-layers'] = 0;
    }

    if ("seed" in llm_args == false) llm_args['seed'] = seed;
    if ("negative_prompt" in llm_args == false) llm_args["negative_prompt"] = negative_prompt;
    if ("max_new_tokens" in llm_args == false) llm_args["max_new_tokens"] = max_new_tokens;
    
    let model_info = await llm.loadModelIfNeeded(ctx, model_name, loader_args);

    const return_value = { result: { "ok": true }, model_id: model_id, args: llm_args, model_info: model_info, model_name: model_name};
    return return_value;
}