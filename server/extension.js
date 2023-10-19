/**
 * Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
 * All rights reserved.
 */


await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();


// component_LlmManager_Oobabooga.js
import { createComponent, generateModelId as generateModelId2 } from "../../../src/utils/omni-utils.js";

// llm_Oobabooga.js
import { runBlock, Llm, generateModelId, deduceLlmTitle, deduceLlmDescription, addLocalLlmChoices, DEFAULT_UNKNOWN_CONTEXT_SIZE, Tokenizer_Openai } from "../../../src/utils/omni-utils.js";
var MODEL_PROVIDER = "oobabooga";
var PROVIDER_NAME = "Oobabooga";
var LLM_MODEL_TYPE_OOBABOOGA = "oobabooga";
var BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
var BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";
var ICON_OOBABOOGA = "\u{1F4C1}";
function parseModelResponse(model_response) {
  return model_response;
}
var Llm_Oobabooga = class extends Llm {
  constructor() {
    const tokenizer_Openai = new Tokenizer_Openai();
    super(tokenizer_Openai);
  }
  // -----------------------------------------------------------------------
  /**
   * @param {any} ctx
   * @param {string} prompt
   * @param {string} instruction
   * @param {string} model_name
   * @param {number} [temperature=0]
   * @param {any} [args=null]
   * @returns {Promise<{ answer_text: string; answer_json: any; }>}
   */
  async query(ctx, prompt, instruction, model_name, temperature = 0.7, args = null) {
    await this.loadModelIfNeeded(ctx, model_name);
    const max_new_tokens = args?.max_new_tokens_max || 2e3;
    const negative_prompt = args?.negative_prompt || "";
    const seed = args?.seed || -1;
    args.user = ctx.userId;
    if ("max_new_tokens" in args == false)
      args.max_new_tokens = max_new_tokens;
    if ("negative_prompt" in args == false)
      args.negative_prompt = negative_prompt;
    if ("seed" in args == false)
      args.seed = seed;
    if ("prompt" in args == false)
      args.prompt = `${instruction}

${prompt}`;
    if ("temperature" in args == false)
      args.temperature = temperature;
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT, args);
    if (response.error)
      throw new Error(response.error);
    const results = response?.results || [];
    if (results.length == 0)
      throw new Error("No results returned from oobabooga");
    const answer_text = results[0].text || null;
    if (!answer_text)
      throw new Error("Empty text result returned from oobabooga.");
    args.answer_text = answer_text;
    const return_value = {
      answer_text,
      answer_json: args
    };
    return return_value;
  }
  getProvider() {
    return MODEL_PROVIDER;
  }
  getModelType() {
    return LLM_MODEL_TYPE_OOBABOOGA;
  }
  async getModelChoices(choices, llm_model_types, llm_context_sizes) {
    await addLocalLlmChoices(choices, llm_model_types, llm_context_sizes, LLM_MODEL_TYPE_OOBABOOGA, MODEL_PROVIDER);
  }
  // -------------------------------------------------
  async getCurrentModelInfoFromServer(ctx) {
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "info" });
    const model_response = response?.result;
    const model_info = parseModelResponse(model_response);
    return model_info;
  }
  async loadModelOnServer(ctx, model_name, loading_args) {
    const block_args = { ...loading_args };
    block_args.model_name = model_name;
    block_args.action = "load";
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, block_args);
    const model_response = response?.result;
    const model_info = parseModelResponse(model_response);
    return model_info;
  }
  async getModelChoicesFromServer(ctx, choices, llm_model_types, llm_context_sizes) {
    const model_names = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "list" });
    for (const model_name in model_names) {
      let title, description, model_type, context_size, memory_need;
      const model_id = generateModelId(model_name, MODEL_PROVIDER);
      title = deduceLlmTitle(model_name, MODEL_PROVIDER, ICON_OOBABOOGA);
      description = deduceLlmDescription(model_name);
      llm_model_types[model_name] = LLM_MODEL_TYPE_OOBABOOGA;
      llm_context_sizes[model_name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
      const choice = { value: model_id, title, description };
      choices.push(choice);
    }
  }
  async loadModelIfNeeded(ctx, model_name, loading_args) {
    let model_info = await this.getCurrentModelInfoFromServer(ctx);
    let loaded_model = model_info?.model_name;
    const context_size = this.getModelContextSizeFromModelInfo(model_info);
    if (context_size)
      this.context_sizes[model_name] = context_size;
    if (loaded_model != model_name) {
      model_info = await this.loadModelOnServer(ctx, model_name, loading_args);
      loaded_model = model_info?.model_name;
    }
    if (loaded_model != model_name)
      throw new Error(`Failed to load model ${model_name} into oobabooga`);
    return model_info;
  }
  getModelContextSizeFromModelInfo(model_info) {
    const context_size = model_info?.shared_settings?.max_new_tokens_max;
    return context_size;
  }
};

// component_LlmManager_Oobabooga.js
var llm = new Llm_Oobabooga();
async function async_getLlmManagerComponent_Oobabooga() {
  const model_choices = {
    "block": "oobabooga.manageModelComponent",
    "args": { "action": "list" },
    "cache": "user",
    "map": { "root": "result" }
  };
  const inputs = [
    { name: "model", type: "string", customSocket: "text", choices: model_choices },
    { name: "use_gpu", type: "boolean", defaultValue: false },
    { name: "seed", type: "number", defaultValue: -1, minimum: -1, maximum: 32768, step: 1, description: "A number used to determine the initial noise distribution for the text generation process. Different seed values will create unique text results. The special value, -1, will generate a random seed instead." },
    { name: "negative_prompt", type: "string", customSocket: "text", defaultValue: "", description: "A text description that guides the text generation process, but with a negative connotation." },
    { name: `max_new_tokens`, type: "number", defaultValue: 2e3, minimum: 8, maximum: 32768, step: 1, description: "The maximum number of tokens to generate." },
    { name: "llm_args", type: "object", customSocket: "object", description: "Extra arguments provided to the LLM" },
    { name: "loader_args", type: "object", customSocket: "object", description: "Extra arguments provided to load the LLM" }
  ];
  const outputs = [
    { name: "model_id", type: "string", customSocket: "text", description: "The ID of the selected LLM model" },
    { name: "args", type: "object", customSocket: "object", description: "Extra arguments provided to the LLM" },
    { name: "model_info", type: "object", customSocket: "object", description: "Information about the selected model" },
    { name: "model_name", type: "string", customSocket: "text", description: "The name of the selected LLM model" }
  ];
  const controls = null;
  const links2 = {};
  const LlmManagerComponent = createComponent(MODEL_PROVIDER, "llm_manager", `LLM Manager: ${PROVIDER_NAME}`, "Text Generation", `Manage LLMs from provider: ${PROVIDER_NAME}`, `Manage LLMs from provider: ${PROVIDER_NAME}`, links2, inputs, outputs, controls, parsePayload);
  return LlmManagerComponent;
}
async function parsePayload(payload, ctx) {
  const failure = { result: { "ok": false }, model_id: null };
  if (!payload)
    return failure;
  const model_name = payload.model;
  const use_gpu = payload.use_gpu || false;
  const seed = payload.seed || -1;
  const negative_prompt = payload.negative_prompt || "";
  const max_new_tokens = payload.max_new_tokens || 2e3;
  let llm_args = payload.llm_args;
  let loader_args = payload.loader_args;
  if (!llm_args || llm_args == void 0)
    llm_args = {};
  if (!loader_args || loader_args == void 0)
    loader_args = {};
  const model_id = generateModelId2(model_name, MODEL_PROVIDER);
  if ("no_stream" in loader_args == false)
    loader_args["no_stream"] = true;
  if ("n-gpu-layers" in loader_args == false) {
    if (use_gpu)
      loader_args["n-gpu-layers"] = 1;
    else
      loader_args["n-gpu-layers"] = 0;
  }
  if ("seed" in llm_args == false)
    llm_args["seed"] = seed;
  if ("negative_prompt" in llm_args == false)
    llm_args["negative_prompt"] = negative_prompt;
  if ("max_new_tokens" in llm_args == false)
    llm_args["max_new_tokens"] = max_new_tokens;
  let model_info = await llm.loadModelIfNeeded(ctx, model_name, loader_args);
  const return_value = { result: { "ok": true }, model_id, args: llm_args, model_info, model_name };
  return return_value;
}

// component_LlmQuery_Oobabooga.js
import { async_getLlmQueryComponent, extractLlmQueryPayload } from "../../../src/utils/omni-utils.js";
var llm2 = new Llm_Oobabooga();
var links = {};
async function get_LlmQueryComponent_Oobabooga() {
  const result = await async_getLlmQueryComponent(MODEL_PROVIDER, links, runProviderPayload, false);
  return result;
}
async function runProviderPayload(payload, ctx) {
  const { instruction, prompt, temperature, model_name, args } = extractLlmQueryPayload(payload, MODEL_PROVIDER);
  const response = await llm2.query(ctx, prompt, instruction, model_name, temperature, args);
  return response;
}

// extension.js
async function CreateComponents() {
  const LlmManagerComponent_Oobabooga = await async_getLlmManagerComponent_Oobabooga();
  const LlmQueryComponent_Oobabooga = await get_LlmQueryComponent_Oobabooga();
  const components = [LlmManagerComponent_Oobabooga, LlmQueryComponent_Oobabooga];
  return {
    blocks: components,
    patches: []
  };
}
var extension_default = { createComponents: CreateComponents };
export {
  extension_default as default
};
