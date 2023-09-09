
await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();


// node_modules/omnilib-utils/component.js
import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from "mercs_rete";
function generateTitle(name) {
  const title = name.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
  return title;
}
function setComponentInputs(component, inputs) {
  inputs.forEach(function(input) {
    var name = input.name, type = input.type, customSocket = input.customSocket, description = input.description, default_value = input.defaultValue, title = input.title, choices = input.choices, minimum = input.minimum, maximum = input.maximum, step = input.step;
    if (!title || title == "")
      title = generateTitle(name);
    component.addInput(
      component.createInput(name, type, customSocket).set("title", title || "").set("description", description || "").set("choices", choices || null).set("minimum", minimum || null).set("maximum", maximum || null).set("step", step || null).setDefault(default_value).toOmniIO()
    );
  });
  return component;
}
function setComponentOutputs(component, outputs) {
  outputs.forEach(function(output) {
    var name = output.name, type = output.type, customSocket = output.customSocket, description = output.description, title = output.title;
    if (!title || title == "")
      title = generateTitle(name);
    component.addOutput(
      component.createOutput(name, type, customSocket).set("title", title || "").set("description", description || "").toOmniIO()
    );
  });
  return component;
}
function setComponentControls(component, controls) {
  controls.forEach(function(control) {
    var name = control.name, title = control.title, placeholder = control.placeholder, description = control.description;
    if (!title || title == "")
      title = generateTitle(name);
    component.addControl(
      component.createControl(name).set("title", title || "").set("placeholder", placeholder || "").set("description", description || "").toOmniControl()
    );
  });
  return component;
}
function createComponent(group_id, id, title, category, description, summary, links2, inputs, outputs, controls, payloadParser) {
  if (!links2)
    links2 = {};
  let baseComponent = OAIBaseComponent.create(group_id, id).fromScratch().set("title", title).set("category", category).set("description", description).setMethod("X-CUSTOM").setMeta({
    source: {
      summary,
      links: links2
    }
  });
  baseComponent = setComponentInputs(baseComponent, inputs);
  baseComponent = setComponentOutputs(baseComponent, outputs);
  if (controls)
    baseComponent = setComponentControls(baseComponent, controls);
  baseComponent.setMacro(OmniComponentMacroTypes.EXEC, payloadParser);
  const component = baseComponent.toJSON();
  return component;
}

// node_modules/omnilib-llms/llm.js
import { omnilog as omnilog2 } from "mercs_shared";
import path2 from "path";

// node_modules/omnilib-utils/files.js
import { ClientExtension, ClientUtils } from "mercs_client";
import fs from "fs/promises";
import path from "path";
async function walkDirForExtension(filePaths, directory_path, extension) {
  const files = await fs.readdir(directory_path);
  for (const file of files) {
    const filepath = path.join(directory_path, file);
    const stats = await fs.stat(filepath);
    if (stats.isDirectory()) {
      filePaths = await walkDirForExtension(filePaths, filepath, extension);
    } else {
      if (path.extname(filepath) === extension) {
        filePaths.push(filepath);
      }
    }
  }
  return filePaths;
}
async function readJsonFromDisk(jsonPath) {
  const jsonContent = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  return jsonContent;
}
async function validateDirectoryExists(path3) {
  try {
    const stats = await fs.stat(path3);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function validateFileExists(path3) {
  try {
    const stats = await fs.stat(path3);
    return stats.isFile();
  } catch {
    return false;
  }
}

// node_modules/omnilib-utils/utils.js
import { omnilog } from "mercs_shared";

// node_modules/omnilib-llms/llm.js
var DEFAULT_UNKNOWN_CONTEXT_SIZE = 2048;
var MODELS_DIR_JSON_PATH = ["..", "..", "user_files", "local_llms_directories.json"];
function generateModelId(model_name, model_provider) {
  return `${model_name}|${model_provider}`;
}
function getModelNameAndProviderFromId(model_id) {
  if (!model_id)
    throw new Error(`getModelNameAndProviderFromId: model_id is not valid: ${model_id}`);
  const splits = model_id.split("|");
  if (splits.length != 2)
    throw new Error(`splitModelNameFromType: model_id is not valid: ${model_id}`);
  return { model_name: splits[0], model_provider: splits[1] };
}
async function addLocalLlmChoices(choices, llm_model_types, llm_context_sizes, model_type, model_provider) {
  const models_dir_json = await getModelsDirJson();
  if (!models_dir_json)
    return;
  const provider_model_dir = models_dir_json[model_provider];
  if (!provider_model_dir)
    return;
  const dir_exists = await validateDirectoryExists(provider_model_dir);
  if (!dir_exists)
    return;
  let filePaths = [];
  filePaths = await walkDirForExtension(filePaths, provider_model_dir, ".bin");
  for (const filepath of filePaths) {
    const name = path2.basename(filepath);
    const id = generateModelId(name, model_provider);
    const title = deduceLlmTitle(name, model_provider);
    const description = deduceLlmDescription(name);
    const choice = { value: id, title, description };
    llm_model_types[name] = model_type;
    llm_context_sizes[name] = DEFAULT_UNKNOWN_CONTEXT_SIZE;
    choices.push(choice);
  }
  return;
}
function deduceLlmTitle(model_name, model_provider, provider_icon = "?") {
  const title = provider_icon + model_name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) + " (" + model_provider + ")";
  return title;
}
function deduceLlmDescription(model_name, context_size = 0) {
  let description = model_name.substring(0, model_name.length - 4);
  if (context_size > 0)
    description += ` (${Math.floor(context_size / 1024)}k)`;
  return description;
}
async function getModelsDirJson() {
  const json_path = path2.resolve(process.cwd(), ...MODELS_DIR_JSON_PATH);
  const file_exist = validateFileExists(json_path);
  if (!file_exist)
    return null;
  const models_dir_json = await readJsonFromDisk(json_path);
  omnilog2.warn(`[getModelsDirJson] json_path = ${json_path}, models_dir_json = ${JSON.stringify(models_dir_json)}`);
  return models_dir_json;
}
var Llm = class {
  constructor(tokenizer, params = null) {
    this.tokenizer = tokenizer;
    this.context_sizes = {};
  }
  countTextTokens(text) {
    return this.tokenizer.countTextTokens(text);
  }
  getModelContextSizeFromModelInfo(model_name) {
    return this.context_sizes[model_name];
  }
  // -----------------------------------------------------------------------
  /**
   * @param {any} ctx
   * @param {string} prompt
   * @param {string} instruction
   * @param {string} model_name
   * @param {number} [temperature=0]
   * @param {any} args
   * @returns {Promise<{ answer_text: string; answer_json: any; }>}
   */
  async query(ctx, prompt, instruction, model_name, temperature = 0, args = null) {
    throw new Error("You have to implement this method");
  }
  /**
  * @param {any} ctx
  * @param {any} args
  * @returns {Promise<{ answer_text: string; answer_json: any; }>}
  */
  async runLlmBlock(ctx, args) {
    throw new Error("You have to implement this method");
  }
  getProvider() {
    throw new Error("You have to implement this method");
  }
  getModelType() {
    throw new Error("You have to implement this method");
  }
  async getModelChoices(choices, llm_model_types, llm_context_sizes) {
    throw new Error("You have to implement this method");
  }
};

// llm_Oobabooga.js
import { omnilog as omnilog3 } from "mercs_shared";

// node_modules/omnilib-utils/blocks.js
async function runBlock(ctx, block_name, args, outputs = {}) {
  try {
    const app = ctx.app;
    if (!app) {
      throw new Error(`[runBlock] app not found in ctx`);
    }
    const blocks = app.blocks;
    if (!blocks) {
      throw new Error(`[runBlock] blocks not found in app`);
    }
    const result = await blocks.runBlock(ctx, block_name, args, outputs);
    return result;
  } catch (err) {
    throw new Error(`Error running block ${block_name}: ${err}`);
  }
}

// node_modules/omnilib-llms/tokenizer_Openai.js
import { encode, isWithinTokenLimit } from "gpt-tokenizer";

// node_modules/omnilib-llms/tokenizer.js
var Tokenizer = class {
  constructor(params = null) {
  }
  encodeText(text) {
    throw new Error("You have to implement the method: encode");
  }
  textIsWithinTokenLimit(text, token_limit) {
    throw new Error("You have to implement the method: isWithinTokenLimit");
  }
  countTextTokens(text) {
    throw new Error("You have to implement the method: countTextTokens");
  }
};

// node_modules/omnilib-llms/tokenizer_Openai.js
var Tokenizer_Openai = class extends Tokenizer {
  constructor() {
    super();
  }
  encodeText(text) {
    return encode(text);
  }
  countTextTokens(text) {
    const tokens = encode(text);
    if (tokens !== null && tokens !== void 0 && tokens.length > 0) {
      const num_tokens = tokens.length;
      return num_tokens;
    } else {
      return 0;
    }
  }
  textIsWithinTokenLimit(text, token_limit) {
    return isWithinTokenLimit(text, token_limit);
  }
};

// llm_Oobabooga.js
var MODEL_PROVIDER = "oobabooga";
var PROVIDER_NAME = "Oobabooga";
var LLM_MODEL_TYPE_OOBABOOGA = "oobabooga";
var BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
var BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";
var ICON_OOBABOOGA = "\u{1F4C1}";
function parseModelResponse(model_response) {
  return model_response;
  if (!model_response)
    return null;
  const model_name = model_response?.model_name;
  return model_name;
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
    const model_info = await this.loadModelIfNeeded(ctx, model_name);
    omnilog3.log(`model_info = ${JSON.stringify(model_info)}`);
    omnilog3.warn(`model_info = ${JSON.stringify(model_info)}`);
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
  const model_id = generateModelId(model_name, MODEL_PROVIDER);
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

// node_modules/omnilib-llms/llmComponent.js
function get_llm_query_inputs(default_llm = "") {
  const input = [
    { name: "instruction", type: "string", description: "Instruction(s)", defaultValue: "You are a helpful bot answering the user with their question to the best of your abilities", customSocket: "text" },
    { name: "prompt", type: "string", customSocket: "text", description: "Prompt(s)" },
    { name: "temperature", type: "number", defaultValue: 0.7, minimum: 0, maximum: 2, description: "The randomness regulator, higher for more creativity, lower for more structured, predictable text." }
  ];
  if (default_llm != "") {
    input.push({ name: "model_id", type: "string", customSocket: "text", defaultValue: default_llm, description: "The provider of the LLM model to use" });
  } else {
    input.push({ name: "model_id", type: "string", customSocket: "text", description: "The provider of the LLM model to use" });
  }
  input.push({ name: "args", type: "object", customSocket: "object", description: "Extra arguments provided to the LLM" });
  return input;
}
var LLM_QUERY_OUTPUT = [
  { name: "answer_text", type: "string", customSocket: "text", description: "The answer to the query", title: "Answer" },
  { name: "answer_json", type: "object", customSocket: "object", description: "The answer in json format, with possibly extra arguments returned by the LLM", title: "Json" }
];
var LLM_QUERY_CONTROL = null;
function createLlmQueryComponent(model_provider, links2, payloadParser) {
  const group_id = model_provider;
  const id = `llm_query`;
  const title = `LLM Query via ${model_provider}`;
  const category = "LLM";
  const description = `Query a LLM with ${model_provider}`;
  const summary = `Query the specified LLM via ${model_provider}`;
  const inputs = get_llm_query_inputs();
  const outputs = LLM_QUERY_OUTPUT;
  const controls = LLM_QUERY_CONTROL;
  const component = createComponent(group_id, id, title, category, description, summary, links2, inputs, outputs, controls, payloadParser);
  return component;
}
function extractPayload(payload, model_provider) {
  if (!payload)
    throw new Error("No payload provided.");
  let args = payload.args;
  if (!args || args == void 0)
    args = {};
  let instruction = null;
  let prompt = null;
  let temperature = null;
  let model_id = null;
  if ("instruction" in args == false)
    instruction = payload.instruction;
  if ("prompt" in args == false)
    prompt = payload.prompt;
  if ("temperature" in args == false)
    temperature = payload.temperature || 0;
  if ("model_id" in args == false)
    model_id = payload.model_id;
  if (!prompt)
    throw new Error(`ERROR: no prompt provided!`);
  const splits = getModelNameAndProviderFromId(model_id);
  const passed_model_name = splits.model_name;
  const passed_provider = splits.model_provider;
  if (passed_provider != model_provider)
    throw new Error(`ERROR: model_provider (${passed_provider}) != ${model_provider}`);
  return {
    instruction,
    prompt,
    temperature,
    model_name: passed_model_name,
    args
  };
}

// component_LlmQuery_Oobabooga.js
var llm2 = new Llm_Oobabooga();
var links = {};
var LlmQueryComponent_Oobabooga = createLlmQueryComponent(MODEL_PROVIDER, links, runProviderPayload);
async function runProviderPayload(payload, ctx) {
  const { instruction, prompt, temperature, model_name, args } = extractPayload(payload, MODEL_PROVIDER);
  const response = await llm2.query(ctx, prompt, instruction, model_name, temperature, args);
  return response;
}

// extension.js
async function CreateComponents() {
  const LlmManagerComponent_Oobabooga = await async_getLlmManagerComponent_Oobabooga();
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
